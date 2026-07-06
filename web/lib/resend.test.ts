import { describe, expect, it, vi } from "vitest";
import { sendBookingConfirmation, sendOperatorAlert, type ResendLike } from "./resend";

function stubClient(): { client: ResendLike; send: ReturnType<typeof vi.fn> } {
  const send = vi.fn().mockResolvedValue({ id: "email-123" });
  return { client: { emails: { send } }, send };
}

describe("sendBookingConfirmation", () => {
  it("sends a confirmation email to the attendee", async () => {
    const { client, send } = stubClient();
    await sendBookingConfirmation("jane@acme.example", "2026-08-01T10:00:00Z", "hello@altolumo.example", client);

    expect(send).toHaveBeenCalledTimes(1);
    const [payload] = send.mock.calls[0];
    expect(payload.to).toBe("jane@acme.example");
    expect(payload.from).toBe("hello@altolumo.example");
    expect(payload.subject).toMatch(/confirmed/i);
  });
});

describe("sendOperatorAlert", () => {
  it("sends an alert email to the operator naming the lead's company", async () => {
    const { client, send } = stubClient();
    await sendOperatorAlert("Acme Co", "2026-08-01T10:00:00Z", "hello@altolumo.example", "operator@altolumo.example", client);

    expect(send).toHaveBeenCalledTimes(1);
    const [payload] = send.mock.calls[0];
    expect(payload.to).toBe("operator@altolumo.example");
    expect(payload.subject).toContain("Acme Co");
    expect(payload.text).toContain("Acme Co");
  });
});
