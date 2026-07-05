// PRD v5 Section 7, "Config File": all configurable values for the funnel,
// read from environment so no secret or environment-specific value is
// hardcoded. See .env.example at the repo root for the full variable list.
export const appConfig = {
  calcom: {
    eventSlug: process.env.CALCOM_EVENT_SLUG ?? "",
  },
  operatorEmail: process.env.OPERATOR_EMAIL ?? "",
  senderEmail: process.env.SENDER_EMAIL ?? "",
  launcherUrl: process.env.LAUNCHER_URL ?? "http://localhost:4173",
};
