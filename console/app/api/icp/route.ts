// ROADMAP.md Sprint 5, "ICP profile library and switcher" — backs
// console/app/icp/page.tsx. GET returns the profile list and the current
// selection; PUT switches the active profile by writing
// crew/config/icp.config.json (the single source every crew agent reads).
import { NextResponse } from "next/server";
import { loadIcpConfig, setActiveProfile } from "@/lib/icp";

export async function GET() {
  try {
    const config = await loadIcpConfig();
    return NextResponse.json(config);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error loading ICP config";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const profileId = body?.activeProfileId;
  if (typeof profileId !== "string" || !profileId) {
    return NextResponse.json({ error: "activeProfileId is required" }, { status: 400 });
  }

  try {
    const config = await setActiveProfile(profileId);
    return NextResponse.json(config);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error updating ICP config";
    const status = message.startsWith("Unknown ICP profile") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
