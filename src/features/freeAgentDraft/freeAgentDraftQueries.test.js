import { describe, expect, it, vi } from "vitest";

import {
  eligibleCandidatePlayersQuery,
  freeAgentDraftKeys,
  freeAgentDraftNavigationQuery,
  freeAgentDraftOverviewQuery,
  freeAgentDraftReadinessQuery,
  freeAgentDraftRecoveryQuery,
  freeAgentDraftResultsQuery,
  privateCandidateCardQuery,
  publishedCandidateCardQuery,
  publishedCandidateCardsQuery,
} from "./freeAgentDraftQueries.js";

const id = (number) =>
  `${number.toString(16).padStart(8, "0")}-0000-4000-8000-000000000000`;
const IDS = Object.freeze({
  league: id(1),
  season: id(2),
  fad: id(3),
  team: id(4),
  assignment: id(5),
  help: id(6),
  player: id(7),
  otherTeam: id(8),
});
const managerAuthorization = Object.freeze({
  authorizationScope: "team_manager",
  authorizationEvidence: Object.freeze({
    kind: "manager_assignment",
    id: IDS.assignment,
  }),
});

function httpClient() {
  return { request: vi.fn() };
}

describe("FAD query keys and options", () => {
  it("separates unscoped and roster-scoped navigation with both scope fields", () => {
    const client = httpClient();
    const unscoped = freeAgentDraftNavigationQuery(client, IDS.league);
    const scoped = freeAgentDraftNavigationQuery(client, IDS.league, {
      rosterSeasonId: IDS.season,
      rosterTeamId: IDS.team,
    });

    expect(unscoped.queryKey).toEqual([
      "league",
      IDS.league,
      "free-agent-draft",
      "navigation",
      { rosterSeasonId: null, rosterTeamId: null },
    ]);
    expect(scoped.queryKey.at(-1)).toEqual({
      rosterSeasonId: IDS.season,
      rosterTeamId: IDS.team,
    });
    expect(unscoped.queryKey).not.toEqual(scoped.queryKey);
    expect(unscoped.meta).toEqual({ private: true, leagueId: IDS.league });
  });

  it("marks T-131/T-132 as viewer-sensitive while keeping ordinary FAD metadata", () => {
    const client = httpClient();
    const options = [
      freeAgentDraftReadinessQuery(client, IDS.league, IDS.season),
      freeAgentDraftOverviewQuery(client, IDS.league, IDS.fad),
      publishedCandidateCardsQuery(client, IDS.league, IDS.fad),
      publishedCandidateCardQuery(client, IDS.league, IDS.fad, IDS.team),
    ];

    for (const option of options.slice(0, 2)) {
      expect(option.meta).toEqual({ private: true, leagueId: IDS.league });
    }
    expect(options[2].meta).toEqual({
      private: true,
      leagueId: IDS.league,
      teamId: null,
      viewerSensitiveFadResults: true,
    });
    expect(options[3].meta).toEqual({
      private: true,
      leagueId: IDS.league,
      teamId: IDS.team,
      viewerSensitiveFadResults: true,
    });
    expect(options[2].queryKey).toEqual([
      "league",
      IDS.league,
      "free-agent-draft",
      IDS.fad,
      "history-cards",
      { limit: 50 },
    ]);
    expect(options[2].initialPageParam).toBeNull();
    expect(options[2].getNextPageParam({
      items: [],
      page: { hasMore: true, nextCursor: "next" },
    })).toBe("next");
  });

  it("polls only while deadline publication is still processing", () => {
    const overview = freeAgentDraftOverviewQuery(
      httpClient(),
      IDS.league,
      IDS.fad
    );

    expect(
      overview.refetchInterval({
        state: { data: { phase: "deadline_processing" } },
      })
    ).toBe(2_000);
    expect(
      overview.refetchInterval({ state: { data: { phase: "allocating" } } })
    ).toBe(false);
    expect(
      overview.refetchInterval({ state: { data: { phase: "completed" } } })
    ).toBe(false);
  });

  it("keeps private cards separate from history and binds exact authorization metadata", () => {
    const client = httpClient();
    const privateQuery = privateCandidateCardQuery(
      client,
      IDS.league,
      IDS.fad,
      IDS.team,
      managerAuthorization
    );
    const historyQuery = publishedCandidateCardQuery(
      client,
      IDS.league,
      IDS.fad,
      IDS.team
    );

    expect(privateQuery.queryKey).toEqual(
      freeAgentDraftKeys.privateCard(IDS.league, IDS.fad, IDS.team)
    );
    expect(privateQuery.queryKey).not.toEqual(historyQuery.queryKey);
    expect(privateQuery.meta).toEqual({
      private: true,
      leagueId: IDS.league,
      teamId: IDS.team,
      authorizationScope: "team_manager",
      authorizationEvidence: {
        kind: "manager_assignment",
        id: IDS.assignment,
      },
    });
  });

  it("normalizes eligible-player filters and uses pageParam only for the cursor", async () => {
    const client = httpClient();
    client.request.mockResolvedValue({
      data: [
        {
          player: {
            playerId: IDS.player,
            fullName: "Ada Player",
            positionGroup: "F",
          },
          effectivePositionGroup: "F",
          activeState: "active",
          benchEligible: true,
          eligibilityCode: "eligible",
          contractLimits: {
            allowedTermsYears: [1, 2, 3],
            minimumTotalValueCentsByTerm: { "1": 100, "2": 200, "3": 300 },
            maximumBenchAavCents: null,
          },
        },
      ],
      meta: { requestId: "request-1" },
      page: { hasMore: false, nextCursor: null },
    });
    const options = eligibleCandidatePlayersQuery(
      client,
      IDS.league,
      IDS.fad,
      IDS.team,
      "F01",
      { q: "  ADA   PLAYER ", limit: 25, authorization: managerAuthorization }
    );

    expect(options.queryKey).toEqual([
      "league",
      IDS.league,
      "free-agent-draft",
      IDS.fad,
      "eligible-players",
      IDS.team,
      "F01",
      { q: "ada player", limit: 25 },
    ]);
    expect(options.queryKey).not.toContain("cursor-2");
    await options.queryFn({ pageParam: "cursor-2", signal: undefined });
    expect(client.request.mock.calls[0][0]).toContain(
      "slotKey=F01&q=ada+player&limit=25&cursor=cursor-2"
    );
  });

  it("keeps immutable results and commissioner recovery in distinct scoped keys with normalized result paging", async () => {
    const client = httpClient();
    client.request.mockResolvedValue({
      data: [],
      meta: { requestId: "request-results" },
      page: { hasMore: false, nextCursor: null },
    });
    const results = freeAgentDraftResultsQuery(
      client,
      IDS.league,
      IDS.fad,
      {
        teamId: IDS.team,
        q: "  ADA   PLAYER ",
        status: "tied",
        limit: 25,
      }
    );
    const recovery = freeAgentDraftRecoveryQuery(
      client,
      IDS.league,
      IDS.fad
    );

    expect(results.queryKey).toEqual([
      "league",
      IDS.league,
      "free-agent-draft",
      IDS.fad,
      "results",
      IDS.team,
      { q: "ada player", status: "tied", limit: 25 },
    ]);
    expect(recovery.queryKey).toEqual([
      "league",
      IDS.league,
      "free-agent-draft",
      IDS.fad,
      "recovery",
    ]);
    expect(results.queryKey).not.toEqual(
      freeAgentDraftKeys.privateCard(IDS.league, IDS.fad, IDS.team)
    );
    expect(recovery.queryKey).not.toEqual(results.queryKey);
    expect(results.meta).toEqual({
      private: true,
      leagueId: IDS.league,
      teamId: IDS.team,
      viewerSensitiveFadResults: true,
    });
    await results.queryFn({ pageParam: "cursor-3", signal: undefined });
    expect(client.request.mock.calls[0][0]).toContain(
      `/results?teamId=${IDS.team}&q=ada+player&limit=25&status=tied&cursor=cursor-3`
    );
  });

  it("uses distinct T-140 keys and transport scopes for a multi-team manager", async () => {
    const client = httpClient();
    client.request.mockResolvedValue({
      data: [],
      meta: { requestId: "request-team-results" },
      page: { hasMore: false, nextCursor: null },
    });
    const first = freeAgentDraftResultsQuery(client, IDS.league, IDS.fad, {
      teamId: IDS.team,
      q: "player",
    });
    const second = freeAgentDraftResultsQuery(client, IDS.league, IDS.fad, {
      teamId: IDS.otherTeam,
      q: "player",
    });

    expect(first.queryKey).not.toEqual(second.queryKey);
    expect(first.queryKey[5]).toBe(IDS.team);
    expect(second.queryKey[5]).toBe(IDS.otherTeam);
    await first.queryFn({ pageParam: null, signal: undefined });
    await second.queryFn({ pageParam: "next", signal: undefined });
    expect(client.request.mock.calls[0][0]).toContain(`teamId=${IDS.team}`);
    expect(client.request.mock.calls[1][0]).toContain(`teamId=${IDS.otherTeam}`);
    expect(client.request.mock.calls[1][0]).toContain("cursor=next");
  });

  it("fails closed for partial scope, missing/mismatched evidence, bad slots, and bad limits", () => {
    const client = httpClient();
    expect(() =>
      freeAgentDraftNavigationQuery(client, IDS.league, {
        rosterSeasonId: IDS.season,
      })
    ).toThrow("Roster team ID");
    expect(() =>
      privateCandidateCardQuery(client, IDS.league, IDS.fad, IDS.team)
    ).toThrow("authorization evidence");
    expect(() =>
      privateCandidateCardQuery(client, IDS.league, IDS.fad, IDS.team, {
        authorizationScope: "team_manager",
        authorizationEvidence: { kind: "help_request", id: IDS.help },
      })
    ).toThrow("authorization evidence");
    expect(() =>
      eligibleCandidatePlayersQuery(
        client,
        IDS.league,
        IDS.fad,
        IDS.team,
        "F13",
        { authorization: managerAuthorization }
      )
    ).toThrow("slot key");
    expect(() =>
      publishedCandidateCardsQuery(client, IDS.league, IDS.fad, { limit: 101 })
    ).toThrow("page limit");
    expect(() =>
      freeAgentDraftResultsQuery(client, IDS.league, IDS.fad, {
        q: "player",
      })
    ).toThrow("result team ID");
  });
});
