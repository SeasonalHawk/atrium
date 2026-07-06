// PRD v5 Section 6, "Booking confirmation and operator alert": fires the
// customer confirmation and the operator notification at the moment a
// consultation is booked. Sender/operator addresses come from
// web/config/app.config.ts, never hardcoded here.
import { Resend } from "resend";

export interface ResendLike {
  emails: {
    send(payload: { from: string; to: string; subject: string; text: string }): Promise<unknown>;
  };
}

function getClient(): ResendLike {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY must be set (see .env.example)");
  return new Resend(apiKey) as unknown as ResendLike;
}

function formatScheduledAt(scheduledAt: string): string {
  return new Date(scheduledAt).toUTCString();
}

export async function sendBookingConfirmation(
  to: string,
  scheduledAt: string,
  senderEmail: string,
  client: ResendLike = getClient(),
) {
  return client.emails.send({
    from: senderEmail,
    to,
    subject: "Your AltoLumo consultation is confirmed",
    text: `Your consultation is confirmed for ${formatScheduledAt(scheduledAt)}. We'll send a calendar invite shortly. Reply to this email if you need to reschedule.`,
  });
}

export async function sendOperatorAlert(
  leadCompany: string,
  scheduledAt: string,
  senderEmail: string,
  operatorEmail: string,
  client: ResendLike = getClient(),
) {
  return client.emails.send({
    from: senderEmail,
    to: operatorEmail,
    subject: `New consultation booked: ${leadCompany}`,
    text: `${leadCompany} booked a consultation for ${formatScheduledAt(scheduledAt)}.`,
  });
}
