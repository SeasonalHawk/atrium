// PRD v5 Section 7, "Local launcher (Node helper)": receives run requests
// from console/app/api/run/route.ts, invokes the corresponding /atrium
// command in Claude Code via RUN_MAP, and reports run status back.
import { RUN_MAP } from "./run-map.mjs";

const PORT = process.env.LAUNCHER_PORT ?? 4173;

// TODO Phase 1: implement an HTTP server that accepts { leadId, command, arg },
// looks up RUN_MAP[command], invokes Claude Code, tracks the Run row status
// (queued -> running -> done|failed), and returns { runId, status }.
console.log(`Launcher stub — would listen on port ${PORT}`);
