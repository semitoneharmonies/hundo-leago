import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../../shared/query/queryClient.js";
import { SessionContext } from "../session/sessionContext.js";
import { adminAnalyticsFixture, withPageDetail } from "../../test/adminAnalyticsFixture.js";
import { AdminAnalyticsPage } from "./AdminAnalyticsPage.jsx";
import { Freshness } from "./AnalyticsExpandedPanels.jsx";
import { validateAdminAnalytics } from "./analyticsContracts.js";
import { adminAnalyticsQuery } from "./analyticsQueries.js";

function renderPage({ status = "authenticated", fixture = {}, failure = null, pending = false, transform = (data) => data } = {}) {
  const request = vi.fn(async (path, options) => {
    if (pending) return new Promise(() => {});
    if (failure) throw failure;
    const days = Number(new URL(path, "https://example.test").searchParams.get("days"));
    const data = withPageDetail(transform(adminAnalyticsFixture({ days, ...fixture })));
    options.validateData(data);
    return { data };
  });
  const queryClient = createQueryClient();
  const session = { status, user: status === "authenticated" ? { id: "admin-fixture" } : null, httpClient: { request } };
  const view = render(<MemoryRouter><QueryClientProvider client={queryClient}><SessionContext.Provider value={session}><AdminAnalyticsPage /></SessionContext.Provider></QueryClientProvider></MemoryRouter>);
  return { ...view, request, queryClient, user: userEvent.setup() };
}

