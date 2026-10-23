import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Link, Route, Routes } from "react-router-dom";
import { SessionContext } from "../../src/features/session/sessionContext.js";
import { LeagueOverviewPage } from "../../src/features/leagues/LeaguePages.jsx";
import { createDesktopNavigationFixture } from "../../src/test/desktopNavigationFixture.js";
import "../../src/App.css";
import "../../src/styles/theme-a.css";

// Synthetic, read-only responses. Hold parent requests to verify that independent
// panels start before the league/team details have completed.
const fixture = createDesktopNavigationFixture();
const events = [];
let release;
const detailsReady = new Promise((resolve) => { release = resolve; });
let held = true;
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const originalRequest = fixture.client.request;
fixture.client.request = async (path, options = {}) => {
  if (options.method && options.method !== "GET") throw new Error("Read-only fixture");
  const event = { path, startedAt: performance.now(), completedAt: null };
  events.push(event);
  const url = new URL(path, "http://fixture.local");
  const league = fixture.leagues.find((item) => path.includes(item.id));
  if (held && league && (url.pathname === `/api/v1/leagues/${league.id}` || url.pathname.endsWith("/teams"))) await detailsReady;
  let response;
  if (url.pathname.endsWith("/standings")) {
    response = { data: { code: "MATCHUP_STANDINGS_FOUND", health: {}, rows: [], results: [], finalizedResultCount: 0, sourceResultVersion: 0 } };
  } else if (url.pathname.endsWith("/trades")) {
    response = { data: { code: "TRADE_PROPOSALS_FOUND", proposals: [] } };
  } else if (url.pathname.endsWith("/activity")) {
    response = { data: { code: "LEAGUE_ACTIVITY_FOUND", activity: [], page: { limit: Number(url.searchParams.get("limit")), nextCursor: null } } };
  } else if (url.pathname.endsWith("/auctions")) {
    response = { data: [], actions: { startTeams: [] }, page: { hasMore: false, nextCursor: null } };
  } else if (url.pathname.startsWith("/api/v1/public/leagues/")) {
    const team = fixture.teams.find((item) => path.includes(item.id));
    response = { data: { code: "PUBLIC_ROSTER_FOUND", roster: {
      league: { id: league.id, name: league.name },
      season: { id: league.currentSeason.id, label: league.currentSeason.label },
      team: { id: team.id, name: team.name, primaryColour: team.primaryColour, secondaryColour: team.secondaryColour, logoReference: null },
      players: [], cap: { capLimitCents: 10000, capUsageCents: 0, capSpaceCents: 10000, retainedSalaryTotalCents: 0, buyoutPenaltyTotalCents: 0 },
      updatedAt: 1,
    } } };
  } else {
    response = await originalRequest(path, options);
  }
  options.validateData?.(response.data);
  options.validateActions?.(response.actions);
  options.validatePage?.(response.page);
  event.completedAt = performance.now();
  return response;
};
window.dashboardFixture = {
  events, leagues: fixture.leagues,
  releaseDetails() { held = false; release(); },
};
if (!window.location.hash) window.location.hash = `/leagues/${fixture.leagues[0].id}`;

createRoot(document.getElementById("root")).render(
  <HashRouter><QueryClientProvider client={queryClient}><SessionContext.Provider value={fixture.session}>
    <nav aria-label="Fixture leagues">{fixture.leagues.map((league) => <Link key={league.id} to={`/leagues/${league.id}`}>{league.name}</Link>)}</nav>
    <Routes><Route path="/leagues/:leagueId" element={<LeagueOverviewPage />} /></Routes>
  </SessionContext.Provider></QueryClientProvider></HashRouter>
);
