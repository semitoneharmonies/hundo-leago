import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { LeagueDraftSetup } from "./LeagueDraftSetup.jsx";

vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const leagueId = id(1);
const userId = id(2);
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
const envelope = (data) => new Response(JSON.stringify({ data, meta: { requestId: "draft-setup" } }), { status: 200, headers: { "Content-Type": "application/json" } });

function setup({ pending = false, hasDeadline = false, failStart = false } = {}) {
  const writes = [];
  const league = { id: leagueId, name: "Inaugural League", status: "setup", timezone: "America/Vancouver",
    currentSeason: { id: id(3), status: "planned", version: 1 },
    membership: { id: id(4), permissionCategory: "commissioner", status: "active", version: 1 }, version: 3 };
  const settings = { leagueId, tradeDeadlineAtMs: hasDeadline ? Date.parse("2027-03-01T08:00:00Z") : null, version: 1 };
  const fetchImpl = vi.fn(async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === "/api/v1/session") return envelope({ csrfToken: "D".repeat(43),
      session: { id: userId, userId, status: "active", createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3, version: 1 },
      user: { id: userId, displayName: "Commissioner", status: "active", version: 1 } });
    const prefix = `/api/v1/leagues/${leagueId}`;
    if (options.method === "GET") {
      if (path === prefix) return envelope({ code: "LEAGUE_FOUND", league });
      if (path === prefix + "/settings") return envelope({ code: "LEAGUE_SETTINGS_FOUND", settings });
      if (path === prefix + "/teams") return envelope({ code: "TEAMS_FOUND", teams: [10, 20, 30, 40].map((n) => ({
        id: id(n), leagueId, name: `Team ${n}`, status: "setup", version: 1,
        currentManager: { assignmentId: id(n + 1), userId: id(n + 2), displayName: `Manager ${n}`, version: 1 },
      })) });
      if (path === prefix + "/memberships") return envelope({ code: "LEAGUE_MEMBERSHIPS_FOUND", memberships: [{
        id: id(5), version: 1, status: pending ? "invited" : "active", user: { id: userId, displayName: "Commissioner" },
      }] });
    }
    writes.push({ path, method: options.method, body: JSON.parse(options.body), headers: options.headers });
    if (path.endsWith("/setup/trade-deadline")) {
      settings.tradeDeadlineAtMs = JSON.parse(options.body).tradeDeadlineAtMs;
      settings.version += 1;
      league.version += 1;
      return envelope({ code: "LEAGUE_TRADE_DEADLINE_RECORDED", league, settings });
    }
    if (path.endsWith("/start")) {
      if (failStart) return new Response(JSON.stringify({ error: { code: "LEAGUE_PRECONDITION_FAILED", message: "League setup changed. Refresh and try again." } }), { status: 412, headers: { "Content-Type": "application/json" } });
      league.status = "active";
      league.currentSeason.status = "active";
      return envelope({ code: "LEAGUE_STARTED", league, activatedTeamCount: 4 });
    }
    throw new Error(`Unexpected request: ${path}`);
  });
  return { writes, ...renderWithProviders(<LeagueDraftSetup leagueId={leagueId} />, { enableSession: true, config, sessionOptions: { fetchImpl } }) };
}

describe("inaugural draft setup", () => {
  it("saves the deadline, refetches the league version, and prepares once after confirmation", async () => {
    const view = setup();
    await screen.findByRole("heading", { name: "Prepare your first Free Agent Draft" });
    expect(screen.getByRole("button", { name: "Prepare league for draft" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Season trade deadline"), { target: { value: "2027-03-01T00:00" } });
    await view.user.click(screen.getByRole("button", { name: "Save trade deadline" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Prepare league for draft" })).toBeEnabled());
    expect(view.writes[0].body).toEqual({ tradeDeadlineAtMs: Date.parse("2027-03-01T08:00:00Z") });
    expect(view.writes[0].headers.get("If-Match")).toBe('"3"');
    await view.user.click(screen.getByRole("button", { name: "Prepare league for draft" }));
    expect(view.writes).toHaveLength(1);
    await view.user.click(screen.getByRole("button", { name: "Confirm draft setup" }));
    await waitFor(() => expect(view.writes).toHaveLength(2));
    expect(view.writes[1].body).toEqual({});
    expect(view.writes[1].headers.get("If-Match")).toBe('"4"');
    expect(view.writes[1].headers.get("X-CSRF-Token")).toBe("D".repeat(43));
    expect(view.writes[1].headers.get("Idempotency-Key")).toMatch(/^league-start:/);
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Prepare your first Free Agent Draft" })).not.toBeInTheDocument());
  });
  it("keeps preparation disabled while an invitation is pending", async () => {
    const view = setup({ pending: true, hasDeadline: true });
    expect(await screen.findByRole("button", { name: "Prepare league for draft" })).toBeDisabled();
    expect(view.writes).toEqual([]);
  });
  it("withdraws the confirmation after a stale-version response without retrying the write", async () => {
    const view = setup({ hasDeadline: true, failStart: true });
    await view.user.click(await screen.findByRole("button", { name: "Prepare league for draft" }));
    await view.user.click(screen.getByRole("button", { name: "Confirm draft setup" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: "Confirm draft setup" })).not.toBeInTheDocument();
    expect(view.writes).toHaveLength(1);
  });
});
