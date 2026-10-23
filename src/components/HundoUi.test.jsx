import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ErrorBlock, PositionTag, TeamMark } from "./HundoUi.jsx";

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

describe("TeamMark", () => {
  const team = {
    name: "Pattern Club",
    primaryColour: "#112233",
    secondaryColour: "#ddeeff",
    tertiaryColour: "#cc3300",
    patternTemplate: "classic-stripes",
  };

  it("uses an uploaded logo with the team pattern underneath as a fallback", () => {
    const view = render(
      <TeamMark
        team={team}
        logoUrl="https://example.test/team-logo.png"
        className="custom-mark"
      />
    );

    const mark = view.container.querySelector(".hl-team-mark");
    const logo = view.container.querySelector("img");
    expect(mark).toHaveClass("custom-mark", "has-team-pattern");
    expect(mark.style.getPropertyValue("--team-primary")).toBe("#112233");
    expect(logo).toHaveAttribute("crossorigin", "use-credentials");

    fireEvent.error(logo);
    expect(logo).not.toBeVisible();
  });

  it("shows a colour mark without rendering team initials when no logo exists", () => {
    const view = render(<TeamMark team={team} />);
    const mark = view.container.querySelector(".hl-team-mark");

    expect(mark).toHaveClass("has-team-pattern");
    expect(mark).toHaveTextContent("");
    expect(mark.querySelector("img")).toBeNull();
  });
});

describe("ErrorBlock", () => {
  it("gives recovery guidance without exposing request IDs or internal codes", () => {
    render(
      <ErrorBlock
        error={{
          code: "INTERNAL_OPERATION_FAILED",
          message: "Internal operation failed.",
          requestId: "request-sensitive",
        }}
        fallback="League teams could not be loaded."
        impact="Team links are unavailable."
        recovery="Refresh the page and try again."
        action={<button type="button">Try again</button>}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "League teams could not be loaded."
    );
    expect(screen.getByText("Team links are unavailable.")).toBeInTheDocument();
    expect(screen.getByText("Refresh the page and try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText(/request-sensitive/i)).toBeNull();
    expect(screen.queryByText(/INTERNAL_OPERATION_FAILED/i)).toBeNull();
    expect(screen.queryByText("Internal operation failed.")).toBeNull();
  });
});
