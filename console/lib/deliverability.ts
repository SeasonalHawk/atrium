// ROADMAP.md Sprint 5, "Deliverability foundation: sending domain, SPF,
// DKIM, DMARC" — checks the three DNS records that determine whether
// outbound email from a sending domain will land in the inbox rather than
// spam. The DNS resolver is injectable so tests never make real lookups.
import { resolveTxt as nodeResolveTxt } from "node:dns/promises";

export type ResolveTxt = (hostname: string) => Promise<string[][]>;

export interface RecordCheck {
  found: boolean;
  record: string | null;
}

export interface DeliverabilityReport {
  domain: string;
  spf: RecordCheck;
  dmarc: RecordCheck;
  dkim: RecordCheck;
}

function flatten(records: string[][]): string[] {
  return records.map((chunks) => chunks.join(""));
}

async function findTxtRecord(
  hostname: string,
  predicate: (record: string) => boolean,
  resolveTxt: ResolveTxt,
): Promise<RecordCheck> {
  try {
    const records = flatten(await resolveTxt(hostname));
    const match = records.find(predicate);
    return { found: Boolean(match), record: match ?? null };
  } catch {
    return { found: false, record: null };
  }
}

export async function checkSpf(domain: string, resolveTxt: ResolveTxt = nodeResolveTxt): Promise<RecordCheck> {
  return findTxtRecord(domain, (r) => r.startsWith("v=spf1"), resolveTxt);
}

export async function checkDmarc(domain: string, resolveTxt: ResolveTxt = nodeResolveTxt): Promise<RecordCheck> {
  return findTxtRecord(`_dmarc.${domain}`, (r) => r.startsWith("v=DMARC1"), resolveTxt);
}

export async function checkDkim(
  domain: string,
  selector: string,
  resolveTxt: ResolveTxt = nodeResolveTxt,
): Promise<RecordCheck> {
  return findTxtRecord(`${selector}._domainkey.${domain}`, (r) => r.includes("v=DKIM1"), resolveTxt);
}

export async function checkDeliverability(
  domain: string,
  selector = "default",
  resolveTxt: ResolveTxt = nodeResolveTxt,
): Promise<DeliverabilityReport> {
  const [spf, dmarc, dkim] = await Promise.all([
    checkSpf(domain, resolveTxt),
    checkDmarc(domain, resolveTxt),
    checkDkim(domain, selector, resolveTxt),
  ]);
  return { domain, spf, dmarc, dkim };
}
