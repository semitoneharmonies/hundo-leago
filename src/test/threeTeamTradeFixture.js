import { createCounterFixture, counterIds } from "./counterProposalFixture.js";
export const threeTeamIds = { ...counterIds, thirdTeam: "11111111-1111-4111-8111-000000000001" };

export function createThreeTeamFixture({ status = "proposed", secondAccepted = false, sharedManager = false, role = "receiver", leagueId = threeTeamIds.league } = {}) {
  const ids = threeTeamIds, fixture = createCounterFixture({ status, role, leagueId }), baseFetch = fixture.fetch;
  fixture.teams[0].currentManager.userId = sharedManager ? ids.receiver : "11111111-1111-4111-8111-000000000002";
  fixture.teams.push({ ...fixture.teams[0], id: ids.thirdTeam, name: "Charlie", currentManager: { ...fixture.teams[0].currentManager, userId: ids.receiver } });
  fixture.original.participants = [fixture.teams[1], fixture.teams[0], fixture.teams[2]].map((team, index) => ({
    teamId: team.id, name: team.name, decision: index === 0 || (index === 1 && secondAccepted) ? "accepted" : index === 1 && status === "declined" ? "declined" : "pending",
    respondedAtMs: index === 0 || (index === 1 && (secondAccepted || status === "declined")) ? 1 : null,
    acknowledgedAtMs: index === 1 && status === "declined" ? 1 : null,
  }));
  fixture.original.assets.find(asset => asset.type === "buyout_obligation").sourceTeamId = ids.thirdTeam;
  fixture.original.assets.find(asset => asset.type === "prospect_right").destinationTeamId = ids.thirdTeam;
  const envelope = (data, status = 200) => new Response(JSON.stringify({ data, meta: { requestId: "three-team-fixture" } }), { status, headers: { "content-type": "application/json" } });
  const own = (proposal, body) => proposal.participants.find(p => p.teamId === (body?.respondingTeamId || ids.thirdTeam));
  const previewTeams = () => fixture.teams.map(team => ({ teamId: team.id,
    before: { cap: { usageCents: 500 }, rosterCounts: { activeForwards: 1, activeDefence: 0, bench: 0, injuredReserve: 0, prospects: 0 } },
    cap: { salaryCapCents: 10000, usageCents: 625, spaceCents: 9375 }, rosterCounts: { activeForwards: 1, activeDefence: 0, bench: 0, injuredReserve: 0, prospects: 0 }, generallyIllegal: false, issues: [] }));
  fixture.fetch = async (url, options = {}) => {
    const pathname = new URL(url).pathname, method = options.method || "GET";
    const proposal = pathname.includes(ids.counter) && fixture.counter ? fixture.counter : fixture.original;
    if (pathname.includes("/trades") && (method === "POST" || pathname.endsWith("/acceptance-preview"))) {
      const body = options.body ? JSON.parse(options.body) : null;
      fixture.requests.push({ pathname, method, body, headers: options.headers });
      if (pathname.endsWith("/trades/preview")) {
        if (fixture.beforePreview) await fixture.beforePreview();
        if (fixture.failPreviewNext) { fixture.failPreviewNext = false; return new Response(JSON.stringify({ error: { code: "TRADE_REQUEST_FAILED", message: "Impact preview could not be loaded.", requestId: "preview-fixture" } }), { status: 500, headers: { "content-type": "application/json" } }); }
        return envelope({ code: "TRADE_PROPOSAL_PREVIEWED", leagueId, generallyIllegal: false, teams: previewTeams() });
      }
      if (fixture.failNext) { fixture.failNext = false; return new Response(JSON.stringify({ error: { code: "TRADE_REQUEST_FAILED", message: "The trade request could not be completed.", requestId: "fixture" } }), { status: 500, headers: { "content-type": "application/json" } }); }
      if (pathname.endsWith("/acceptance-preview")) return envelope({ code: "TRADE_ACCEPTANCE_PREVIEWED", proposal: { id: proposal.id, leagueId, version: proposal.version }, assets: [], generallyIllegal: false,
        teams: fixture.teams.map(team => ({ teamId: team.id, cap: { salaryCapCents: 10000, usageCents: 625, spaceCents: 9375 }, rosterCounts: { activeForwards: 1, activeDefence: 0, bench: 0, injuredReserve: 0, prospects: 0 }, generallyIllegal: false, issues: [] })) });
      if (pathname.endsWith("/acknowledge")) { own(proposal, body).acknowledgedAtMs = 2; return envelope({ code: "TRADE_ACKNOWLEDGED" }); }
      if (pathname.endsWith("/accept")) { own(proposal, body).decision = "accepted"; own(proposal, body).respondedAtMs = 2; proposal.version++;
        if (proposal.participants.every(p => p.decision === "accepted")) { proposal.storageStatus = "completed"; proposal.status = "Accepted"; }
        return envelope({ code: "TRADE_PARTICIPANT_ACCEPTED", proposal }); }
      if (pathname.endsWith("/decline")) { own(proposal, body).decision = "declined"; own(proposal, body).respondedAtMs = 2; proposal.storageStatus = "declined"; proposal.status = "Rejected"; proposal.version++; return envelope({ code: "TRADE_PROPOSAL_REJECTED" }); }
      if (pathname.endsWith("/counter") || pathname.endsWith("/trades")) {
        if (pathname.endsWith("/counter")) { proposal.storageStatus = "declined"; proposal.status = "Rejected"; }
        fixture.counter = { ...fixture.original, id: ids.counter, proposingTeam: fixture.teams.find(t => t.id === body.proposingTeamId), receivingTeam: fixture.teams.find(t => t.id === body.participants[1].teamId), storageStatus: "proposed", status: "Pending", version: 1,
          participants: body.participants.map((p, index) => ({ teamId: p.teamId, name: fixture.teams.find(team => team.id === p.teamId).name, decision: index === 0 ? "accepted" : "pending", respondedAtMs: index === 0 ? 2 : null, acknowledgedAtMs: null })) };
        return envelope({ code: "TRADE_PROPOSAL_CREATED", proposal: { id: ids.counter } }, 201);
      }
    }
    if (pathname === "/api/v1/notifications") return envelope({ code: "NOTIFICATIONS_FOUND", notifications: [], page: { nextCursor: null } });
    return baseFetch(url, options);
  };
  return fixture;
}
