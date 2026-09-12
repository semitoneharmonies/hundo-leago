import { describe, expect, it } from "vitest";

import { routePaths } from "./routePaths.js";

describe("draft and FAD route paths", () => {
  it("builds stable draft-area, legacy FAD, auction, and recovery routes", () => {
    expect(routePaths.leagueDrafts("league/1")).toBe(
      "/leagues/league%2F1/drafts"
    );
    expect(routePaths.leagueFreeAgentDrafts("league/1")).toBe(
      "/leagues/league%2F1/drafts/free-agent"
    );
    expect(routePaths.leagueEntryDrafts("league/1")).toBe(
      "/leagues/league%2F1/drafts/entry"
    );
    expect(routePaths.draftFreeAgentCard("league/1", "fad 2", "team/3")).toBe(
      "/leagues/league%2F1/drafts/free-agent/fad%202/cards/team%2F3"
    );
    expect(routePaths.draftFreeAgentAllocationResults("league/1", "fad 2")).toBe(
      "/leagues/league%2F1/drafts/free-agent/fad%202/results"
    );
    expect(routePaths.leagueFreeAgentDraft("league/1")).toBe(
      "/leagues/league%2F1/free-agent-draft"
    );
    expect(routePaths.freeAgentDraft("league/1", "fad 2")).toBe(
      "/leagues/league%2F1/free-agent-draft/fad%202"
    );
    expect(routePaths.freeAgentDraftResults("league/1", "fad 2")).toBe(
      "/leagues/league%2F1/free-agent-draft/fad%202/results"
    );
    expect(routePaths.freeAgentDraftCard("league/1", "fad 2", "team/3")).toBe(
      "/leagues/league%2F1/free-agent-draft/fad%202/cards/team%2F3"
    );
    expect(routePaths.auctionDetail("league/1", "auction/4")).toBe(
      "/leagues/league%2F1/auctions/auction%2F4"
    );
    expect(routePaths.commissionerFadRecovery("league/1", "fad 2", "recovery/5")).toBe(
      "/leagues/league%2F1/commissioner?fadId=fad+2&recoveryId=recovery%2F5"
    );
  });

  it.each([
    ["leagueDrafts", [" "]],
    ["draftFreeAgentCard", ["league", "fad", ""]],
    ["draftFreeAgentAllocationResults", ["league", ""]],
    ["leagueFreeAgentDraft", [" "]],
    ["freeAgentDraft", ["league", ""]],
    ["freeAgentDraftCard", ["league", "fad", ""]],
    ["auctionDetail", ["league", ""]],
    ["commissionerFadRecovery", ["league", "fad", ""]],
  ])("fails visibly when %s lacks a stable route segment", (name, args) => {
    expect(() => routePaths[name](...args)).toThrow("required");
  });
});
