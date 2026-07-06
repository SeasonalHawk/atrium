import { describe, expect, it } from "vitest";
import { buildLeadRow, mapElicitationPayloadToLeadIntake } from "./leadIntake";

describe("mapElicitationPayloadToLeadIntake", () => {
  it("maps tappable labels to their slug enums", () => {
    const intake = mapElicitationPayloadToLeadIntake({
      company: "Acme Co",
      challenge: "AI strategy",
      timeline: "Just exploring",
      budgetBand: "$10k - $50k",
    });

    expect(intake).toEqual({
      company: "Acme Co",
      challenge: "ai-strategy",
      timeline: "exploring",
      budgetBand: "10k-50k",
    });
  });

  it("throws a readable error when a required field is missing", () => {
    expect(() => mapElicitationPayloadToLeadIntake({ company: "Acme Co" })).toThrow(/Invalid lead intake payload/);
  });

  it("throws when a label isn't a recognized option", () => {
    expect(() =>
      mapElicitationPayloadToLeadIntake({
        company: "Acme Co",
        challenge: "Not a real option",
        timeline: "Immediate",
        budgetBand: "Under $10k",
      }),
    ).toThrow(/Invalid lead intake payload/);
  });
});

describe("buildLeadRow", () => {
  it("builds a Supabase-ready row for a new inbound lead", () => {
    const row = buildLeadRow({
      company: "Acme Co",
      challenge: "ai-strategy",
      timeline: "exploring",
      budgetBand: "10k-50k",
    });

    expect(row).toMatchObject({
      source: "inbound",
      company: "Acme Co",
      stage: "new",
      admitted: false,
      reviewState: "pending",
      emailStatus: "not-found",
    });
    expect(row.dedupeKey).toBe("inbound:acme-co");
  });

  it("slugifies unusual company names for the dedupe key", () => {
    const row = buildLeadRow({
      company: "Acme & Co., Ltd.!!",
      challenge: "automation",
      timeline: "immediate",
      budgetBand: "undisclosed",
    });

    expect(row.dedupeKey).toBe("inbound:acme-co-ltd");
  });
});
