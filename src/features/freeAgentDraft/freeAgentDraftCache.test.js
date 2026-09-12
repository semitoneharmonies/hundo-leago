import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { ApiError } from "../../shared/api/ApiError.js";
import {
  isCandidateAuthorizationError,
  isFreeAgentDraftQuery,
  isPrivateCandidateQuery,
  isViewerSensitiveFadResultQuery,
  removePrivateCandidateQueries,
  removeViewerSensitiveFadResultQueries,
  sweepPrivateCandidateQueries,
} from "./freeAgentDraftCache.js";
import {
  eligibleCandidatePlayersQuery,
  freeAgentDraftResultsQuery,
  privateCandidateCardQuery,
  publishedCandidateCardQuery,
  publishedCandidateCardsQuery,
} from "./freeAgentDraftQueries.js";

const id = (number) =>
  `${number.toString(16).padStart(8, "0")}-0000-4000-8000-000000000000`;
const IDS = Object.freeze({
  league: id(1),
  otherLeague: id(2),
  fad: id(3),
  team: id(4),
  otherTeam: id(5),
  assignment: id(6),
  otherAssignment: id(7),
});

function authorization(assignmentId) {
  return {
    authorizationScope: "team_manager",
    authorizationEvidence: { kind: "manager_assignment", id: assignmentId },
  };
}

function build(client, options, value = { private: "data" }) {
  const query = client.getQueryCache().build(client, options);
  query.setData(value);
  return query;
}

function privateQuery(client, { teamId = IDS.team, assignmentId = IDS.assignment } = {}) {
  return build(
    client,
    privateCandidateCardQuery(
      { request() {} },
      IDS.league,
      IDS.fad,
      teamId,
      authorization(assignmentId)
    )
  );
}

