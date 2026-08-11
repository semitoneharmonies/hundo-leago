import { describe, expect, it } from "vitest";

import {
  auctionAavCents,
  initialAuctionOffer,
  validateAuctionOffer,
} from "./auctionUi.js";

describe("auction UI offer guidance", () => {
  it("uses half-up AAV and preserves ordinary opening, joining, and edit rules", () => {
    expect(auctionAavCents(1_000, 3)).toBe(333);
    expect(auctionAavCents(1_001, 3)).toBe(334);
    expect(
      validateAuctionOffer("2.00", "2", { action: "start" })
    ).toEqual({ totalValueCents: 200, termYears: 2, aavCents: 100 });
    expect(() =>
      validateAuctionOffer("2.00", "2", { action: "join" })
    ).toThrow("minimum joining");
    expect(
      validateAuctionOffer("2.00", "2", {
        action: "edit",
        sourceKind: "ordinary_weekly",
      })
    ).toEqual({ totalValueCents: 200, termYears: 2, aavCents: 100 });
    expect(() =>
      validateAuctionOffer("3.50", "2", { action: "start" })
    ).toThrow("whole dollars");
  });

  it("distinguishes a strict restricted improvement from an equal fallback floor", () => {
    const floor = { totalValueCents: 500, termYears: 2, aavCents: 250 };
    expect(() =>
      validateAuctionOffer("5.00", "2", {
        action: "join",
        sourceKind: "fad_restricted",
        fadOrigin: "candidate_tie_restricted",
        minimumContract: floor,
      })
    ).toThrow("must improve");
    expect(
      validateAuctionOffer("5.00", "1", {
        action: "join",
        sourceKind: "fad_restricted",
        fadOrigin: "candidate_tie_restricted",
        minimumContract: floor,
      })
    ).toEqual({ totalValueCents: 500, termYears: 1, aavCents: 500 });
    expect(
      validateAuctionOffer("5.00", "2", {
        action: "join",
        sourceKind: "fad_open_rapid",
        fadOrigin: "restricted_no_improvement_fallback",
        minimumContract: floor,
      })
    ).toEqual({ totalValueCents: 500, termYears: 2, aavCents: 250 });
    expect(() =>
      validateAuctionOffer("5.00", "3", {
        action: "join",
        sourceKind: "fad_open_rapid",
        fadOrigin: "restricted_no_improvement_fallback",
        minimumContract: floor,
      })
    ).toThrow("fallback floor");
  });

  it("prefills a safe strict restricted improvement and preserves an own bid", () => {
    expect(
      initialAuctionOffer(
        {
          sourceKind: "fad_restricted",
          minimumContract: {
            totalValueCents: 300,
            termYears: 3,
            aavCents: 100,
          },
        },
        { bid: null }
      )
    ).toEqual({ total: "5.00", term: "3" });
    expect(
      initialAuctionOffer(
        { sourceKind: "fad_open_rapid", minimumContract: null },
        { bid: { totalValueCents: 625, termYears: 1 } }
      )
    ).toEqual({ total: "6.25", term: "1" });
  });
});
