import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResponseContractError } from "../../shared/api/responseContracts.js";
import { renderWithProviders } from "../../test/render.jsx";
import { TeamRosterPage } from "./TeamRosterPage.jsx";
import { validatePublicRosterResponse } from "./publicRosterContracts.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const seasonId = "22222222-2222-4222-8222-222222222222";
const teamId = "33333333-3333-4333-8333-333333333333";
const activePlayerId = "44444444-4444-4444-8444-444444444444";
const prospectPlayerId = "55555555-5555-4555-8555-555555555555";
const activeOwnershipId = "66666666-6666-4666-8666-666666666666";
const secondActiveOwnershipId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const secondActivePlayerId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const prospectOwnershipId = "77777777-7777-4777-8777-777777777777";
const contractId = "88888888-8888-4888-8888-888888888888";
const pickId = "99999999-9999-4999-8999-999999999999";
const laterPickId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function publicRoster() {
  return {
    league: { id: leagueId, name: "Hundo League" },
    season: { id: seasonId, label: "2026-27" },
    team: {
      id: teamId,
      name: "Target Owls",
      primaryColour: "#112233",
      secondaryColour: "#aabbcc",
      logoReference: null,
    },
    players: [
      {
        playerReference: activePlayerId,
        name: "Active Player",
        normalizedPosition: "F",
        rosterCategory: "Active",
        aavCents: 500,
        remainingContractYears: 2,
        age: 26,
        seasonStatistics: {
          gamesPlayed: 10,
          goals: 4,
          assists: 6,
          nhlPoints: 10,
          fantasyPointsHundredths: 1250,
        },
      },
      {
        playerReference: prospectPlayerId,
        name: "Prospect Player",
        normalizedPosition: "D",
        rosterCategory: "Prospect",
        aavCents: null,
        remainingContractYears: 0,
        age: null,
        seasonStatistics: null,
      },
    ],
    cap: {
      capLimitCents: 1000,
      capUsageCents: 1500,
      capSpaceCents: -500,
      retainedSalaryTotalCents: 200,
      buyoutPenaltyTotalCents: 100,
    },
    updatedAt: 1,
  };
}

function workspace() {
  return {
    code: "TEAM_WORKSPACE_FOUND",
    canManage: true,
    orderVersion: 0,
    league: { id: leagueId, name: "Hundo League" },
    season: { id: seasonId, label: "2026-27" },
    team: {
      id: teamId,
      name: "Target Owls",
      primaryColour: "#112233",
      secondaryColour: "#aabbcc",
      logoReference: null,
      version: 1,
    },
    players: [
      {
        ownershipId: activeOwnershipId,
        ownershipVersion: 1,
        playerId: activePlayerId,
        name: "Active Player",
        normalizedPosition: "F",
        rosterCategory: "Active",
        ownershipKind: "Contract",
        slotNumber: 1,
        displayOrder: 0,
        age: 26,
        contract: {
          id: contractId,
          version: 1,
          type: "Standard",
          originalTotalValueCents: 1000,
          originalTermYears: 2,
          aavCents: 500,
          remainingYears: 2,
        },
        statistics: {
          gamesPlayed: 10,
          goals: 4,
          assists: 6,
          nhlPoints: 10,
          fantasyPointsHundredths: 1250,
        },
      },
      {
        ownershipId: prospectOwnershipId,
        ownershipVersion: 1,
        playerId: prospectPlayerId,
        name: "Prospect Player",
        normalizedPosition: "D",
        rosterCategory: "Prospect",
        ownershipKind: "Prospect Right",
        slotNumber: null,
        displayOrder: null,
        age: null,
        contract: null,
        statistics: null,
      },
    ],
    cap: {
      limitCents: 1000,
      usageCents: 800,
      spaceCents: 200,
      activePlayerCents: 500,
      retainedSalaryCents: 200,
      buyoutPenaltyCents: 100,
      retentionSlotsUsed: 1,
      retentionSlotLimit: 3,
      complete: true,
      issues: [],
    },
    draftPicks: [
      {
        id: laterPickId,
        version: 1,
        targetSeason: {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          label: "2027-28",
        },
        round: 2,
        position: 3,
        originalTeam: { id: teamId, name: "Target Owls" },
      },
      {
        id: pickId,
        version: 1,
        targetSeason: { id: seasonId, label: "2026-27" },
        round: 1,
        position: 3,
        originalTeam: { id: teamId, name: "Target Owls" },
      },
    ],
    tradeAssets: {
      contracts: [],
      prospects: [],
      draftPicks: [],
      retentions: [],
      buyouts: [],
      futureConsiderations: [],
    },
  };
}

