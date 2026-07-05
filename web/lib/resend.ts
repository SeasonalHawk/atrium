// PRD v5 Section 6, "Booking confirmation and operator alert": fires the
// customer confirmation and the operator notification at the moment a
// consultation is booked. Sender/operator addresses come from
// web/config/app.config.ts, never hardcoded here.
import { Resend } from "resend";

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY must be set (see .env.example)");
  return new Resend(apiKey);
}

export async function sendBookingConfirmation(_to: string, _scheduledAt: string) {
  // TODO Phase 1: render and send the customer confirmation email.
  throw new Error("not implemented");
}

export async function sendOperatorAlert(_leadCompany: string, _scheduledAt: string) {
  // TODO Phase 1: send the operator alert to config.operatorEmail.
  throw new Error("not implemented");
}
