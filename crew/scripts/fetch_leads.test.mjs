import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { fetchNewLeads, leadToTarget } from "./fetch_leads.mjs";

test("leadToTarget maps required and optional fields", () => {
  const target = leadToTarget({
    dedupeKey: "acme.example",
    company: "Acme Corp",
    companyUrl: "https://acme.example",
    contactName: "Jane Doe",
    contactEmail: "jane@acme.example",
    stage: "new",
    sourceDetail: "funnel booking",
  });

  assert.equal(target.id, "acme.example");
  assert.equal(target.source, "inbound");
  assert.equal(target.company, "Acme Corp");
  assert.equal(target.companyUrl, "https://acme.example");
  assert.equal(target.contactName, "Jane Doe");
  assert.equal(target.contactEmail, "jane@acme.example");
  assert.equal(target.sourceDetail, "funnel booking");
});

test("leadToTarget omits optional fields when absent", () => {
  const target = leadToTarget({ dedupeKey: "beta.example", company: "Beta Inc" });
  assert.equal("companyUrl" in target, false);
  assert.equal("contactName" in target, false);
  assert.equal("contactEmail" in target, false);
  assert.equal(target.stage, "new");
});

test("fetchNewLeads throws without Supabase env vars", async () => {
  await assert.rejects(() => fetchNewLeads({ env: {} }), /SUPABASE_URL/);
});

test("fetchNewLeads throws on a non-2xx Supabase response", async () => {
  const fetchImpl = async () => ({ ok: false, status: 503, text: async () => "unavailable" });

  await assert.rejects(
    () =>
      fetchNewLeads({
        fetchImpl,
        env: { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake-key" },
      }),
    /503/
  );
});

test("fetchNewLeads writes one target file per new lead", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "atrium-fetch-leads-"));
  const fetchImpl = async (url, options) => {
    assert.match(url, /stage=eq\.new/);
    assert.equal(options.headers.apikey, "fake-key");
    return {
      ok: true,
      json: async () => [
        { dedupeKey: "acme.example", company: "Acme Corp" },
        { dedupeKey: "beta.example", company: "Beta Inc" },
      ],
    };
  };

  const result = await fetchNewLeads({
    fetchImpl,
    env: { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake-key" },
    targetsDir: dir,
  });

  assert.deepEqual(result.written.sort(), ["acme.example", "beta.example"]);
  assert.deepEqual(result.skipped, []);

  const written = JSON.parse(await readFile(path.join(dir, "acme.example.json"), "utf-8"));
  assert.equal(written.company, "Acme Corp");
  assert.equal(written.source, "inbound");

  await rm(dir, { recursive: true, force: true });
});

test("fetchNewLeads skips leads already imported (no duplication)", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "atrium-fetch-leads-"));
  await writeFile(path.join(dir, "acme.example.json"), JSON.stringify({ id: "acme.example" }), "utf-8");

  const fetchImpl = async () => ({
    ok: true,
    json: async () => [{ dedupeKey: "acme.example", company: "Acme Corp" }],
  });

  const result = await fetchNewLeads({
    fetchImpl,
    env: { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake-key" },
    targetsDir: dir,
  });

  assert.deepEqual(result.written, []);
  assert.deepEqual(result.skipped, ["acme.example"]);

  await rm(dir, { recursive: true, force: true });
});

test("fetchNewLeads creates the targets directory if missing", async () => {
  const parentDir = await mkdtemp(path.join(tmpdir(), "atrium-fetch-leads-"));
  const dir = path.join(parentDir, "nested", "targets");

  const fetchImpl = async () => ({
    ok: true,
    json: async () => [{ dedupeKey: "acme.example", company: "Acme Corp" }],
  });

  const result = await fetchNewLeads({
    fetchImpl,
    env: { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fake-key" },
    targetsDir: dir,
  });

  assert.deepEqual(result.written, ["acme.example"]);
  await rm(parentDir, { recursive: true, force: true });
});
