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
const activeDefenceOwnershipId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const activeDefencePlayerId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const benchOwnershipId = "12121212-1212-4121-8121-121212121212";
const benchPlayerId = "34343434-3434-4343-8343-343434343434";
const benchContractId = "56565656-5656-4565-8565-565656565656";
const prospectOwnershipId = "77777777-7777-4777-8777-777777777777";
const contractId = "88888888-8888-4888-8888-888888888888";
const pickId = "99999999-9999-4999-8999-999999999999";
const laterPickId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const managerTeamId = "abababab-abab-4aba-8aba-abababababab";

function mockPointerTarget(element) {
  const descriptor = Object.getOwnPropertyDescriptor(
    document,
    "elementFromPoint"
  );
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: vi.fn(() => element),
  });
  return () => {
    if (descriptor) {
      Object.defineProperty(document, "elementFromPoint", descriptor);
    } else {
      delete document.elementFromPoint;
    }
  };
}

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
    for (const heading of ["GP", "G", "A", "P", "FP", "FPG"]) {
      expect(
        screen.getAllByRole("button", {
          name: `Sort roster by ${heading}`,
        }).length
      ).toBeGreaterThan(0);
    }
    const activeRow = screen
      .getByRole("rowheader", { name: "Active Player" })
      .closest("tr");
    expect(within(activeRow).getAllByText("10")).toHaveLength(2);
    expect(within(activeRow).getByText("12.50")).toBeInTheDocument();
    expect(within(activeRow).getByText("1.25")).toBeInTheDocument();
    expect(screen.queryByText("Limit")).not.toBeInTheDocument();
    expect(screen.getByText("1/3 slots used")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Owned draft picks" })
    ).toBeInTheDocument();
    const draftPickRegion = screen.getByRole("region", {
      name: "Owned draft picks",
    });
    expect(
      within(draftPickRegion).getAllByRole("link", {
        name: /pick 3, originally Target Owls/i,
      })
    ).toHaveLength(2);
    expect(
      within(draftPickRegion)
        .getAllByRole("columnheader")
        .map(({ textContent }) => textContent)
    ).toEqual(["Year", "R1", "R2", "R3", "R4"]);
    expect(
      within(draftPickRegion)
        .getAllByRole("rowheader")
        .map(({ textContent }) => textContent)
    ).toEqual(["2026-27", "2027-28"]);

    await view.user.click(
      screen.getByRole("button", { name: /Hockey lines/ })
    );
    expect(
      screen.getByRole("heading", { name: "Hockey lines" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Drag Active Player to reorder",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Move Active Player later" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Active Player").closest(".hl-line-player")).toHaveClass(
      "hl-line-player--team"
    );
  });

  it("starts requested-player and requested-pick trades from another roster", async () => {
    const data = workspace();
    data.canManage = false;
    const managerTeam = {
      id: managerTeamId,
      leagueId,
      name: "Manager Falcons",
      primaryColour: "#102a43",
      secondaryColour: "#f97316",
      tertiaryColour: null,
      logoReference: null,
      version: 1,
      currentManager: {
        userId: "user-1",
        displayName: "League Manager",
        version: 1,
      },
    };
    const view = renderWithProviders(
      <TeamRosterPage
        workspace={data}
        teams={[data.team, managerTeam]}
        currentUserId="user-1"
        managerName="Other Manager"
        onTeamChange={() => {}}
        httpClient={{ request: vi.fn() }}
      />
    );

    const playerRequest = screen.getByRole("link", {
      name: "Request Active Player in a trade",
    });
    expect(playerRequest.getAttribute("href")).toContain(
      `assetDirection=requested`
    );
    expect(playerRequest.getAttribute("href")).toContain(
      `proposingTeamId=${managerTeamId}`
    );
    expect(playerRequest.getAttribute("href")).toContain(
      `sourceTeamId=${teamId}`
    );
    expect(screen.getByRole("link", {
      name: "Request Prospect Player in a trade",
    })).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /2026-27 round 1, pick 3, originally Target Owls/i,
      }).getAttribute("href")
    ).toContain("assetType=draft_pick");

    await view.user.click(
      screen.getByRole("button", { name: /Hockey lines/ })
    );
    expect(
      screen.getByRole("link", {
        name: "Request Active Player in a trade",
      })
    ).toBeInTheDocument();
  });

  it("offers compact roster actions and sends authoritative commands", async () => {
    const data = workspace();
    data.players[0].injuredReserveEligible = true;
    data.players[0].onTradeBlock = false;
    data.players[1].injuredReserveEligible = false;
    data.players[1].onTradeBlock = false;
    const httpClient = {
      request: vi.fn(async () => ({ data: {} })),
    };
    const confirm = vi.spyOn(globalThis, "confirm").mockReturnValue(true);
    renderWithProviders(
      <TeamRosterPage
        workspace={data}
        teams={[data.team]}
        managerName="League Manager"
        onTeamChange={() => {}}
        httpClient={httpClient}
      />
    );
    const activeRow = screen
      .getByRole("rowheader", { name: "Active Player" })
      .closest("tr");
    expect(
      within(activeRow).getByRole("button", {
        name: "Buy out Active Player",
      })
    ).toBeEnabled();
    expect(
      within(activeRow).getByRole("button", {
        name: "Move Active Player to injured reserve",
      })
    ).toBeEnabled();
    expect(
      within(activeRow).getByRole("button", {
        name: "Move to bench Active Player",
      })
    ).toBeEnabled();
    expect(
      within(activeRow).getByRole("link", {
        name: "Add Active Player to a trade",
      })
    ).toHaveAttribute(
      "href",
      expect.stringContaining(`assetId=${contractId}`)
    );
    expect(
      within(activeRow).getByRole("button", {
        name: "Add Active Player to the trade block",
      })
    ).toBeEnabled();

    await within(activeRow)
      .getByRole("button", {
        name: "Add Active Player to the trade block",
      })
      .click();
    await waitFor(() =>
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.stringContaining(
          `/roster/${activeOwnershipId}/trade-block`
        ),
        expect.objectContaining({
          method: "PUT",
          body: { blocked: true, expectedVersion: 1 },
        })
      )
    );

    await within(activeRow)
      .getByRole("button", {
        name: "Move Active Player to injured reserve",
      })
      .click();
    await waitFor(() =>
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.stringContaining(
          `/roster/${activeOwnershipId}/move`
        ),
        expect.objectContaining({
          method: "POST",
          body: {
            confirmedIllegal: false,
            destinationCategory: "Injured Reserve",
            expectedVersion: 1,
          },
        })
      )
    );

    await within(activeRow)
      .getByRole("button", {
        name: "Move to bench Active Player",
      })
      .click();
    await waitFor(() =>
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.stringContaining(
          `/roster/${activeOwnershipId}/move`
        ),
        expect.objectContaining({
          method: "POST",
          body: {
            confirmedIllegal: false,
            destinationCategory: "Bench",
            expectedVersion: 1,
          },
        })
      )
    );

    await within(activeRow)
      .getByRole("button", { name: "Buy out Active Player" })
      .click();
    await waitFor(() =>
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.stringContaining(`/contracts/${contractId}/buyout`),
        expect.objectContaining({
          method: "POST",
          body: {
            confirmed: true,
            expectedContractVersion: 1,
            expectedOwnershipVersion: 1,
          },
        })
      )
    );
    expect(confirm).toHaveBeenCalledOnce();
    confirm.mockRestore();
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
    const source = screen.getByRole("button", {
      name: "Drag Active Player to reorder",
    });
    const target = screen.getByText("Second Forward").closest(".hl-line-player");
    const restorePointerTarget = mockPointerTarget(target);
    fireEvent.pointerDown(source, {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerMove(source, {
      pointerId: 1,
      pointerType: "mouse",
      buttons: 1,
      clientX: 40,
      clientY: 40,
    });
    fireEvent.pointerUp(source, {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      clientX: 40,
      clientY: 40,
    });
    restorePointerTarget();

    await waitFor(() => {
      expect(savedInput?.forwardOwnerships.map(({ id }) => id)).toEqual([
        secondActiveOwnershipId,
        activeOwnershipId,
      ]);
    });
    expect(await screen.findByText("Line order saved.")).toBeInTheDocument();
  });

  it("moves a Bench player to Active by drag and drop", async () => {
    const data = workspace();
    data.players.splice(1, 0, {
      ...data.players[0],
      ownershipId: benchOwnershipId,
      playerId: benchPlayerId,
      name: "Bench Player",
      rosterCategory: "Bench",
      slotNumber: 1,
      displayOrder: null,
      contract: {
        ...data.players[0].contract,
        id: benchContractId,
        aavCents: 300,
      },
    });
    const httpClient = {
      request: vi.fn(async () => ({ data: {} })),
    };
    renderWithProviders(
      <TeamRosterPage
        workspace={data}
        teams={[data.team]}
        managerName="League Manager"
        onTeamChange={() => {}}
        httpClient={httpClient}
      />
    );

    const source = screen.getByRole("button", {
      name: "Drag Bench Player to reorder",
    });
    const target = screen
      .getByRole("rowheader", { name: "Active Player" })
      .closest("tr");
    const dataTransfer = {
      effectAllowed: "",
      dropEffect: "",
      setData: vi.fn(),
      getData: vi.fn(() => benchOwnershipId),
    };
    fireEvent.dragStart(source, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });

    await waitFor(() =>
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.stringContaining(`/roster/${benchOwnershipId}/move`),
        expect.objectContaining({
          method: "POST",
          body: {
            confirmedIllegal: false,
            destinationCategory: "Active",
            expectedVersion: 1,
          },
        })
      )
    );
  });

  it("defaults to AAV order within position groups and saves table drag ordering", async () => {
    const data = workspace();
    data.players[0].displayOrder = null;
    data.players.splice(1, 0, {
      ...data.players[0],
      ownershipId: secondActiveOwnershipId,
      playerId: secondActivePlayerId,
      name: "Higher AAV Forward",
      contract: { ...data.players[0].contract, aavCents: 700 },
    });
    data.players.splice(2, 0, {
      ...data.players[0],
      ownershipId: activeDefenceOwnershipId,
      playerId: activeDefencePlayerId,
      name: "Highest AAV Defence",
      normalizedPosition: "D",
      contract: { ...data.players[0].contract, aavCents: 900 },
    });
    let savedInput = null;
    const view = renderWithProviders(
      <TeamRosterPage
        workspace={data}
        teams={[data.team]}
        managerName="League Manager"
        onTeamChange={() => {}}
        httpClient={{
          request: vi.fn(async (_path, options) => {
            savedInput = options.body;
            return { data: { orderVersion: 1 } };
          }),
        }}
      />
    );

    const activeRoster = screen.getByRole("region", {
      name: "Active roster",
    });
    expect(
      within(activeRoster)
        .getAllByRole("rowheader")
        .map(({ textContent }) => textContent)
    ).toEqual([
      "Higher AAV Forward",
      "Active Player",
      "Highest AAV Defence",
    ]);

    const source = within(activeRoster).getByRole("button", {
      name: "Drag Active Player to reorder",
    });
    const target = within(activeRoster)
      .getByRole("rowheader", { name: "Higher AAV Forward" })
      .closest("tr");
    const dataTransfer = {
      effectAllowed: "",
      dropEffect: "",
      setData: vi.fn(),
      getData: vi.fn(() => activeOwnershipId),
    };
    fireEvent.dragStart(source, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });

    await waitFor(() => {
      expect(savedInput?.forwardOwnerships.map(({ id }) => id)).toEqual([
        activeOwnershipId,
        secondActiveOwnershipId,
      ]);
    });
    expect(await screen.findByText("Line order saved.")).toBeInTheDocument();

    const pointerSource = within(activeRoster).getByRole("button", {
      name: "Drag Active Player to reorder",
    });
    const pointerTarget = within(activeRoster)
      .getByRole("rowheader", { name: "Higher AAV Forward" })
      .closest("tr");
    const restorePointerTarget = mockPointerTarget(pointerTarget);
    fireEvent.pointerDown(pointerSource, {
      pointerId: 2,
      pointerType: "touch",
      button: 0,
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerMove(pointerSource, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 40,
      clientY: 40,
    });
    fireEvent.pointerUp(pointerSource, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 40,
      clientY: 40,
    });
    restorePointerTarget();

    await waitFor(() => {
      expect(savedInput?.forwardOwnerships.map(({ id }) => id)).toEqual([
        secondActiveOwnershipId,
        activeOwnershipId,
      ]);
    });
    expect(view).toBeDefined();
  });
});
