import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "../../src/app/AppProviders.jsx";
import { AuctionsPage } from "../../src/features/auctions/AuctionPages.jsx";
import { SessionContext } from "../../src/features/session/sessionContext.js";
import "../../src/styles/theme-a.css";

const id = number => `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
const leagueId = id(1);
const now = Date.parse("2026-10-12T19:00:00Z");
const closes = Date.parse("2026-10-18T23:00:00Z");
const allowed = () => ({ allowed: true, reasonCode: null });
const denied = reasonCode => ({ allowed: false, reasonCode });
const team = {
  teamId: id(8), name: "Snow Owls", primaryColour: "#112233", secondaryColour: "#ddeeff",
  tertiaryColour: null, patternTemplate: "solid", logoReference: null,
};
const league = {
  id: leagueId, name: "Fixture League", status: "active", timezone: "America/Vancouver",
  currentSeason: null, membership: { id: id(2), permissionCategory: "manager", status: "active", version: 1 }, version: 1,
};
const modes = ["join", "edit", "limit", "cooldown"];
const names = ["Alex Player", "Brandon Long-Playername", "Charlie Player", "Dylan Player"];
const mixed = new URLSearchParams(location.search).has("mixed");
const rapid = new URLSearchParams(location.search).has("rapid");
const auctions = modes.map((mode, index) => ({
  auctionId: id(20 + index), leagueId, seasonId: id(3), version: 1,
  player: { playerId: id(40 + index), fullName: names[index], positionGroup: index % 2 ? "D" : "F" },
  status: "active", openedAtMs: now - 100000, resolvesAtMs: closes + (mixed && index === 3 ? 3600000 : 0),
  resolvedAtMs: null, updatedAtMs: now, bidCount: 2, participatingTeamCount: 2,
  sourceKind: rapid ? "fad_open_rapid" : "ordinary_weekly",
  fadOrigin: rapid ? "manager_nomination" : null, fadId: rapid ? id(90) : null, fadRolloverId: rapid ? id(91) : null,
  targetRolloverAtMs: rapid ? closes + (mixed && index === 3 ? 3600000 : 0) : null,
  creationCutoffAtMs: rapid ? closes - 3600000 : null, eligibleTeams: [], minimumContract: null, drawCommitment: rapid ? "a".repeat(64) : null,
  viewerTeams: [{
    teamId: team.teamId, team, eligible: true, participantStatus: null,
    bid: mode === "join" ? null : {
      bidId: id(60 + index), version: 1, status: "active", totalValueCents: 600,
      termYears: 2, aavCents: 300, editCount: mode === "limit" ? 1 : 0, editLimit: 1,
      cooldownEndsAtMs: mode === "cooldown" ? now + 100000 : now - 100000,
      ...(rapid ? { bindingIllegalityConfirmedAtMs: now - 100000 } : {}),
    },
    join: mode === "join" ? allowed() : denied("ENTRY_NOT_EDITABLE"),
    edit: mode === "edit" ? allowed() : denied(mode === "limit" ? "EDIT_LIMIT_REACHED" : mode === "cooldown" ? "COOLDOWN_ACTIVE" : "ENTRY_NOT_EDITABLE"),
  }],
  administrativeBids: [], result: null,
  capabilities: { view: allowed(), adminCancel: denied("NOT_AUTHORIZED"), adminResolve: denied("NOT_AUTHORIZED") },
}));
window.mobileAuctionRequests = [];
const httpClient = { async request(path, options = {}) {
  window.mobileAuctionRequests.push({ path, method: options.method || "GET" });
  let result;
  if (path === "/api/v1/leagues") result = { data: { code: "LEAGUES_FOUND", leagues: [league] } };
  else if (path.startsWith(`/api/v1/leagues/${leagueId}/auctions?`)) {
    result = { data: auctions, actions: { startTeams: [] }, page: { nextCursor: null, hasMore: false } };
  } else throw new Error(`Unexpected local fixture request: ${path}`);
  options.validateData?.(result.data);
  options.validateActions?.(result.actions);
  options.validatePage?.(result.page);
  return result;
} };

createRoot(document.getElementById("root")).render(
  <AppProviders Router={MemoryRouter} routerProps={{ initialEntries: [`/leagues/${leagueId}/auctions`] }}
    enableSession={false} config={{ appEnv: "local", apiOrigin: "http://127.0.0.1:4199", socketOrigin: "http://127.0.0.1:4199" }}>
    <SessionContext.Provider value={{ status: "authenticated", user: { id: id(4), displayName: "Fixture Manager" }, httpClient }}>
      <Routes>
        <Route path="/leagues/:leagueId/auctions" element={<AuctionsPage />} />
        <Route path="/leagues/:leagueId/auctions/:auctionId" element={<h1>Review your auction bid</h1>} />
      </Routes>
    </SessionContext.Provider>
  </AppProviders>
);
