import { describe, expect, it } from 'vitest';
import { rosterLegalityMessages } from './rosterLegalityMessages.js';

describe('roster illegality explanations', () => {
  it('lists simultaneous limits, cap and named healthy IR players', () => {
    expect(rosterLegalityMessages({
      players: [{ playerId: 'stone', name: 'Mark Stone' }, { playerId: 'other', name: 'Other Player' }],
      legality: {
        counts: { activeDefence: 7, active: 19 }, limits: { activeDefence: 6, active: 18 },
        reasons: [{ code: 'ACTIVE_DEFENCE_LIMIT_EXCEEDED' }, { code: 'ACTIVE_TOTAL_LIMIT_EXCEEDED' },
          { code: 'SALARY_CAP_EXCEEDED' }, { code: 'HEALTHY_PLAYER_ON_IR', playerId: 'stone' },
          { code: 'HEALTHY_PLAYER_ON_IR', playerId: 'other' }],
      },
    })).toEqual(['Too many defencemen (7/6)', 'Over the active player limit (19/18)', 'Over the cap',
      'Healthy player on IR: Mark Stone', 'Healthy player on IR: Other Player']);
  });
  it('explains position, contract and incomplete cap data instead of showing raw codes', () => {
    expect(rosterLegalityMessages({ players: [{ playerId: 'a', name: 'Test Player' }], legality: {
      reasons: ['PLAYER_POSITION_MISSING', 'PLAYER_POSITION_UNSUPPORTED', 'PLAYER_POSITION_ASSIGNMENT_MISMATCH',
        'ACTIVE_CONTRACT_MISSING', 'SALARY_CAP_CALCULATION_INCOMPLETE'].map(code => ({ code, playerId: 'a' })),
    } })).toEqual(['Test Player has no assigned position', 'Test Player has an ineligible position',
      'Test Player is in the wrong position slot', 'Test Player has no active contract', 'Salary cap calculation is incomplete']);
  });
  it('keeps unfamiliar or missing reasons visible without exposing internal codes', () => {
    expect(rosterLegalityMessages({ legality: { reasons: [{ code: 'FUTURE_INTERNAL_CODE' }] } })).toEqual(['Another roster issue needs commissioner review']);
    expect(rosterLegalityMessages({})).toEqual(['Roster legality needs commissioner review']);
  });
});
