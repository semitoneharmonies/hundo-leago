const id = value => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
export const counterIds = { league: id(1), season: id(2), receivingTeam: id(3), sendingTeam: id(4),
  trade: id(5), counter: id(6), contract: id(7), player: id(8).replace("-4000-", "-5000-"),
  pick: id(9), prospect: id(10), buyout: id(11), future: id(12), receiver: id(13), sender: id(14), otherLeague: id(15) };

export function createCounterFixture({ role = "receiver", leagueId = counterIds.league, status = "proposed", unavailable = false } = {}) {
  const ids = counterIds;
  const userId = role === "receiver" ? ids.receiver : role === "sender" ? ids.sender : id(20);
  const teams = [
    { id: ids.receivingTeam, name: "Benning Did Nothing Wrong", manager: ids.receiver },
    { id: ids.sendingTeam, name: "Wolfy's", manager: ids.sender },
  ].map(({ manager, ...team }) => ({ ...team, leagueId, status: "active", primaryColour: null, secondaryColour: null,
    logoReference: null, createdAtMs: 1, updatedAtMs: 1, version: 1,
    currentManager: { assignmentId: id(30 + (team.id === ids.sendingTeam ? 1 : 0)), userId: manager,
      displayName: "Manager", acceptedAtMs: 1, version: 1 } }));
  const asset = (type, sourceTeamId, snapshot, number) => ({ id: id(number), type, sourceTeamId,
    destinationTeamId: sourceTeamId === ids.sendingTeam ? ids.receivingTeam : ids.sendingTeam, snapshot: { type, ...snapshot } });
  const original = { id: ids.trade, leagueId, seasonId: ids.season, proposingTeam: teams[1], receivingTeam: teams[0],
    proposingUserId: ids.sender, status: status === "proposed" ? "Pending" : "Rejected", storageStatus: status,
    createdAtMs: 1, expiresAtMs: 8_000_000_000_000, tradeDeadlineAtMs: null, effectiveDeadlineAtMs: 8_000_000_000_000,
    respondedAtMs: null, completedAtMs: null, commissionerCompletionReference: null, version: 1,
    assets: [
      asset("contract", ids.sendingTeam, { contract: { id: ids.contract, aavCents: 500, originalTermYears: 2 }, player: { id: ids.player, name: "Mitch Marner" } }, 41),
      asset("requested_retention", ids.sendingTeam, { contractId: ids.contract, retainedAavCents: 125 }, 42),
      asset("prospect_right", ids.sendingTeam, { player: { id: ids.prospect, name: "Drafted Prospect" } }, 43),
      asset("draft_pick", ids.receivingTeam, { id: ids.pick, targetSeasonLabel: "2027-28", roundNumber: 2 }, 44),
      asset("buyout_obligation", ids.receivingTeam, { id: ids.buyout, player: { name: "Bought Out Player" }, years: [{ penalty_cents: 125 }] }, 45),
      asset("future_consideration_instruction", ids.receivingTeam, { description: "Conditional third-round pick" }, 46),
      asset("future_consideration", ids.sendingTeam, { id: ids.future, description: "Existing agreement" }, 47),
    ], history: [] };
  function workspace(teamId) {
    const hasPlayer = teamId === ids.sendingTeam;
    return { code: "TEAM_WORKSPACE_FOUND", canManage: teams.find(t => t.id === teamId).currentManager.userId === userId,
      orderVersion: 0, league: { id: leagueId, name: "Amigo Leago" }, season: { id: ids.season, label: "2026-27" }, team: teams.find(t => t.id === teamId),
      players: hasPlayer ? [{ ownershipId: id(50), ownershipVersion: 1, playerId: ids.player, name: "Mitch Marner", normalizedPosition: "F",
        rosterCategory: "Active", ownershipKind: "Rostered", slotNumber: 1, displayOrder: 1, onTradeBlock: false,
        contract: { id: ids.contract, aavCents: 500, retainedAavCents: 0, originalTermYears: 2, remainingYears: 2 }, statistics: null }] : [],
      cap: { limitCents: 10000, usageCents: hasPlayer ? 500 : 125, spaceCents: hasPlayer ? 9500 : 9875,
        activePlayerCents: hasPlayer ? 500 : 0, retainedSalaryCents: 0, buyoutPenaltyCents: hasPlayer ? 0 : 125,
        retentionSlotsUsed: 0, retentionSlotLimit: 3, complete: true, issues: [] }, draftPicks: [],
      tradeAssets: { contracts: hasPlayer && !unavailable ? [{ id: ids.contract, label: "Mitch Marner · $5.00 AAV · 2y" }] : [],
        prospects: hasPlayer ? [{ id: ids.prospect, label: "Drafted Prospect" }] : [],
        draftPicks: hasPlayer ? [] : [{ id: ids.pick, label: "2027-28 Round 2" }], retentions: [],
        buyouts: hasPlayer ? [] : [{ id: ids.buyout, label: "Bought Out Player · $1.25 penalty · 2y", playerName: "Bought Out Player", annualPenaltyCents: 125, remainingYears: 2 }],
        futureConsiderations: hasPlayer ? [{ id: ids.future, label: "Existing agreement" }] : [] } };
  }
  const fixture = { original, teams, workspace, requests: [], failNext: false, counter: null, userId };
  const envelope = (data, status = 200) => new Response(JSON.stringify({ data, meta: { requestId: "counter-fixture" } }),
    { status, headers: { "content-type": "application/json" } });
  fixture.fetch = async (url, options = {}) => {
    const pathname = new URL(url).pathname;
    fixture.requests.push({ pathname, method: options.method || "GET", body: options.body ? JSON.parse(options.body) : null, headers: options.headers });
    if (pathname === "/api/v1/session") return envelope({ csrfToken: "D".repeat(43),
      session: { id: id(60), userId, status: "active", createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3, version: 1 },
      user: { id: userId, displayName: "Manager", status: "active", version: 1 } });
    if (pathname === "/api/v1/leagues") return envelope({ code: "LEAGUES_FOUND", leagues: [{ id: leagueId, name: "Amigo Leago", status: "active", timezone: "America/Vancouver", currentSeason: null,
      membership: { id: id(61), permissionCategory: role === "commissioner" ? "commissioner" : "manager", status: "active", version: 1 }, version: 1 }] });
    const root = `/api/v1/leagues/${leagueId}`;
    if (pathname === `${root}/teams`) return envelope({ code: "TEAMS_FOUND", teams });
    for (const team of teams) if (pathname === `${root}/teams/${team.id}/roster`) return envelope(workspace(team.id));
    if (pathname === `${root}/trades`) return envelope({ code: "TRADE_PROPOSALS_FOUND", proposals: [original, ...(fixture.counter ? [fixture.counter] : [])] });
    if (pathname === `${root}/trades/${ids.trade}`) return envelope({ code: "TRADE_PROPOSAL_FOUND", proposal: original });
    if (pathname === `${root}/trades/${ids.counter}`) return envelope({ code: "TRADE_PROPOSAL_FOUND", proposal: fixture.counter });
    if (pathname.endsWith("/acceptance-preview")) return envelope({ code: "TRADE_ACCEPTANCE_PREVIEWED", proposal: { id: ids.trade, leagueId, version: 1 }, assets: [], generallyIllegal: false,
      teams: teams.map(team => ({ teamId: team.id, cap: { salaryCapCents: 10000, usageCents: 625, spaceCents: 9375 }, counts: { activeForwards: 1, activeDefence: 0, bench: 0, injuredReserve: 0, prospects: 0 }, generallyIllegal: false, issues: [] })) });
    if (pathname === `${root}/trades/${ids.trade}/counter` && options.method === "POST") {
      if (fixture.failNext) {
        fixture.failNext = false;
        return new Response(JSON.stringify({ error: { code: "TRADE_REQUEST_FAILED", message: "The trade request could not be completed.", requestId: "counter-fixture" } }), { status: 500, headers: { "content-type": "application/json" } });
      }
      original.storageStatus = "declined";
      original.status = "Rejected";
      fixture.counter = { ...original, id: ids.counter, status: "Pending", storageStatus: "proposed", proposingTeam: teams[0], receivingTeam: teams[1], proposingUserId: userId };
      return envelope({ code: "TRADE_COUNTER_PROPOSAL_CREATED", proposal: { id: ids.counter }, originalProposal: { id: ids.trade, storageStatus: "declined" } }, 201);
    }
    throw new Error(`Unexpected counter fixture request: ${pathname}`);
  };
  return fixture;
}
