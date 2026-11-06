import { expect, test } from 'vitest';
import { deadlineAfterWorkSlots } from './src/index.js';
test('six work slots end at the third afternoon; evening does not move deadline backwards', () => {
    expect(deadlineAfterWorkSlots(0, 6)).toBe(10);
    expect(deadlineAfterWorkSlots(2, 6)).toBe(14);
    expect(() => deadlineAfterWorkSlots(-1, 1)).toThrow();
});
