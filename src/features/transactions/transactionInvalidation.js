const EVENT = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+){1,7}$/;
const ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

export function invalidateOnSocketReconnect(queryClient) {
  return queryClient.invalidateQueries({ refetchType: "active" });
}

export function invalidationPrefixes(eventName, payload) {
  if (
    !EVENT.test(eventName || "") ||
    !payload ||
    payload.type !== eventName ||
    !ID.test(payload.leagueId || "")
  ) {
    return [];
  }
  const prefixes = [["league", payload.leagueId, "activity"]];
  if (eventName.startsWith("auction.")) {
    prefixes.push(["league", payload.leagueId, "auctions"]);
    prefixes.push(["league", payload.leagueId, "auction"]);
  }
  if (eventName.startsWith("trade.")) {
    prefixes.push(["league", payload.leagueId, "trades"]);
    prefixes.push(["league", payload.leagueId, "trade"]);
  }
  prefixes.push(["notifications"]);
  return prefixes;
}
