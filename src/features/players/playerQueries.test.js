import { describe, expect, it, vi } from "vitest";

import {
  leaguePlayerInfiniteQuery,
  leaguePlayerSearchQuery,
} from "./playerQueries.js";

const leagueId = "11111111-1111-4111-8111-111111111111";

describe("league player catalog queries", () => {
  it("loads one 100-player page at a time in fantasy-points order", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        data: [{ id: "first-player" }],
        page: { nextCursor: "next-player", hasMore: true },
      })
      .mockResolvedValueOnce({
        data: [{ id: "second-player" }],
        page: { nextCursor: null, hasMore: false },
      });
    const query = leaguePlayerInfiniteQuery({ request }, leagueId);

    const first = await query.queryFn({
      pageParam: null,
      signal: new AbortController().signal,
    });

    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toContain("limit=100");
    expect(request.mock.calls[0][0]).toContain("sort=fantasyPoints");
    expect(query.getNextPageParam(first)).toBe("next-player");

    const second = await query.queryFn({
      pageParam: query.getNextPageParam(first),
      signal: new AbortController().signal,
    });

    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][0]).toContain("cursor=next-player");
    expect(query.getNextPageParam(second)).toBeUndefined();
  });

  it("keeps autocomplete searches to a single small page", async () => {
    const request = vi.fn(async () => ({
      data: [{ id: "matching-player" }],
      page: { nextCursor: "not-followed", hasMore: true },
    }));
    const query = leaguePlayerSearchQuery(
      { request },
      leagueId,
      { query: "kuch", limit: 8, sort: "name" }
    );

    const result = await query.queryFn({
      signal: new AbortController().signal,
    });

    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toContain("query=kuch");
    expect(request.mock.calls[0][0]).toContain("limit=8");
    expect(request.mock.calls[0][0]).toContain("sort=name");
    expect(result.page.hasMore).toBe(true);
  });

  it("sends a selected team to the server before pagination", async () => {
    const teamId = "22222222-2222-4222-8222-222222222222";
    const request = vi.fn(async () => ({
      data: [],
      page: { nextCursor: null, hasMore: false },
    }));
    const query = leaguePlayerInfiniteQuery(
      { request },
      leagueId,
      { teamId }
    );

    await query.queryFn({
      pageParam: null,
      signal: new AbortController().signal,
    });

    expect(request.mock.calls[0][0]).toContain(`teamId=${teamId}`);
    expect(query.queryKey).toContain(teamId);
  });
});
