import { describe, expect, it } from "vitest";
import { checkDeliverability, checkDkim, checkDmarc, checkSpf, type ResolveTxt } from "./deliverability";

function mockResolver(byHostname: Record<string, string[][]>): ResolveTxt {
  return async (hostname: string) => {
    const records = byHostname[hostname];
    if (!records) {
      throw Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" });
    }
    return records;
  };
}

describe("checkSpf", () => {
  it("finds a valid SPF record", async () => {
    const resolver = mockResolver({ "atrium.example": [["v=spf1 include:_spf.resend.com ~all"]] });
    const result = await checkSpf("atrium.example", resolver);
    expect(result.found).toBe(true);
    expect(result.record).toContain("v=spf1");
  });

  it("ignores unrelated TXT records", async () => {
    const resolver = mockResolver({ "atrium.example": [["google-site-verification=abc123"]] });
    const result = await checkSpf("atrium.example", resolver);
    expect(result.found).toBe(false);
    expect(result.record).toBeNull();
  });

  it("handles a domain with no TXT records at all", async () => {
    const resolver = mockResolver({});
    const result = await checkSpf("nonexistent.example", resolver);
    expect(result.found).toBe(false);
  });
});

describe("checkDmarc", () => {
  it("finds a DMARC record at the _dmarc subdomain", async () => {
    const resolver = mockResolver({ "_dmarc.atrium.example": [["v=DMARC1; p=quarantine;"]] });
    const result = await checkDmarc("atrium.example", resolver);
    expect(result.found).toBe(true);
  });
});

describe("checkDkim", () => {
  it("finds a DKIM record at the selector's _domainkey subdomain", async () => {
    const resolver = mockResolver({
      "resend._domainkey.atrium.example": [["v=DKIM1; k=rsa; p=MIGfMA0GCSq..."]],
    });
    const result = await checkDkim("atrium.example", "resend", resolver);
    expect(result.found).toBe(true);
  });

  it("reassembles a TXT record split across multiple chunks", async () => {
    const resolver = mockResolver({
      "resend._domainkey.atrium.example": [["v=DKIM1; k=rsa; p=MIGf", "MA0GCSq..."]],
    });
    const result = await checkDkim("atrium.example", "resend", resolver);
    expect(result.record).toBe("v=DKIM1; k=rsa; p=MIGfMA0GCSq...");
  });
});

describe("checkDeliverability", () => {
  it("aggregates SPF, DMARC, and DKIM into one report", async () => {
    const resolver = mockResolver({
      "atrium.example": [["v=spf1 include:_spf.resend.com ~all"]],
      "_dmarc.atrium.example": [["v=DMARC1; p=none;"]],
      "resend._domainkey.atrium.example": [["v=DKIM1; k=rsa; p=abc"]],
    });
    const report = await checkDeliverability("atrium.example", "resend", resolver);
    expect(report.domain).toBe("atrium.example");
    expect(report.spf.found).toBe(true);
    expect(report.dmarc.found).toBe(true);
    expect(report.dkim.found).toBe(true);
  });

  it("reports missing records independently rather than failing the whole check", async () => {
    const resolver = mockResolver({ "atrium.example": [["v=spf1 ~all"]] });
    const report = await checkDeliverability("atrium.example", "resend", resolver);
    expect(report.spf.found).toBe(true);
    expect(report.dmarc.found).toBe(false);
    expect(report.dkim.found).toBe(false);
  });
});
