import { describe, expect, it, vi } from "vitest";
import { loadIcpConfig, setActiveProfile, type IcpConfig } from "./icp";

const SAMPLE_CONFIG: IcpConfig = {
  activeProfileId: "embedded-executive",
  profiles: [
    {
      id: "embedded-executive",
      tenantId: "altolumo",
      name: "Embedded Executive",
      offer: "Embedded Executive -- 1 day/wk",
      aiEngagement: true,
      firmographics: { stage: ["seed"], employeeRange: [10, 100] },
      buyerTitles: ["CEO"],
      triggers: ["recent-funding"],
      sourceWeights: { serp: 1 },
      admissionThreshold: 60,
    },
    {
      id: "founder-advisory",
      tenantId: "altolumo",
      name: "Founder Advisory",
      offer: "Founder Advisory -- 4-6 hrs/mo",
      aiEngagement: true,
      firmographics: { stage: ["seed"], employeeRange: [1, 15] },
      buyerTitles: ["Founder"],
      triggers: ["recent-founding"],
      sourceWeights: { serp: 1 },
      admissionThreshold: 60,
    },
  ],
};

describe("loadIcpConfig", () => {
  it("parses the config file", async () => {
    const readFileImpl = vi.fn().mockResolvedValue(JSON.stringify(SAMPLE_CONFIG));
    const config = await loadIcpConfig("/fake/path.json", readFileImpl);
    expect(config.activeProfileId).toBe("embedded-executive");
    expect(config.profiles).toHaveLength(2);
  });
});

describe("setActiveProfile", () => {
  it("switches the active profile and persists the change", async () => {
    const readFileImpl = vi.fn().mockResolvedValue(JSON.stringify(SAMPLE_CONFIG));
    const writeFileImpl = vi.fn().mockResolvedValue(undefined);

    const updated = await setActiveProfile("founder-advisory", "/fake/path.json", readFileImpl, writeFileImpl);

    expect(updated.activeProfileId).toBe("founder-advisory");
    expect(writeFileImpl).toHaveBeenCalledTimes(1);
    const [writtenPath, writtenContent] = writeFileImpl.mock.calls[0];
    expect(writtenPath).toBe("/fake/path.json");
    expect(JSON.parse(writtenContent).activeProfileId).toBe("founder-advisory");
  });

  it("rejects an unknown profile id without writing", async () => {
    const readFileImpl = vi.fn().mockResolvedValue(JSON.stringify(SAMPLE_CONFIG));
    const writeFileImpl = vi.fn().mockResolvedValue(undefined);

    await expect(setActiveProfile("nonexistent", "/fake/path.json", readFileImpl, writeFileImpl)).rejects.toThrow(
      /Unknown ICP profile/,
    );
    expect(writeFileImpl).not.toHaveBeenCalled();
  });
});
