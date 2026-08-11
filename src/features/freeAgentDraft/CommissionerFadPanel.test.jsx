import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { RealtimeContext } from "../../shared/realtime/realtimeContext.js";
import { renderWithProviders } from "../../test/render.jsx";
import { CommissionerFadPanel } from "./CommissionerFadPanel.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
const seasonId = "22222222-2222-4222-8222-222222222222";
const operationId = "33333333-3333-4333-8333-333333333333";
const entryDraftId = "44444444-4444-4444-8444-444444444444";
const assignmentId = "55555555-5555-4555-8555-555555555555";
const teamId = "66666666-6666-4666-8666-666666666666";
const userId = "77777777-7777-4777-8777-777777777777";
const receiptId = "88888888-8888-4888-8888-888888888888";
const jobId = "99999999-9999-4999-8999-999999999999";
const config = {
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
};

function response(data, status = 200) {
  return new Response(
    JSON.stringify({ data, meta: { requestId: "request-readiness" } }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

function readiness() {
  return {
    leagueId,
    seasonId,
    operationId,
    operationVersion: 3,
    status: "blocked",
    triggerKind: "entry_draft_completed",
    entryDraftId,
    exemptionId: null,
    serverNowMs: 1_000_000,
    timeZone: "America/Vancouver",
    observedSeasonVersion: 2,
    firstMatchupWeekBefore: null,
    firstMatchupWeekAfter: null,
    candidateDeadlineAtMs: null,
    reminderAtMs: null,
    helpOpensAtMs: null,
    initialRollovers: [],
    priorSeasonRollover: null,
    participatingTeamCount: 1,
    teamProjections: [
      {
        teamId,
        team: {
          teamId,
          name: "Readiness Owls",
          primaryColour: "#112233",
          secondaryColour: "#ffffff",
          tertiaryColour: null,
          patternTemplate: "solid",
          logoReference: null,
        },
        managerReady: true,
        managerAssignmentId: assignmentId,
        carryoverCount: 2,
        openForwardSlots: 10,
        openDefenceSlots: 6,
        openBenchSlots: 4,
        structuralConflictCount: 0,
      },
    ],
    blockers: [
      {
        code: "FIRST_MATCHUP_REQUIRED",
        message: "The first matchup schedule must be confirmed.",
        resourceId: seasonId,
      },
    ],
    warnings: [],
    resultFadId: null,
    retryReadiness: { allowed: true, reasonCode: null },
  };
}

describe("CommissionerFadPanel", () => {
  it("submits only the exact blocked operation retry with version and a secure intent key", async () => {
    const retryRequests = [];
    const fetchImpl = vi.fn(async (url, options = {}) => {
      const path = new URL(url).pathname;
      if (path === "/api/v1/session") {
        return response({
          csrfToken: "D".repeat(43),
          session: {
            id: userId,
            userId,
            status: "active",
            createdAtMs: 1,
            lastUsedAtMs: 1,
            idleExpiresAtMs: 2,
            absoluteExpiresAtMs: 3,
            version: 1,
          },
          user: {
            id: userId,
            displayName: "Commissioner",
            status: "active",
            version: 1,
          },
        });
      }
      if (path.endsWith("/free-agent-drafts/readiness") && options.method === "GET") {
        expect(new URL(url).searchParams.get("seasonId")).toBe(seasonId);
        return response(readiness());
      }
      if (path.endsWith("/free-agent-drafts/readiness/retries")) {
        retryRequests.push({
          body: JSON.parse(options.body),
          headers: options.headers,
        });
        return response(
          {
            retryReceiptId: receiptId,
            leagueId,
            seasonId,
            readinessOperationId: operationId,
            acceptedFromVersion: 3,
            resultingReadinessVersion: 4,
            retryAttemptNumber: 2,
            jobRunId: jobId,
            occurrenceKey: `fad-readiness:${leagueId}:${seasonId}:${entryDraftId}`,
            acceptedAtMs: 1_000_001,
            status: "accepted",
          },
          202
        );
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderWithProviders(
      <RealtimeContext.Provider value={{ status: "disconnected", privacyEpoch: 0 }}>
        <CommissionerFadPanel leagueId={leagueId} seasonId={seasonId} />
      </RealtimeContext.Provider>,
      {
        enableSession: true,
        config,
        sessionOptions: { fetchImpl },
      }
    );

    expect(
      await screen.findByText("The first matchup schedule must be confirmed.")
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/opening time/i)).toBeNull();
    expect(screen.queryByLabelText(/team list/i)).toBeNull();
    await view.user.click(
      screen.getByRole("button", { name: "Retry automatic readiness" })
    );
    expect(screen.getByText("RETRY FREE AGENT DRAFT READINESS")).toBeInTheDocument();
    await view.user.click(
      screen.getByRole("button", { name: "Confirm readiness retry" })
    );

    await waitFor(() => expect(retryRequests).toHaveLength(1));
    expect(retryRequests[0].body).toEqual({
      seasonId,
      readinessOperationId: operationId,
      confirmation: "RETRY FREE AGENT DRAFT READINESS",
    });
    expect(retryRequests[0].headers.get("If-Match")).toBe('"3"');
    expect(retryRequests[0].headers.get("Idempotency-Key")).toMatch(
      /^fad-readiness-retry:/
    );
    expect(retryRequests[0].headers.get("X-CSRF-Token")).toBe("D".repeat(43));
    expect(await screen.findByText(/Retry 2 accepted/)).toBeInTheDocument();
  });
});
