import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HOCKEY_QUOTES } from "../quotes.js";
import QuoteTicker from "./QuoteTicker.jsx";
import { shuffleQuoteSequence } from "./quoteTickerSequence.js";

describe("quote ticker", () => {
  it("shuffles a copy of the legacy catalog", () => {
    const quotes = [
      { text: "First", author: "One" },
      { text: "Second", author: "Two" },
      { text: "Third", author: "Three" },
    ];

    expect(shuffleQuoteSequence(quotes, () => 0)).toEqual([
      quotes[1],
      quotes[2],
      quotes[0],
    ]);
    expect(quotes.map(({ text }) => text)).toEqual([
      "First",
      "Second",
      "Third",
    ]);
  });

  it("renders two visual copies for a continuous, pausable sequence", () => {
    render(<QuoteTicker />);

    const ticker = screen.getByRole("region", {
      name: "Hockey quote ticker. Hover or focus to pause.",
    });
    const groups = ticker.querySelectorAll(".hl-quote-ticker__group");

    expect(ticker).toHaveAttribute("tabindex", "0");
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveAttribute("aria-hidden", "true");
    expect(groups[1]).toHaveClass("hl-quote-ticker__group--duplicate");
    expect(
      ticker.querySelectorAll(".hl-quote-ticker__item")
    ).toHaveLength(HOCKEY_QUOTES.length * 2);
  });
});
