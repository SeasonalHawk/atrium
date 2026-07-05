// PRD v5 Section 6, "Cal.com booking integration": reserves a real
// consultation slot and returns booking details. The event slug and API key
// are read from web/config/app.config.ts / environment, never hardcoded.
export interface BookingResult {
  bookingId: string;
  scheduledAt: string;
}

export async function reserveSlot(_leadId: string, _slotStart: string): Promise<BookingResult> {
  // TODO Phase 1: call the Cal.com API with the configured event slug,
  // return the confirmed bookingId + scheduledAt. PRD Section 10 condition 5:
  // if no confirmed booking returns, surface a "choose another slot" prompt
  // and leave the lead unbooked.
  throw new Error("not implemented");
}
