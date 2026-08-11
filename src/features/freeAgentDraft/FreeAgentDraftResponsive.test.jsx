import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CandidateSlot } from "./CandidateSlot.jsx";

const stylesheet = readFileSync(
  resolve(
    "src/features/freeAgentDraft/FreeAgentDraftPage.module.css"
  ),
  "utf8"
);
const compactCss = stylesheet.slice(
  stylesheet.indexOf("@media (max-width: 34rem)")
);
const tabletCss = stylesheet.slice(
  stylesheet.indexOf("@media (max-width: 56rem)"),
  stylesheet.indexOf("@media (max-width: 34rem)")
);

function editableCandidateSlot() {
  return {
    slotKey: "F02",
    slotGroup: "F",
    required: true,
    occupantKind: "candidate",
    player: {
      playerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      fullName: "Narrow Layout Candidate",
      positionGroup: "F",
    },
    authoritativeRosterCategory: null,
    remainingYears: null,
    totalValueCents: 600,
    termYears: 1,
    aavCents: 600,
    validation: { status: "valid", codes: [] },
    outcome: null,
    capabilities: {
      addCandidate: { allowed: false },
      editCandidate: { allowed: true },
      moveCandidate: { allowed: true },
      moveCarryover: { allowed: false },
      removeCandidate: { allowed: true },
    },
  };
}

describe("FAD-15 compact Candidate Card actions", () => {
  it("keeps every slot action in the narrow DOM and keyboard tab order", async () => {
    const previousWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 320,
    });
    const user = userEvent.setup();
    render(
      <CandidateSlot
        slot={editableCandidateSlot()}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const slot = document.querySelector('[data-slot-key="F02"]');
    const actions = within(slot).getByRole("group", {
      name: "Narrow Layout Candidate actions",
    });
    const buttons = within(actions).getAllByRole("button");
    expect(buttons.map((button) => button.textContent.trim())).toEqual([
      "Edit contract",
      "Move",
      "Remove",
    ]);
    for (const button of buttons) {
      expect(button).toBeVisible();
      expect(button).toBeEnabled();
      await user.tab();
      expect(button).toHaveFocus();
    }

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: previousWidth,
    });
    expect(screen.getByText("Narrow Layout Candidate")).toBeInTheDocument();
  });

  it("collapses grids and gives compact action controls a full-width reachable row", () => {
    expect(stylesheet).toMatch(
      /\.resultEvidence\s*{[^}]*min-width:\s*0;/s
    );
    expect(compactCss).toMatch(
      /\.slotGrid,\s*\.clockGrid,\s*\.summaryGrid\s*{\s*grid-template-columns:\s*1fr;/
    );
    expect(compactCss).toMatch(
      /\.slotActions,\s*\.editorActions,\s*\.teamSelector\s*{\s*display:\s*grid;\s*grid-template-columns:\s*1fr;/
    );
    expect(compactCss).toMatch(
      /\.slotActions button,\s*\.editorActions button\s*{\s*width:\s*100%;/
    );
    expect(tabletCss).toMatch(
      /\.resultFilters\s*{\s*grid-template-columns:\s*1fr 1fr;/
    );
    expect(tabletCss).toMatch(
      /\.offerRow\s*{\s*grid-template-columns:\s*1fr 1fr;/
    );
    expect(compactCss).toMatch(
      /\.resultFilters,\s*\.offerRow\s*{\s*grid-template-columns:\s*1fr;/
    );
    expect(compactCss).toMatch(
      /\.resultFilters button,\s*\.offerRow > div\s*{\s*grid-column:\s*auto;/
    );
  });
});
