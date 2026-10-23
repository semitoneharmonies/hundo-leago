import { describe, expect, it, vi } from "vitest";

import {
  auctionDetailQuery,
  auctionKeys,
  auctionListQuery,
} from "./auctionQueries.js";

const id = (number) =>
  `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
const IDS = Object.freeze({
  league: id(1),
  auction: id(2),
  fad: id(3),
});

function client() {
  return { request: vi.fn() };
}

describe("auction query keys and options", () => {
  it("uses the frozen root/list/detail key seam and canonical FAD filters", () => {
    const httpClient = client();
    const list = auctionListQuery(httpClient, IDS.league, {
      fadId: IDS.fad,
      statuses: ["cancelled", "active", "resolved", "active"],
      q: "  ADA   PLAYER ",
      limit: 25,
    });
    const detail = auctionDetailQuery(httpClient, IDS.league, IDS.auction);

    expect(auctionKeys.root(IDS.league)).toEqual(["league", IDS.league, "auctions"]);
    expect(list.queryKey).toEqual([
      "league",
      IDS.league,
      "auctions",
      {
        sourceKind: null,
        fadId: IDS.fad,
        statuses: ["active", "resolved", "cancelled"],
        q: "ada player",
        limit: 25,
      },
    ]);
    expect(detail.queryKey).toEqual([
      "league",
      IDS.league,
      "auctions",
      "detail",
      IDS.auction,
    ]);
    expect(list.meta).toEqual({ private: true, leagueId: IDS.league });
    expect(detail.meta).toEqual({ private: true, leagueId: IDS.league });
  });

  it("keeps the opaque cursor in pageParam and not in the base list key", async () => {
    const httpClient = client();
    httpClient.request.mockResolvedValue({
      data: [],
      actions: { startTeams: [] },
      page: { nextCursor: null, hasMore: false },
      meta: { requestId: "request-1" },
    });
    const options = auctionListQuery(httpClient, IDS.league, {
      sourceKind: "fad_restricted",
      fadId: IDS.fad,
      limit: 50,
    });

    expect(options.queryKey).not.toContain("cGFnZS0y");
    await options.queryFn({ pageParam: "cGFnZS0y", signal: undefined });
    expect(httpClient.request.mock.calls[0][0]).toContain("cursor=cGFnZS0y");
    expect(
      options.getNextPageParam({
        items: [],
        actions: { startTeams: [] },
        page: { nextCursor: "next", hasMore: true },
      })
    ).toBe("next");
  });

  it("fails closed for invalid stable IDs and unknown filters", () => {
    const httpClient = client();
    expect(() => auctionListQuery(httpClient, "league", {})).toThrow("League ID");
    expect(() =>
      auctionDetailQuery(httpClient, IDS.league, "auction")
    ).toThrow("Auction ID");
    expect(() =>
      auctionListQuery(httpClient, IDS.league, { cursor: "not-a-base-filter" })
    ).toThrow("filters");
  });
});
