import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../../shared/query/queryClient.js";
import { SessionContext } from "../session/sessionContext.js";
import { adminAnalyticsFixture, makeCalendarAnalytics, withPageDetail } from "../../test/adminAnalyticsFixture.js";
import { accountDirectoryFixture } from "../../test/accountDirectoryFixture.js";
import { AdminAnalyticsPage } from "./AdminAnalyticsPage.jsx";

beforeEach(() => vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-28T07:30:00Z")));
afterEach(() => vi.restoreAllMocks());

function page({ transform = data => data, calendarOptions = {} } = {}) {
  const request = vi.fn(async (path, options) => {
    const params = new URL(path, "https://example.test").searchParams;
    let data;
    if (path.startsWith("/api/v1/admin/account-directory")) data = accountDirectoryFixture();
    else if (params.has("week")) data = transform(makeCalendarAnalytics("week", params.get("week"), "2026-11-27", calendarOptions));
    else if (params.has("month")) data = transform(makeCalendarAnalytics("month", params.get("month"), "2026-11-27", calendarOptions));
    else data = adminAnalyticsFixture({ days: Number(params.get("days") || 28) });
    if (params.get("detail") === "pages") withPageDetail(data);
    options.validateData(data);
    return { data };
  });
  const session = { status: "authenticated", user: { id: "calendar-admin" }, httpClient: { request } };
  const client = createQueryClient();
  const view = render(<MemoryRouter><QueryClientProvider client={client}><SessionContext.Provider value={session}><AdminAnalyticsPage/></SessionContext.Provider></QueryClientProvider></MemoryRouter>);
  return { ...view, request, client, user: userEvent.setup() };
}
async function week(view, value) {
  await screen.findByText("Registered accounts");
  await view.user.click(screen.getByRole("button", { name: "Calendar week" }));
  await waitFor(() => expect(view.request).toHaveBeenCalledWith("/api/v1/admin/analytics?week=2026-11-23&detail=pages", expect.any(Object)));
  if (value) fireEvent.change(screen.getByLabelText("Week containing"), { target: { value } });
}
async function month(view, value) {
  await screen.findByText("Registered accounts");
  await view.user.click(screen.getByRole("button", { name: "Calendar month" }));
  await waitFor(() => expect(view.request).toHaveBeenCalledWith("/api/v1/admin/analytics?month=2026-11&detail=pages", expect.any(Object)));
  if (value) fireEvent.change(screen.getByLabelText("Month"), { target: { value } });
}
describe("Calendar analytics filters", () => {
  it("keeps recent ranges and normalizes any selected week date to Monday in UTC−8", async () => {
    const view = page();
    await week(view, "2026-11-18");
    await waitFor(() => expect(view.request).toHaveBeenLastCalledWith("/api/v1/admin/analytics?week=2026-11-16&detail=pages", expect.any(Object)));
    expect(await screen.findByText(/Week of Nov 16, 2026 – Nov 22, 2026/)).toBeInTheDocument();
    expect(screen.getByLabelText("Week containing")).toHaveAttribute("max", "2026-11-27");
    expect(screen.getByText("Created in the selected calendar week")).toBeInTheDocument();
    expect(screen.queryByText("Today is partial")).not.toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Recent days" }));
    expect(await screen.findByText("Created in the selected 28-day period")).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Last 90 days" }));
    await waitFor(() => expect(view.request).toHaveBeenLastCalledWith("/api/v1/admin/analytics?days=90&detail=pages", expect.any(Object)));
  });

  it("defaults calendar selection to today's fixed UTC−8 date and marks current periods to date", async () => {
    const view = page();
    await week(view);
    expect(screen.getByLabelText("Week containing")).toHaveValue("2026-11-27");
    expect(await screen.findByText(/Week to date through Nov 27, 2026/)).toBeInTheDocument();
    expect(screen.getByText("Created in the selected calendar week to date")).toBeInTheDocument();
    expect(screen.getByText("Today is partial")).toBeInTheDocument();
    expect(screen.getByText("Comparison available after this calendar week is complete and both periods are fully measured.")).toBeInTheDocument();
    await month(view);
    expect(await screen.findByText(/November 2026 · Month to date through Nov 27, 2026/)).toBeInTheDocument();
    expect(screen.getByLabelText("Month")).toHaveValue("2026-11");
    expect(screen.getByLabelText("Month")).toHaveAttribute("max", "2026-11");
  });

  it("requests full historical months and preserves registered-account totals", async () => {
    const view = page();
    await month(view, "2026-10");
    await waitFor(() => expect(view.request).toHaveBeenLastCalledWith("/api/v1/admin/analytics?month=2026-10&detail=pages", expect.any(Object)));
    expect(await screen.findByText(/October 2026 · daily totals in UTC−8/)).toBeInTheDocument();
    expect(screen.getByText("Created in the selected calendar month")).toBeInTheDocument();
    expect(screen.getByText("Registered accounts")).toBeInTheDocument();
    expect(screen.getByText("Activity was not measured in this period")).toBeInTheDocument();
    expect(screen.getByText(/Collection began on 2026-11-27, after this period/)).toBeInTheDocument();
    expect(screen.queryByText("Today is partial")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Daily page views" })).not.toBeInTheDocument();
    expect(screen.getByText(/Independent of the analytics date range/)).toBeInTheDocument();
  });

  it("does not submit empty or future calendar selections", async () => {
    const view = page();
    await week(view);
    await screen.findByText(/Week to date through/);
    const count = view.request.mock.calls.length;
    fireEvent.change(screen.getByLabelText("Week containing"), { target: { value: "" } });
    expect(screen.getByText("Choose a valid calendar period")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh totals" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Week containing"), { target: { value: "2026-11-28" } });
    expect(view.request).toHaveBeenCalledTimes(count);
    await view.user.click(screen.getByRole("button", { name: "Calendar month" }));
    await screen.findByText(/November 2026 · Month to date/);
    const afterMonth = view.request.mock.calls.length;
    fireEvent.change(screen.getByLabelText("Month"), { target: { value: "" } });
    expect(screen.getByText("Choose a valid calendar period")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Month"), { target: { value: "2026-12" } });
    expect(view.request).toHaveBeenCalledTimes(afterMonth);
  });

  it("masks days before collection and marks the first collected day partial", async () => {
    const view = page();
    await month(view);
    await screen.findByText(/November 2026 · Month to date/);
    await view.user.click(screen.getByText("View daily totals"));
    const table = within(screen.getByRole("region", { name: "Daily analytics totals" }));
    const earlier = within(table.getByRole("row", { name: /2026-11-01\s*Not measured — —/ }));
    expect(earlier.getAllByText("—")).toHaveLength(2);
    expect(table.getByText("Partial first day")).toBeInTheDocument();
    expect(view.container.querySelector('[title="2026-11-01: not measured"]')).not.toBeNull();
  });

  it("marks the retention edge without falsely labeling it a partial first day", async () => {
    const view = page({ calendarOptions: { startedOn: "2020-01-01" } });
    await month(view, "2025-11");
    await screen.findByText(/Earlier days in this range are outside retained activity history/);
    await view.user.click(screen.getByText("View daily totals"));
    const table = within(screen.getByRole("region", { name: "Daily analytics totals" }));
    expect(table.getAllByText("Not retained")).toHaveLength(27);
    expect(table.queryByText("Partial first day")).not.toBeInTheDocument();
    expect(within(table.getByRole("row", { name: /^2025-11-28/ })).queryByText("—")).not.toBeInTheDocument();
  });

  it("explains a historical period outside retained history without showing usage zeroes", async () => {
    const view = page({ calendarOptions: { startedOn: "2020-01-01" } });
    await month(view, "2025-10");
    expect(await screen.findByText("Activity is outside retained history")).toBeInTheDocument();
    expect(screen.getByText(/Activity history is retained for 365 days/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Daily page views" })).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });

  it("compares fully measured complete months using clearly labeled calendar totals", async () => {
    const view = page({ calendarOptions: { startedOn: "2026-01-01" } });
    await month(view, "2026-10");
    expect(await screen.findByText(/% vs. the previous calendar month; total page views, with different month lengths/)).toBeInTheDocument();
    expect(screen.getByText("Historical period")).toBeInTheDocument();
    expect(screen.queryByText("Today is partial")).not.toBeInTheDocument();
  });

  it("withholds comparison when collection began on the previous period's first day", async () => {
    const view = page({ calendarOptions: { startedOn: "2026-09-01" } });
    await month(view, "2026-10");
    expect(await screen.findByText("Comparison unavailable: both calendar periods must be fully measured and retained.")).toBeInTheDocument();
    expect(screen.queryByText(/% vs./)).not.toBeInTheDocument();
  });

  it("keeps expanded measurements unknown independently of base usage and current freshness", async () => {
    const view = page({ calendarOptions: { startedOn: "2026-01-01", expandedStartedOn: "2026-11-27" } });
    await month(view, "2026-10");
    expect(await screen.findByRole("heading", { name: "Daily page views" })).toBeInTheDocument();
    expect(screen.getByText("Feature actions were not measured in this period")).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Experience" }));
    expect(screen.getByText("Outcomes were not measured in this period")).toBeInTheDocument();
    expect(screen.getAllByText("Not measured")).toHaveLength(3);
    expect(screen.queryByText("0 samples")).not.toBeInTheDocument();
    expect(screen.getByText("Current snapshot")).toBeInTheDocument();
    expect(screen.getByText(/processing backlog are current snapshots, not historical states/)).toBeInTheDocument();
  });

  it("never adds calendar parameters to the independent account-directory request", async () => {
    const view = page();
    await month(view, "2026-10");
    await screen.findByText(/October 2026 · daily totals/);
    await view.user.click(screen.getByRole("button", { name: "Account directory" }));
    await screen.findByText("alex.morgan@example.test");
    expect(view.request).toHaveBeenLastCalledWith("/api/v1/admin/account-directory?limit=50&offset=0&sort=username&direction=asc", expect.any(Object));
  });
});
