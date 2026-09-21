import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "../../shared/query/queryClient.js";
import {
  NotificationDestinationUnavailableError,
  freeAgentDraftDestinationPath,
  prepareFreeAgentDraftDestination,
} from "./notificationDestinations.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const otherLeagueId = "22222222-2222-4222-8222-222222222222";
const seasonId = "33333333-3333-4333-8333-333333333333";
const fadId = "44444444-4444-4444-8444-444444444444";
const teamId = "55555555-5555-4555-8555-555555555555";
const cardId = "66666666-6666-4666-8666-666666666666";
const auctionId = "77777777-7777-4777-8777-777777777777";
const recoveryId = "88888888-8888-4888-8888-888888888888";

const destinations = Object.freeze({
  private_card: { kind: "private_card", leagueId, fadId, teamId, cardId },
  commissioner_fad: { kind: "commissioner_fad", leagueId, seasonId },
  fad_results: { kind: "fad_results", leagueId, fadId },
  auction: { kind: "auction", leagueId, auctionId },
  fad_recovery: { kind: "fad_recovery", leagueId, fadId, recoveryId },
  fad_overview: { kind: "fad_overview", leagueId, fadId },
});

describe("FAD notification destinations", () => {
  it("maps every approved destination kind through the canonical route helpers", () => {
    expect(freeAgentDraftDestinationPath(destinations.private_card)).toBe(
      `/leagues/${leagueId}/free-agent-draft/${fadId}/cards/${teamId}`
    );
    expect(freeAgentDraftDestinationPath(destinations.commissioner_fad)).toBe(
      `/leagues/${leagueId}/commissioner`
    );
    expect(freeAgentDraftDestinationPath(destinations.fad_results)).toBe(
      `/leagues/${leagueId}/free-agent-draft/${fadId}/results`
    );
    expect(freeAgentDraftDestinationPath(destinations.auction)).toBe(
      `/leagues/${leagueId}/auctions/${auctionId}`
    );
    expect(freeAgentDraftDestinationPath(destinations.fad_recovery)).toBe(
      `/leagues/${leagueId}/commissioner?fadId=${fadId}&recoveryId=${recoveryId}`
    );
    expect(freeAgentDraftDestinationPath(destinations.fad_overview)).toBe(
      `/leagues/${leagueId}/free-agent-draft/${fadId}`
    );
  });

  it("removes only target-league private caches and re-fetches membership", async () => {
    const queryClient = createQueryClient();
    const target = ["league", leagueId, "auction", auctionId];
    const other = ["league", otherLeagueId, "auction", auctionId];
    const publicTarget = ["public-roster", leagueId];
    queryClient.setQueryDefaults(target, {
      meta: { private: true, leagueId },
    });
    queryClient.setQueryDefaults(other, {
      meta: { private: true, leagueId: otherLeagueId },
    });
    queryClient.setQueryDefaults(publicTarget, { meta: { private: false } });
    queryClient.setQueryData(target, { privateBid: true });
    queryClient.setQueryData(other, { otherPrivateBid: true });
    queryClient.setQueryData(publicTarget, { public: true });
    const httpClient = {
      request: vi.fn(async () => ({ data: { leagues: [{ id: leagueId }] } })),
    };

    await expect(
      prepareFreeAgentDraftDestination({
        destination: destinations.auction,
        httpClient,
        queryClient,
      })
    ).resolves.toBe(`/leagues/${leagueId}/auctions/${auctionId}`);

    expect(queryClient.getQueryData(target)).toBeUndefined();
    expect(queryClient.getQueryData(other)).toEqual({ otherPrivateBid: true });
    expect(queryClient.getQueryData(publicTarget)).toEqual({ public: true });
    expect(httpClient.request).toHaveBeenCalledWith("/api/v1/leagues", {
      authenticated: true,
      dataKind: "object",
      validateData: expect.any(Function),
      signal: expect.any(AbortSignal),
    });
  });

  it("fails closed when current league membership cannot be confirmed", async () => {
    const queryClient = createQueryClient();
    const httpClient = {
      request: vi.fn(async () => ({ data: { leagues: [] } })),
    };
    await expect(
      prepareFreeAgentDraftDestination({
        destination: destinations.private_card,
        httpClient,
        queryClient,
      })
    ).rejects.toBeInstanceOf(NotificationDestinationUnavailableError);
  });
});
