import { describe, expect, it } from "vitest";
import { fetchLeadById, fetchLeads, groupByStage, PIPELINE_STAGES, type LeadsClient } from "./leads";
import type { Lead } from "@atrium/shared/supabase";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    createdAt: "2026-01-01T00:00:00Z",
    source: "inbound",
    company: "Acme Co",
    emailStatus: "valid",
    stage: "new",
    admitted: true,
    reviewState: "pending",
    dedupeKey: "acme.example",
    ...overrides,
  };
}

function stubClient(leads: Lead[], byIdError: string | null = null): LeadsClient {
  return {
    from() {
      return {
        select() {
          return {
            async order() {
              return { data: leads, error: null };
            },
            eq(_column: string, value: string) {
              return {
                async maybeSingle() {
                  if (byIdError) {
                    return { data: null, error: { message: byIdError } };
                  }
                  return { data: leads.find((l) => l.id === value) ?? null, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("fetchLeads", () => {
  it("returns leads from the client", async () => {
    const leads = [makeLead()];
    const result = await fetchLeads(stubClient(leads));
    expect(result).toEqual(leads);
  });

  it("throws a clear error when the query fails", async () => {
    const client: LeadsClient = {
      from() {
        return {
          select() {
            return {
              async order() {
                return { data: null, error: { message: "connection refused" } };
              },
              eq() {
                return { async maybeSingle() { return { data: null, error: null }; } };
              },
            };
          },
        };
      },
    };
    await expect(fetchLeads(client)).rejects.toThrow(/connection refused/);
  });
});

describe("fetchLeadById", () => {
  it("returns the matching lead", async () => {
    const leads = [makeLead({ id: "lead-1" }), makeLead({ id: "lead-2", company: "Other Co" })];
    const result = await fetchLeadById("lead-2", stubClient(leads));
    expect(result?.company).toBe("Other Co");
  });

  it("returns null when no lead matches", async () => {
    const result = await fetchLeadById("missing", stubClient([makeLead()]));
    expect(result).toBeNull();
  });

  it("throws a clear error when the query fails", async () => {
    const result = fetchLeadById("lead-1", stubClient([makeLead()], "timeout"));
    await expect(result).rejects.toThrow(/timeout/);
  });
});

describe("groupByStage", () => {
  it("buckets leads by stage and initializes every pipeline stage", () => {
    const leads = [makeLead({ id: "a", stage: "new" }), makeLead({ id: "b", stage: "won" })];
    const grouped = groupByStage(leads);
    expect(Object.keys(grouped).sort()).toEqual([...PIPELINE_STAGES].sort());
    expect(grouped.new.map((l) => l.id)).toEqual(["a"]);
    expect(grouped.won.map((l) => l.id)).toEqual(["b"]);
    expect(grouped.lost).toEqual([]);
  });
});
