import { describe, expect, it } from 'vitest';
import { formatMoment } from '../src/lib/time';

const NOW = new Date(2026, 9, 25, 14, 30, 0);

describe('time', () => {
  it('shows only the time, to the second, for a moment earlier today', () => {
    const today = new Date(2026, 9, 25, 9, 5, 7);
    expect(formatMoment(today, NOW, 'en-GB')).toBe('09:05:07');
  });

  it('shows the date as well for a moment on another day', () => {
    const yesterday = new Date(2026, 9, 24, 9, 5, 7);
    expect(formatMoment(yesterday, NOW, 'en-GB')).toBe('24 Oct, 09:05:07');
  });
});
