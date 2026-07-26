import { describe, expect, it, vi } from "vitest";

import { leaguePlayerSearchQuery } from "./playerQueries.js";

const leagueId = "11111111-1111-4111-8111-111111111111";

describe("complete league player catalog query", () => {
  it("loads a provider catalog larger than 2,500 records", async () => {
    let page = 0;
    const request = vi.fn(async () => {
      const current = page;
      page += 1;
      return {
        data: [{ id: `player-${current}` }],
        page: {
          nextCursor: current < 31 ? `cursor-${current + 1}` : null,
          hasMore: current < 31,
        },
      };
    });
    const query = leaguePlayerSearchQuery(
      { request },
      leagueId,
      { fetchAll: true }
    );

    const result = await query.queryFn({
      signal: new AbortController().signal,
    });
    expect(request).toHaveBeenCalledTimes(32);
    expect(result.players).toHaveLength(32);
    expect(result.page).toEqual({ nextCursor: null, hasMore: false });
  });

  it("still fails closed on an unexpectedly unbounded catalog", async () => {
    const request = vi.fn(async () => ({
      data: [],
      page: { nextCursor: "another-page", hasMore: true },
    }));
    const query = leaguePlayerSearchQuery(
      { request },
      leagueId,
      { fetchAll: true }
    );

    await expect(
      query.queryFn({ signal: new AbortController().signal })
    ).rejects.toThrow(/exceeds the supported page limit/i);
    expect(request).toHaveBeenCalledTimes(101);
  });
});
