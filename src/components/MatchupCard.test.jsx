import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/render.jsx";
import { MatchupCard } from "./MatchupCard.jsx";

const summary = { id: "pairing", homeTeam: { id: "home", name: "Home Team" }, awayTeam: { id: "away", name: "Away Team" } };
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };

describe("matchup summary scores", () => {
  it("uses the official result, including zero and negative scores", async () => {
    const request = vi.fn(async () => ({ data: { matchup: {
      ...summary, result: { currentVersion: { homeScoreHundredths: 0, awayScoreHundredths: -125 } },
      scoring: { home: { scoreHundredths: 99999 }, away: { scoreHundredths: 500 } },
    } } }));
    renderWithProviders(<MatchupCard leagueId="league" seasonId="season" week={{ id: "week" }} matchup={summary} httpClient={{ request }} />, { config });
    expect(await screen.findByLabelText("Home Team: 0.00 fantasy points")).toBeInTheDocument();
    expect(screen.getByLabelText("Away Team: -1.25 fantasy points")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home Team vs Away Team" })).toHaveAttribute("href", "/leagues/league/matchups?season=season&week=week&matchup=pairing");
    expect(request.mock.calls[0][1]).toMatchObject({ authenticated: true });
  });

  it("shows unavailable rather than inventing a zero for an unscored matchup", async () => {
    renderWithProviders(<MatchupCard leagueId="league" seasonId="season" week={{ id: "week" }} matchup={summary}
      httpClient={{ request: async () => ({ data: { matchup: { ...summary, result: null, scoring: null } } }) }} />, { config });
    expect(await screen.findByLabelText("Home Team: — fantasy points")).toBeInTheDocument();
    expect(screen.getByLabelText("Away Team: — fantasy points")).toBeInTheDocument();
  });

  it("keeps other matchup scores visible when one request fails", async () => {
    const request = async (path) => {
      if (path.endsWith("/pairing")) throw new Error("Unavailable");
      return { data: { matchup: { scoring: { home: { scoreHundredths: 12345 }, away: { scoreHundredths: 6789 } } } } };
    };
    renderWithProviders(<>
      <MatchupCard leagueId="league" seasonId="season" week={{ id: "week" }} matchup={summary} httpClient={{ request }} />
      <MatchupCard leagueId="league" seasonId="season" week={{ id: "week" }} matchup={{ ...summary, id: "second" }} httpClient={{ request }} />
    </>, { config });
    expect(await screen.findByLabelText("Home Team: 123.45 fantasy points")).toBeInTheDocument();
    expect(within(await screen.findByRole("alert")).getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