describe("Admin analytics page", () => {
  it("shows only aggregate usage, product shares and separate account totals", async () => {
    const view = renderPage();
    expect(await screen.findByText("Registered accounts")).toBeInTheDocument();
    expect(screen.getByText("46")).toBeInTheDocument();
    expect(screen.getAllByText("60%")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Leago & Daily" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Daily page views from/ })).toBeInTheDocument();
    expect(screen.getByText(/not unique people or visits/)).toBeInTheDocument();
    expect(screen.queryByText("admin-fixture")).not.toBeInTheDocument();
    expect(view.request).toHaveBeenCalledExactlyOnceWith("/api/v1/admin/analytics?days=28&detail=pages", expect.objectContaining({ authenticated: true, signal: expect.any(AbortSignal) }));
    const query = view.queryClient.getQueryCache().find({ queryKey: ["admin", "analytics", 28, "pages"] });
    expect(query.meta.private).toBe(true);
    expect(view.request.mock.calls[0][1].method).toBeUndefined();
  });

  it("changes periods and exposes exact daily values through an accessible table", async () => {
    const view = renderPage();
    await screen.findByText("Registered accounts");
    await view.user.click(screen.getByRole("button", { name: "Last 7 days" }));
    await screen.findByText(/Created in the selected 7-day period/);
    expect(view.request).toHaveBeenLastCalledWith("/api/v1/admin/analytics?days=7&detail=pages", expect.any(Object));
    await view.user.click(screen.getByText("View daily totals"));
    const daily = within(screen.getByRole("region", { name: "Daily analytics totals" }));
    expect(daily.getAllByRole("row")).toHaveLength(8);
    expect(daily.getByRole("rowheader", { name: "2026-11-27" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last 7 days" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps unmeasured history distinct from zero usage while showing account totals", async () => {
    renderPage({ fixture: { coverage: "not_started" } });
    expect(await screen.findByRole("heading", { name: "Activity measurement has not started" })).toBeInTheDocument();
    expect(screen.getByText("46")).toBeInTheDocument();
    for (const label of ["Page views", "Active minutes · estimated", "Minutes per page view", "Reported installations"]) {
      expect(within(screen.getByText(label, { selector: "span" }).parentElement.parentElement).getByText("—")).toBeInTheDocument();
    }
    expect(screen.queryByRole("heading", { name: "Daily page views" })).not.toBeInTheDocument();
  });

  it("does not imply growth when the earlier period was not measured", async () => {
    renderPage({ fixture: { coverage: "partial", startedOn: "2026-11-20" } });
    expect(await screen.findByText(/Partial measurement:/)).toBeInTheDocument();
    expect(screen.getByText("Comparison available after a full earlier period is measured.")).toBeInTheDocument();
    expect(screen.getAllByText("Not measured").length).toBeGreaterThan(0);
    expect(screen.getByText("Partial first day")).toBeInTheDocument();
  });

  it("withholds a percentage comparison when measurement began on the earlier period's first day", async () => {
    renderPage({ fixture: { startedOn: "2026-10-03" } });
    expect(await screen.findByText("Comparison available after a full earlier period is measured.")).toBeInTheDocument();
    expect(screen.queryByText(/% vs\. the previous/)).not.toBeInTheDocument();
  });

  it("denies managers without exposing analytics data", async () => {
    renderPage({ failure: { status: 403, code: "PLATFORM_ADMINISTRATOR_REQUIRED" } });
    expect(await screen.findByRole("heading", { name: "Administrator access required" })).toBeInTheDocument();
    expect(screen.queryByText("Registered accounts")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Last 28 days" })).not.toBeInTheDocument();
  });

  it("shows unavailable totals on failure, rather than fabricated zeroes, and can retry", async () => {
    const view = renderPage({ failure: { status: 503, code: "ANALYTICS_UNAVAILABLE" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Usage totals are unavailable, rather than zero.");
    expect(screen.queryByText("Registered accounts")).not.toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Refresh totals" }));
    await waitFor(() => expect(view.request).toHaveBeenCalledTimes(2));
  });

  it.each(["unknown", "unauthenticated"])("does not request private analytics for a %s session", (status) => {
    const view = renderPage({ status });
    expect(view.request).not.toHaveBeenCalled();
    expect(screen.queryByText("Registered accounts")).not.toBeInTheDocument();
    if (status === "unauthenticated") expect(screen.getByRole("link", { name: /Sign in with/ })).toHaveAttribute("href", "/");
  });

  it("shows a loading state while totals are pending", () => {
    renderPage({ pending: true });
    expect(screen.getByRole("status")).toHaveTextContent("Loading aggregate analytics");
  });
});

describe("aggregate analytics response contract", () => {
  it.each([7, 28, 90])("accepts the %i-day aggregate response", (days) => {
    expect(validateAdminAnalytics(adminAnalyticsFixture({ days }), days)).toBe(true);
  });
  it.each([
    (data) => { data.users = [{ id: "should-not-be-here" }]; },
    (data) => { data.pages[0].userId = "should-not-be-here"; },
    (data) => { data.pages[0].category = "/rooms/private-id"; },
    (data) => { data.products[0].pageViews = -1; },
    (data) => { data.daily[1].date = data.daily[0].date; },
    (data) => { data.totals.activeSeconds += 1; },
    (data) => { data.period.previousEndDate = data.period.startDate; },
  ])("rejects identity-bearing, malformed or inconsistent responses", (mutate) => {
    const data = adminAnalyticsFixture();
    mutate(data);
    expect(() => validateAdminAnalytics(data, 28)).toThrow();
  });
  it("rejects mismatched or unsupported requested periods", () => {
    expect(() => validateAdminAnalytics(adminAnalyticsFixture({ days: 7 }), 28)).toThrow();
    expect(() => adminAnalyticsQuery({}, 30)).toThrow();
  });
});
describe("expanded aggregate dashboard", () => {
  it("shows active minutes per page view and recorded feature action rankings", async () => {
    renderPage();
    expect(await screen.findByText("Minutes per page view")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recorded feature actions" })).toBeInTheDocument();
    expect(screen.getByText("Filter changes and search submissions")).toBeInTheDocument();
    expect(screen.getByText(/No search terms, player selections, or message content/)).toBeInTheDocument();
  });

  it("separates current room cohorts from prospective lifecycle events and weekly gameplay", async () => {
    const view = renderPage();
    await screen.findByText("Registered accounts");
    await view.user.click(screen.getByRole("button", { name: "Gameplay" }));
    expect(screen.getByRole("heading", { name: "Room fill & completion" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Scheduled rooms" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Practice rooms" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Room lifecycle events" })).toHaveTextContent("80%");
    expect(screen.getByRole("region", { name: "Weekly aggregate gameplay" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Weekly activity totals stacked/ })).toBeInTheDocument();
    expect(screen.getByText(/do not form a conversion rate/)).toBeInTheDocument();
    expect(screen.getByText(/current snapshot of rooms whose play dates/)).toBeInTheDocument();
  });

  it("labels installation and launch events without implying unique devices", async () => {
    const view = renderPage();
    await screen.findByText("Registered accounts");
    await view.user.click(screen.getByRole("button", { name: "Experience" }));
    const panel = within(screen.getByRole("region", { name: "Experience analytics" }));
    expect(panel.getByRole("heading", { name: "Installations and openings" })).toBeInTheDocument();
    expect(panel.getByText("Installed-app openings")).toBeInTheDocument();
    expect(panel.getByText("Launch layout")).toBeInTheDocument();
    expect(panel.getByText(/event counts, not unique installs or devices/)).toBeInTheDocument();
    expect(panel.getByText(/Some iPhone and iPad installations do not report/)).toBeInTheDocument();
    expect(panel.getByText("42% of recorded openings")).toBeInTheDocument();
  });

  it("shows actual outcome ratios and first-document performance buckets", async () => {
    const view = renderPage();
    await screen.findByText("Registered accounts");
    await view.user.click(screen.getByRole("button", { name: "Experience" }));
    const outcomes = within(screen.getByRole("region", { name: "Aggregate action outcomes" }));
    expect(outcomes.getByText("88.6%")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Browser performance samples" })).toBeInTheDocument();
    expect(screen.getByText(/first reported rating per document, not per route/)).toBeInTheDocument();
    expect(screen.getByText(/not percentile scores/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Statistics & injury freshness" })).toBeInTheDocument();
  });

  it("shows no samples and undefined success rates when supporting reports are absent", async () => {
    const view = renderPage({ transform: (data) => {
      data.metrics.forEach((row) => { if (row.metric.startsWith("vital.") || row.metric.startsWith("action.")) row.count = 0; });
      return data;
    } });
    await screen.findByText("Registered accounts");
    await view.user.click(screen.getByRole("button", { name: "Experience" }));
    expect(screen.getAllByText("No supported browser samples yet.")).toHaveLength(3);
    const outcomes = within(screen.getByRole("region", { name: "Aggregate action outcomes" }));
    expect(outcomes.getAllByText("—")).toHaveLength(4);
    expect(outcomes.queryByText("100%")).not.toBeInTheDocument();
  });

  it("shows suppressed time cells and keeps a seven-day period unavailable", async () => {
    const view = renderPage();
    await screen.findByText("Registered accounts");
    await view.user.click(screen.getByRole("button", { name: "Timing & context" }));
    const heatmap = within(screen.getByRole("region", { name: "Page views by weekday and six-hour block" }));
    expect(heatmap.getByText("<5")).toBeInTheDocument();
    expect(heatmap.getAllByRole("row")).toHaveLength(8);
    await view.user.click(screen.getByRole("button", { name: "Last 7 days" }));
    expect(await screen.findByRole("heading", { name: "More activity is needed" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Page views by weekday and six-hour block" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Timing & context" })).toHaveAttribute("aria-pressed", "true");
  });

  it("distinguishes unknown NHL evidence and build observation dates", async () => {
    const view = renderPage();
    await screen.findByText("Registered accounts");
    await view.user.click(screen.getByRole("button", { name: "Timing & context" }));
    expect(screen.getAllByText("Unknown").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Server builds first observed" })).toBeInTheDocument();
    expect(screen.getByText(/not its deployment time/)).toBeInTheDocument();
    expect(screen.getByText("hundo-analytics-example-build")).toBeInTheDocument();
  });

  it("keeps operational source failures separate from zero or otherwise available analytics", async () => {
    const view = renderPage({ fixture: { sourcesUnavailable: true } });
    expect(await screen.findByText("Registered accounts")).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Gameplay" }));
    expect(screen.getByRole("heading", { name: "Room information is unavailable" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gameplay information is unavailable" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Weekly aggregate gameplay" })).not.toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Experience" }));
    expect(screen.getByRole("heading", { name: "Update information is unavailable" })).toBeInTheDocument();
  });

  it("keeps missing Daily facts unavailable while Leago gameplay stays readable", async () => {
    const view = renderPage({ transform: (data) => {
      data.operations.gameplay.totals.dailyDrafts = null;
      data.operations.gameplay.weekly.forEach((row) => { row.dailyDrafts = null; });
      data.operations.calendar.days.forEach((row) => { row.dailyDrafts = null; });
      data.operations.freshness.dailyScoringPending = null;
      return data;
    } });
    await screen.findByText("Registered accounts");
    await view.user.click(screen.getByRole("button", { name: "Gameplay" }));
    const gameplay = within(screen.getByRole("region", { name: "Weekly aggregate gameplay" }));
    expect(gameplay.getAllByText("Unavailable").length).toBeGreaterThan(0);
    await view.user.click(screen.getByRole("button", { name: "Experience" }));
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });

  it("shows existing gameplay even before the additional browser/event counters start", async () => {
    const view = renderPage({ fixture: { expandedCoverage: "not_started" } });
    await screen.findByText("Registered accounts");
    await view.user.click(screen.getByRole("button", { name: "Gameplay" }));
    expect(screen.getByRole("heading", { name: "Room fill & completion" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Room event measurement has not started" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Weekly aggregate gameplay" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Weekly activity totals stacked/ })).toBeInTheDocument();
  });
});

describe("expanded aggregate contract boundaries", () => {
  it("accepts independently unavailable sources and different builds first observed on one date", () => {
    const data = adminAnalyticsFixture({ sourcesUnavailable: true });
    data.releases.push({ date: data.releases[0].date, buildId: "second-example-build" });
    expect(validateAdminAnalytics(data, 28)).toBe(true);
  });

  it.each([
    (data) => { data.metrics[0].userId = "forbidden"; },
    (data) => { data.metrics[0].metric = "user.specific.account"; },
    (data) => { data.timeBlocks[0].ip = "127.0.0.1"; },
    (data) => { data.peakUsage.suppressionThreshold = 1; },
    (data) => { data.timeBlocks[0] = { ...data.timeBlocks[0], suppressed: false, pageViews: 1, activeSeconds: 30 }; },
    (data) => { data.operations.dailyRooms.modes[0].roomId = "forbidden"; },
    (data) => { data.operations.gameplay.weekly[0].completedTrades += 1; },
    (data) => { data.operations.freshness.statistics.lastSuccessAtMs = "yesterday"; },
    (data) => { data.operations.calendar.days[0].leagueId = "forbidden"; },
    (data) => { data.releases.push({ ...data.releases[0], date: data.period.endDate }); },
  ])("rejects identifier-bearing or inconsistent expanded metrics", (mutate) => {
    const data = adminAnalyticsFixture();
    mutate(data);
    expect(() => validateAdminAnalytics(data, 28)).toThrow();
  });
});
describe("analytics operational visuals", () => {
  it("shows rounded update ages fixed to the report refresh", () => {
    const data = adminAnalyticsFixture();
    const asOfMs = Date.parse("2026-11-27T15:10:00Z");
    render(<Freshness data={data} asOfMs={asOfMs} />);
    expect(screen.getByText("About 3 hours ago")).toBeInTheDocument();
    expect(screen.getByText("About 6 hours ago")).toBeInTheDocument();
    expect(screen.getByText(/Update ages are rounded as of this refresh:/)).toBeInTheDocument();
  });
  it("does not fabricate a freshness age when no update exists or the source clock is ahead", () => {
    const data = adminAnalyticsFixture();
    data.operations.freshness.statistics.lastSuccessAtMs = null;
    data.operations.freshness.injuries.lastSuccessAtMs = Date.parse("2026-11-28T00:00:00Z");
    render(<Freshness data={data} asOfMs={Date.parse("2026-11-27T15:10:00Z")} />);
    expect(screen.getByText("Age unavailable")).toBeInTheDocument();
    expect(screen.getByText("Timestamp is ahead of this refresh")).toBeInTheDocument();
  });
});
