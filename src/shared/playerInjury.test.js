import { describe, expect, it } from 'vitest';
import { injuryNameProps, injuryDetailLines, validatePlayerInjury } from './playerInjury.js';
const injury = { status: 'injured', source: 'admin', observedAtMs: 1000, needsReview: false, stale: false,
  details: { timeline: 'Week to Week', designation: 'LTIR', reason: 'Lower Body' } };
describe('injury details', () => {
  it('shows all pasted details without losing the trade-block style', () => {
    expect(validatePlayerInjury(injury)).toBe(true);
    const props = injuryNameProps({ injury, onTradeBlock: true });
    expect(props.className).toContain('is-injury-trade-block');
    expect(props.title).toBe('Injured · On trade block\nTimeline: Week to Week\nStatus: LTIR\nReason: Lower Body');
  });
  it('hides details and red styling after recovery even if stale detail data exists', () => {
    expect(injuryDetailLines({ ...injury, status: 'healthy' })).toEqual([]);
    expect(injuryNameProps({ injury: { ...injury, status: 'healthy' } })).toEqual({});
    expect(injuryDetailLines({ ...injury, details: { ...injury.details, designation: null } })).toEqual(['Timeline: Week to Week', 'Reason: Lower Body']);
  });
  it('rejects malformed public details', () => {
    expect(() => validatePlayerInjury({ ...injury, details: { ...injury.details, reason: {} } })).toThrow();
  });
});
