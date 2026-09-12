import { describe, expect, it } from "vitest";

import {
  auctionAavCents,
  auctionTotalPreview,
  initialAuctionOffer,
  sourceLabel,
  validateAuctionOffer,
} from "./auctionUi.js";

describe("auction UI offer guidance", () => {
  it("uses half-up AAV and preserves ordinary opening, joining, and edit rules", () => {
    expect(auctionAavCents(1_000, 3)).toBe(333);
    expect(auctionAavCents(1_001, 3)).toBe(334);
    expect(
      validateAuctionOffer("1.25", "2", { action: "start" })
    ).toEqual({ totalValueCents: 250, termYears: 2, aavCents: 125 });
    expect(() =>
      validateAuctionOffer("1.25", "2", { action: "join" })
    ).toThrow("minimum joining");
    expect(
      validateAuctionOffer("1.25", "2", {
        action: "edit",
        sourceKind: "ordinary_weekly",
      })
    ).toEqual({ totalValueCents: 250, termYears: 2, aavCents: 125 });
    expect(() =>
      validateAuctionOffer("1.10", "2", { action: "start" })
    ).toThrow("25-cent increments");
    expect(() =>
      validateAuctionOffer("0.75", "3", { action: "start" })
    ).toThrow("at least $1.00");
    expect(auctionTotalPreview("10.25", "3")).toBe("30.75");
  });

  it("distinguishes a strict restricted improvement from an equal fallback floor", () => {
    const floor = { totalValueCents: 500, termYears: 2, aavCents: 250 };
    expect(() =>
      validateAuctionOffer("2.50", "2", {
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
      validateAuctionOffer("2.50", "2", {
        action: "join",
        sourceKind: "fad_open_rapid",
        fadOrigin: "restricted_no_improvement_fallback",
        minimumContract: floor,
      })
    ).toEqual({ totalValueCents: 500, termYears: 2, aavCents: 250 });
    expect(() =>
      validateAuctionOffer("4.75", "1", {
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
    ).toEqual({ aav: "1.75", term: "3" });
    expect(
      initialAuctionOffer(
        { sourceKind: "fad_open_rapid", minimumContract: null },
        { bid: { totalValueCents: 625, termYears: 1, aavCents: 625 } }
      )
    ).toEqual({ aav: "6.25", term: "1" });
  });

  it("uses plain auction labels for the current competition phase", () => {
    expect(sourceLabel({ sourceKind: "ordinary_weekly" })).toBe("Auction");
    expect(sourceLabel({ sourceKind: "fad_restricted" })).toBe(
      "Free Agent Draft Rapid Auction"
    );
    expect(sourceLabel({ sourceKind: "fad_open_rapid" })).toBe(
      "Free Agent Draft Rapid Auction"
    );
    expect(sourceLabel({ sourceKind: "fad_open_rapid" })).not.toContain(
      "FAD"
    );
  });
});
