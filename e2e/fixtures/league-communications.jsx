import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext } from "../../src/features/session/sessionContext.js";
import { LeagueCommunications } from "../../src/features/commissioner/LeagueCommunications.jsx";
import { FadDeadlineControls } from "../../src/features/freeAgentDraft/FadDeadlineControls.jsx";
import { FadTimingControls } from "../../src/features/freeAgentDraft/FadTimingControls.jsx";
import { FadAuctionCutoffControls } from "../../src/features/freeAgentDraft/FadAuctionCutoffControls.jsx";
import { TradeDeadlineControls } from '../../src/features/commissioner/TradeDeadlineControls.jsx';
import { AuctionTimingControls } from '../../src/features/auctions/AuctionTimingControls.jsx';
import "../../src/styles/theme-a.css";

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const leagueId = id(1);
const people = ["Alex", "Morgan", "Sam", "Taylor", "Jordan", "Charlie"];
const cards = people.map((name, index) => ({ teamId: id(20 + index), userId: id(40 + index),
  teamName: `Team ${name}`, displayName: name, status: index < 4 ? "complete" : index === 4 ? "incomplete" : "empty" }));
const messages = [{ id: id(2), leagueId, kind: "announcement", title: "Draft week is approaching",
  body: "Save your Candidate Card before Monday's target deadline. Unfinished cards will hold processing.",
  pinned: true, expiresAtMs: null, createdAtMs: Date.parse("2026-09-29T07:00:00Z"),
  authorName: "Commissioner", archivedAtMs: null, version: 1, recipientCount: 6 }];
window.communicationRequests = [];
let processingAuthorized = false;
let timing = { leagueId, fadId: id(3), held: true, canReschedule: true, blockedReason: null, reminderAlreadySent: true,
  deadlineAtMs: Date.parse('2026-09-29T07:00:00Z'), serverNowMs: Date.parse('2026-09-29T08:00:00Z'),
  weekOneAtMs: Date.parse('2026-10-05T07:00:00Z'), rolloverTimesAtMs: [Date.parse('2026-10-01T07:00:00Z'),Date.parse('2026-10-03T07:00:00Z')] };
