import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResponseContractError } from "../../shared/api/responseContracts.js";
import { TeamRosterPage } from "./TeamRosterPage.jsx";
import { validatePublicRosterResponse } from "./publicRosterContracts.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const seasonId = "22222222-2222-4222-8222-222222222222";
const teamId = "33333333-3333-4333-8333-333333333333";
const activePlayerId = "44444444-4444-4444-8444-444444444444";
const prospectPlayerId = "55555555-5555-4555-8555-555555555555";

function roster() {
  return {
    league: { id: leagueId, name: "Hundo League" },
    season: { id: seasonId, label: "2026-27" },
    team: {
      id: teamId,
      name: "Target Owls",
      primaryColour: "#112233",
      secondaryColour: "#aabbcc",
      logoReference: null,
    },
    players: [
      {
        playerReference: activePlayerId,
        name: "Active Player",
        normalizedPosition: "F",
        rosterCategory: "Active",
        aavCents: 500,
        remainingContractYears: 2,
        age: 26,
        seasonStatistics: {
          gamesPlayed: 10,
          goals: 4,
          assists: 6,
          nhlPoints: 10,
          fantasyPointsHundredths: 1250,
        },
      },
      {
        playerReference: prospectPlayerId,
        name: "Prospect Player",
        normalizedPosition: "D",
        rosterCategory: "Prospect",
        aavCents: null,
        remainingContractYears: 0,
        age: null,
        seasonStatistics: null,
      },
    ],
    cap: {
      capLimitCents: 1000,
      capUsageCents: 1500,
      capSpaceCents: -500,
      retainedSalaryTotalCents: 200,
      buyoutPenaltyTotalCents: 100,
    },
    updatedAt: 1,
  };
}

describe("public roster response contract", () => {
  it("accepts only the exact approved public fields", () => {
    expect(
      validatePublicRosterResponse({
        code: "PUBLIC_ROSTER_FOUND",
        roster: roster(),
      })
    ).toBe(true);
    expect(() =>
      validatePublicRosterResponse({
        code: "PUBLIC_ROSTER_FOUND",
        roster: { ...roster(), membership: { id: "private" } },
      })
    ).toThrow(ResponseContractError);
  });

  it("rejects duplicate players and cap totals that do not reconcile", () => {
    const duplicate = roster();
    duplicate.players.push({ ...duplicate.players[0] });
    expect(() =>
      validatePublicRosterResponse({ code: "PUBLIC_ROSTER_FOUND", roster: duplicate })
    ).toThrow(/duplicate players/i);
    const badCap = roster();
    badCap.cap.capSpaceCents = 0;
    expect(() =>
      validatePublicRosterResponse({ code: "PUBLIC_ROSTER_FOUND", roster: badCap })
    ).toThrow(/do not reconcile/i);
  });
});

describe("authoritative team roster page", () => {
  it("shows categories, contracts, statistics, cap components, and unavailable controls", () => {
    render(
      <TeamRosterPage
        roster={roster()}
        managerName="League Manager"
        canOperateRoster
      />
    );
    expect(screen.getByRole("heading", { name: "Target Owls" })).toBeInTheDocument();
    expect(screen.getByText("Manager: League Manager")).toBeInTheDocument();
    for (const heading of ["Active roster", "Bench", "Injured reserve", "Prospects", "Salary cap"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    expect(screen.getByText("1/18 used · F 1/12 · D 0/6")).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Active Player" })).toBeInTheDocument();
    expect(screen.getByText("10 GP · 4 G · 6 A · 10 P · 12.50 FP")).toBeInTheDocument();
    expect(screen.getByText("-$5.00")).toBeInTheDocument();
    expect(screen.getByText(/Dedicated roster command controls are not connected yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
