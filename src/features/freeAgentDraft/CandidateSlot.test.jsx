import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { CandidateSlot } from "./CandidateSlot.jsx";

function capabilities() {
  return {
    addCandidate: { allowed: false },
    editCandidate: { allowed: false },
    moveCandidate: { allowed: false },
    moveCarryover: { allowed: false },
    removeCandidate: { allowed: false },
  };
}

function slot(overrides = {}) {
  return {
    slotKey: "F01",
    slotGroup: "F",
    required: true,
    occupantKind: "empty",
    locked: false,
    player: null,
    totalValueCents: null,
    termYears: null,
    aavCents: null,
    remainingYears: null,
    validation: { status: "valid", codes: [] },
    outcome: null,
    capabilities: capabilities(),
    ...overrides,
  };
}

describe("CandidateSlot compact rows", () => {
  it("renders one editable name/AAV/term/total row with no row-level action", () => {
    const onDraftChange = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CandidateSlot
          slot={slot()}
          editable
          draft={{
            playerId: null,
            playerName: "",
            aav: "",
            termYears: "",
          }}
          buildEligibleQueryOptions={() => ({
            queryKey: ["eligible"],
            queryFn: async () => ({ items: [], page: { hasMore: false } }),
            initialPageParam: null,
            getNextPageParam: () => undefined,
          })}
          onDraftChange={onDraftChange}
        />
      </QueryClientProvider>
    );

    expect(screen.getByRole("combobox", { name: "F01 player name" })).toBeEnabled();
    fireEvent.change(screen.getByRole("textbox", { name: "F01 AAV" }), {
      target: { value: "10.25" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "F01 term" }), {
      target: { value: "3" },
    });
    expect(onDraftChange).toHaveBeenCalledWith({ aav: "10.25" });
    expect(onDraftChange).toHaveBeenCalledWith({ termYears: "3" });
    expect(screen.getByRole("textbox", { name: "F01 total contract value" })).toHaveValue("");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("associates a row validation error with name, AAV, and term", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CandidateSlot
          slot={slot()}
          editable
          draft={{
            playerId: null,
            playerName: "Connor",
            aav: "",
            termYears: "",
          }}
          rowError="Choose a player from the suggestions, or clear this row."
          buildEligibleQueryOptions={() => ({
            queryKey: ["eligible-error"],
            queryFn: async () => ({ items: [], page: { hasMore: false } }),
            initialPageParam: null,
            getNextPageParam: () => undefined,
          })}
          onDraftChange={vi.fn()}
        />
      </QueryClientProvider>
    );

    const error = screen.getByRole("alert");
    for (const field of [
      screen.getByRole("combobox", { name: "F01 player name" }),
      screen.getByRole("textbox", { name: "F01 AAV" }),
      screen.getByRole("combobox", { name: "F01 term" }),
    ]) {
      expect(field).toHaveAttribute("aria-describedby", error.id);
      expect(field).toHaveAttribute("aria-invalid", "true");
    }
  });

  it("derives a read-only total from AAV and term", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CandidateSlot
          slot={slot()}
          editable
          draft={{
            playerId: "player",
            playerName: "Connor McDavid",
            aav: "10.25",
            termYears: "3",
          }}
          buildEligibleQueryOptions={() => ({
            queryKey: ["eligible-total"],
            queryFn: async () => ({ items: [], page: { hasMore: false } }),
            initialPageParam: null,
            getNextPageParam: () => undefined,
          })}
          onDraftChange={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(screen.getByRole("textbox", { name: "F01 total contract value" }))
      .toHaveValue("$30.75");
  });

  it("keeps carryover fields locked regardless of edit mode", () => {
    render(
      <CandidateSlot
        editable
        slot={slot({
          occupantKind: "carryover",
          locked: true,
          player: { playerId: "player", fullName: "Locked Player" },
          totalValueCents: 1_200,
          termYears: 3,
          aavCents: 400,
          remainingYears: 2,
          outcome: { code: "carryover" },
        })}
      />
    );

    expect(screen.getByRole("textbox", { name: "F01 player name" })).toHaveValue(
      "Locked Player"
    );
    expect(screen.getByRole("textbox", { name: "F01 AAV" })).toHaveValue(
      "$4.00"
    );
    expect(screen.getByRole("textbox", { name: "F01 term" })).toHaveValue("2");
    expect(screen.getByText("Locked carryover")).toBeVisible();
  });

  it.each([
    ["automatic_win", "Won"],
    ["automatic_loss", "Not won"],
    ["restricted_pending", "Tie"],
    ["fallback_pending", "Not won"],
  ])("announces the published %s result as %s", (code, label) => {
    render(
      <CandidateSlot
        published
        slot={slot({
          occupantKind: "candidate",
          player: { playerId: "player", fullName: "Requested Player" },
          totalValueCents: 3_000,
          termYears: 3,
          aavCents: 1_000,
          outcome: { code },
        })}
      />
    );

    expect(screen.getByText(label)).toBeVisible();
    expect(screen.getByRole("textbox", { name: "F01 player name" })).toHaveValue(
      "Requested Player"
    );
  });

  it("explicitly marks an incomplete published request as not won", () => {
    render(
      <CandidateSlot
        published
        slot={slot({
          occupantKind: "candidate",
          player: { playerId: "player", fullName: "Incomplete Player" },
          validation: {
            status: "invalid",
            codes: ["CANDIDATE_CONTRACT_INCOMPLETE"],
          },
          outcome: { code: "invalid_offer" },
        })}
      />
    );

    expect(screen.getByText("Not won — incomplete")).toBeVisible();
  });
});
