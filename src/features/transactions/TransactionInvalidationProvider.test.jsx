import { describe, expect, it } from "vitest";

import { invalidationPrefixes } from "./transactionInvalidation.js";

const leagueId = "11111111-1111-4111-8111-111111111111";

describe("M5-11 metadata-only socket invalidation", () => {
  it("maps trade and auction metadata only to scoped refetch prefixes", () => {
    expect(invalidationPrefixes("trade.changed", { type: "trade.changed", leagueId })).toEqual([
      ["league", leagueId, "activity"],
      ["league", leagueId, "trades"],
      ["league", leagueId, "trade"],
      ["notifications"],
    ]);
    expect(invalidationPrefixes("auction.updated", { type: "auction.updated", leagueId })).toEqual([
      ["league", leagueId, "activity"],
      ["league", leagueId, "auctions"],
      ["league", leagueId, "auction"],
      ["notifications"],
    ]);
  });

  it("ignores malformed, cross-shape, and non-metadata input", () => {
    expect(invalidationPrefixes("trade.changed", { type: "auction.updated", leagueId })).toEqual([]);
    expect(invalidationPrefixes("trade.changed", { type: "trade.changed", leagueId: "not-an-id" })).toEqual([]);
    expect(invalidationPrefixes("trade.changed", null)).toEqual([]);
  });
});
