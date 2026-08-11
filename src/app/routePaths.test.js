import { describe, expect, it } from "vitest";

import { routePaths } from "./routePaths.js";

describe("FAD route paths", () => {
  it("builds stable current, detail, result, card, auction, and recovery routes", () => {
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
    ["leagueFreeAgentDraft", [" "]],
    ["freeAgentDraft", ["league", ""]],
    ["freeAgentDraftCard", ["league", "fad", ""]],
    ["auctionDetail", ["league", ""]],
    ["commissionerFadRecovery", ["league", "fad", ""]],
  ])("fails visibly when %s lacks a stable route segment", (name, args) => {
    expect(() => routePaths[name](...args)).toThrow("required");
  });
});
