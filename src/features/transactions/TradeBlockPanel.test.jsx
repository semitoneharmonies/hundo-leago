import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "../../shared/query/queryClient.js";
import { renderWithProviders } from "../../test/render.jsx";
import { teamWorkspaceKeys } from "../rosters/teamWorkspaceQueries.js";
import { TradeBlockPanel } from "./TradeBlockPanel.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
const teamId = "22222222-2222-4222-8222-222222222222";
const playerId = "33333333-3333-4333-8333-333333333333";
const ownershipId = "44444444-4444-4444-8444-444444444444";

function workspace(players) {
  return {
    team: {
      id: teamId,
      name: "Current Team Name",
      primaryColour: "#112233",
      secondaryColour: "#ddeeff",
    },
    players,
  };
}

function renderPanel(players, { currentUserId = null, currentManager = null } = {}) {
  const queryClient = createQueryClient();
  queryClient.setQueryData(
    teamWorkspaceKeys.detail(leagueId, teamId),
    workspace(players)
  );
  return renderWithProviders(
    <TradeBlockPanel
      httpClient={{ request: vi.fn() }}
      leagueId={leagueId}
      teams={[{ id: teamId, currentManager }]}
      currentUserId={currentUserId}
    />,
    { queryClient, initialEntries: [`/leagues/${leagueId}/trades`] }
  );
}

describe("league trade block", () => {
  it("does not offer a trade action on the viewer's own trade block", () => {
    renderPanel([{ ownershipId, playerId, name: "Own Player", onTradeBlock: true }], {
      currentUserId: "manager", currentManager: { userId: "manager" },
    });
    expect(screen.queryByRole("link", { name: /Propose trade/ })).not.toBeInTheDocument();
  });

  it("prefills the requested player, owning team and unambiguous managed team", () => {
    const managedTeamId = "77777777-7777-4777-8777-777777777777";
    const contractId = "88888888-8888-4888-8888-888888888888";
    const queryClient = createQueryClient();
    queryClient.setQueryData(teamWorkspaceKeys.detail(leagueId, teamId), workspace([
      { ownershipId, playerId, name: "Trade Player", onTradeBlock: true, contract: { id: contractId, aavCents: 500 } },
    ]));
    queryClient.setQueryData(teamWorkspaceKeys.detail(leagueId, managedTeamId), { team: { id: managedTeamId, name: "My Team" }, players: [] });
    renderWithProviders(<TradeBlockPanel httpClient={{ request: vi.fn() }} leagueId={leagueId} currentUserId="manager"
      teams={[{ id: teamId }, { id: managedTeamId, currentManager: { userId: "manager" } }]} />, { queryClient });
    const destination = new URL(screen.getByRole("link", { name: "Propose trade for Trade Player" }).getAttribute("href"), "https://example.test");
    expect(Object.fromEntries(destination.searchParams)).toEqual({ assetDirection: "requested", assetType: "contract", assetId: contractId, sourceTeamId: teamId, proposingTeamId: managedTeamId });
  });

  it("shows current team and player data for blocked players", async () => {
    renderPanel([
      {
        ownershipId,
        playerId,
        name: "Current Player Name",
        normalizedPosition: "F",
        rosterCategory: "Active",
        onTradeBlock: true,
        age: 24,
        nhlTeamAbbreviation: "MTL",
        contract: { aavCents: 500 },
        statistics: {
          gamesPlayed: 10,
          goals: 3,
          assists: 4,
          nhlPoints: 7,
          fantasyPointsHundredths: 850,
        },
      },
      {
        ownershipId: "55555555-5555-4555-8555-555555555555",
        playerId: "66666666-6666-4666-8666-666666666666",
        name: "Unavailable Player",
        normalizedPosition: "D",
        rosterCategory: "Bench",
        onTradeBlock: false,
      },
    ]);

    expect(await screen.findByRole("heading", { name: "Trade block" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Current Player Name/ })).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/players/${playerId}`
    );
    const table = screen.getByRole("table", {
      name: "Players currently available on the trade block",
    });
    const playerRow = within(table)
      .getByRole("link", { name: "Current Player Name" })
      .closest("tr");
    expect(within(playerRow).getByText("Current Team Name")).toBeInTheDocument();
    expect(within(playerRow).getByLabelText("F position, Active")).toBeInTheDocument();
    expect(within(playerRow).getByText("$5.00")).toBeInTheDocument();
    expect(within(playerRow).getByText("24")).toBeInTheDocument();
    expect(within(playerRow).getByText("MTL")).toBeInTheDocument();
    expect(within(playerRow).getByText("8.50")).toBeInTheDocument();
    expect(within(playerRow).getByText("0.85")).toBeInTheDocument();
    expect(
      screen.queryByText(/available for trade conversations/i)
    ).toBeNull();
    expect(screen.queryByText("Unavailable Player")).not.toBeInTheDocument();
  });

  it("shows a clear empty state", async () => {
    renderPanel([]);
    expect(
      await screen.findByText("No players are on the trade block right now.")
    ).toBeInTheDocument();
  });
});
