export function bidderCountLabel(participantCount) {
  return `${participantCount} ${
    participantCount === 1 ? "bidder" : "bidders"
  }`;
}
