export function rosterLegalityMessages({ legality = {}, players = [] }) {
  const messages = (legality.reasons || []).map(reason => {
    const name = players.find(player => player.playerId === reason.playerId)?.name;
    const player = name || 'A player';
    const capacity = field => Number.isInteger(legality.counts?.[field]) && Number.isInteger(legality.limits?.[field])
      ? ` (${legality.counts[field]}/${legality.limits[field]})` : '';
    switch (reason.code) {
      case 'ACTIVE_FORWARD_LIMIT_EXCEEDED': return `Too many forwards${capacity('activeForwards')}`;
      case 'ACTIVE_DEFENCE_LIMIT_EXCEEDED': return `Too many defencemen${capacity('activeDefence')}`;
      case 'ACTIVE_TOTAL_LIMIT_EXCEEDED': return `Over the active player limit${capacity('active')}`;
      case 'BENCH_LIMIT_EXCEEDED': return `Too many players on the bench${capacity('bench')}`;
      case 'INJURED_RESERVE_LIMIT_EXCEEDED': return `Too many players on IR${capacity('injuredReserve')}`;
      case 'SALARY_CAP_EXCEEDED': return 'Over the cap';
      case 'SALARY_CAP_CALCULATION_INCOMPLETE': return 'Salary cap calculation is incomplete';
      case 'HEALTHY_PLAYER_ON_IR': return name ? `Healthy player on IR: ${name}` : 'Healthy player on IR';
      case 'ACTIVE_CONTRACT_MISSING': return `${player} has no active contract`;
      case 'PLAYER_POSITION_MISSING': return `${player} has no assigned position`;
      case 'PLAYER_POSITION_UNSUPPORTED': return `${player} has an ineligible position`;
      case 'PLAYER_POSITION_ASSIGNMENT_MISMATCH': return `${player} is in the wrong position slot`;
      case 'ACTIVE_FORWARD_SLOTS_INCOMPLETE': return 'Forward slots are incomplete';
      case 'ACTIVE_DEFENCE_SLOTS_INCOMPLETE': return 'Defence slots are incomplete';
      default: return 'Another roster issue needs commissioner review';
    }
  });
  return [...new Set(messages.length ? messages : ['Roster legality needs commissioner review'])];
}
