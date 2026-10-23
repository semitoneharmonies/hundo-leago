import { describe, expect, it } from 'vitest';
import { matchupDayRows, selectMatchupDay, validMatchupDate } from './matchupDaySelection.js';

describe('matchup day selection', () => {
  it('preserves weekday positions for partial and two-week matchup windows', () => {
    const days = Array.from({ length: 13 }, (_, i) => ({ date: `2026-10-${13 + i}` }));
    const rows = matchupDayRows(days);
    expect(rows).toHaveLength(2);
    expect(rows[0][0]).toBeNull();
    expect(rows[0][1].date).toBe('2026-10-13');
    expect(rows[1][6].date).toBe('2026-10-25');
  });
  it('defaults to today, the last past day or the first future day and rejects impossible dates', () => {
    const days = ['2026-10-12', '2026-10-13'].map(date => ({ date }));
    expect(selectMatchupDay(days, null, '2026-10-12')).toBe(days[0]);
    expect(selectMatchupDay(days, null, '2026-10-20')).toBe(days[1]);
    expect(selectMatchupDay(days, null, '2026-10-01')).toBe(days[0]);
    expect(selectMatchupDay(days, '2026-10-12', '2026-10-20')).toBe(days[0]);
    expect(validMatchupDate('2026-02-30')).toBe(false);
    expect(validMatchupDate('2028-02-29')).toBe(true);
  });
});
