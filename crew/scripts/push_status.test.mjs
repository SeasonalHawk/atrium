import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildLeadUpdate, pushStatus } from "./push_status.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PENDING_SYNC_DIR = path.resolve(__dirname, "..", "workspace", "pending-sync");

async function cleanupPendingSync(dedupeKey) {
  const files = await readdir(PENDING_SYNC_DIR).catch(() => []);
  await Promise.all(
    files
      .filter((f) => f.startsWith(dedupeKey))
      .map((f) => rm(path.join(PENDING_SYNC_DIR, f), { force: true }))
  );
}

test("buildLeadUpdate only includes provided fields", () => {
  const update = buildLeadUpdate({ dedupeKey: "acme.example", grade: "B" });
  assert.deepEqual(update, { dedupeKey: "acme.example", grade: "B" });
});

test("buildLeadUpdate includes all recognized fields when present", () => {
  const update = buildLeadUpdate({
    dedupeKey: "acme.example",
    prospectScore: 64,
    grade: "B",
    categoryScores: { companyFit: 42 },
    stage: "researched",
    qualification: "BANT notes",
  });
  assert.equal(update.prospectScore, 64);
  assert.equal(update.stage, "researched");
  assert.equal(update.qualification, "BANT notes");
});

test("pushStatus throws without a dedupeKey", async () => {
  await assert.rejects(() => pushStatus({}), /dedupeKey is required/);
});

test("pushStatus preserves to disk when Supabase env vars are missing", async () => {
  const dedupeKey = `test-missing-env-${Date.now()}`;
  let fetchCalled = false;

  const result = await pushStatus(
    { dedupeKey, grade: "B" },
    { fetchImpl: async () => { fetchCalled = true; }, env: {} }
  );

  assert.equal(result.written, false);
  assert.equal(result.preserved, true);
  assert.equal(fetchCalled, false);
  await cleanupPendingSync(dedupeKey);
});

test("pushStatus writes via PATCH when Supabase env vars are present", async () => {
  let capturedUrl;
  let capturedOptions;
  const fetchImpl = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      json: async () => [{ dedupeKey: "acme.example", grade: "B" }],
    };
  };

  const result = await pushStatus(
    { dedupeKey: "acme.example", grade: "B" },
    {
      fetchImpl,
      env: { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake-key" },
    }
  );

  assert.equal(result.written, true);
  assert.equal(result.preserved, false);
  assert.match(capturedUrl, /dedupeKey=eq\.acme\.example/);
  assert.equal(capturedOptions.method, "PATCH");
  assert.equal(capturedOptions.headers.apikey, "fake-key");
});

test("pushStatus preserves to disk when Supabase returns a non-2xx status", async () => {
  const dedupeKey = `test-500-${Date.now()}`;
  const fetchImpl = async () => ({
    ok: false,
    status: 500,
    text: async () => "internal error",
  });

  const result = await pushStatus(
    { dedupeKey, grade: "B" },
    { fetchImpl, env: { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake-key" } }
  );

  assert.equal(result.written, false);
  assert.equal(result.preserved, true);
  await cleanupPendingSync(dedupeKey);
});

test("pushStatus preserves to disk on a network error", async () => {
  const dedupeKey = `test-network-error-${Date.now()}`;
  const fetchImpl = async () => {
    throw new Error("ECONNREFUSED");
  };

  const result = await pushStatus(
    { dedupeKey, grade: "B" },
    { fetchImpl, env: { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake-key" } }
  );

  assert.equal(result.written, false);
  assert.equal(result.preserved, true);
  await cleanupPendingSync(dedupeKey);
});

test("pushStatus actually writes a pending-sync file when preserving", async () => {
  const dedupeKey = `test-file-contents-${Date.now()}`;
  await pushStatus({ dedupeKey, grade: "C" }, { env: {} });

  const files = await readdir(PENDING_SYNC_DIR);
  const match = files.find((f) => f.startsWith(dedupeKey));
  assert.ok(match, "expected a pending-sync file to be written");

  const content = JSON.parse(await readFile(path.join(PENDING_SYNC_DIR, match), "utf-8"));
  assert.equal(content.status.dedupeKey, dedupeKey);
  assert.ok(content.reason);

  await cleanupPendingSync(dedupeKey);
});
