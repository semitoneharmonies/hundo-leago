import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KittyPaymentFlag } from "./KittyPaymentFlag.jsx";
import { KITTY_PAYMENT_MESSAGES, kittyReminderForDate } from "./kittyPaymentReminder.js";

const flag = () => screen.queryByRole("complementary", { name: "League kitty payment reminder" });
const advance = (ms) => act(() => vi.advanceTimersByTime(ms));
let account = 0;
let userId;

beforeEach(() => {
  userId = `kitty-timer-${++account}`;
  window.localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 22, 10));
});
afterEach(() => vi.useRealTimers());

describe("daily 15-second kitty flag", () => {
  it("preserves all ten messages and rotates by local date", () => {
    const messages = Array.from({ length: 11 }, (_, day) => kittyReminderForDate(new Date(2026, 9, 22 + day, 12)).message);
    expect(new Set(messages.slice(0, 10)).size).toBe(10);
    expect(messages[10]).toBe(messages[0]);
    expect(new Set(messages)).toEqual(new Set(KITTY_PAYMENT_MESSAGES));
    expect(kittyReminderForDate(new Date(2026, 9, 22, 23, 59)).day).toBe("2026-10-22");
    expect(kittyReminderForDate(new Date(2026, 9, 23, 0)).day).toBe("2026-10-23");
  });

  it("stays for a full 15 seconds through clicks, StrictMode and route remounts", () => {
    const view = (path) => <StrictMode><KittyPaymentFlag key={`${userId}:${path}`} userId={userId} /></StrictMode>;
    const { rerender } = render(view("/dashboard"));
    expect(flag()).toBeVisible();
    expect(screen.queryByRole("button", { name: /Dismiss payment/ })).not.toBeInTheDocument();
    fireEvent.click(flag());
    advance(5_000);
    rerender(view("/players"));
    expect(flag()).toBeVisible();
    advance(5_000);
    rerender(view("/dashboard"));
    expect(flag()).toBeVisible();
    advance(4_999);
    expect(flag()).toBeVisible();
    advance(1);
    expect(flag()).not.toBeInTheDocument();
    rerender(view("/players"));
    fireEvent.focus(window);
    expect(flag()).not.toBeInTheDocument();
  });

  it("resumes only the remaining time from a saved deadline", () => {
    window.localStorage.setItem(`hundo:kitty-payment:display-v2:${userId}`, JSON.stringify({day:"2026-10-22", expiresAtMs:Date.now()+5_000}));
    render(<KittyPaymentFlag userId={userId} />);
    advance(4_999);
    expect(flag()).toBeVisible();
    advance(1);
    expect(flag()).not.toBeInTheDocument();
  });

  it("stays hidden after an earlier display and separates accounts", () => {
    window.localStorage.setItem(`hundo:kitty-payment:display-v2:${userId}`, JSON.stringify({day:"2026-10-22", expiresAtMs:Date.now()-1}));
    const { rerender } = render(<KittyPaymentFlag key={userId} userId={userId} />);
    expect(flag()).not.toBeInTheDocument();
    rerender(<KittyPaymentFlag key="other" userId={`${userId}-other`} />);
    expect(flag()).toBeVisible();
  });

  it("gives a previously cut-short legacy reminder one full display", () => {
    window.localStorage.setItem(`hundo:kitty-payment:last-seen:${userId}`, "2026-10-22");
    const { unmount } = render(<KittyPaymentFlag userId={userId} />);
    advance(14_999);
    expect(flag()).toBeVisible();
    advance(1);
    unmount();
    render(<KittyPaymentFlag userId={userId} />);
    expect(flag()).not.toBeInTheDocument();
    expect(window.localStorage.getItem(`hundo:kitty-payment:last-seen:${userId}`)).toBe("2026-10-22");
  });

  it("does not extend the deadline on focus and returns once on a new day", () => {
    render(<KittyPaymentFlag userId={userId} />);
    const message=flag().textContent;
    advance(10_000);
    fireEvent.focus(window);
    advance(5_000);
    expect(flag()).not.toBeInTheDocument();
    act(() => vi.setSystemTime(new Date(2026, 9, 23, 9)));
    fireEvent.focus(window);
    expect(flag()).toBeVisible();
    expect(flag().textContent).not.toBe(message);
    fireEvent(document, new Event("visibilitychange"));
    advance(15_000);
    expect(flag()).not.toBeInTheDocument();
  });

  it("waits until a hidden tab returns before starting the next day's timer", () => {
    render(<KittyPaymentFlag userId={userId} />);
    advance(15_000);
    act(() => vi.setSystemTime(new Date(2026, 9, 23, 9)));
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    expect(flag()).not.toBeInTheDocument();
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    expect(flag()).toBeVisible();
    advance(15_000);
    expect(flag()).not.toBeInTheDocument();
  });

  it("retains the timer across navigation when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
    const { rerender } = render(<KittyPaymentFlag key="first" userId={userId} />);
    advance(10_000);
    rerender(<KittyPaymentFlag key="second" userId={userId} />);
    expect(flag()).toBeVisible();
    advance(5_000);
    expect(flag()).not.toBeInTheDocument();
    rerender(<KittyPaymentFlag key="third" userId={userId} />);
    expect(flag()).not.toBeInTheDocument();
  });
});
