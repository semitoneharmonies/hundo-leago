import { createRoot } from "react-dom/client";
import { BrowserRouter, useSearchParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext } from "../../src/features/session/sessionContext.js";
import { LeagueCommunications } from "../../src/features/commissioner/LeagueCommunications.jsx";
import { LeagueAnnouncements } from "../../src/features/leagues/LeagueAnnouncements.jsx";
import { effectiveLeagueAuthority, hasCommissionerAuthority } from "../../src/shared/leagueAuthority.js";
import "../../src/index.css";
import "../../src/styles/theme-a.css";

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const parameters = new URLSearchParams(window.location.search);
const authority = parameters.get("role") === "commissioner" ? "commissioner" : "platform_administrator";
const league = { id: id(1), membership: { effectiveAuthority: authority, permissionCategory: "member", status: "active" } };
const leagues = [{ leagueId: id(1), leagueName: "Amigo Leago", recipientCount: 2 }, { leagueId: id(2), leagueName: "Goon Spoons", recipientCount: 2 }];
const recipients = ["Alex", "Morgan", "Sam"].map((displayName, index) => ({ userId: id(10 + index), displayName }));
window.announcementRequests = [];
let publications = 0;
const client = { async request(url, options = {}) {
  window.announcementRequests.push({ url, method: options.method || "GET", body: options.body, key: options.idempotencyKey });
  let data;
  if (url === "/api/v1/push/settings") data = { available: false };
  else if (url.includes("/announcements?")) data = { code: "LEAGUE_ANNOUNCEMENTS_FOUND", announcements: [], page: { nextCursor: null } };
  else if (url.startsWith("/api/v1/admin/announcements")) {
    if (authority !== "platform_administrator") throw new Error("Administrator required");
    const common = { scope: "all_leagues", leagues, recipientCount: 4, uniqueRecipientCount: 3 };
    if (url.endsWith("/preview")) data = { ...common, message: options.body, recipients, previewHash: "a".repeat(64) };
    else {
      publications += 1;
      if (parameters.has("uncertain") && publications === 1) throw new Error("Connection lost after sending");
      data = { ...common, id: id(30), leagues: leagues.map((item, index) => ({ ...item, id: id(40 + index) })), replayed: publications > 1 };
    }
  } else if (url.endsWith("/preview")) data = { leagueId: league.id, message: options.body, recipients: recipients.slice(0, 2), recipientCount: 2, previewHash: "b".repeat(64) };
  else if (options.method === "POST") data = { leagueId: league.id, id: id(50), recipientCount: 2, replayed: false };
  else data = { leagueId: league.id, messages: [] };
  options.validateData?.(data);
  return { data };
} };
const session = { status: "authenticated", user: { id: id(60) }, httpClient: client };
export function Preview() {
  const [search] = useSearchParams();
  return <main className="hl-page" style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
    <p>Local verification · sample leagues and people</p>
    <h1>Announcements</h1>
    <aside style={{ maxWidth: 400 }}><LeagueAnnouncements league={league} session={session} /></aside>
    <LeagueCommunications leagueId={league.id} canManage={hasCommissionerAuthority(league.membership)}
      canManageSitewide={effectiveLeagueAuthority(league.membership) === "platform_administrator"}
      initialAudienceScope={search.get("audience") === "all_leagues" ? "all_leagues" : "league"} initiallyExpanded />
  </main>;
}
createRoot(document.getElementById("root")).render(<BrowserRouter>
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <SessionContext.Provider value={session}><Preview /></SessionContext.Provider>
  </QueryClientProvider>
</BrowserRouter>);
