import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PositionTag } from "./HundoUi.jsx";

describe("PositionTag", () => {
  it("uses position colour and roster-category border classes", () => {
    const view = render(<PositionTag position="F" category="Active" />);

    expect(screen.getByText("F")).toHaveClass(
      "hl-position-tag",
      "is-forward",
      "is-active-roster"
    );
    expect(screen.getByText("F")).toHaveAccessibleName(
      "F position, Active"
    );

    view.rerender(<PositionTag position="D" category="Bench" />);
    expect(screen.getByText("D")).toHaveClass("is-defence", "is-bench");

    view.rerender(
      <PositionTag position="F" category="Injured Reserve" />
    );
    expect(screen.getByText("F")).toHaveClass("is-injured-reserve");

    view.rerender(<PositionTag position="D" category="Prospect" />);
    expect(screen.getByText("D")).toHaveClass("is-prospect");

    view.rerender(<PositionTag position="F" />);
    expect(screen.getByText("F")).toHaveClass("is-free-agent");
  });
});