describe("public roster response contract", () => {
  it("accepts only the exact approved public fields", () => {
    expect(
      validatePublicRosterResponse({
        code: "PUBLIC_ROSTER_FOUND",
        roster: publicRoster(),
      })
    ).toBe(true);
    expect(() =>
      validatePublicRosterResponse({
        code: "PUBLIC_ROSTER_FOUND",
        roster: { ...publicRoster(), membership: { id: "private" } },
      })
    ).toThrow(ResponseContractError);
  });

  it("rejects duplicate players and cap totals that do not reconcile", () => {
    const duplicate = publicRoster();
    duplicate.players.push({ ...duplicate.players[0] });
    expect(() =>
      validatePublicRosterResponse({
        code: "PUBLIC_ROSTER_FOUND",
        roster: duplicate,
      })
    ).toThrow(/duplicate players/i);
    const badCap = publicRoster();
    badCap.cap.capSpaceCents = 0;
    expect(() =>
      validatePublicRosterResponse({
        code: "PUBLIC_ROSTER_FOUND",
        roster: badCap,
      })
    ).toThrow(/do not reconcile/i);
  });
});

describe("authoritative team roster page", () => {
  it("shows readable cap components, roster views, and owned picks", async () => {
    const data = workspace();
    const view = renderWithProviders(
      <TeamRosterPage
        workspace={data}
        teams={[data.team]}
        managerName="League Manager"
        onTeamChange={() => {}}
        httpClient={{ request: async () => ({ data: {} }) }}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Target Owls" })
    ).toBeInTheDocument();
    expect(screen.getByText("Manager: League Manager")).toBeInTheDocument();
    for (const heading of [
      "Active roster",
      "Bench",
      "Injured reserve",
      "Prospects",
      "Salary cap",
    ]) {
      expect(
        screen.getByRole("heading", { name: heading })
      ).toBeInTheDocument();
    }
    expect(screen.getByText(/1\/18 used/)).toBeInTheDocument();
    expect(
      screen.getByRole("rowheader", { name: "Active Player" })
    ).toBeInTheDocument();
    expect(screen.getByText(/10 GP.*12\.50 FP/)).toBeInTheDocument();
    expect(screen.getByText("1/3 slots used")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Owned draft picks" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Pick 3.*originally Target Owls/)
    ).toHaveLength(2);
    expect(
      within(
        screen.getByRole("region", { name: "Owned draft picks" })
      )
        .getAllByRole("heading", { level: 3 })
        .map(({ textContent }) => textContent)
    ).toEqual(["2026-27", "2027-28"]);

    await view.user.click(
      screen.getByRole("button", { name: /Hockey lines/ })
    );
    expect(
      screen.getByRole("heading", { name: "Hockey lines" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Move Active Player later" })
    ).toBeDisabled();
  });

  it("saves same-position pointer drag ordering", async () => {
    const data = workspace();
    data.players.splice(1, 0, {
      ...data.players[0],
      ownershipId: secondActiveOwnershipId,
      playerId: secondActivePlayerId,
      name: "Second Forward",
      slotNumber: 2,
      displayOrder: 1,
    });
    let savedInput = null;
    const httpClient = {
      request: vi.fn(async (_path, options) => {
        savedInput = options.body;
        return { data: { orderVersion: 1 } };
      }),
    };
    const view = renderWithProviders(
      <TeamRosterPage
        workspace={data}
        teams={[data.team]}
        managerName="League Manager"
        onTeamChange={() => {}}
        httpClient={httpClient}
      />
    );

    await view.user.click(
      screen.getByRole("button", { name: /Hockey lines/ })
    );
    const source = screen.getByText("Active Player").closest(".hl-line-player");
    const target = screen.getByText("Second Forward").closest(".hl-line-player");
    const dataTransfer = {
      effectAllowed: "",
      setData: vi.fn(),
    };
    fireEvent.dragStart(source, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });

    await waitFor(() => {
      expect(savedInput?.forwardOwnerships.map(({ id }) => id)).toEqual([
        secondActiveOwnershipId,
        activeOwnershipId,
      ]);
    });
    expect(await screen.findByText("Line order saved.")).toBeInTheDocument();
  });
});
