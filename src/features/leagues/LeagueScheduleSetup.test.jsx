import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { CommissionerCompetitionPage } from "../competition/CompetitionPages.jsx";

vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const leagueId = id(1), userId = id(2), seasonId = id(3);
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
const envelope = data => new Response(JSON.stringify({ data, meta: { requestId: "draft-setup" } }), { status: 200, headers: { "Content-Type": "application/json" } });

function setup({ pending = false, hasDeadline = false, failStart = false } = {}) {
  const requests = [];
  const league = { id: leagueId, name: "Inaugural League", status: "setup", timezone: "America/Vancouver",
    currentSeason: { id: seasonId, label: "2026-27", status: "planned", version: 1 },
    membership: { id: id(4), permissionCategory: "commissioner", effectiveAuthority: "commissioner", status: "active", version: 1 }, version: 3 };
  const settings = { leagueId, tradeDeadlineAtMs: hasDeadline ? Date.parse("2027-03-01T08:00:00Z") : null, version: 1 };
  let rejectStart = failStart;
  const fetchImpl = vi.fn(async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === "/api/v1/session") return envelope({ csrfToken: "D".repeat(43),
      session: { id: userId, userId, status: "active", createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3, version: 1 },
      user: { id: userId, displayName: "Commissioner", status: "active", version: 1 } });
    if (path === "/api/v1/leagues") return envelope({ code: "LEAGUES_FOUND", leagues: [league] });
    const prefix = `/api/v1/leagues/${leagueId}`;
    if (options.method === "GET") {
      if (path === prefix) return envelope({ code: "LEAGUE_FOUND", league });
      if (path === prefix + "/settings") return envelope({ code: "LEAGUE_SETTINGS_FOUND", settings });
      if (path === prefix + "/teams") return envelope({ code: "TEAMS_FOUND", teams: [10, 20, 30, 40].map(n => ({
        id: id(n), leagueId, name: `Team ${n}`, status: league.status, version: 1,
        currentManager: { assignmentId: id(n + 1), userId: id(n + 2), displayName: `Manager ${n}`, version: 1 },
      })) });
      if (path === prefix + "/memberships") return envelope({ code: "LEAGUE_MEMBERSHIPS_FOUND", memberships: [{
        id: id(5), version: 1, status: pending ? "invited" : "active", user: { id: userId, displayName: "Commissioner" },
      }] });
      if (path === prefix + "/seasons") return envelope({ code: "LEAGUE_SEASONS_FOUND", leagueId, seasons: [{
        id: seasonId, label: "2026-27", nhlSeasonKey: "20262027", status: league.currentSeason.status, version: league.currentSeason.version,
        regularSeasonStartsAtMs: null, regularSeasonEndsAtMs: null, fantasyPlayoffsStartAtMs: null, fantasyPlayoffsEndAtMs: null,
      }] });
      if (path === `${prefix}/seasons/${seasonId}/matchup-weeks`) return envelope({ code: "MATCHUP_WEEKS_FOUND", weeks: [], health: {} });
      if (path === prefix + "/free-agent-drafts/readiness") return envelope({
        leagueId, seasonId, operationId: null, operationVersion: null, status: "not_triggered", triggerKind: null, entryDraftId: null, exemptionId: null,
        serverNowMs: Date.parse("2026-09-12T07:00:00Z"), timeZone: "America/Vancouver", observedSeasonVersion: league.currentSeason.version,
        firstMatchupWeekBefore: null, firstMatchupWeekAfter: null, candidateDeadlineAtMs: null, reminderAtMs: null, helpOpensAtMs: null,
        initialRollovers: [], priorSeasonRollover: null, participatingTeamCount: 0, teamProjections: [], blockers: [], warnings: [], resultFadId: null,
        retryReadiness: { allowed: false, reasonCode: "RECOVERY_NOT_AVAILABLE" },
      });
    }
    const body = JSON.parse(options.body);
    requests.push({ path, method: options.method, body, headers: options.headers });
    if (path.endsWith("/setup/trade-deadline")) {
      settings.tradeDeadlineAtMs = body.tradeDeadlineAtMs; settings.version += 1; league.version += 1;
      return envelope({ code: "LEAGUE_TRADE_DEADLINE_RECORDED", league, settings });
    }
    if (path.endsWith("/start")) {
      if (rejectStart) return new Response(JSON.stringify({ error: { code: "LEAGUE_PRECONDITION_FAILED", message: "League setup changed. Refresh and try again." } }), { status: 412, headers: { "Content-Type": "application/json" } });
      league.status = "active"; league.currentSeason.status = "active"; league.currentSeason.version += 1;
      return envelope({ code: "LEAGUE_STARTED", league, activatedTeamCount: 4 });
    }
    if (path.endsWith("/matchup-schedules")) {
      if (body.confirmed) return envelope({ code: "MATCHUP_SCHEDULE_GENERATED", result: { weekCount: 1 } });
      return envelope({ code: "MATCHUP_SCHEDULE_PREVIEWED", preview: { seasonId, expectedSeasonVersion: league.currentSeason.version,
        participantCount: 4, weekCount: 1, matchupCount: 2, byeCount: 0, firstWeekStartsAtMs: body.firstWeekStartsAtMs,
        weeks: [{ sequence: 1, startsAtMs: body.firstWeekStartsAtMs, endsAtMs: body.firstWeekStartsAtMs + 86400000 }], draftTiming: body.draftTiming } });
    }
    throw new Error(`Unexpected request: ${path}`);
  });
  return { requests, allowStart: () => { rejectStart = false; }, ...renderWithProviders(
    <Routes><Route path="/leagues/:leagueId/commissioner" element={<CommissionerCompetitionPage />} /></Routes>,
    { initialEntries: [`/leagues/${leagueId}/commissioner`], enableSession: true, config, sessionOptions: { fetchImpl } }) };
}

