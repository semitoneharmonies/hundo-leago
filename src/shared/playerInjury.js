import { ResponseContractError } from './api/responseContracts.js';

export function validatePlayerInjury(injury) {
  if (injury === undefined) return true;
  if (!injury || !['unknown', 'injured', 'healthy'].includes(injury.status) ||
      ![null, 'admin', 'espn'].includes(injury.source) ||
      !(injury.observedAtMs === null || (Number.isSafeInteger(injury.observedAtMs) && injury.observedAtMs >= 0)) ||
      typeof injury.needsReview !== 'boolean' || typeof injury.stale !== 'boolean') {
    throw new ResponseContractError('The player injury status is invalid.');
  }
  if (injury.details !== undefined && (!injury.details ||
    typeof injury.details.timeline !== 'string' || injury.details.timeline.length > 100 ||
    ![null, 'string'].includes(injury.details.designation === null ? null : typeof injury.details.designation) ||
    ![null, 'string'].includes(injury.details.reason === null ? null : typeof injury.details.reason))) {
    throw new ResponseContractError('The player injury details are invalid.');
  }
  return true;
}

export function injuryNameProps(player) {
  return player.injury?.status === 'injured'
    ? { className: `hl-injured-player-name${player.onTradeBlock ? ' is-injury-trade-block' : ''}`, title: [`Injured${player.onTradeBlock ? ' · On trade block' : ''}${player.injury.needsReview ? ' · awaiting review' : ''}${player.injury.stale ? ' · last report is outdated' : ''}`, ...injuryDetailLines(player.injury)].join('\n') }
    : {};
}

export function injuryDetailLines(injury) {
  if (injury?.status !== 'injured' || !injury.details) return [];
  const { timeline, designation, reason } = injury.details;
  return [timeline && `Timeline: ${timeline}`, designation && `Status: ${designation}`, reason && `Reason: ${reason}`].filter(Boolean);
}
