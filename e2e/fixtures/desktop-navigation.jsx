import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "../../src/app/AppShell.jsx";
import { SessionContext } from "../../src/features/session/sessionContext.js";
import { TeamWorkspacePage } from "../../src/features/leagues/LeaguePages.jsx";
import { LeagueDashboard } from "../../src/features/leagues/LeagueDashboard.jsx";
import { LeagueMatchupsPage } from "../../src/features/competition/CompetitionPages.jsx";
import { createDesktopNavigationFixture } from "../../src/test/desktopNavigationFixture.js";
import "../../src/App.css";
import "../../src/styles/theme-a.css";

const fixture = createDesktopNavigationFixture({ commissioner: new URLSearchParams(window.location.search).has("commissioner"), administrator: new URLSearchParams(window.location.search).has("administrator") });
window.navigationFixture = fixture;
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
window.navigationQueryClient = queryClient;
if (!window.location.hash) window.location.hash = `/leagues/${fixture.leagues[0].id}/teams/${fixture.teams[2].id}/roster`;

export function Dashboard() {
  const { leagueId } = useParams();
  if (new URLSearchParams(window.location.search).has("dashboard")) return <main className="hl-page hl-page--wide"><LeagueDashboard league={fixture.leagues.find((league) => league.id === leagueId)} teams={fixture.teams.filter((team) => team.leagueId === leagueId)} session={fixture.session} /></main>;
  return <main className="hl-page hl-page--wide"><h1>{fixture.leagues.find((league) => league.id === leagueId)?.name || "Account"}</h1><p>Local preview with sample data. Choose Teams or Matchups in the navigation.</p></main>;
}

createRoot(document.getElementById("root")).render(<StrictMode><HashRouter><QueryClientProvider client={queryClient}><SessionContext.Provider value={fixture.session}>
  <AppShell><Routes>
    <Route path="/leagues/:leagueId/teams/:teamId/roster" element={<TeamWorkspacePage />} />
    <Route path="/leagues/:leagueId/matchups" element={<LeagueMatchupsPage />} />
    <Route path="/leagues/:leagueId" element={<Dashboard />} />
    <Route path="*" element={<Dashboard />} />
  </Routes></AppShell>
</SessionContext.Provider></QueryClientProvider></HashRouter></StrictMode>);
