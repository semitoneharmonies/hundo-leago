import { describe, expect, it, vi } from "vitest";

import {
  cancelAuctionAsCommissioner,
  editAuctionBidAsCommissioner,
  getAuction,
  listAuctions,
  normalizeAuctionFilters,
  putMyAuctionBid,
  removeAuctionBidAsCommissioner,
  requestAuctionResolutionAsCommissioner,
  startAuction,
} from "./auctionApi.js";

const id = (number) =>
  `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
const IDS = Object.freeze({
  league: id(1),
  season: id(2),
  auction: id(3),
  fad: id(4),
  rollover: id(5),
  player: id(6),
  team: id(7),
  bid: id(8),
  queue: id(9),
  operation: id(10),
});
const NOW_MS = 1_800_000_000_000;
const DAY_MS = 86_400_000;

function allowed() {
  return { allowed: true, reasonCode: null };
}

function denied(reasonCode = "NOT_AUTHORIZED") {
  return { allowed: false, reasonCode };
}

function team() {
  return {
    teamId: IDS.team,
    name: "Snow Owls",
    primaryColour: "#112233",
    secondaryColour: "#ddeeff",
    tertiaryColour: null,
    patternTemplate: "solid",
    logoReference: null,
  };
}

function player() {
  return {
    playerId: IDS.player,
    fullName: "Ada Player",
    positionGroup: "F",
  };
}

function ordinaryAuction() {
  return {
    auctionId: IDS.auction,
    leagueId: IDS.league,
    seasonId: IDS.season,
    version: 1,
    player: player(),
    status: "active",
    openedAtMs: NOW_MS,
    resolvesAtMs: NOW_MS + DAY_MS,
    resolvedAtMs: null,
    updatedAtMs: NOW_MS,
    bidCount: 0,
    participatingTeamCount: 0,
    sourceKind: "ordinary_weekly",
    fadOrigin: null,
    fadId: null,
    fadRolloverId: null,
    targetRolloverAtMs: null,
    creationCutoffAtMs: null,
    eligibleTeams: [],
    minimumContract: null,
    drawCommitment: null,
    viewerTeams: [],
    administrativeBids: [],
    result: null,
    capabilities: {
      view: allowed(),
      adminCancel: denied(),
      adminResolve: denied(),
    },
  };
}

function fadAuction() {
  return {
    ...ordinaryAuction(),
    sourceKind: "fad_open_rapid",
    fadOrigin: "manager_nomination",
    fadId: IDS.fad,
    fadRolloverId: IDS.rollover,
    targetRolloverAtMs: NOW_MS + DAY_MS,
    creationCutoffAtMs: NOW_MS + DAY_MS - 3_600_000,
    drawCommitment: "a".repeat(64),
  };
}

function queuedNomination() {
  return {
    queueId: IDS.queue,
    fadId: IDS.fad,
    teamId: IDS.team,
    player: player(),
    totalValueCents: 600,
    termYears: 2,
    aavCents: 300,
    bindingIllegalityConfirmedAtMs: NOW_MS,
    acceptedAtMs: NOW_MS,
    openingRolloverId: IDS.rollover,
    resolutionRolloverId: null,
    status: "queued",
    version: 1,
  };
}

function bidResult({ edited = false } = {}) {
  return {
    code: edited ? "AUCTION_BID_EDITED" : "AUCTION_BID_SUBMITTED",
    replayed: false,
    auction: {
      id: IDS.auction,
      leagueId: IDS.league,
      seasonId: IDS.season,
      status: "open",
      openedAtMs: NOW_MS,
      bidClosesAtMs: NOW_MS + DAY_MS,
    },
    bid: {
      id: IDS.bid,
      teamId: IDS.team,
      totalValueCents: edited ? 700 : 600,
      termYears: 2,
      aavCents: edited ? 350 : 300,
      firstSubmittedAtMs: NOW_MS,
      lastEditedAtMs: edited ? NOW_MS + 5_000_000 : NOW_MS,
      editCount: edited ? 1 : 0,
      status: "active",
      version: edited ? 2 : 1,
    },
  };
}

function client(response) {
  return {
    request: vi.fn().mockResolvedValue(response),
  };
}

describe("auction API boundary", () => {
  it("normalizes list filters and consumes authoritative actions with cursor paging", async () => {
    const httpClient = client({
      data: [ordinaryAuction()],
      actions: {
        startTeams: [
          {
            teamId: IDS.team,
            team: team(),
            sourceKind: "ordinary_weekly",
            fadId: null,
            fadRolloverId: null,
            targetRolloverAtMs: null,
            creationCutoffAtMs: null,
            startAuction: allowed(),
          },
        ],
      },
      page: { nextCursor: "Y3Vyc29y", hasMore: true },
      meta: { requestId: "request-1" },
    });
    const signal = new AbortController().signal;
    const result = await listAuctions(httpClient, IDS.league, {
      statuses: ["resolved", "active", "resolved"],
      q: "  ADA   PLAYER  ",
      limit: 25,
      cursor: "cGFnZS0y",
      signal,
    });

    expect(result.actions.startTeams).toHaveLength(1);
    expect(result.page).toEqual({ nextCursor: "Y3Vyc29y", hasMore: true });
    expect(httpClient.request).toHaveBeenCalledWith(
      `/api/v1/leagues/${IDS.league}/auctions?status=active&status=resolved&q=ada+player&limit=25&cursor=cGFnZS0y`,
      expect.objectContaining({
        authenticated: true,
        dataKind: "array",
        actionsKind: "object",
        signal,
      })
    );
    const options = httpClient.request.mock.calls[0][1];
    expect(options.validateData).toBeTypeOf("function");
    expect(options.validateActions).toBeTypeOf("function");
    expect(options.validatePage).toBeTypeOf("function");
  });

  it("uses exact FAD list context and stable-ID detail reads", async () => {
    const listedClient = client({
      data: [fadAuction()],
      actions: { startTeams: [] },
      page: { nextCursor: null, hasMore: false },
      meta: { requestId: "request-1" },
    });
    await listAuctions(listedClient, IDS.league, {
      sourceKind: "fad_open_rapid",
      fadId: IDS.fad,
    });
    expect(listedClient.request.mock.calls[0][0]).toBe(
      `/api/v1/leagues/${IDS.league}/auctions?sourceKind=fad_open_rapid&fadId=${IDS.fad}&limit=50`
    );

    const detailClient = client({ data: fadAuction(), meta: { requestId: "request-2" } });
    await expect(
      getAuction(detailClient, IDS.league, IDS.auction)
    ).resolves.toMatchObject({ auctionId: IDS.auction, fadId: IDS.fad });
    expect(detailClient.request.mock.calls[0][0]).toBe(
      `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`
    );
  });

  it("sends the simplified contract for both direct and queued starts", async () => {
    const directClient = client({
      data: { kind: "auction_opened", auction: fadAuction(), queuedNomination: null },
      meta: { requestId: "request-direct" },
    });
    const body = {
      playerId: IDS.player,
      teamId: IDS.team,
      aavCents: 300,
      termYears: 2,
    };
    await expect(
      startAuction(directClient, IDS.league, body, {
        idempotencyKey: "fad-start:direct",
      })
    ).resolves.toMatchObject({ kind: "auction_opened" });
    expect(directClient.request.mock.calls[0][1]).toMatchObject({
      method: "POST",
      authenticated: true,
      body,
      idempotencyKey: "fad-start:direct",
    });

    const queuedClient = client({
      data: {
        kind: "nomination_queued",
        auction: null,
        queuedNomination: queuedNomination(),
      },
      meta: { requestId: "request-queued" },
    });
    await expect(
      startAuction(queuedClient, IDS.league, body, {
        idempotencyKey: "fad-start:queued",
      })
    ).resolves.toMatchObject({ kind: "nomination_queued" });
  });

  it("uses absent If-Match for a join and exact bid version for an edit", async () => {
    const joinClient = client({ data: bidResult(), meta: { requestId: "request-join" } });
    const input = {
      teamId: IDS.team,
      aavCents: 300,
      termYears: 2,
    };
    await putMyAuctionBid(joinClient, IDS.league, IDS.auction, input, {
      version: null,
      idempotencyKey: "fad-bid:join",
    });
    expect(joinClient.request.mock.calls[0][1]).not.toHaveProperty("version");

    const editClient = client({
      data: bidResult({ edited: true }),
      meta: { requestId: "request-edit" },
    });
    await putMyAuctionBid(
      editClient,
      IDS.league,
      IDS.auction,
      { ...input, aavCents: 350 },
      { version: 1, idempotencyKey: "fad-bid:edit" }
    );
    expect(editClient.request.mock.calls[0][1]).toMatchObject({
      method: "PUT",
      version: 1,
      idempotencyKey: "fad-bid:edit",
    });
  });

  it("fails before transport for obsolete confirmation, unknown filters, and invalid contexts", async () => {
    const httpClient = client({});
    await expect(
      startAuction(
        httpClient,
        IDS.league,
        {
          playerId: IDS.player,
          teamId: IDS.team,
          aavCents: 300,
          termYears: 2,
          bindingIllegalityConfirmed: true,
        },
        { idempotencyKey: "fad-start:false" }
      )
    ).rejects.toThrow("invalid");
    expect(() => normalizeAuctionFilters({ status: ["active"] })).toThrow("filters");
    expect(() =>
      normalizeAuctionFilters({ sourceKind: "ordinary_weekly", fadId: IDS.fad })
    ).toThrow("cannot include a FAD ID");
    expect(() => normalizeAuctionFilters({ q: "ada\nplayer" })).toThrow("search");
    await expect(
      listAuctions(httpClient, IDS.league, { cursor: "abc=" })
    ).rejects.toThrow("cursor");
    expect(httpClient.request).not.toHaveBeenCalled();
  });

  it("sends exact commissioner bid edit and removal commands with bid preconditions", async () => {
    const editedAuction = {
      ...ordinaryAuction(),
      version: 2,
      administrativeBids: [
        {
          bidId: IDS.bid,
          teamId: IDS.team,
          team: team(),
          version: 2,
          status: "active",
          participantStatus: null,
          capabilities: {
            adminEditBid: allowed(),
            adminRemoveBid: allowed(),
          },
        },
      ],
    };
    const editClient = client({ data: editedAuction });
    const editBody = {
      teamId: IDS.team,
      aavCents: 350,
      termYears: 2,
    };
    await editAuctionBidAsCommissioner(
      editClient,
      IDS.league,
      IDS.auction,
      IDS.bid,
      editBody,
      { version: 1, idempotencyKey: "auction-admin:edit" }
    );
    expect(editClient.request).toHaveBeenCalledWith(
      `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}/bids/${IDS.bid}`,
      expect.objectContaining({
        method: "PATCH",
        authenticated: true,
        body: editBody,
        version: 1,
        idempotencyKey: "auction-admin:edit",
      })
    );

    const removeClient = client({
      data: {
        auction: ordinaryAuction(),
        removedBidId: IDS.bid,
        restrictedParticipantStatus: null,
        fadAllocationVersion: null,
      },
    });
    await removeAuctionBidAsCommissioner(
      removeClient,
      IDS.league,
      IDS.auction,
      IDS.bid,
      { version: 2, idempotencyKey: "auction-admin:remove" }
    );
    expect(removeClient.request).toHaveBeenCalledWith(
      `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}/bids/${IDS.bid}`,
      expect.objectContaining({
        method: "DELETE",
        body: { confirmation: "REMOVE AUCTION BID" },
        version: 2,
        idempotencyKey: "auction-admin:remove",
      })
    );
  });

  it("sends exact commissioner cancel and resolution commands with auction preconditions", async () => {
    const cancelClient = client({
      data: {
        auction: ordinaryAuction(),
        fadAllocation: null,
        recoveryId: null,
      },
    });
    await cancelAuctionAsCommissioner(
      cancelClient,
      IDS.league,
      IDS.auction,
      { version: 3, idempotencyKey: "auction-admin:cancel" }
    );
    expect(cancelClient.request).toHaveBeenCalledWith(
      `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}/cancel`,
      expect.objectContaining({
        method: "POST",
        body: { confirmation: "CANCEL AUCTION" },
        version: 3,
        idempotencyKey: "auction-admin:cancel",
      })
    );

    const resolutionClient = client({
      data: {
        operationId: IDS.operation,
        occurrenceKey: `auction:${IDS.auction}:${NOW_MS + DAY_MS}`,
        auctionId: IDS.auction,
        status: "pending",
        acceptedAtMs: NOW_MS + DAY_MS,
        pollDescriptor: {
          kind: "auction",
          leagueId: IDS.league,
          auctionId: IDS.auction,
        },
      },
    });
    await requestAuctionResolutionAsCommissioner(
      resolutionClient,
      IDS.league,
      IDS.auction,
      { version: 4, idempotencyKey: "auction-admin:resolve" }
    );
    expect(resolutionClient.request).toHaveBeenCalledWith(
      `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}/resolve`,
      expect.objectContaining({
        method: "POST",
        body: { confirmation: "RESOLVE AUCTION" },
        version: 4,
        idempotencyKey: "auction-admin:resolve",
      })
    );
  });

  it("rejects commissioner command shape and missing preconditions before transport", async () => {
    const httpClient = client({});
    await expect(
      editAuctionBidAsCommissioner(
        httpClient,
        IDS.league,
        IDS.auction,
        IDS.bid,
        {
          teamId: IDS.team,
          aavCents: 300,
          termYears: 2,
          currentValueCents: 500,
        },
        { version: 1, idempotencyKey: "auction-admin:invalid" }
      )
    ).rejects.toThrow("body");
    await expect(
      cancelAuctionAsCommissioner(httpClient, IDS.league, IDS.auction, {
        version: null,
        idempotencyKey: "auction-admin:missing-version",
      })
    ).rejects.toThrow("version is required");
    expect(httpClient.request).not.toHaveBeenCalled();
  });
});
