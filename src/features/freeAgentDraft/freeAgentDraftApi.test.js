import { describe, expect, it, vi } from "vitest";

import {
  acceptFreeAgentDraftRecoveryAction,
  addCandidateCardCandidate,
  applyFreeAgentDraftCorrection,
  editCandidateCardCandidate,
  getEligibleCandidatePlayers,
  getFreeAgentDraftNavigation,
  getFreeAgentDraftOverview,
  getFreeAgentDraftReadiness,
  getFreeAgentDraftRecovery,
  getFreeAgentDraftResults,
  getPrivateCandidateCard,
  getPublishedCandidateCard,
  getPublishedCandidateCards,
  moveCandidateCardEntry,
  previewFreeAgentDraftCorrection,
  previewCandidateCardRevision,
  removeCandidateCardCandidate,
  requestCandidateCardHelp,
  retryFreeAgentDraftReadiness,
} from "./freeAgentDraftApi.js";

const IDS = Object.freeze({
  season: "11111111-1111-4111-8111-111111111111",
  operation: "22222222-2222-4222-8222-222222222222",
  entry: "33333333-3333-4333-8333-333333333333",
  player: "44444444-4444-4444-8444-444444444444",
});

function client(data = {}) {
  return {
    request: vi.fn().mockResolvedValue({
      data,
      meta: { requestId: "request-1" },
      page: null,
    }),
  };
}

