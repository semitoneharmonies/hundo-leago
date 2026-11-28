import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext } from "../../src/features/session/sessionContext.js";
import { AdminAnalyticsPage } from "../../src/features/analytics/AdminAnalyticsPage.jsx";
import { adminAnalyticsFixture, makeCalendarAnalytics, withPageDetail } from "../../src/test/adminAnalyticsFixture.js";
import { analyticsHealthFixture } from "../../src/test/analyticsHealthFixture.js";
import { accountDirectoryFixture } from "../../src/test/accountDirectoryFixture.js";
import { createHttpClient } from "../../src/shared/api/httpClient.js";
import "../../src/index.css";

const scenario = new URLSearchParams(location.search).get("scenario") || "full";
const client = createHttpClient({ apiOrigin: location.origin, fetchImpl: async (url) => {
  const parsed = new URL(url);
  const days = Number(parsed.searchParams.get("days") || 28);
  if (parsed.pathname === "/api/v1/admin/analytics/health") {
    const kind = parsed.searchParams.has("week") ? "week" : parsed.searchParams.has("month") ? "month" : null;
    const report = kind ? makeCalendarAnalytics(kind, parsed.searchParams.get(kind)) : adminAnalyticsFixture({ days });
    const group = parsed.searchParams.get("group");
    const totals = {failed_jobs:1,pending_jobs:2,running_jobs:1,daily_scoring_pending:2,matchups_awaiting_data:0,failed_statistics:1,failed_injuries:0};
    const data = analyticsHealthFixture({group,period:report.period,total:totals[group]});
    return new Response(JSON.stringify({ data, meta:{requestId:"local-health-preview"} }),{headers:{"Content-Type":"application/json"}});
  }
  if (parsed.pathname === "/api/v1/admin/account-directory") {
    if (scenario === "directory-denied" || scenario === "directory-failure") {
      const denied = scenario === "directory-denied";
      return new Response(JSON.stringify({ error: { code: denied ? "PLATFORM_ADMINISTRATOR_REQUIRED" : "ACCOUNT_DIRECTORY_UNAVAILABLE", message: denied ? "Administrator access required." : "The account directory could not be loaded.", requestId: "local-directory-preview" } }), { status: denied ? 403 : 503, headers: { "Content-Type": "application/json" } });
    }
    const data = accountDirectoryFixture({ offset: Number(parsed.searchParams.get("offset") || 0), sort: parsed.searchParams.get("sort") || "username", direction: parsed.searchParams.get("direction") || "asc", ...(scenario === "directory-empty" ? { total: 0 } : {}) });
    return new Response(JSON.stringify({ data, meta: { requestId: "local-directory-preview" } }), { headers: { "Content-Type": "application/json" } });
  }
  if (scenario === "denied" || scenario === "failure") {
    return new Response(JSON.stringify({ error: { code: scenario === "denied" ? "PLATFORM_ADMINISTRATOR_REQUIRED" : "ANALYTICS_UNAVAILABLE", message: scenario === "denied" ? "Administrator access required." : "Analytics could not be loaded.", requestId: "local-analytics-preview" } }), { status: scenario === "denied" ? 403 : 503, headers: { "Content-Type": "application/json" } });
  }
  const calendarKind = parsed.searchParams.has("week") ? "week" : parsed.searchParams.has("month") ? "month" : null;
  const data = calendarKind ? makeCalendarAnalytics(calendarKind, parsed.searchParams.get(calendarKind)) : adminAnalyticsFixture({ days, ...(scenario === "empty" ? { coverage: "not_started" } : scenario === "partial" ? { coverage: "partial", startedOn: "2026-11-25" } : {}) });
  if (parsed.searchParams.get("detail") === "pages") withPageDetail(data);
  return new Response(JSON.stringify({ data, meta: { requestId: "local-analytics-preview" } }), { headers: { "Content-Type": "application/json" } });
} });
const session = { status: "authenticated", user: { id: "sample-admin", displayName: "Local preview" }, httpClient: client };
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
createRoot(document.getElementById("root")).render(<StrictMode><BrowserRouter><QueryClientProvider client={queryClient}><SessionContext.Provider value={session}>
  <div style={{ padding: "1rem clamp(1rem, 4vw, 3rem)", color: "#9fb4ce", borderBottom: "1px solid #283b55", fontFamily: "system-ui", fontSize: ".875rem" }}>HUNDO LEAGO · ADMIN <span style={{ float: "right" }}>Local sample data</span></div>
  <AdminAnalyticsPage />
</SessionContext.Provider></QueryClientProvider></BrowserRouter></StrictMode>);
