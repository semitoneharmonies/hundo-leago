import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../shared/api/ApiError.js";
import { StatisticsRefreshPanel } from "./StatisticsRefreshPanel.jsx";

const data = { jobId: "11111111-1111-4111-8111-111111111111", status: "succeeded", playerCount: 2686, capturedAtMs: 1789167600000 };

describe("administrator statistics panel", () => {
  it("stays read-only on mount and blocks repeated clicks until a confirmed result", async () => {
    let finish;
    const request = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    render(<StatisticsRefreshPanel httpClient={{ request }} />);
    expect(request).not.toHaveBeenCalled();
    const button = screen.getByRole("button", { name: "Refresh now" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(request).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Updating NHL statistics…" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Keep this page open");
    await act(async () => finish({ data }));
    expect(screen.getByRole("status")).toHaveTextContent("NHL statistics updated for 2,686 players.");
    expect(screen.getByRole("button", { name: "Refresh now" })).toBeEnabled();
    expect(document.querySelector("time")).toHaveAttribute("datetime", new Date(data.capturedAtMs).toISOString());
    expect(screen.queryByText(data.jobId)).not.toBeInTheDocument();
  });

  it.each([
    ["STATISTICS_OPERATION_DISABLED", 503, "have not been enabled yet"],
    ["PLATFORM_ADMINISTRATOR_REQUIRED", 403, "Only a platform administrator"],
    ["STATISTICS_OPERATION_IN_PROGRESS", 409, "already running"],
    ["STATISTICS_OPERATION_FAILED", 503, "last successful results remain available"],
    ["SESSION_EXPIRED", 401, "Your session has ended"],
    ["CSRF_INVALID", 403, "Reload the page"],
    ["RATE_LIMITED", 429, "Wait a few minutes"],
    ["NETWORK_ERROR", null, "could not confirm whether the refresh finished"],
    ["REQUEST_ABORTED", null, "It may still be running"],
    ["APPLICATION_DATA_INVALID", 200, "could not confirm"],
    ["HTTP_REQUEST_FAILED", 502, "could not confirm"],
  ])("explains %s without exposing raw diagnostics or retrying", async (code, status, message) => {
    const request = vi.fn().mockRejectedValue(new ApiError({ code, status, message: "PRIVATE_DIAGNOSTIC" }));
    render(<StatisticsRefreshPanel httpClient={{ request }} />);
    await userEvent.click(screen.getByRole("button", { name: "Refresh now" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByText(/PRIVATE_DIAGNOSTIC/)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).not.toHaveTextContent("NHL statistics updated");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("clears old success when a later explicit refresh fails", async () => {
    const request = vi.fn().mockResolvedValueOnce({ data }).mockRejectedValueOnce(new Error("lost connection"));
    render(<StatisticsRefreshPanel httpClient={{ request }} />);
    await userEvent.click(screen.getByRole("button", { name: "Refresh now" }));
    expect(screen.getByRole("status")).toHaveTextContent("NHL statistics updated");
    await userEvent.click(screen.getByRole("button", { name: "Refresh now" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not confirm");
    expect(screen.getByRole("status")).not.toHaveTextContent("NHL statistics updated");
    expect(request).toHaveBeenCalledTimes(2);
  });
});
