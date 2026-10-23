import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useInfiniteQuery = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({ useInfiniteQuery }));

import { EligiblePlayerSearch } from "./EligiblePlayerSearch.jsx";

function state(overrides = {}) {
  return {
    data: { pages: [{ items: [] }] },
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isError: false,
    isFetchingNextPage: false,
    isPending: false,
    ...overrides,
  };
}

beforeEach(() => useInfiniteQuery.mockReset());

describe("EligiblePlayerSearch compact autocomplete", () => {
  it("stays lazy until a focused input contains search text", () => {
    useInfiniteQuery.mockReturnValue(state());
    const buildQueryOptions = vi.fn(() => ({ queryKey: ["eligible"] }));
    render(
      <EligiblePlayerSearch
        buildQueryOptions={buildQueryOptions}
        value=""
        selectedPlayerId={null}
        inputLabel="F01 player name"
        onInputChange={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
    const input = screen.getByRole("combobox", { name: "F01 player name" });
    fireEvent.focus(input);
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).not.toHaveAttribute("aria-controls");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders suggestions and selects one without a row save", () => {
    const player = {
      player: { playerId: "player-one", fullName: "Connor McDavid" },
      effectivePositionGroup: "F",
    };
    useInfiniteQuery.mockReturnValue(
      state({ data: { pages: [{ items: [player] }] } })
    );
    const onSelect = vi.fn();
    render(
      <EligiblePlayerSearch
        buildQueryOptions={() => ({ queryKey: ["eligible"] })}
        value="Connor"
        selectedPlayerId={null}
        inputLabel="F01 player name"
        onInputChange={vi.fn()}
        onSelect={onSelect}
      />
    );

    const input = screen.getByRole("combobox", { name: "F01 player name" });
    fireEvent.focus(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
    const option = screen.getByRole("option", { name: "Select Connor McDavid" });
    expect(option).toHaveProperty("tagName", "BUTTON");
    expect(option.querySelector("button")).toBeNull();
    fireEvent.click(option);
    expect(onSelect).toHaveBeenCalledWith(player);
  });

  it("associates an input error with the compact autocomplete", () => {
    useInfiniteQuery.mockReturnValue(state());
    render(
      <EligiblePlayerSearch
        buildQueryOptions={() => ({ queryKey: ["eligible"] })}
        value="Connor"
        selectedPlayerId={null}
        inputLabel="F01 player name"
        describedBy="candidate-slot-F01-error"
        invalid
        onInputChange={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole("combobox", { name: "F01 player name" })).toHaveAttribute(
      "aria-describedby",
      "candidate-slot-F01-error"
    );
    expect(screen.getByRole("combobox", { name: "F01 player name" })).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("clears an existing selection when its text changes", () => {
    useInfiniteQuery.mockReturnValue(state());
    const onInputChange = vi.fn();
    render(
      <EligiblePlayerSearch
        buildQueryOptions={() => ({ queryKey: ["eligible"] })}
        value="Connor McDavid"
        selectedPlayerId="player-one"
        inputLabel="F01 player name"
        onInputChange={onInputChange}
        onSelect={vi.fn()}
      />
    );

    fireEvent.change(screen.getByRole("combobox", { name: "F01 player name" }), {
      target: { value: "Connor" },
    });
    expect(onInputChange).toHaveBeenCalledWith("Connor");
  });
});
