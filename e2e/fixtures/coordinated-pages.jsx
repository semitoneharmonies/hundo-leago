import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { SessionContext } from "../../src/features/session/sessionContext.js";
import { LeagueMatchupsPage } from "../../src/features/competition/CompetitionPages.jsx";
import { TradesPage } from "../../src/features/transactions/TransactionPages.jsx";
import { PlayersCatalogPage } from "../../src/features/players/PlayersCatalogPage.jsx";
import { createDesktopNavigationFixture } from "../../src/test/desktopNavigationFixture.js";
import "../../src/App.css";
import "../../src/styles/theme-a.css";

// All requests terminate in synthetic fixture responses. No backend is used.
const fixture = createDesktopNavigationFixture();
const pageName = new URLSearchParams(window.location.search).get("page") || "matchups";
const league = fixture.leagues[0];
const events = [];
let release;
let held = true;
let ready = new Promise((resolve) => { release = resolve; });
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const original = fixture.client.request;
const shouldHold = (path) => pageName === "matchups" ? path.includes("/matchups/")
  : pageName === "trades" ? path.endsWith("/roster") : path.includes("/auctions?");
const player = {
  id: "11111111-1111-4111-8111-000000008000", firstName: "Sample", lastName: "Skater", fullName: "Sample Skater",
  birthDate: "1998-01-01", status: "active", version: 1,
  provider: { provider: "sportsdataio-discovery-lab", sourcePosition: "C", normalizedPosition: "F", nhlTeamAbbreviation: "VAN", active: true, sourceVersion: "2026REG", effectiveAtMs: 1 },
  statistics: { provider: "release_qa_fixture", nhlSeasonKey: "20262027", gamesPlayed: 3, goals: 1, assists: 2, nhlPoints: 3, fantasyPointsHundredths: 900, sourceUpdatedAtMs: 1 },
  league: { id: league.id, ownership: null, activeContract: null },
};
fixture.client.request = async (path, options = {}) => {
  if (options.method && options.method !== "GET") throw new Error("This fixture is read-only.");
  const event = { path, held: held && shouldHold(path), completed: false };
  events.push(event);
  if (event.held) await ready;
  let response;
  if (new URL(path, "http://fixture.local").pathname.endsWith("/players")) {
    response = { data: [player], page: { hasMore: false, nextCursor: null } };
    options.validateData?.(response.data);
  } else response = await original(path, options);
  event.completed = true;
  return response;
};
window.pageFixture = {
  events,
  release() { held = false; release(); },
  refresh() {
    held = true;
    ready = new Promise((resolve) => { release = resolve; });
    void queryClient.invalidateQueries({ queryKey: ["league", league.id] });
  },
};
window.location.hash = `/leagues/${league.id}/${pageName}`;
createRoot(document.getElementById("root")).render(
  <HashRouter><QueryClientProvider client={queryClient}><SessionContext.Provider value={fixture.session}>
    <Routes>
      <Route path="/leagues/:leagueId/matchups" element={<LeagueMatchupsPage />} />
      <Route path="/leagues/:leagueId/trades" element={<TradesPage />} />
      <Route path="/leagues/:leagueId/players" element={<PlayersCatalogPage />} />
    </Routes>
  </SessionContext.Provider></QueryClientProvider></HashRouter>
);
