const phases = { waiting: 0, auction: 1, locked: 2, finished: 3, void: 4, closed: 4 };

// These are audio observations only. The server remains authoritative for bids,
// awards and the room phase; a missing lot alone never means a lost bid.
export function createAuctionAudioTracker({ play, now }) {
  const rooms = new Map();
  const created = new Set();
  function seed(room, viewerId) {
    return { room, viewerId, phase: room.phase, seen: new Set((room.auctions || []).map(lot => lot.id)),
      bids: new Set((room.auctions || []).filter(lot => lot.ownBid != null).map(lot => lot.id)),
      settled: new Set((room.members || []).flatMap(member => member.roster || []).map(player => player.id)),
      countdown: new Set(), baselineNext: false };
  }
  function observe(room, viewerId) {
    if (!room?.id || !room.joined) return;
    let state = rooms.get(room.id);
    if (!state || state.viewerId !== viewerId || state.baselineNext) {
      state = seed(room, viewerId);
      rooms.set(room.id, state);
      return;
    }
    // Ignore late responses that would take the room back into an earlier phase.
    if ((phases[room.phase] ?? -1) < (phases[state.phase] ?? -1)) return;
    const before = state.phase;
    state.phase = room.phase;
    state.room = room;
    if (before === "waiting" && room.phase === "auction") play("start");
    if (["waiting", "auction"].includes(before) && ["locked", "finished"].includes(room.phase)) play("end");
    for (const lot of room.auctions || []) {
      if (lot.ownBid != null) state.bids.add(lot.id);
      if (!state.seen.has(lot.id) && room.phase === "auction") play("slot");
      state.seen.add(lot.id);
    }
    for (const member of room.members || []) {
      for (const player of member.roster || []) {
        if (state.bids.has(player.id) && !state.settled.has(player.id)) {
          play(member.id === viewerId ? "win" : "denied");
          state.settled.add(player.id);
        }
      }
    }
  }
  function confirmedBid(roomId, playerId) {
    const state = rooms.get(roomId);
    if (state && playerId != null) state.bids.add(playerId);
    play("confirmed");
  }
  function tick() {
    const time = now();
    for (const state of rooms.values()) {
      const { room } = state;
      if (!["waiting", "auction"].includes(state.phase)) continue;
      const beforeStart = state.phase === "waiting";
      const deadline = Date.parse(beforeStart ? room.auctionStartsAt : room.auctionEndsAt ?? room.firstGameAt);
      const seconds = Math.ceil((deadline - time) / 1000);
      if (!Number.isFinite(deadline) || seconds < 1 || seconds > 5) continue;
      const key = `${state.phase}:${deadline}:${seconds}`;
      if (state.countdown.has(key)) continue;
      state.countdown.add(key);
      play(beforeStart ? "countdown" : "closing");
    }
  }
  function roomCreated(room, viewerId) {
    if (!room?.id || created.has(room.id)) return;
    created.add(room.id);
    observe(room, viewerId);
    if (room.joined && room.phase === "auction") play("start");
  }
  return { observe, confirmedBid, roomCreated, tick, forget: id => rooms.delete(id),
    rebaseline: () => { for (const state of rooms.values()) state.baselineNext = true; } };
}
