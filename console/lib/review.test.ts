import { describe, expect, it } from "vitest";
import { decideReview, fetchReviewQueue, type ReviewClient } from "./review";
import type { Lead } from "@atrium/shared/supabase";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    createdAt: "2026-01-01T00:00:00Z",
    source: "inbound",
    company: "Acme Co",
    emailStatus: "valid",
    stage: "review",
    admitted: true,
    reviewState: "pending",
    dedupeKey: "acme.example",
    ...overrides,
  };
}

function stubClient(leads: Lead[], updateError: string | null = null): ReviewClient {
  return {
    from() {
      return {
        select() {
          return {
            eq(_column: string, value: string) {
              return {
                async order() {
                  return { data: leads.filter((l) => l.stage === value), error: null };
                },
              };
            },
          };
        },
        update(values: Partial<Lead>) {
          return {
            eq(_column: string, id: string) {
              return {
                select() {
                  return {
                    async maybeSingle() {
                      if (updateError) {
                        return { data: null, error: { message: updateError } };
                      }
                      const lead = leads.find((l) => l.id === id);
                      return { data: lead ? { ...lead, ...values } : null, error: null };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("fetchReviewQueue", () => {
  it("returns only leads in the review stage", async () => {
    const leads = [makeLead({ id: "a", stage: "review" }), makeLead({ id: "b", stage: "won" })];
    const result = await fetchReviewQueue(stubClient(leads));
    expect(result.map((l) => l.id)).toEqual(["a"]);
  });

  it("throws a clear error when the query fails", async () => {
    const client: ReviewClient = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  async order() {
                    return { data: null, error: { message: "connection refused" } };
                  },
                };
              },
            };
          },
          update() {
            throw new Error("not used");
          },
        };
      },
    };
    await expect(fetchReviewQueue(client)).rejects.toThrow(/connection refused/);
  });
});

describe("decideReview", () => {
  it("approving sets reviewState and advances the stage to contacted", async () => {
    const leads = [makeLead({ id: "a", stage: "review" })];
    const result = await decideReview("a", "approved", stubClient(leads));
    expect(result?.reviewState).toBe("approved");
    expect(result?.stage).toBe("contacted");
  });

  it("rejecting sets reviewState but leaves the lead in the review stage", async () => {
    const leads = [makeLead({ id: "a", stage: "review" })];
    const result = await decideReview("a", "rejected", stubClient(leads));
    expect(result?.reviewState).toBe("rejected");
    expect(result?.stage).toBe("review");
  });

  it("holding sets reviewState but leaves the lead in the review stage", async () => {
    const leads = [makeLead({ id: "a", stage: "review" })];
    const result = await decideReview("a", "held", stubClient(leads));
    expect(result?.reviewState).toBe("held");
    expect(result?.stage).toBe("review");
  });

  it("throws a clear error when the update fails", async () => {
    const leads = [makeLead({ id: "a", stage: "review" })];
    await expect(decideReview("a", "approved", stubClient(leads, "timeout"))).rejects.toThrow(/timeout/);
  });
});