describe("FAD API boundary", () => {
  it("uses exact read paths, query grammar, authentication, and validators", async () => {
    const httpClient = client({ projection: true });
    const signal = new AbortController().signal;

    await getFreeAgentDraftNavigation(httpClient, "league/1", { signal });
    await getFreeAgentDraftNavigation(httpClient, "league/1", {
      rosterSeasonId: "season 2",
      rosterTeamId: "team/3",
      signal,
    });
    await getFreeAgentDraftReadiness(httpClient, "league/1", "season 2", { signal });
    await getFreeAgentDraftOverview(httpClient, "league/1", "fad/4", { signal });
    await getPrivateCandidateCard(httpClient, "league/1", "fad/4", "team/3", { signal });
    await getPublishedCandidateCard(httpClient, "league/1", "fad/4", "team/3", { signal });

    expect(httpClient.request.mock.calls.map(([path]) => path)).toEqual([
      "/api/v1/leagues/league%2F1/free-agent-drafts/navigation",
      "/api/v1/leagues/league%2F1/free-agent-drafts/navigation?rosterSeasonId=season+2&rosterTeamId=team%2F3",
      "/api/v1/leagues/league%2F1/free-agent-drafts/readiness?seasonId=season+2",
      "/api/v1/leagues/league%2F1/free-agent-drafts/fad%2F4",
      "/api/v1/leagues/league%2F1/free-agent-drafts/fad%2F4/candidate-cards/team%2F3/private",
      "/api/v1/leagues/league%2F1/free-agent-drafts/fad%2F4/candidate-cards/team%2F3/history",
    ]);
    for (const [, options] of httpClient.request.mock.calls) {
      expect(options).toMatchObject({ authenticated: true, dataKind: "object", signal });
      expect(options.validateData).toBeTypeOf("function");
      expect(options).not.toHaveProperty("method");
      expect(options).not.toHaveProperty("body");
    }
  });

  it("maps both paginated reads without placing cursors in caller-owned state", async () => {
    const httpClient = client([{ id: "row" }]);
    httpClient.request.mockResolvedValue({
      data: [{ id: "row" }],
      meta: { requestId: "request-1" },
      page: { nextCursor: "next", hasMore: true },
    });

    await expect(
      getPublishedCandidateCards(httpClient, "league", "fad", {
        limit: 50,
        cursor: "page-2",
      })
    ).resolves.toEqual({
      items: [{ id: "row" }],
      page: { nextCursor: "next", hasMore: true },
    });
    await expect(
      getEligibleCandidatePlayers(httpClient, "league", "fad", "team", {
        slotKey: "F01",
        q: "mcdavid",
        limit: 25,
        cursor: null,
      })
    ).resolves.toEqual({
      items: [{ id: "row" }],
      page: { nextCursor: "next", hasMore: true },
    });

    expect(httpClient.request.mock.calls.map(([path]) => path)).toEqual([
      "/api/v1/leagues/league/free-agent-drafts/fad/candidate-cards?limit=50&cursor=page-2",
      "/api/v1/leagues/league/free-agent-drafts/fad/candidate-cards/team/eligible-players?slotKey=F01&q=mcdavid&limit=25",
    ]);
    expect(httpClient.request.mock.calls[0][1].validatePage).toBeTypeOf(
      "function"
    );
    expect(httpClient.request.mock.calls[1][1].validatePage).toBeTypeOf(
      "function"
    );
  });

  it("sends exact retry and preview bodies with their distinct header rules", async () => {
    const httpClient = client({ accepted: true });
    const retryInput = {
      seasonId: IDS.season,
      readinessOperationId: IDS.operation,
      confirmation: "RETRY FREE AGENT DRAFT READINESS",
    };
    const action = { type: "remove", entryId: IDS.entry };

    await retryFreeAgentDraftReadiness(httpClient, "league", retryInput, {
      version: 4,
      idempotencyKey: "fad-readiness:uuid",
    });
    await previewCandidateCardRevision(httpClient, "league", "fad", "team", action);

    expect(httpClient.request.mock.calls[0]).toEqual([
      "/api/v1/leagues/league/free-agent-drafts/readiness/retries",
      expect.objectContaining({
        method: "POST",
        authenticated: true,
        body: retryInput,
        version: 4,
        idempotencyKey: "fad-readiness:uuid",
      }),
    ]);
    expect(httpClient.request.mock.calls[1]).toEqual([
      "/api/v1/leagues/league/free-agent-drafts/fad/candidate-cards/team/revision-previews",
      expect.objectContaining({
        method: "POST",
        authenticated: true,
        body: { action },
      }),
    ]);
    expect(httpClient.request.mock.calls[1][1]).not.toHaveProperty("version");
    expect(httpClient.request.mock.calls[1][1]).not.toHaveProperty("idempotencyKey");
  });

  it("uses exact result, recovery, recovery-action, correction-preview, and correction command semantics", async () => {
    const httpClient = client([]);
    httpClient.request.mockResolvedValue({
      data: [],
      meta: { requestId: "request-history" },
      page: { nextCursor: null, hasMore: false },
    });

    await getFreeAgentDraftResults(httpClient, "league", "fad", {
      q: "ada player",
      status: "pending",
      limit: 25,
      cursor: "page-2",
    });
    await getFreeAgentDraftRecovery(httpClient, "league", "fad");
    await acceptFreeAgentDraftRecoveryAction(
      httpClient,
      "league",
      "fad",
      {
        action: "retry_allocation",
        resourceId: IDS.entry,
        reason: "Retry the exact failed allocation.",
      },
      { idempotencyKey: "fad-recovery:uuid" }
    );
    await previewFreeAgentDraftCorrection(
      httpClient,
      "league",
      "fad",
      IDS.entry
    );
    await applyFreeAgentDraftCorrection(
      httpClient,
      "league",
      "fad",
      IDS.entry,
      {
        mode: "recompute_locked_snapshot",
        previewFingerprint: "a".repeat(64),
        reason: "Apply the reviewed deterministic correction.",
        confirmation: "APPLY FAD CORRECTION",
      },
      { version: 3, idempotencyKey: "fad-correction:uuid" }
    );

    expect(httpClient.request.mock.calls.map(([path]) => path)).toEqual([
      "/api/v1/leagues/league/free-agent-drafts/fad/results?q=ada+player&limit=25&status=pending&cursor=page-2",
      "/api/v1/leagues/league/free-agent-drafts/fad/recovery",
      "/api/v1/leagues/league/free-agent-drafts/fad/recovery/actions",
      `/api/v1/leagues/league/free-agent-drafts/fad/allocations/${IDS.entry}/correction-previews`,
      `/api/v1/leagues/league/free-agent-drafts/fad/allocations/${IDS.entry}/corrections`,
    ]);
    expect(httpClient.request.mock.calls[0][1].validatePage).toBeTypeOf(
      "function"
    );
    expect(httpClient.request.mock.calls[2][1]).toMatchObject({
      method: "POST",
      body: {
        action: "retry_allocation",
        resourceId: IDS.entry,
        reason: "Retry the exact failed allocation.",
      },
      idempotencyKey: "fad-recovery:uuid",
    });
    expect(httpClient.request.mock.calls[2][1]).not.toHaveProperty("version");
    expect(httpClient.request.mock.calls[3][1]).toMatchObject({
      method: "POST",
      body: { mode: "recompute_locked_snapshot" },
    });
    expect(httpClient.request.mock.calls[3][1]).not.toHaveProperty("version");
    expect(httpClient.request.mock.calls[3][1]).not.toHaveProperty("idempotencyKey");
    expect(httpClient.request.mock.calls[4][1]).toMatchObject({
      method: "POST",
      version: 3,
      idempotencyKey: "fad-correction:uuid",
      body: {
        mode: "recompute_locked_snapshot",
        previewFingerprint: "a".repeat(64),
        reason: "Apply the reviewed deterministic correction.",
        confirmation: "APPLY FAD CORRECTION",
      },
    });
  });

  it("sends exact add, edit, move, bodyless delete, and help requests", async () => {
    const httpClient = client({ card: true });
    const writeOptions = { version: 7, idempotencyKey: "candidate:uuid" };

    await addCandidateCardCandidate(
      httpClient,
      "league",
      "fad",
      "team",
      "F04",
      { playerId: IDS.player, totalValueCents: 600, termYears: 2 },
      writeOptions
    );
    await editCandidateCardCandidate(
      httpClient,
      "league",
      "fad",
      "team",
      IDS.entry,
      { totalValueCents: 900, termYears: 3 },
      writeOptions
    );
    await moveCandidateCardEntry(
      httpClient,
      "league",
      "fad",
      "team",
      IDS.entry,
      { slotKey: "B02" },
      writeOptions
    );
    await removeCandidateCardCandidate(
      httpClient,
      "league",
      "fad",
      "team",
      IDS.entry,
      writeOptions
    );
    await requestCandidateCardHelp(
      httpClient,
      "league",
      "fad",
      "team",
      { message: null },
      { idempotencyKey: "help:uuid" }
    );

    expect(httpClient.request.mock.calls.map(([, options]) => options.method)).toEqual([
      "PUT",
      "PATCH",
      "POST",
      "DELETE",
      "POST",
    ]);
    expect(httpClient.request.mock.calls[3][1]).not.toHaveProperty("body");
    expect(httpClient.request.mock.calls[4][1]).toMatchObject({
      body: { message: null },
      idempotencyKey: "help:uuid",
    });
    expect(httpClient.request.mock.calls[4][1]).not.toHaveProperty("version");
    expect(httpClient.request.mock.calls.every(([, options]) => options.authenticated)).toBe(true);
  });

  it("fails before transport for setup-like retry fields and malformed write controls", async () => {
    const httpClient = client({});
    await expect(
      retryFreeAgentDraftReadiness(
        httpClient,
        "league",
        {
          seasonId: IDS.season,
          readinessOperationId: IDS.operation,
          confirmation: "RETRY FREE AGENT DRAFT READINESS",
          openingAtMs: 123,
        },
        { version: 1, idempotencyKey: "fad-readiness:uuid" }
      )
    ).rejects.toThrow("retry body");
    expect(() =>
      addCandidateCardCandidate(
        httpClient,
        "league",
        "fad",
        "team",
        "F13",
        { playerId: IDS.player, totalValueCents: 600, termYears: 2 },
        { version: 1, idempotencyKey: "candidate:uuid" }
      )
    ).toThrow("slot key");
    await expect(
      removeCandidateCardCandidate(
        httpClient,
        "league",
        "fad",
        "team",
        IDS.entry,
        { version: 0, idempotencyKey: "candidate:uuid" }
      )
    ).rejects.toThrow("version");
    expect(httpClient.request).not.toHaveBeenCalled();
  });
});
