// PRD v5 Section 7, Interface Contracts: "Console to launcher contract".
// Accepts a RunRequest, calls the local launcher (launcher/server.mjs), and
// returns a RunResponse. PRD Section 10 condition 1: if the launcher is
// unreachable, surface a clear error and leave lead state unchanged.
import { NextResponse } from "next/server";

export interface RunRequest {
  leadId: string;
  command: string; // AtriumCommand, see crew/atrium/SKILL.md
  arg?: string;
}

export interface RunResponse {
  runId: string;
  status: "queued" | "running" | "done" | "failed";
}

export async function POST(request: Request) {
  // TODO Phase 1: forward RunRequest to appConfig.launcherUrl, map the
  // launcher's response to RunResponse.
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
