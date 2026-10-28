import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { clearPrivateQueries } from "../../shared/query/queryClient.js";
import { activityQuery, transactionKeys } from "../transactions/transactionQueries.js";
import { dashboardActivityQuery, prefetchDashboardQueries, prefetchDashboardTeams } from "./dashboardQueries.js";

const league = {
  id: "11111111-1111-4111-8111-111111111111",
  currentSeason: { id: "22222222-2222-4222-8222-222222222222" },
  membership: { status: "active" },
};
function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
}
function response(path) {
  if (path.includes("/auctions?")) return { data: [], actions: { startTeams: [] }, page: { hasMore: false, nextCursor: null, limit: 3 } };
  return { data: { week: null, rows: [], proposals: [], activity: [] } };
}

describe("dashboard load ahead", () => {
  it("starts all team panels together only within an authorized active season", async () => {
    const queryClient = client();
    const pending = [];
    const httpClient = { request: vi.fn(() => new Promise((resolve) => pending.push(resolve))) };
    const teams = [{ id: "team-one" }, { id: "team-two" }];
    await prefetchDashboardTeams(queryClient, httpClient, null, teams);
    await prefetchDashboardTeams(queryClient, httpClient, { ...league, currentSeason: null }, teams);
    await prefetchDashboardTeams(queryClient, httpClient, { ...league, membership: { status: "ended" } }, teams);
    expect(httpClient.request).not.toHaveBeenCalled();
    const first = prefetchDashboardTeams(queryClient, httpClient, league, teams);
    const repeated = prefetchDashboardTeams(queryClient, httpClient, league, teams);
    expect(httpClient.request.mock.calls.map(([path]) => path)).toEqual(teams.map(({ id }) => `/api/v1/leagues/${league.id}/teams/${id}/roster`));
    expect(httpClient.request.mock.calls.every(([, options]) => options.authenticated && options.signal && !options.method)).toBe(true);
    pending.forEach((resolve) => resolve({ data: {} }));
    await Promise.all([first, repeated]);
    queryClient.clear();
  });

  it("starts independent requests together and reuses them for repeated loads", async () => {
    const queryClient = client();
    const pending = [];
    const httpClient = { request: vi.fn((path) => new Promise((resolve) => pending.push(() => resolve(response(path))))) };
    const loading = prefetchDashboardQueries(queryClient, httpClient, league);
    const joining = prefetchDashboardQueries(queryClient, httpClient, league);
    expect(httpClient.request).toHaveBeenCalledTimes(5);
    expect(httpClient.request.mock.calls.some(([path]) => path.endsWith("/activity?limit=5&category=all"))).toBe(true);
    expect(httpClient.request.mock.calls.every(([, options]) => options.authenticated && options.signal && !options.method)).toBe(true);
    pending.forEach((resolve) => resolve());
    await Promise.all([loading, joining]);
    await prefetchDashboardQueries(queryClient, httpClient, league);
    expect(httpClient.request).toHaveBeenCalledTimes(5);
    queryClient.clear();
  });

  it("does not load without an active membership and season, and isolates leagues", async () => {
    const queryClient = client();
    const httpClient = { request: vi.fn(async (path) => response(path)) };
    await prefetchDashboardQueries(queryClient, httpClient, null);
    await prefetchDashboardQueries(queryClient, httpClient, { ...league, currentSeason: null });
    await prefetchDashboardQueries(queryClient, httpClient, { ...league, membership: { status: "ended" } });
    expect(httpClient.request).not.toHaveBeenCalled();
    await prefetchDashboardQueries(queryClient, httpClient, league);
    await prefetchDashboardQueries(queryClient, httpClient, { ...league, id: "33333333-3333-4333-8333-333333333333" });
    expect(queryClient.getQueryCache().getAll()).toHaveLength(10);
    expect(queryClient.getQueryCache().getAll().every((query) => query.meta.private && query.meta.leagueId === query.queryKey[1])).toBe(true);
    await clearPrivateQueries(queryClient);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("cancels in-flight private reads when the session is cleared", async () => {
    const queryClient = client();
    const signals = [];
    const httpClient = { request: vi.fn((path, { signal }) => new Promise((resolve, reject) => {
      signals.push(signal);
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })) };
    const loading = prefetchDashboardQueries(queryClient, httpClient, league);
    await clearPrivateQueries(queryClient);
    await loading;
    expect(signals).toHaveLength(5);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("keeps five-entry summaries separate from the full activity page cache", async () => {
    const queryClient = client();
    const httpClient = { request: vi.fn(async (path) => response(path)) };
    const summary = dashboardActivityQuery(httpClient, league.id);
    const full = activityQuery(httpClient, league.id);
    expect(full.queryKey).toEqual(transactionKeys.activity(league.id));
    expect(summary.queryKey).not.toEqual(full.queryKey);
    await queryClient.fetchQuery(summary);
    await queryClient.fetchQuery(full);
    expect(httpClient.request.mock.calls.map(([path]) => path)).toEqual([
      `/api/v1/leagues/${league.id}/activity?limit=5&category=all`,
      `/api/v1/leagues/${league.id}/activity?limit=25&category=all`,
    ]);
    queryClient.clear();
  });
});
