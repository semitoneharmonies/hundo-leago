import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LeagueRulesDropdown from "./LeagueRulesDropdown.jsx";

describe("LeagueRulesDropdown", () => {
  it("shows the current auction and trade rules in plain language", () => {
    render(<LeagueRulesDropdown onClose={vi.fn()} />);

    expect(screen.getByText("$100")).toBeInTheDocument();
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
