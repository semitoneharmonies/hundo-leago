import { createRoot } from "react-dom/client";
import { useQuery } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../src/app/AppProviders.jsx";
import { TeamRosterPage } from "../../src/features/rosters/TeamRosterPage.jsx";
import { teamWorkspaceQuery } from "../../src/features/rosters/teamWorkspaceQueries.js";
import { createCapOutlookFixture, capOutlookId } from "../../src/test/capOutlookFixture.js";
import "../../src/styles/theme-a.css";

const fixture = createCapOutlookFixture();
window.capFixture = fixture;
const client = { request: fixture.request, resourceUrl: (value) => value };
export function Preview() {
  const { data } = useQuery(teamWorkspaceQuery(client, fixture.league.id, fixture.team.id));
  return <main style={{ maxWidth: 1150, margin: "0 auto", padding: 16 }}>
    <p style={{ color: "#94a3b8", fontSize: 12 }}>Local preview · sample roster · moves affect this preview only</p>
    {data && <TeamRosterPage workspace={data} teams={[fixture.team]} currentUserId={capOutlookId(3)} managerName="Preview manager" onTeamChange={() => {}} httpClient={client} />}
  </main>;
}
createRoot(document.getElementById("root")).render(
  <AppProviders Router={MemoryRouter} enableSession={false} config={{ appEnv: "local", apiOrigin: "http://127.0.0.1:4199", socketOrigin: "http://127.0.0.1:4199", buildId: null }}>
    <Preview />
  </AppProviders>
);
