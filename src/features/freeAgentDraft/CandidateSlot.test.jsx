import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { CandidateSlot } from "./CandidateSlot.jsx";

function capabilities(overrides = {}) {
  return {
    addCandidate: { allowed: false },
    editCandidate: { allowed: false },
    moveCandidate: { allowed: false },
    moveCarryover: { allowed: false },
    removeCandidate: { allowed: false },
    ...overrides,
  };
}

function emptySlot(overrides = {}) {
  return {
    slotKey: "B01",
    slotGroup: "B",
    required: false,
    occupantKind: "empty",
    capabilities: capabilities(),
    ...overrides,
  };
}

describe("CandidateSlot variants", () => {
  it("labels an unavailable optional bench slot without offering an add action", () => {
    render(
      <CandidateSlot
        slot={emptySlot()}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Bench" })).toBeVisible();
    expect(screen.getByText("Optional")).toBeVisible();
    expect(screen.getByText("Empty optional slot")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Add candidate" })
    ).not.toBeInTheDocument();
  });

  it("offers the exact mandatory defence slot to the add callback", () => {
    const onAdd = vi.fn();
    const slot = emptySlot({
      slotKey: "D01",
      slotGroup: "D",
      required: true,
      capabilities: capabilities({ addCandidate: { allowed: true } }),
    });
    render(
      <CandidateSlot
        slot={slot}
        onAdd={onAdd}
        onEdit={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Defence" })).toBeVisible();
    expect(screen.getByText("Mandatory")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Add candidate" }));
    expect(onAdd).toHaveBeenCalledWith(slot);
  });

  it("renders a multi-year carryover warning and permits only its server-authorized move", () => {
    const onMove = vi.fn();
    const slot = {
      slotKey: "D02",
      slotGroup: "D",
      required: true,
      occupantKind: "carryover",
      player: {
        playerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        fullName: "Locked Defence Player",
        positionGroup: "D",
      },
      authoritativeRosterCategory: "Active",
      remainingYears: 2,
      totalValueCents: 1_200,
      termYears: 2,
      aavCents: 600,
      validation: { status: "warning", codes: ["CAP_WARNING"] },
      outcome: { code: "carryover" },
      capabilities: capabilities({ moveCarryover: { allowed: true } }),
    };
    render(
      <CandidateSlot
        slot={slot}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onMove={onMove}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("Locked carryover")).toBeVisible();
    expect(screen.getByText(/2 years remaining/)).toBeVisible();
    expect(screen.getByText("Needs attention")).toBeVisible();
    expect(screen.getByText("CAP WARNING")).toBeVisible();
    expect(screen.getByText(/Carried to the new season/)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Edit contract" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Move" }));
    expect(onMove).toHaveBeenCalledWith(slot);
  });
});
