// ROADMAP.md Sprint 5, "ICP profile library and switcher" — reads and
// writes crew/config/icp.config.json, the single source of truth every
// crew agent and the Lead Engine already read (engine/src/core/config_loader.py).
// The console never duplicates the profiles, only adds activeProfileId.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface IcpFirmographics {
  stage: string[];
  employeeRange: [number, number];
}

export interface IcpProfile {
  id: string;
  tenantId: string;
  name: string;
  offer: string;
  aiEngagement: boolean;
  preloaded?: boolean;
  primary?: boolean;
  firmographics: IcpFirmographics;
  buyerTitles: string[];
  triggers: string[];
  sourceWeights: Record<string, number>;
  admissionThreshold: number;
}

export interface IcpConfig {
  _comment?: string;
  activeProfileId: string;
  profiles: IcpProfile[];
}

export const DEFAULT_ICP_CONFIG_PATH = path.join(process.cwd(), "..", "crew", "config", "icp.config.json");

export async function loadIcpConfig(
  configPath: string = DEFAULT_ICP_CONFIG_PATH,
  readFileImpl: typeof readFile = readFile,
): Promise<IcpConfig> {
  const raw = await readFileImpl(configPath, "utf-8");
  return JSON.parse(raw) as IcpConfig;
}

export async function setActiveProfile(
  profileId: string,
  configPath: string = DEFAULT_ICP_CONFIG_PATH,
  readFileImpl: typeof readFile = readFile,
  writeFileImpl: typeof writeFile = writeFile,
): Promise<IcpConfig> {
  const config = await loadIcpConfig(configPath, readFileImpl);
  if (!config.profiles.some((p) => p.id === profileId)) {
    throw new Error(`Unknown ICP profile id: ${profileId}`);
  }
  const updated: IcpConfig = { ...config, activeProfileId: profileId };
  await writeFileImpl(configPath, `${JSON.stringify(updated, null, 2)}\n`, "utf-8");
  return updated;
}
