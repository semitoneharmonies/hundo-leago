import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "../../src/app/AppShell.jsx";
import { SessionContext } from "../../src/features/session/sessionContext.js";
import { AccountHome } from "../../src/features/accounts/AccountHome.jsx";
import { PublicTipJarPage, TipJarPage } from "../../src/features/tipJar/TipJarPage.jsx";
import { createDesktopNavigationFixture } from "../../src/test/desktopNavigationFixture.js";
import "../../src/App.css";
import "../../src/styles/theme-a.css";

// Controlled synthetic responses only: no account service or live storage.
const member = new URLSearchParams(location.search).has("member");
const source = createDesktopNavigationFixture();
const requests = [];
const runId = "77777777-7777-4777-8777-777777777777";
const result = { rank: 1, highestLevelCompleted: 1, completed: false, shotsToCompletion: 4, updatedAt: "2026-10-26T20:00:00Z" };
const publicEntries = [
  { ...result, playerId: "public-member", playerName: "Site Manager", isGuest: false },
  { ...result, rank: 2, shotsToCompletion: 6, playerId: "public-guest", playerName: "Snowbird", isGuest: true },
];
const fixture = { requests, leagues: source.leagues, publicEntries, failPublic: false, failLeague: false };
const client = {
  resourceUrl: (value) => value,
  async request(path, options = {}) {
    requests.push({ path, method: options.method || "GET", authenticated: options.authenticated || false, body: options.body });
    let data;
    if (path === "/api/v1/games/tip-jar/leaderboard") {
      if (fixture.failPublic) throw new Error("Synthetic leaderboard failure");
      data = { rulesetVersion: "campaign-v1", entries: [...publicEntries] };
    } else if (path.endsWith("/tip-jar/leaderboard")) {
      if (!member) throw new Error("Anonymous private request");
      if (fixture.failLeague) throw new Error("Synthetic league leaderboard failure");
      const name = path.includes(source.leagues[1].id) ? "Pacific Manager" : "League Manager";
      data = { rulesetVersion: "campaign-v1", entries: [{ ...result, managerId: source.session.user.id, managerName: name }], personalBest: null };
    } else if (path === "/api/v1/games/tip-jar/runs") {
      data = { runId, seed: 3, rulesetVersion: "campaign-v1", createdAt: "2026-10-26T20:00:00Z" };
    } else if (path === `/api/v1/games/tip-jar/runs/${runId}/checkpoint`) {
      data = { runId, shotsUsed: options.body.shots.length, highestLevelCompleted: 1, shotsToCompletion: 1, level: 2, pucks: 20, failed: false, completed: false, levelResults: [{ level: 1, shots: 1, totalShots: 1 }], qualifies: true, named: false };
    } else if (path === `/api/v1/games/tip-jar/runs/${runId}/name`) {
      publicEntries.push({ ...result, rank: 3, playerId: "new-guest", playerName: options.body.name, isGuest: true });
      data = { saved: true, qualifies: true };
    } else if (member) return source.request(path, options);
    else throw new Error(`Unexpected anonymous request: ${path}`);
    options.validateData?.(data);
    return { data };
  },
};
fixture.session = member ? { ...source.session, httpClient: client } : { status: "unauthenticated", user: null, appEnv: "local", httpClient: client };
window.guestGamesFixture = fixture;
window.guestGamesQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
export function LeagueHome() {
  const { leagueId } = useParams();
  return <main className="hl-page"><h1>{source.leagues.find((league) => league.id === leagueId)?.name}</h1></main>;
}
if (!location.hash) location.hash = member ? `/leagues/${source.leagues[0].id}/tip-jar` : "/";
createRoot(document.getElementById("root")).render(<HashRouter><QueryClientProvider client={window.guestGamesQueryClient}><SessionContext.Provider value={fixture.session}>
  <AppShell><Routes>
    <Route path="/" element={<AccountHome />} />
    <Route path="/games/tip-jar" element={<PublicTipJarPage />} />
    <Route path="/leagues/:leagueId/tip-jar" element={<TipJarPage />} />
    <Route path="/leagues/:leagueId" element={<LeagueHome />} />
  </Routes></AppShell>
</SessionContext.Provider></QueryClientProvider></HashRouter>);