timing.canEditDeadline=true;timing.canEditActiveAuctions=false;
timing.roundDates=[1,2].map(sequence=>({sequence,canEdit:true,blockedReason:null}));
if(new URLSearchParams(window.location.search).has('rapid')) {
  timing={...timing,held:false,canEditDeadline:false,canEditActiveAuctions:true,
    roundDates:[{sequence:1,canEdit:false,blockedReason:'This round has already finished.'},timing.roundDates[1]]};
}
const client = { async request(url, options = {}) {
  window.communicationRequests.push({ url, method: options.method || "GET", body: options.body });
  let data;
  if (url.includes('/auctions/') && url.includes('/timing')) {
    data={leagueId,auctionId:id(9),timeZone:'America/Vancouver',closesAtMs:Date.parse('2026-10-02T19:00:00Z'),
      playoffsAtMs:null,seasonEndsAtMs:null,serverNowMs:timing.serverNowMs,canEdit:true,blockedReason:null,history:[]};
    if(url.endsWith('/preview'))data={...data,proposed:options.body,previewHash:'f'.repeat(64),shortened:true};
    if(url.endsWith('/apply'))data={leagueId,auctionId:id(9),id:id(10),accepted:true,replayed:false};
  } else if (url.includes('/calendar/trade-deadline')) {
    data = { leagueId, seasonId: id(7), timeZone: 'America/Vancouver', tradeDeadlineAtMs: Date.parse('2026-09-28T19:00:00Z'),
      serverNowMs: timing.serverNowMs, canEdit: true, blockedReason: null, history: [] };
    if (url.endsWith('/preview')) data = { ...data, proposed: options.body, previewHash: 'e'.repeat(64),
      impact: { shortened: 0, extended: 0, unchanged: 0, expiredRetained: 2, reopensDeadline: true } };
    if (url.endsWith('/apply')) data = { leagueId, id: id(8), accepted: true, replayed: false };
  } else if (url.includes('/deadline-control/auction-cutoff')) {
    data = { leagueId, fadId: id(3), gapMinutes: 60, canEdit: true, blockedReason: null, serverNowMs: timing.serverNowMs,
      rounds: timing.rolloverTimesAtMs.map((time, i) => ({ sequence: i+1, opensAtMs: timing.deadlineAtMs,
        closesAtMs: time, cutoffAtMs: time-3600000, protected: i===0 })) };
    if (url.endsWith('/preview')) data = { ...data, proposed: options.body, previewHash: 'd'.repeat(64),
      changes: [{ sequence: 2, opensAtMs: timing.deadlineAtMs, closesAtMs: timing.rolloverTimesAtMs[1],
        beforeCutoffAtMs: timing.rolloverTimesAtMs[1]-3600000, afterCutoffAtMs: timing.rolloverTimesAtMs[1]-options.body.gapMinutes*60000,
        reopensNow: false, closesNow: false, noNominationWindow: false }],
      retained: [{ sequence: 1, cutoffAtMs: timing.rolloverTimesAtMs[0]-3600000, reason: 'Existing auction or queued nomination' }] };
    if (url.endsWith('/apply')) data = { leagueId, fadId: id(3), id: id(6), accepted: true, replayed: false };
  } else if (url.includes('/deadline-control/timing')) {
    data = timing;
    if (url.endsWith('/preview')) data = { ...timing, proposed: options.body, affectedAuctions:timing.canEditActiveAuctions?2:0, previewHash: 'c'.repeat(64) };
    if (url.endsWith('/apply')) {
      timing = { ...timing, ...options.body, held: false };
      data = { leagueId, fadId: id(3), id: id(5), accepted: true, replayed: false };
    }
  } else if (url.includes("/deadline-control")) {
    data = { leagueId, fadId: id(3), held: !processingAuthorized, processingAuthorized,
      canProceed: true, total: 6, complete: 4, blockedReason: null,
      deadlineAtMs: Date.parse("2026-09-29T07:00:00Z"), serverNowMs: Date.parse("2026-09-29T08:00:00Z"),
      unfinishedTeams: cards.filter(c => c.status !== "complete").map(({ teamId, teamName, status }) => ({ teamId, teamName, status })) };
    if (url.endsWith("/preview")) data = { ...data, reason: options.body.reason, previewHash: "b".repeat(64) };
    if (url.endsWith("/proceed")) {
      processingAuthorized = true;
      data = { leagueId, fadId: id(3), id: id(4), accepted: true, replayed: false };
    }
  } else if (url.endsWith("/history")) data = { leagueId, messages: [...messages] };
  else if (url.endsWith("/card-progress")) data = { leagueId, cards, total: 6, complete: 4, empty: 1 };
  else if (url.endsWith("/preview")) {
    const recipients = options.body.notify ? cards.filter(c => options.body.audience !== "unfinished_cards" || c.status !== "complete")
      .map(({ userId, displayName }) => ({ userId, displayName })) : [];
    data = { leagueId, message: options.body, recipients, recipientCount: recipients.length, previewHash: "a".repeat(64) };
  } else if (url.endsWith("/archive")) {
    const message = messages.find(m => url.includes(m.id));
    message.archivedAtMs = Date.now(); message.version += 1;
    data = { leagueId, id: message.id, archived: true };
  } else if (options.method === "POST") {
    const message = options.body.message;
    const recipientCount = message.notify ? message.audience === "unfinished_cards" ? 2 : 6 : 0;
    const messageId = id(100 + messages.length);
    messages.unshift({ ...message, id: messageId, leagueId, createdAtMs: Date.now(), archivedAtMs: null,
      authorName: "Commissioner", version: 1, recipientCount });
    data = { leagueId, id: messageId, recipientCount, replayed: false };
  } else data = { leagueId, messages: messages.filter(m => m.kind === "announcement" && m.archivedAtMs === null) };
  options.validateData?.(data);
  return { data };
} };
const canManage = !new URLSearchParams(window.location.search).has("manager");
createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <SessionContext.Provider value={{ status: "authenticated", httpClient: client }}>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        <p>Local preview · sample data · <a href="?">Commissioner</a> · <a href="?manager">Manager</a></p>
        <h1>League dashboard</h1>
        <LeagueCommunications leagueId={leagueId} canManage={canManage} />
        {canManage && <FadDeadlineControls leagueId={leagueId} fadId={id(3)} />}
        {canManage && <FadTimingControls leagueId={leagueId} fadId={id(3)} />}
        {canManage && <FadAuctionCutoffControls leagueId={leagueId} fadId={id(3)} />}
        {canManage && <TradeDeadlineControls leagueId={leagueId} />}
        {canManage && <AuctionTimingControls leagueId={leagueId} auctionId={id(9)} />}
      </main>
    </SessionContext.Provider>
  </QueryClientProvider>
);
