import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDailyOpeningRefresh } from "./useDailyOpeningRefresh.js";

vi.mock("./dailyApi.js", () => ({ dailyNow: () => Date.now() }));
afterEach(() => vi.useRealTimers());

describe("Daily opening refresh", () => {
  it("refreshes at opening instead of waiting for polling, and cancels a changed schedule", async () => {
    vi.useFakeTimers();
    const at = delay => new Date(Date.now() + delay).toISOString();
    const refetch = vi.fn();
    const hook = renderHook(({ deadline }) => useDailyOpeningRefresh(deadline, refetch), { initialProps: { deadline: at(1000) } });
    hook.rerender({ deadline: at(2000) });
    await act(() => vi.advanceTimersByTimeAsync(1100));
    expect(refetch).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(refetch).toHaveBeenCalledOnce();
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(refetch).toHaveBeenCalledOnce();
    hook.rerender({ deadline: at(1000) });
    hook.unmount();
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(refetch).toHaveBeenCalledOnce();
  });
  it("refreshes an already-due waiting snapshot once and ignores absent deadlines", () => {
    const refetch = vi.fn();
    const hook = renderHook(({ deadline }) => useDailyOpeningRefresh(deadline, refetch), { initialProps: { deadline: null } });
    expect(refetch).not.toHaveBeenCalled();
    hook.rerender({ deadline: new Date(Date.now() - 1000).toISOString() });
    expect(refetch).toHaveBeenCalledOnce();
    hook.unmount();
  });
});