async function enterDates() {
  fireEvent.change(await screen.findByLabelText("Season trade deadline"), { target: { value: "2027-03-01T00:00" } });
  fireEvent.change(screen.getByLabelText("Candidate Card deadline"), { target: { value: "2026-09-13T00:00" } });
  await waitFor(() => expect(screen.getByRole("button", { name: "Review league setup" })).toBeEnabled());
}

describe("combined inaugural calendar setup", () => {
  it("reviews all dates without writes, saves the deadline and prepares once, then confirms a fresh schedule preview", async () => {
    const view = setup(); await enterDates();
    const dates = screen.getByRole("group", { name: "Season dates" });
    expect(within(dates).getByLabelText("Season trade deadline")).toBeVisible();
    expect(within(dates).getByLabelText("Candidate Card deadline")).toHaveValue("2026-09-13T00:00");
    expect(screen.getByLabelText("Week 1 starts")).toHaveValue("2026-09-29T00:00");
    expect(screen.queryByRole("button", { name: "Save trade deadline", exact: true })).not.toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Review league setup" }));
    expect(await screen.findByRole("region", { name: "League setup review" })).toHaveTextContent("Candidate Card deadline");
    expect(view.requests).toEqual([]);
    await view.user.click(screen.getByRole("button", { name: "Save trade deadline and prepare league" }));
    await screen.findByRole("region", { name: "Schedule generation preview" });
    expect(view.requests.map(item => item.path.split("/").at(-1))).toEqual(["trade-deadline", "start", "matchup-schedules"]);
    expect(view.requests[0].headers.get("If-Match")).toBe('"3"');
    expect(view.requests[1].headers.get("If-Match")).toBe('"4"');
    expect(view.requests[1].headers.get("X-CSRF-Token")).toBe("D".repeat(43));
    expect(view.requests[1].headers.get("Idempotency-Key")).toMatch(/^league-start:/);
    expect(view.requests[2].body.confirmed).toBe(false);
    expect(view.requests[2].body.draftTiming.candidateDeadlineAtMs).toBe(Date.parse("2026-09-13T07:00:00Z"));
    await view.user.click(screen.getByRole("button", { name: "Confirm schedule generation" }));
    await waitFor(() => expect(view.requests).toHaveLength(4));
    expect(view.requests[3].body.confirmed).toBe(true);
    expect(view.requests[3].headers.get("If-Match")).toBe('"2"');
  });
  it("requires accepted managers without requiring a separately saved trade deadline", async () => {
    const view = setup({ pending: true });
    fireEvent.change(await screen.findByLabelText("Season trade deadline"), { target: { value: "2027-03-01T00:00" } });
    await screen.findByText("4 managed teams · 1 pending invitations");
    expect(screen.getByRole("button", { name: "Review league setup" })).toBeDisabled();
    expect(view.requests).toEqual([]);
  });
  it("keeps a saved deadline after preparation fails and retries only preparation", async () => {
    const view = setup({ failStart: true }); await enterDates();
    await view.user.click(screen.getByRole("button", { name: "Review league setup" }));
    await view.user.click(screen.getByRole("button", { name: "Save trade deadline and prepare league" }));
    await screen.findByRole("alert");
    await waitFor(() => expect(screen.getByRole("button", { name: "Review league setup" })).toBeEnabled());
    expect(view.requests).toHaveLength(2);
    expect(screen.getByLabelText("Season trade deadline")).toBeDisabled();
    expect(screen.getByLabelText("Candidate Card deadline")).toHaveValue("2026-09-13T00:00");
    view.allowStart();
    await view.user.click(screen.getByRole("button", { name: "Review league setup" }));
    await view.user.click(screen.getByRole("button", { name: "Prepare league and preview schedule" }));
    await screen.findByRole("region", { name: "Schedule generation preview" });
    expect(view.requests.filter(item => item.path.endsWith("/setup/trade-deadline"))).toHaveLength(1);
    expect(view.requests[2].headers.get("Idempotency-Key")).toBe(view.requests[1].headers.get("Idempotency-Key"));
  });
  it("restores default scoring dates while preserving the candidate deadline and chosen rollovers", async () => {
    const view = setup(); await enterDates();
    fireEvent.change(screen.getByLabelText("Total rapid-auction rounds"), { target: { value: "5" } });
    const lastRound = screen.getByLabelText("Round 5 rolls over").value;
    fireEvent.change(screen.getByLabelText("NHL regular season starts"), { target: { value: "2026-09-29T13:00" } });
    fireEvent.change(screen.getByLabelText("Week 1 starts"), { target: { value: "2026-09-20T00:00" } });
    await view.user.click(screen.getByRole("button", { name: "Use default season dates" }));
    expect(screen.getByLabelText("NHL regular season starts")).toHaveValue("2026-09-29T00:00");
    expect(screen.getByLabelText("Week 1 starts")).toHaveValue("2026-09-29T00:00");
    expect(screen.getByLabelText("Candidate Card deadline")).toHaveValue("2026-09-13T00:00");
    expect(screen.getByLabelText("Season trade deadline")).toHaveValue("2027-03-01T00:00");
    expect(screen.getByLabelText("Round 5 rolls over")).toHaveValue(lastRound);
    expect(view.requests).toEqual([]);
  });
});
