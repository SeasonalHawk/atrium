// PRD v5 Section 7: Atrium addition (not in the reference repo). The intake
// bridge script — pulls new-stage inbound leads from Supabase into the
// workspace for the crew to work, one workspace record per lead, no
// duplication (PRD Section 6, "Intake bridge and write-back").
//
// Usage:
//   node fetch_leads.mjs [--stage new]

import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const TARGETS_DIR = path.join(REPO_ROOT, "crew", "workspace", "targets");

export function leadToTarget(lead) {
  const target = {
    id: lead.dedupeKey,
    createdAt: lead.createdAt || new Date().toISOString(),
    source: "inbound",
    sourceDetail: lead.sourceDetail || "",
    company: lead.company,
    stage: lead.stage || "new",
  };
  if (lead.companyUrl) target.companyUrl = lead.companyUrl;
  if (lead.contactName) target.contactName = lead.contactName;
  if (lead.contactEmail) target.contactEmail = lead.contactEmail;
  return target;
}

async function existingTargetIds(targetsDir) {
  try {
    const files = await readdir(targetsDir);
    return new Set(files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")));
  } catch (err) {
    if (err.code === "ENOENT") return new Set();
    throw err;
  }
}

export async function fetchNewLeads({
  stage = "new",
  fetchImpl = fetch,
  env = process.env,
  targetsDir = TARGETS_DIR,
} = {}) {
  const supabaseUrl = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example)");
  }

  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/leads?stage=eq.${encodeURIComponent(stage)}&source=eq.inbound`;
  const response = await fetchImpl(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Supabase returned ${response.status}: ${body}`);
  }

  const leads = await response.json();
  const alreadyImported = await existingTargetIds(targetsDir);

  const written = [];
  const skipped = [];
  await mkdir(targetsDir, { recursive: true });

  for (const lead of leads) {
    const target = leadToTarget(lead);
    if (alreadyImported.has(target.id)) {
      skipped.push(target.id);
      continue;
    }
    await writeFile(path.join(targetsDir, `${target.id}.json`), JSON.stringify(target, null, 2), "utf-8");
    written.push(target.id);
  }

  return { written, skipped };
}

async function main() {
  const stageArgIndex = process.argv.indexOf("--stage");
  const stage = stageArgIndex !== -1 ? process.argv[stageArgIndex + 1] : "new";

  const result = await fetchNewLeads({ stage });
  console.log(`Fetched ${result.written.length} new lead(s), skipped ${result.skipped.length} already-imported.`);
  for (const id of result.written) console.log(`  + ${id}.json`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(`fetch_leads: ${err.message}`);
    process.exit(1);
  });
}
