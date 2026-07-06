// PRD v5 Section 7: Atrium addition. Writes score, grade, stage, and
// artifact links back to Supabase after a completed crew run. PRD Section 10
// condition 3: if Supabase is unreachable, preserve crew output in the
// workspace and log the failure for a later sync (sync_workspace.mjs).
//
// Usage:
//   node push_status.mjs <status.json>
//   cat status.json | node push_status.mjs
//
// status.json shape: { dedupeKey, prospectScore?, grade?, categoryScores?,
//                       stage?, qualification?, artifacts? }

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PENDING_SYNC_DIR = path.join(REPO_ROOT, "crew", "workspace", "pending-sync");

export function buildLeadUpdate(status) {
  const update = { dedupeKey: status.dedupeKey };
  if (status.prospectScore !== undefined) update.prospectScore = status.prospectScore;
  if (status.grade !== undefined) update.grade = status.grade;
  if (status.categoryScores !== undefined) update.categoryScores = status.categoryScores;
  if (status.stage !== undefined) update.stage = status.stage;
  if (status.qualification !== undefined) update.qualification = status.qualification;
  return update;
}

export async function pushStatus(status, { fetchImpl = fetch, env = process.env } = {}) {
  if (!status.dedupeKey) {
    throw new Error("status.dedupeKey is required — it's the upsert key in Supabase");
  }

  const supabaseUrl = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    await preserveForLaterSync(status, "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    return { written: false, preserved: true };
  }

  const update = buildLeadUpdate(status);
  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?dedupeKey=eq.${encodeURIComponent(status.dedupeKey)}`;

  let response;
  try {
    response = await fetchImpl(url, {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(update),
    });
  } catch (err) {
    await preserveForLaterSync(status, `network error: ${err.message}`);
    return { written: false, preserved: true };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    await preserveForLaterSync(status, `Supabase returned ${response.status}: ${body}`);
    return { written: false, preserved: true };
  }

  const rows = await response.json();
  return { written: true, preserved: false, rows };
}

async function preserveForLaterSync(status, reason) {
  await mkdir(PENDING_SYNC_DIR, { recursive: true });
  const filePath = path.join(PENDING_SYNC_DIR, `${status.dedupeKey || "unknown"}-${Date.now()}.json`);
  await writeFile(
    filePath,
    JSON.stringify({ status, reason, failedAt: new Date().toISOString() }, null, 2),
    "utf-8"
  );
  console.error(`push_status: preserved for later sync (${reason}) -> ${filePath}`);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

async function main() {
  const inputPath = process.argv[2];
  const raw = inputPath ? await readFile(inputPath, "utf-8") : await readStdin();
  const status = JSON.parse(raw);

  const result = await pushStatus(status);
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(`push_status: ${err.message}`);
    process.exit(1);
  });
}
