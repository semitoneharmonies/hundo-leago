import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../src/app/AppProviders.jsx";
import { TeamRosterPage } from "../../src/features/rosters/TeamRosterPage.jsx";
import { createCapOutlookFixture, capOutlookId } from "../../src/test/capOutlookFixture.js";
import "../../src/styles/theme-a.css";
import { SCORING_CATEGORIES, EXPANDED_SCORING_VERSION } from "../../src/shared/scoringCategories.js";

const fixture = createCapOutlookFixture();
const ownRoster = new URLSearchParams(window.location.search).has("own");
fixture.setCanManage(ownRoster);
fixture.players.forEach((player) => {
  player.injuredReserveEligible = true;
  player.statistics = {
    gamesPlayed: 72, goals: 30, assists: 45, nhlPoints: 75,
    fantasyPointsHundredths: 18325,
    scoringRuleVersion: EXPANDED_SCORING_VERSION,
    scoringStats: Object.fromEntries(SCORING_CATEGORIES.map((category, index) => [category.key, index + 10])),
  };
});
fixture.players[1].onTradeBlock = true;
fixture.players[4].onTradeBlock = true;
const client = { request: fixture.request, resourceUrl: (value) => value };
const viewerId = capOutlookId(100);
const viewerTeam = { ...fixture.team, id: capOutlookId(101), name: "Your team", currentManager: { userId: viewerId } };

createRoot(document.getElementById("root")).render(
  <AppProviders Router={MemoryRouter} enableSession={false} config={{ appEnv: "local", apiOrigin: "http://127.0.0.1:4199", socketOrigin: "http://127.0.0.1:4199", buildId: null }}>
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
      <p style={{ color: "#a9b9d1", fontSize: 13 }}>Local preview · sample data · <a href="?own">Your roster actions</a> · <a href="?">Another team's roster</a></p>
      <TeamRosterPage workspace={fixture.workspace()} teams={[fixture.team, viewerTeam]} currentUserId={ownRoster ? fixture.team.currentManager.userId : viewerId} managerName="Preview manager" onTeamChange={() => {}} httpClient={client} />
    </main>
  </AppProviders>
);
