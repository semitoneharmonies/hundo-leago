import { describe, expect, it } from "vitest";

import { projectDraftTradeCap } from "./tradeCapPreview.js";

function workspace({
  buyouts = [],
  players = [],
  usageCents,
}) {
  return {
    cap: { complete: true, usageCents },
    players,
    tradeAssets: { buyouts },
  };
}

function contractPlayer({
  aavCents = 500,
  id = "contract-a",
  retainedAavCents = 100,
  rosterCategory = "Active",
} = {}) {
  return {
    rosterCategory,
    contract: { id, aavCents, retainedAavCents },
  };
}

describe("draft trade cap projection", () => {
  it("projects active contracts, requested retention, and transferred buyouts for both teams", () => {
    const preview = projectDraftTradeCap({
      proposingWorkspace: workspace({
        usageCents: 3_000,
        players: [contractPlayer()],
      }),
      receivingWorkspace: workspace({
        usageCents: 4_000,
        buyouts: [{ id: "buyout-b", annualPenaltyCents: 125 }],
      }),
      proposingAssets: [
        {
          type: "player",
          reference: "contract:contract-a",
          retainedAavDollars: "1.50",
        },
      ],
      receivingAssets: [
        { type: "buyout_obligation", reference: "buyout-b" },
      ],
    });

    expect(preview).toEqual({
      available: true,
      message: null,
      teams: [
        { currentCents: 3_000, changeCents: -125, projectedCents: 2_875 },
        { currentCents: 4_000, changeCents: 125, projectedCents: 4_125 },
      ],
    });
  });

  it("keeps bench contracts and non-cap assets at zero cap change", () => {
    const preview = projectDraftTradeCap({
      proposingWorkspace: workspace({
        usageCents: 2_000,
        players: [contractPlayer({ rosterCategory: "Bench" })],
      }),
      receivingWorkspace: workspace({ usageCents: 3_000 }),
      proposingAssets: [
        { type: "player", reference: "contract:contract-a" },
      ],
      receivingAssets: [
        { type: "future_considerations", reference: "Future help" },
      ],
    });

    expect(preview.available).toBe(true);
    expect(preview.teams).toEqual([
      { currentCents: 2_000, changeCents: 0, projectedCents: 2_000 },
      { currentCents: 3_000, changeCents: 0, projectedCents: 3_000 },
    ]);
  });

  it("counts requested retention as an obligation even when the traded contract is not Active", () => {
    const preview = projectDraftTradeCap({
      proposingWorkspace: workspace({
        usageCents: 2_000,
        players: [contractPlayer({ rosterCategory: "Bench" })],
      }),
      receivingWorkspace: workspace({ usageCents: 3_000 }),
      proposingAssets: [
        {
          type: "player",
          reference: "contract:contract-a",
          retainedAavDollars: "1.50",
        },
      ],
      receivingAssets: [
        { type: "future_considerations", reference: "Future help" },
      ],
    });

    expect(preview.teams).toEqual([
      { currentCents: 2_000, changeCents: 150, projectedCents: 2_150 },
      { currentCents: 3_000, changeCents: 0, projectedCents: 3_000 },
    ]);
  });

  it("does not estimate when a selected contract lacks current cap details", () => {
    const preview = projectDraftTradeCap({
      proposingWorkspace: workspace({ usageCents: 2_000 }),
      receivingWorkspace: workspace({ usageCents: 3_000 }),
      proposingAssets: [
        { type: "player", reference: "contract:missing-contract" },
      ],
      receivingAssets: [
        { type: "future_considerations", reference: "Future help" },
      ],
    });

    expect(preview.available).toBe(false);
    expect(preview.message).toMatch(/missing current cap details/i);
    expect(preview.teams[0].projectedCents).toBeNull();
  });
});
