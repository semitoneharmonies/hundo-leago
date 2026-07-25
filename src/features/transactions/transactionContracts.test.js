import { describe, expect, it } from "vitest";

import {
  buildTradeAsset,
  validateAuctionList,
  validateTradeDetail,
} from "./transactionContracts.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const seasonId = "22222222-2222-4222-8222-222222222222";
const auctionId = "33333333-3333-4333-8333-333333333333";
const playerId = "44444444-4444-4444-8444-444444444444";
const teamA = "55555555-5555-4555-8555-555555555555";
const teamB = "66666666-6666-4666-8666-666666666666";
const tradeId = "77777777-7777-4777-8777-777777777777";
const assetId = "88888888-8888-4888-8888-888888888888";

function auction(participant = { teamId: teamB, teamName: "Other Team" }) {
  return {
    id: auctionId,
    leagueId,
    seasonId,
    player: { id: playerId, fullName: "Sealed Player", positionGroup: "F" },
    status: "Active",
    openedAtMs: 1,
    bidClosesAtMs: 2,
    participantCount: 1,
    participants: [participant],
    ownBid: {
      id: assetId,
      teamId: teamA,
      totalValueCents: 500,
      termYears: 2,
      aavCents: 250,
      firstSubmittedAtMs: 1,
      lastEditedAtMs: 1,
      editCount: 0,
      version: 1,
    },
  };
}

describe("M5-11 transaction response contracts", () => {
  it("accepts own-bid values but rejects a competing participant value", () => {
    expect(validateAuctionList({ code: "ACTIVE_AUCTIONS_FOUND", auctions: [auction()] })).toBe(true);
    expect(() => validateAuctionList({
      code: "ACTIVE_AUCTIONS_FOUND",
      auctions: [auction({ teamId: teamB, teamName: "Other Team", totalValueCents: 999_999 })],
    })).toThrow(/sealed bid data/);
  });

  it("builds every approved typed trade asset with exact transport keys", () => {
    expect([
      buildTradeAsset({ type: "contract", reference: assetId }),
      buildTradeAsset({ type: "prospect_right", reference: playerId }),
      buildTradeAsset({ type: "draft_pick", reference: assetId }),
      buildTradeAsset({ type: "retention_obligation", reference: assetId }),
      buildTradeAsset({ type: "buyout_obligation", reference: assetId }),
      buildTradeAsset({ type: "future_consideration", reference: assetId }),
      buildTradeAsset({ type: "future_consideration_instruction", reference: "Conditional selection" }),
      buildTradeAsset({ type: "requested_retention", reference: assetId, retainedAavCents: "250" }),
    ]).toEqual([
      { type: "contract", contractId: assetId },
      { type: "prospect_right", playerId },
      { type: "draft_pick", draftPickId: assetId },
      { type: "retention_obligation", retentionObligationId: assetId },
      { type: "buyout_obligation", buyoutObligationId: assetId },
      { type: "future_consideration", futureConsiderationId: assetId },
      { type: "future_consideration_instruction", description: "Conditional selection" },
      { type: "requested_retention", contractId: assetId, retainedAavCents: 250 },
    ]);
  });

  it("accepts correction-required trade details and typed history", () => {
    expect(validateTradeDetail({
      code: "TRADE_PROPOSAL_FOUND",
      proposal: {
        id: tradeId,
        leagueId,
        seasonId,
        proposingTeam: { id: teamA, name: "A" },
        receivingTeam: { id: teamB, name: "B" },
        storageStatus: "correction_required",
        createdAtMs: 1,
        expiresAtMs: 2,
        effectiveDeadlineAtMs: 2,
        version: 3,
        assets: [{ id: assetId, type: "contract", snapshot: { type: "contract" } }],
        history: [{ id: assetId, type: "correction_required", occurredAtMs: 2 }],
      },
    })).toBe(true);
  });
});
