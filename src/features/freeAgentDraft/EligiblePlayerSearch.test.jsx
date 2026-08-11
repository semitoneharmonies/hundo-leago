import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useInfiniteQuery = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({ useInfiniteQuery }));

import { EligiblePlayerSearch } from "./EligiblePlayerSearch.jsx";

function queryState(overrides = {}) {
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

function renderSearch(state, { selectedPlayerId = null } = {}) {
  const buildQueryOptions = vi.fn((filters) => ({
    queryKey: ["eligible-players", filters],
  }));
  const onSelect = vi.fn();
  useInfiniteQuery.mockReturnValue(state);
  render(
    <EligiblePlayerSearch
      buildQueryOptions={buildQueryOptions}
      selectedPlayerId={selectedPlayerId}
      onSelect={onSelect}
    />
  );
  return { buildQueryOptions, onSelect };
}

beforeEach(() => {
  useInfiniteQuery.mockReset();
});

describe("EligiblePlayerSearch", () => {
  it("shows the pending state without exposing pagination controls", () => {
    const { buildQueryOptions } = renderSearch(
      queryState({ data: undefined, isPending: true })
    );

    expect(buildQueryOptions).toHaveBeenCalledWith({ q: "", limit: 25 });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading eligible players"
    );
    expect(
      screen.queryByRole("navigation", { name: "Eligible player pages" })
    ).not.toBeInTheDocument();
  });

  it.each([
    ["the server message", "Eligibility is temporarily unavailable."],
    ["the safe fallback", ""],
  ])("shows %s when the eligible-player request fails", (_label, message) => {
    renderSearch(
      queryState({
        data: undefined,
        error: new Error(message),
        isError: true,
      })
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      message || "Eligible players could not be loaded."
    );
    expect(
      screen.queryByRole("navigation", { name: "Eligible player pages" })
    ).not.toBeInTheDocument();
  });

  it("shows an explicit empty result and a disabled terminal page control", () => {
    renderSearch(queryState());

    expect(
      screen.getByText("No eligible players match this search.")
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "All matching players loaded" })
    ).toBeDisabled();
  });

  it("trims search input, distinguishes positions, and selects or paginates", () => {
    const fetchNextPage = vi.fn();
    const forward = {
      player: { playerId: "forward-player", fullName: "Alpha Forward" },
      effectivePositionGroup: "F",
    };
    const defence = {
      player: { playerId: "defence-player", fullName: "Beta Defence" },
      effectivePositionGroup: "D",
    };
    const { buildQueryOptions, onSelect } = renderSearch(
      queryState({
        data: { pages: [{ items: [forward] }, { items: [defence] }] },
        fetchNextPage,
        hasNextPage: true,
      }),
      { selectedPlayerId: forward.player.playerId }
    );

    expect(screen.getByText("Forward")).toBeVisible();
    expect(screen.getByText("Defence")).toBeVisible();
    expect(screen.getByRole("button", { name: "Selected" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const selectDefence = screen.getByRole("button", {
      name: "Select Beta Defence",
    });
    expect(selectDefence).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(selectDefence);
    expect(onSelect).toHaveBeenCalledWith(defence);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "  beta  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(buildQueryOptions).toHaveBeenLastCalledWith({ q: "beta", limit: 25 });

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("disables pagination while the next eligible-player page is loading", () => {
    renderSearch(
      queryState({ hasNextPage: true, isFetchingNextPage: true })
    );

    expect(
      screen.getByRole("button", { name: /^Loading more/ })
    ).toBeDisabled();
  });
});
