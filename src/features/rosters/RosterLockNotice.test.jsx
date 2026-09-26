import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RosterLockSummary } from "./RosterLockNotice.jsx";

const scope = { leagueId: "league-a", seasonId: "season-a" };
const week = (sequence, at, label, overrides = {}) => ({ ...scope, sequence,
  status: "scheduled", locksAtMs: Date.parse(at), locksAtDisplay: label, ...overrides });
const opening = week(1, "2026-09-29T23:00:00Z", "Tuesday, September 29, 2026 at 4:00 PM Pacific Daylight Time");
const monday = week(2, "2026-10-05T23:00:00Z", "Monday, October 5, 2026 at 4:00 PM Pacific Daylight Time");
afterEach(() => vi.useRealTimers());

describe("next roster lock", () => {
  it.each([
    ["2026-09-28T23:00:00Z", opening, "Tuesday, September 29"],
    ["2026-12-25T23:00:00Z", week(13, "2026-12-27T00:00:00Z", "Saturday, December 26, 2026 at 5:00 PM Pacific Time"), "Saturday, December 26"],
    ["2027-02-07T23:00:00Z", week(18, "2027-02-09T00:00:00Z", "Monday, February 8, 2027 at 5:00 PM Pacific Time"), "Monday, February 8"],
  ])("shows the saved first-day deadline after %s", (now, row, expected) => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(now));
    render(<RosterLockSummary {...scope} weeks={[row]} />);
    expect(screen.getByText(new RegExp(expected))).toHaveAttribute("datetime", new Date(row.locksAtMs).toISOString());
    expect(screen.getByText(row.locksAtDisplay)).toBeVisible();
    expect(screen.queryByText(/baseline/i)).not.toBeInTheDocument();
  });

  it("selects the earliest deadline in this league and season and skips cancelled or finished weeks", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-28T23:00:00Z"));
    render(<RosterLockSummary {...scope} weeks={[monday,
      { ...opening, status: "cancelled", locksAtDisplay: "cancelled" },
      { ...opening, status: "final", locksAtDisplay: "finished" },
      { ...opening, leagueId: "league-b", locksAtDisplay: "other league" },
      { ...opening, seasonId: "season-b", locksAtDisplay: "other season" }, opening]} />);
    expect(screen.getByText(opening.locksAtDisplay)).toBeVisible();
    expect(screen.queryByText(/other league|other season|cancelled|finished/)).not.toBeInTheDocument();
  });

  it("advances at the exact deadline without a reload", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(opening.locksAtMs - 1_000));
    render(<RosterLockSummary {...scope} weeks={[opening, monday]} />);
    expect(screen.getByText(opening.locksAtDisplay)).toBeVisible();
    act(() => vi.advanceTimersByTime(1_000));
    expect(screen.queryByText(opening.locksAtDisplay)).not.toBeInTheDocument();
    expect(screen.getByText(monday.locksAtDisplay)).toBeVisible();
  });

  it("refreshes after a suspended tab regains focus", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(opening.locksAtMs - 1_000));
    render(<RosterLockSummary {...scope} weeks={[opening, monday]} />);
    vi.setSystemTime(new Date(opening.locksAtMs + 1));
    fireEvent.focus(window);
    expect(screen.getByText(monday.locksAtDisplay)).toBeVisible();
  });

  it("distinguishes loading, unavailable and no upcoming deadline without leaking stale data", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-28T23:00:00Z"));
    const retry = vi.fn();
    const { rerender } = render(<RosterLockSummary {...scope} pending />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading roster lock time");
    rerender(<RosterLockSummary {...scope} failed weeks={[opening]} onRetry={retry} />);
    expect(screen.queryByText(opening.locksAtDisplay)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
    rerender(<RosterLockSummary {...scope} weeks={[]} />);
    expect(screen.getByText("No upcoming roster lock is scheduled.")).toBeVisible();
  });

  it("labels an older API deadline explicitly as UTC instead of guessing a local offset", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-28T23:00:00Z"));
    render(<RosterLockSummary {...scope} weeks={[{ ...opening, locksAtDisplay: undefined }]} />);
    expect(screen.getByText(/11:00 PM UTC/)).toBeVisible();
  });
});
