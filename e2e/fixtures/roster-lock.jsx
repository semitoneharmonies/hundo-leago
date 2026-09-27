import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../src/app/AppProviders.jsx";
import { TeamRosterPage } from "../../src/features/rosters/TeamRosterPage.jsx";
import { RosterLockNotice } from "../../src/features/rosters/RosterLockNotice.jsx";
import LeagueRulesDropdown from "../../src/components/LeagueRulesDropdown.jsx";
import { createCapOutlookFixture, capOutlookId } from "../../src/test/capOutlookFixture.js";
import "../../src/styles/theme-a.css";

const fixture = createCapOutlookFixture();
const workspace = fixture.workspace();
const params = new URLSearchParams(location.search);
const christmas = params.get("week") === "christmas";
const locksAtMs = Date.parse(christmas ? "2026-12-27T00:00:00Z" : "2026-09-29T23:00:00Z");
const requests = [];
const client = { resourceUrl: (value) => value, request: async (url, options) => {
  requests.push({ url, method: options?.method ?? "GET" });
  return { data: { code: "MATCHUP_WEEKS_FOUND", health: {}, weeks: [{
    id: capOutlookId(900), leagueId: fixture.league.id, seasonId: workspace.season.id,
    sequence: christmas ? 13 : 1, weekKey: "preview", startsAtMs: locksAtMs - 16 * 3600000,
    baselineAtMs: locksAtMs - 15 * 3600000, locksAtMs, endsAtMs: locksAtMs + 86400000,
    rollsOverAtMs: locksAtMs + 86401000, version: 1, status: "scheduled", matchups: [], byes: [],
    locksAtDisplay: christmas ? "Saturday, December 26, 2026 at 5:00 PM Pacific Time" : "Tuesday, September 29, 2026 at 4:00 PM Pacific Daylight Time",
  }] } };
} };
window.rosterLockRequests = requests;
createRoot(document.getElementById("root")).render(
  <AppProviders Router={MemoryRouter} enableSession={false} config={{ appEnv: "local", apiOrigin: "http://127.0.0.1:4199", socketOrigin: "http://127.0.0.1:4199", buildId: null }}>
    <main className="hl-page hl-page--wide">
      <TeamRosterPage workspace={workspace} teams={[fixture.team]} currentUserId={capOutlookId(3)}
        managerName="Preview manager" onTeamChange={() => {}} httpClient={client}
        rosterLockNotice={<RosterLockNotice httpClient={client} leagueId={fixture.league.id} seasonId={workspace.season.id} />} />
      <LeagueRulesDropdown onClose={() => {}} />
    </main>
  </AppProviders>
);
