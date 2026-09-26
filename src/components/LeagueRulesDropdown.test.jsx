import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LeagueRulesDropdown from "./LeagueRulesDropdown.jsx";

describe("LeagueRulesDropdown", () => {
  it("shows the current draft, auction and trade rules in plain language", () => {
    render(<LeagueRulesDropdown onClose={vi.fn()} />);

    expect(screen.getByText("$100")).toBeInTheDocument();
    expect(screen.getByText("Free Agent Draft")).toBeInTheDocument();
    expect(
      screen.getByText(/There is no final Submit button/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/highest AAV. If AAV is tied, the longer contract wins/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/\$4 AAV for one year beats \$3 AAV for three years/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/only those tied teams enter a restricted blind auction/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Restricted and league-wide rapid auctions also rank/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Only managers of that team can see its salary/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Rapid-auction bids do not reserve cap or roster space/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Starting bids require at least \$1 AAV/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Bids rank by AAV, then longer contract length/)
    ).toBeInTheDocument();
    expect(screen.getByText(/the team that bid first wins, in both/)).toBeInTheDocument();
    expect(screen.getByText(/Each team counts once/)).toBeInTheDocument();
    expect(screen.queryByText(/equal-chance draw/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/needs commissioner approval/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/independent rules calculator/)).not.toBeInTheDocument();
    expect(screen.queryByText(/FAD/)).not.toBeInTheDocument();
    expect(screen.getByText(/locks on the first day of each matchup week/)).toBeInTheDocument();
    expect(screen.getByText(/Check your roster in Teams for the exact date and time/)).toBeInTheDocument();
    expect(screen.queryByText(/baseline/i)).not.toBeInTheDocument();
  });
});
