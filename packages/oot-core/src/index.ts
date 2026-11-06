export const engineVersion = '0.1.0';
export function deadlineAfterWorkSlots(start: number, count: number): number {
  if (!Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(count) || count < 1) throw Error('INVALID_TIME');
  let slot = start;
  while (count > 0) { if (slot % 4 < 2) count--; slot++; }
  return slot;
}
