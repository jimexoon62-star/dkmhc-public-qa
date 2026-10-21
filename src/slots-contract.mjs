/*
 * Pure offline overlap checks for fictional time slots.
 * Does not reserve appointments or model distributed concurrency.
 */
export function overlaps(a, b) {
  for (const slot of [a, b]) {
    if (!slot || !Number.isFinite(slot.start) || !Number.isFinite(slot.end) ||
        slot.start >= slot.end) throw new TypeError('Valid numeric start/end required');
  }
  return a.start < b.end && b.start < a.end;
}

export function checkSlot(candidate, occupied = []) {
  if (!candidate || !Number.isFinite(candidate.start) || !Number.isFinite(candidate.end) ||
      candidate.start >= candidate.end) {
    throw new TypeError('Invalid synthetic slot');
  }
  const conflicts = occupied.some(existing => overlaps(candidate, existing));
  return Object.freeze({ available: !conflicts, reserved: false });
}
