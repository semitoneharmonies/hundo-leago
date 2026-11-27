import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext } from "../../src/features/session/sessionContext.js";
import { AdminAnalyticsPage } from "../../src/features/analytics/AdminAnalyticsPage.jsx";
import { adminAnalyticsFixture } from "../../src/test/adminAnalyticsFixture.js";
import { createHttpClient } from "../../src/shared/api/httpClient.js";
import "../../src/index.css";

const scenario = new URLSearchParams(location.search).get("scenario") || "full";
const client = createHttpClient({ apiOrigin: location.origin, fetchImpl: async (url) => {
  const days = Number(new URL(url).searchParams.get("days") || 28);
  if (scenario === "denied" || scenario === "failure") {
    return new Response(JSON.stringify({ error: { code: scenario === "denied" ? "PLATFORM_ADMINISTRATOR_REQUIRED" : "ANALYTICS_UNAVAILABLE", message: scenario === "denied" ? "Administrator access required." : "Analytics could not be loaded.", requestId: "local-analytics-preview" } }), { status: scenario === "denied" ? 403 : 503, headers: { "Content-Type": "application/json" } });
  }
  const data = adminAnalyticsFixture({ days, ...(scenario === "empty" ? { coverage: "not_started" } : scenario === "partial" ? { coverage: "partial", startedOn: "2026-11-25" } : {}) });
  return new Response(JSON.stringify({ data, meta: { requestId: "local-analytics-preview" } }), { headers: { "Content-Type": "application/json" } });
} });
const session = { status: "authenticated", user: { id: "sample-admin", displayName: "Local preview" }, httpClient: client };
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
createRoot(document.getElementById("root")).render(<StrictMode><BrowserRouter><QueryClientProvider client={queryClient}><SessionContext.Provider value={session}>
  <div style={{ padding: "1rem clamp(1rem, 4vw, 3rem)", color: "#9fb4ce", borderBottom: "1px solid #283b55", fontFamily: "system-ui", fontSize: ".875rem" }}>HUNDO LEAGO · ADMIN <span style={{ float: "right" }}>Local sample data</span></div>
  <AdminAnalyticsPage />
</SessionContext.Provider></QueryClientProvider></BrowserRouter></StrictMode>);
