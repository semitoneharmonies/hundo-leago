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
      screen.getByText(/highest total contract value \(AAV × years\)/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/\$3 AAV for three years totals \$9/)
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
      screen.getByText(/Bids rank by total contract value, then AAV/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/needs commissioner approval/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/independent rules calculator/)).not.toBeInTheDocument();
    expect(screen.queryByText(/FAD/)).not.toBeInTheDocument();
  });
});
