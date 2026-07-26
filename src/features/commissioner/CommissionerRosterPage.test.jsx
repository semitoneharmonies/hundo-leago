import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";

vi.mock("socket.io-client", () => ({
  io: () => ({
    on() {},
    off() {},
    onAny() {},
    offAny() {},
    disconnect() {},
  }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { AccountHome } from "../accounts/AccountHome.jsx";
import { CommissionerRosterPage } from "./CommissionerRosterPage.jsx";

const IDS = Object.freeze({
  league: "11111111-1111-4111-8111-111111111111",
  season: "22222222-2222-4222-8222-222222222222",
  futureSeason: "22222222-2222-4222-8222-222222222223",
  team: "33333333-3333-4333-8333-333333333333",
  secondTeam: "33333333-3333-4333-8333-333333333334",
  user: "44444444-4444-4444-8444-444444444444",
  membership: "55555555-5555-4555-8555-555555555555",
  ownership: "66666666-6666-4666-8666-666666666666",
  prospectOwnership: "66666666-6666-4666-8666-666666666667",
  player: "77777777-7777-4777-8777-777777777777",
  prospectPlayer: "77777777-7777-4777-8777-777777777779",
  freeAgent: "77777777-7777-4777-8777-777777777778",
  contract: "88888888-8888-4888-8888-888888888888",
  contractYear: "99999999-9999-4999-8999-999999999999",
  providerAttempt: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  correction: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  activity: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  operation: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  backup: `backup-v1-${"e".repeat(64)}`,
});
const config = Object.freeze({
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
});

function envelope(data, status = 200) {
  return new Response(
    JSON.stringify({ data, meta: { requestId: "request-1" } }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

function sessionData() {
  return {
    csrfToken: "R".repeat(43),
    session: {
      id: IDS.user,
      userId: IDS.user,
      status: "active",
      createdAtMs: 1,
      lastUsedAtMs: 2,
      idleExpiresAtMs: 3,
      absoluteExpiresAtMs: 4,
      version: 1,
    },
    user: {
      id: IDS.user,
      displayName: "Roster Commissioner",
      status: "active",
      version: 1,
    },
  };
}

function league(authority = "commissioner") {
  return {
    id: IDS.league,
    name: "Alpha Test League",
    status: "active",
    currentSeason: {
      id: IDS.season,
      label: "2026-27",
      status: "active",
      version: 1,
    },
    membership: {
      id: IDS.membership,
      permissionCategory:
        authority === "platform_administrator" ? "member" : authority,
      effectiveAuthority: authority,
      status: "active",
      version: 1,
    },
    version: 1,
  };
}

function cap(teamId, usage = 4_000) {
  return {
    leagueId: IDS.league,
    seasonId: IDS.season,
    teamId,
    capLimitCents: 10_000,
    capUsageCents: usage,
    capSpaceCents: 10_000 - usage,
    overCap: usage > 10_000,
    complete: true,
    breakdown: {
      activePlayerCents: usage,
      retentionCents: 0,
      buyoutCents: 0,
    },
    activePlayers: [],
    retentionObligations: [],
    buyoutObligations: [],
    issues: [],
  };
}

function workspace() {
  return {
    code: "COMMISSIONER_ROSTER_WORKSPACE_FOUND",
    workspace: {
      league: {
        id: IDS.league,
        name: "Alpha Test League",
        currentSeasonId: IDS.season,
        currentSeasonLabel: "2026-27",
        salaryCapCents: 10_000,
      },
      teams: [
        {
          id: IDS.team,
          name: "Alpha Aurora",
          status: "active",
          version: 1,
          cap: cap(IDS.team),
        },
        {
          id: IDS.secondTeam,
          name: "Alpha Blades",
          status: "active",
          version: 1,
          cap: cap(IDS.secondTeam, 5_000),
        },
      ],
      seasons: [
        {
          id: IDS.season,
          label: "2026-27",
          nhlSeasonKey: "20262027",
          status: "active",
          sequence: 1,
        },
        {
          id: IDS.futureSeason,
          label: "2027-28",
          nhlSeasonKey: "20272028",
          status: "planned",
          sequence: 2,
        },
      ],
      roster: [
        {
          ownershipId: IDS.ownership,
          ownershipVersion: 2,
          seasonId: IDS.season,
          playerId: IDS.player,
          teamId: IDS.team,
          ownershipKind: "Rostered",
          rosterCategory: "Active",
          positionGroup: "F",
          slotNumber: 1,
          player: {
            id: IDS.player,
            fullName: "Roster Player",
            birthDate: "2000-01-01",
            status: "active",
            effectivePosition: "F",
            provider: "sportsdataio-discovery-lab",
            nhlTeamAbbreviation: "VAN",
          },
          contract: {
            id: IDS.contract,
            version: 3,
            teamId: IDS.team,
            type: "normal",
            originalTotalValueCents: 900,
            originalTermYears: 1,
            aavCents: 900,
            startSeasonId: IDS.season,
            status: "active",
            auctionBuyoutLockExpiresAtMs: null,
            years: [
              {
                id: IDS.contractYear,
                seasonId: IDS.season,
                yearNumber: 1,
                aavCents: 900,
                status: "current",
                rolloverAtMs: null,
              },
            ],
          },
        },
        {
          ownershipId: IDS.prospectOwnership,
          ownershipVersion: 1,
          seasonId: IDS.season,
          playerId: IDS.prospectPlayer,
          teamId: IDS.secondTeam,
          ownershipKind: "Prospect Right",
          rosterCategory: "Prospect",
          positionGroup: "F",
          slotNumber: null,
          player: {
            id: IDS.prospectPlayer,
            fullName: "Unsigned Prospect",
            birthDate: "2007-01-01",
            status: "active",
            effectivePosition: "F",
            provider: "release_qa",
            nhlTeamAbbreviation: null,
          },
          contract: null,
        },
      ],
      freeAgents: [
        {
          playerId: IDS.freeAgent,
          fullName: "Free Agent",
          birthDate: "2001-01-01",
          effectivePosition: "D",
          provider: "sportsdataio-discovery-lab",
          nhlTeamAbbreviation: "SEA",
        },
      ],
      providerHealth: {
        provider: "sportsdataio-discovery-lab",
        dataScope: "last-season-only",
        staleAfterMs: 259_200_000,
        catalogPlayerCount: 1_234,
        lastAttempt: {
          id: IDS.providerAttempt,
          nhlSeasonKey: "20252026",
          status: "succeeded",
          startedAtMs: 1_000,
          completedAtMs: 2_000,
          playerCount: 1_234,
          errorCode: null,
        },
        lastSuccessfulImport: {
          id: IDS.providerAttempt,
          nhlSeasonKey: "20252026",
          status: "succeeded",
          startedAtMs: 1_000,
          completedAtMs: 2_000,
          playerCount: 1_234,
        },
        stale: false,
        enabled: true,
      },
    },
  };
}

function seasons() {
  return {
    code: "LEAGUE_SEASONS_FOUND",
    leagueId: IDS.league,
    seasons: [
      {
        id: IDS.season,
        label: "2026-27",
        nhlSeasonKey: "20262027",
        status: "active",
        regularSeasonStartsAtMs: 1,
        regularSeasonEndsAtMs: 2,
        fantasyPlayoffsStartAtMs: null,
        fantasyPlayoffsEndAtMs: null,
        version: 1,
      },
      {
        id: IDS.futureSeason,
        label: "2027-28",
        nhlSeasonKey: "20272028",
        status: "planned",
        regularSeasonStartsAtMs: 3,
        regularSeasonEndsAtMs: 4,
        fantasyPlayoffsStartAtMs: null,
        fantasyPlayoffsEndAtMs: null,
        version: 1,
      },
    ],
  };
}

function correction(preview) {
  return {
    code: preview
      ? "COMMISSIONER_ROSTER_ADD_CORRECTION_PREVIEWED"
      : "COMMISSIONER_ROSTER_ADD_CORRECTION_APPLIED",
    preview,
    before: { playerId: IDS.freeAgent, teamId: null },
    requested: { playerId: IDS.freeAgent, teamId: IDS.team },
    authoritative: { playerId: IDS.freeAgent, teamId: IDS.team },
    warnings: [{ code: "TEAM_ROSTER_ILLEGAL", teamId: IDS.team }],
    capImpact: [
      {
        teamId: IDS.team,
        cap: cap(IDS.team, 4_300),
        warnings: [{ code: "TEAM_ROSTER_ILLEGAL", teamId: IDS.team }],
      },
    ],
    ...(preview
      ? {}
      : {
          evidence: {
            correctionId: IDS.correction,
            activityId: IDS.activity,
            activityType: "commissioner_roster_added",
            occurredAtMs: 10,
          },
        }),
  };
}

function renderPage(fetchImpl, { appEnv = "local" } = {}) {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<AccountHome />} />
      <Route
        path="/leagues/:leagueId/commissioner/rosters"
        element={<CommissionerRosterPage />}
      />
    </Routes>,
    {
      initialEntries: [
        `/leagues/${IDS.league}/commissioner/rosters`,
      ],
      enableSession: true,
      config: { ...config, appEnv },
      sessionOptions: { fetchImpl },
    }
  );
}

function fetchForAuthority(authority, extra) {
  return vi.fn(async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === "/api/v1/session") return envelope(sessionData());
    if (path === "/api/v1/leagues") {
      return envelope({ code: "LEAGUES_FOUND", leagues: [league(authority)] });
    }
    if (path === `/api/v1/leagues/${IDS.league}/seasons`) {
      return envelope(seasons());
    }
    if (
      path ===
      `/api/v1/leagues/${IDS.league}/commissioner/roster-workspace`
    ) {
      return envelope(workspace());
    }
    return extra(path, options);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("M7-10 commissioner roster operations", () => {
  it("denies non-commissioners before requesting the protected workspace", async () => {
    const fetchImpl = fetchForAuthority("manager", (path) => {
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(fetchImpl);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Current commissioner authority is required."
    );
    expect(
      fetchImpl.mock.calls.some(
        ([url]) => new URL(url).pathname.endsWith("/roster-workspace")
      )
    ).toBe(false);
  });

  it("previews and applies an exact roster addition with cap warnings", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => IDS.operation),
    });
    const requests = [];
    const fetchImpl = fetchForAuthority("commissioner", (path, options) => {
      if (
        path ===
        `/api/v1/leagues/${IDS.league}/commissioner/roster-additions/previews`
      ) {
        requests.push({ path, options });
        return envelope(correction(true));
      }
      if (
        path ===
        `/api/v1/leagues/${IDS.league}/commissioner/roster-additions`
      ) {
        requests.push({ path, options });
        return envelope(correction(false));
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderPage(fetchImpl);

    expect(
      await screen.findByRole("heading", {
        name: "Commissioner roster operations",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Choose the operation you need" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Import health" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("sportsdataio-discovery-lab")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Reset staging test leagues",
      })
    ).not.toBeInTheDocument();
    const movePanel = screen
      .getByRole("heading", { name: "Move or re-slot a player" })
      .closest("section");
    const contractPanel = screen
      .getByRole("heading", { name: "Correct a contract" })
      .closest("section");
    expect(
      within(movePanel).queryByRole("combobox", {
        name: "Destination team",
      })
    ).not.toBeInTheDocument();
    expect(
      within(contractPanel).queryByRole("combobox", {
        name: "Contract team",
      })
    ).not.toBeInTheDocument();
    expect(
      within(contractPanel).queryByRole("combobox", {
        name: "Contract type",
      })
    ).not.toBeInTheDocument();
    expect(
      within(contractPanel).queryByRole("combobox", {
        name: "Contract status",
      })
    ).not.toBeInTheDocument();
    expect(
      within(contractPanel).queryByRole("textbox", {
        name: "Auction buyout lock",
      })
    ).not.toBeInTheDocument();
    await view.user.selectOptions(
      within(movePanel).getByLabelText("Rostered player"),
      IDS.prospectOwnership
    );
    expect(
      within(movePanel)
        .getByLabelText("Roster category")
        .querySelectorAll("option")
    ).toHaveLength(1);
    expect(
      within(movePanel).getByRole("option", { name: "Prospect" })
    ).toBeInTheDocument();

    const panel = screen
      .getByRole("heading", { name: "Add a player" })
      .closest("section");
    const form = within(panel);
    await view.user.selectOptions(
      form.getByLabelText("Player"),
      IDS.freeAgent
    );
    await view.user.selectOptions(
      form.getByLabelText("Destination team"),
      IDS.team
    );
    await view.user.selectOptions(
      form.getByLabelText("Roster category"),
      "Bench"
    );
    await view.user.clear(
      form.getByLabelText(/^Total contract value/)
    );
    await view.user.type(
      form.getByLabelText(/^Total contract value/),
      "6.00"
    );
    await view.user.clear(form.getByLabelText(/^Term/));
    await view.user.type(form.getByLabelText(/^Term/), "2");
    await view.user.type(
      form.getByLabelText(/^Reason/),
      "Fixture roster test"
    );
    await view.user.click(
      form.getByRole("button", { name: "Preview player addition" })
    );

    expect(
      await form.findByRole("heading", { name: "Authoritative preview" })
    ).toBeInTheDocument();
    expect(form.getAllByText(/TEAM_ROSTER_ILLEGAL/)).toHaveLength(2);
    expect(form.getByText("$43.00")).toBeInTheDocument();
    expect(requests).toHaveLength(1);
    expect(JSON.parse(requests[0].options.body)).toEqual({
      seasonId: IDS.season,
      playerId: IDS.freeAgent,
      teamId: IDS.team,
      rosterCategory: "Bench",
      positionGroup: "D",
      slotNumber: 1,
      contractType: "normal",
      originalTotalValueCents: 600,
      termYears: 2,
      reason: "Fixture roster test",
    });
    expect(requests[0].options.headers.get("X-CSRF-Token")).toBe(
      "R".repeat(43)
    );
    expect(requests[0].options.headers.has("Idempotency-Key")).toBe(false);

    await view.user.click(
      form.getByLabelText(
        "I reviewed this preview, its cap impact, and every warning."
      )
    );
    await view.user.click(
      form.getByRole("button", {
        name: "Apply confirmed player addition",
      })
    );

    expect(
      await form.findByText("player addition applied.")
    ).toBeInTheDocument();
    expect(requests).toHaveLength(2);
    expect(JSON.parse(requests[1].options.body)).toEqual({
      ...JSON.parse(requests[0].options.body),
      confirmWarnings: true,
    });
    expect(requests[1].options.headers.get("X-CSRF-Token")).toBe(
      "R".repeat(43)
    );
    expect(requests[1].options.headers.get("Idempotency-Key")).toBe(
      IDS.operation
    );
  });

  it("builds exact remove, same-team roster, and value-term contract previews", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => IDS.operation),
    });
    const requests = [];
    const fetchImpl = fetchForAuthority("commissioner", (path, options) => {
      if (
        path.endsWith("/roster-removals/previews") ||
        path.endsWith("/roster-corrections/previews") ||
        path.endsWith("/contract-corrections/previews")
      ) {
        requests.push({
          path,
          body: JSON.parse(options.body),
          headers: options.headers,
        });
        return envelope(correction(true));
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderPage(fetchImpl);
    await screen.findByRole("heading", {
      name: "Commissioner roster operations",
    });

    const removePanel = screen
      .getByRole("heading", { name: "Remove a player" })
      .closest("section");
    await view.user.selectOptions(
      within(removePanel).getByLabelText("Rostered player"),
      IDS.ownership
    );
    await view.user.click(
      within(removePanel).getByRole("button", {
        name: "Preview player removal",
      })
    );
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0].path).toBe(
      `/api/v1/leagues/${IDS.league}/commissioner/roster-removals/previews`
    );
    expect(requests[0].body).toEqual({
      seasonId: IDS.season,
      ownershipId: IDS.ownership,
      playerId: IDS.player,
      expectedVersion: 2,
      contractId: IDS.contract,
      expectedContractVersion: 3,
      reason: null,
    });

    const movePanel = screen
      .getByRole("heading", { name: "Move or re-slot a player" })
      .closest("section");
    await view.user.selectOptions(
      within(movePanel).getByLabelText("Rostered player"),
      IDS.ownership
    );
    await view.user.selectOptions(
      within(movePanel).getByLabelText("Roster category"),
      "Bench"
    );
    await view.user.click(
      within(movePanel).getByRole("button", {
        name: "Preview roster correction",
      })
    );
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[1].path).toBe(
      `/api/v1/leagues/${IDS.league}/commissioner/roster-corrections/previews`
    );
    expect(requests[1].body).toEqual({
      seasonId: IDS.season,
      ownershipId: IDS.ownership,
      playerId: IDS.player,
      expectedVersion: 2,
      correctedTeamId: IDS.team,
      correctedOwnershipKind: "Rostered",
      correctedRosterCategory: "Bench",
      correctedPositionGroup: "F",
      correctedSlotNumber: 1,
      reason: null,
    });

    const contractPanel = screen
      .getByRole("heading", { name: "Correct a contract" })
      .closest("section");
    await view.user.selectOptions(
      within(contractPanel).getByLabelText("Contracted player"),
      IDS.ownership
    );
    await view.user.clear(
      within(contractPanel).getByLabelText(/^Total contract value/)
    );
    await view.user.type(
      within(contractPanel).getByLabelText(/^Total contract value/),
      "12.00"
    );
    await view.user.clear(within(contractPanel).getByLabelText(/^Term/));
    await view.user.type(
      within(contractPanel).getByLabelText(/^Term/),
      "2"
    );
    await view.user.click(
      within(contractPanel).getByRole("button", {
        name: "Preview contract correction",
      })
    );
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(requests[2].path).toBe(
      `/api/v1/leagues/${IDS.league}/commissioner/contract-corrections/previews`
    );
    expect(requests[2].body).toEqual({
      seasonId: IDS.season,
      contractId: IDS.contract,
      playerId: IDS.player,
      expectedVersion: 3,
      correctedOriginalTotalValueCents: 1_200,
      correctedOriginalTermYears: 2,
      reason: null,
    });
    for (const request of requests) {
      expect(request.headers.get("X-CSRF-Token")).toBe("R".repeat(43));
      expect(request.headers.has("Idempotency-Key")).toBe(false);
    }
  });

  it("keeps the staging reset hidden from commissioners in staging", async () => {
    const fetchImpl = fetchForAuthority("commissioner", (path) => {
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(fetchImpl, { appEnv: "staging" });

    expect(
      await screen.findByRole("heading", {
        name: "Commissioner roster operations",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Reset staging test leagues",
      })
    ).not.toBeInTheDocument();
  });

  it.each(["local", "production"])(
    "keeps the staging reset hidden from platform administrators in %s",
    async (appEnv) => {
      const fetchImpl = fetchForAuthority(
        "platform_administrator",
        (path) => {
          throw new Error(`Unexpected request: ${path}`);
        }
      );
      renderPage(fetchImpl, { appEnv });

      expect(
        await screen.findByRole("heading", {
          name: "Commissioner roster operations",
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", {
          name: "Reset staging test leagues",
        })
      ).not.toBeInTheDocument();
    }
  );

  it("shows the staging reset only to platform administrators in staging and signs out", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => IDS.operation),
    });
    let resetRequest = null;
    const fetchImpl = fetchForAuthority(
      "platform_administrator",
      (path, options) => {
        if (path === "/api/v1/operations/staging-fixture-reset") {
          resetRequest = options;
          return envelope({
            code: "STAGING_FIXTURE_RESET_COMPLETED",
            fixtureBuildId: "m7-10-release-qa",
            resetAtMs: 20,
            backupId: IDS.backup,
            providerCatalogPlayerCount: 1_234,
            sessionInvalidated: true,
            unsafeSessionEvidence: "must never reach the receipt",
          });
        }
        throw new Error(`Unexpected request: ${path}`);
      }
    );
    const view = renderPage(fetchImpl, { appEnv: "staging" });

    const panel = (
      await screen.findByRole("heading", {
        name: "Reset staging test leagues",
      })
    ).closest("section");
    const form = within(panel);
    expect(panel).toHaveTextContent("invalidates every staging session");
    await view.user.type(
      form.getByLabelText(/^Type “RESET STAGING TEST LEAGUES”/),
      "RESET STAGING TEST LEAGUES"
    );
    await view.user.type(
      form.getByLabelText(/^Reset reason/),
      "Repeat manual release acceptance"
    );
    await view.user.click(
      form.getByRole("button", {
        name: "Reset staging test leagues and sign out",
      })
    );

    const receipt = (
      await screen.findByRole("heading", {
        name: "Staging reset completed",
      })
    ).closest("section");
    const evidence = within(receipt);
    expect(
      screen.getByRole("heading", { name: "Sign in" })
    ).toBeInTheDocument();
    expect(evidence.getByText(IDS.backup)).toBeInTheDocument();
    expect(evidence.getByText("m7-10-release-qa")).toBeInTheDocument();
    expect(evidence.getByText("1,234")).toBeInTheDocument();
    expect(evidence.getByText("Yes")).toBeInTheDocument();
    expect(receipt.querySelector("time")).toHaveAttribute(
      "dateTime",
      new Date(20).toISOString()
    );
    expect(receipt).not.toHaveTextContent("must never reach the receipt");
    expect(JSON.parse(resetRequest.body)).toEqual({
      confirmation: "RESET STAGING TEST LEAGUES",
      reason: "Repeat manual release acceptance",
    });
    expect(resetRequest.headers.get("X-CSRF-Token")).toBe("R".repeat(43));
    expect(resetRequest.headers.get("Idempotency-Key")).toBe(IDS.operation);
  });

  it("keeps the authenticated page and shows no receipt when the staging reset fails", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => IDS.operation),
    });
    const fetchImpl = fetchForAuthority(
      "platform_administrator",
      (path) => {
        if (path === "/api/v1/operations/staging-fixture-reset") {
          return new Response(
            JSON.stringify({
              error: {
                code: "STAGING_FIXTURE_RESET_FAILED",
                message: "The staging reset failed safely.",
                requestId: "request-reset-failed",
              },
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        throw new Error(`Unexpected request: ${path}`);
      }
    );
    const view = renderPage(fetchImpl, { appEnv: "staging" });

    const panel = (
      await screen.findByRole("heading", {
        name: "Reset staging test leagues",
      })
    ).closest("section");
    const form = within(panel);
    await view.user.type(
      form.getByLabelText(/^Type “RESET STAGING TEST LEAGUES”/),
      "RESET STAGING TEST LEAGUES"
    );
    await view.user.type(
      form.getByLabelText(/^Reset reason/),
      "Failure receipt regression"
    );
    await view.user.click(
      form.getByRole("button", {
        name: "Reset staging test leagues and sign out",
      })
    );

    expect(
      await screen.findByText("The staging reset failed safely.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Commissioner roster operations",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Staging reset completed",
      })
    ).not.toBeInTheDocument();
  });
});
