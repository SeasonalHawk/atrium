// PRD v5 Section 6, "Cal.com booking integration": generates a short list
// of suggested consultation slots for the funnel's final step (see the
// design note in web/lib/calcom.ts on presenting slots instead of
// embedding Cal.com's iframe). Weekdays only, two times per day, starting
// tomorrow. Accepts `now` so tests are deterministic.
const SLOT_HOURS_UTC = [15, 19]; // displayed to the visitor in their local time

export function suggestedSlots(count: number, now: Date = new Date()): string[] {
  const slots: string[] = [];
  const cursor = new Date(now);
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCDate(cursor.getUTCDate() + 1);

  while (slots.length < count) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      for (const hour of SLOT_HOURS_UTC) {
        if (slots.length >= count) break;
        const slot = new Date(cursor);
        slot.setUTCHours(hour, 0, 0, 0);
        slots.push(slot.toISOString());
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return slots;
}
