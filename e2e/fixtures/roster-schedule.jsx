import { createRoot } from "react-dom/client";
import { useQuery } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../src/app/AppProviders.jsx";
import { TeamRosterPage } from "../../src/features/rosters/TeamRosterPage.jsx";
import { teamWorkspaceQuery } from "../../src/features/rosters/teamWorkspaceQueries.js";
import { createRosterScheduleFixture } from "../../src/test/rosterScheduleFixture.js";
import "../../src/index.css";

const fixture = createRosterScheduleFixture();
window.scheduleFixture = fixture;
export function Preview() {
  const { data } = useQuery(teamWorkspaceQuery(fixture.client, fixture.league.id, fixture.team.id));
  return data && <TeamRosterPage workspace={data} currentUserId={fixture.team.currentManager.userId} teams={[fixture.team]} httpClient={fixture.client} onTeamChange={() => {}} />;
}
createRoot(document.getElementById("root")).render(
  <AppProviders Router={MemoryRouter} enableSession={false} config={{ appEnv: "local", apiOrigin: "http://127.0.0.1:4199", socketOrigin: "http://127.0.0.1:4199", buildId: null }}>
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: 16 }}>
      <p style={{ color: "#94a3b8", fontSize: 12 }}>Local schedule preview · illustrative roster and games</p>
      <Preview />
    </main>
  </AppProviders>,
);