describe("FAD private cache policy", () => {
  it("recognizes actual Query instances and their exact metadata", () => {
    const client = new QueryClient();
    const card = privateQuery(client);
    const eligible = build(
      client,
      eligibleCandidatePlayersQuery(
        { request() {} },
        IDS.league,
        IDS.fad,
        IDS.team,
        "F01",
        { authorization: authorization(IDS.assignment) }
      )
    );
    const history = build(
      client,
      publishedCandidateCardQuery(
        { request() {} },
        IDS.league,
        IDS.fad,
        IDS.team
      )
    );
    const summaries = build(
      client,
      publishedCandidateCardsQuery(
        { request() {} },
        IDS.league,
        IDS.fad
      )
    );
    const results = build(
      client,
      freeAgentDraftResultsQuery(
        { request() {} },
        IDS.league,
        IDS.fad,
        { teamId: IDS.team }
      )
    );

    expect(card.meta).toEqual(expect.objectContaining({
      authorizationEvidence: { kind: "manager_assignment", id: IDS.assignment },
    }));
    expect(isFreeAgentDraftQuery(card)).toBe(true);
    expect(isPrivateCandidateQuery(card)).toBe(true);
    expect(isPrivateCandidateQuery(eligible)).toBe(true);
    expect(isFreeAgentDraftQuery(history)).toBe(true);
    expect(isPrivateCandidateQuery(history)).toBe(false);
    expect(isViewerSensitiveFadResultQuery(summaries)).toBe(true);
    expect(isViewerSensitiveFadResultQuery(history)).toBe(true);
    expect(isViewerSensitiveFadResultQuery(results)).toBe(true);
    expect(isViewerSensitiveFadResultQuery(card)).toBe(false);
  });

  it("cancels and removes only the exact requested private scope", async () => {
    const client = new QueryClient();
    const exact = privateQuery(client);
    const otherTeam = privateQuery(client, {
      teamId: IDS.otherTeam,
      assignmentId: IDS.otherAssignment,
    });
    const otherLeague = build(
      client,
      privateCandidateCardQuery(
        { request() {} },
        IDS.otherLeague,
        IDS.fad,
        IDS.team,
        authorization(IDS.assignment)
      )
    );

    await expect(
      removePrivateCandidateQueries(client, {
        leagueId: IDS.league,
        fadId: IDS.fad,
        teamId: IDS.team,
      })
    ).resolves.toBe(1);
    expect(client.getQueryCache().find({ queryKey: exact.queryKey })).toBeUndefined();
    expect(client.getQueryCache().find({ queryKey: otherTeam.queryKey })).toBeDefined();
    expect(client.getQueryCache().find({ queryKey: otherLeague.queryKey })).toBeDefined();
  });

  it("removes every cached T-140 filter for only the selected team", async () => {
    const client = new QueryClient();
    const selectedDefault = build(
      client,
      freeAgentDraftResultsQuery(
        { request() {} },
        IDS.league,
        IDS.fad,
        { teamId: IDS.team }
      )
    );
    const selectedSearch = build(
      client,
      freeAgentDraftResultsQuery(
        { request() {} },
        IDS.league,
        IDS.fad,
        { teamId: IDS.team, q: "cached money" }
      )
    );
    const otherTeam = build(
      client,
      freeAgentDraftResultsQuery(
        { request() {} },
        IDS.league,
        IDS.fad,
        { teamId: IDS.otherTeam }
      )
    );
    const selectedHistory = build(
      client,
      publishedCandidateCardQuery(
        { request() {} },
        IDS.league,
        IDS.fad,
        IDS.team
      )
    );

    await expect(
      removeViewerSensitiveFadResultQueries(client, {
        leagueId: IDS.league,
        fadId: IDS.fad,
        teamId: IDS.team,
      })
    ).resolves.toBe(2);
    expect(client.getQueryCache().find({ queryKey: selectedDefault.queryKey })).toBeUndefined();
    expect(client.getQueryCache().find({ queryKey: selectedSearch.queryKey })).toBeUndefined();
    expect(client.getQueryCache().find({ queryKey: otherTeam.queryKey })).toBeDefined();
    expect(client.getQueryCache().find({ queryKey: selectedHistory.queryKey })).toBeDefined();
  });

  it.each([
    ["exact deadline", { phase: "cards_open", serverNowMs: 1_000, candidateDeadlineAtMs: 1_000 }],
    ["missing deadline", { phase: "cards_open", serverNowMs: 999, candidateDeadlineAtMs: null }],
    ["phase transition", { phase: "rapid", serverNowMs: 999, candidateDeadlineAtMs: 1_000 }],
  ])("removes private data at the conservative %s boundary", async (_label, state) => {
    const client = new QueryClient();
    const query = privateQuery(client);

    await expect(
      sweepPrivateCandidateQueries(client, {
        leagueId: IDS.league,
        fadId: IDS.fad,
        ...state,
        authorizationEvidence: [
          { kind: "manager_assignment", id: IDS.assignment },
        ],
      })
    ).resolves.toBe(1);
    expect(client.getQueryCache().find({ queryKey: query.queryKey })).toBeUndefined();
  });

  it("removes rotated evidence while retaining the current assignment", async () => {
    const client = new QueryClient();
    const oldQuery = privateQuery(client);
    const retainedQuery = privateQuery(client, {
      teamId: IDS.otherTeam,
      assignmentId: IDS.otherAssignment,
    });

    await expect(
      sweepPrivateCandidateQueries(client, {
        leagueId: IDS.league,
        fadId: IDS.fad,
        phase: "help_window",
        serverNowMs: 999,
        candidateDeadlineAtMs: 1_000,
        authorizationEvidence: [
          { kind: "manager_assignment", id: IDS.otherAssignment },
        ],
      })
    ).resolves.toBe(1);
    expect(client.getQueryCache().find({ queryKey: oldQuery.queryKey })).toBeUndefined();
    expect(client.getQueryCache().find({ queryKey: retainedQuery.queryKey })).toBeDefined();
  });

  it("fails closed by removing a private-key query with corrupt metadata", async () => {
    const client = new QueryClient();
    const query = build(client, {
      queryKey: [
        "league",
        IDS.league,
        "free-agent-draft",
        IDS.fad,
        "private-card",
        IDS.team,
      ],
      queryFn: async () => null,
      meta: { private: true, leagueId: IDS.league, teamId: IDS.team },
    });

    expect(isPrivateCandidateQuery(query)).toBe(true);
    await expect(
      sweepPrivateCandidateQueries(client, {
        leagueId: IDS.league,
        fadId: IDS.fad,
        phase: "cards_open",
        serverNowMs: 999,
        candidateDeadlineAtMs: 1_000,
        authorizationEvidence: [
          { kind: "manager_assignment", id: IDS.assignment },
        ],
      })
    ).resolves.toBe(1);
    expect(client.getQueryCache().find({ queryKey: query.queryKey })).toBeUndefined();
  });

  it("classifies only the protected response failures that require eviction", () => {
    const error = (status, code) =>
      new ApiError({ status, code, message: "Safe failure." });

    expect(isCandidateAuthorizationError(error(403, "FORBIDDEN"))).toBe(true);
    expect(isCandidateAuthorizationError(error(404, "NOT_FOUND"))).toBe(true);
    expect(isCandidateAuthorizationError(error(409, "FAD_PHASE_CONFLICT"))).toBe(true);
    expect(isCandidateAuthorizationError(error(409, "FAD_DEADLINE_PASSED"))).toBe(true);
    expect(isCandidateAuthorizationError(error(409, "FAD_HELP_WINDOW_CLOSED"))).toBe(false);
    expect(isCandidateAuthorizationError(new Error("not an API error"))).toBe(false);
  });
});
