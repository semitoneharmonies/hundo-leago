import { ResponseContractError } from './api/responseContracts.js';

export function validatePlayerInjury(injury) {
  if (injury === undefined) return true;
  if (!injury || !['unknown', 'injured', 'healthy'].includes(injury.status) ||
      ![null, 'admin', 'espn'].includes(injury.source) ||
      !(injury.observedAtMs === null || (Number.isSafeInteger(injury.observedAtMs) && injury.observedAtMs >= 0)) ||
      typeof injury.needsReview !== 'boolean' || typeof injury.stale !== 'boolean') {
    throw new ResponseContractError('The player injury status is invalid.');
  }
  return true;
}

export function injuryNameProps(player) {
  return player.injury?.status === 'injured'
    ? { className: `hl-injured-player-name${player.onTradeBlock ? ' is-injury-trade-block' : ''}`, title: `Injured${player.onTradeBlock ? ' · On trade block' : ''}${player.injury.needsReview ? ' · awaiting review' : ''}${player.injury.stale ? ' · last report is outdated' : ''}` }
    : {};
}
