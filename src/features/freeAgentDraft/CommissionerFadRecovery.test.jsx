import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import React from "react";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { RealtimeContext } from "../../shared/realtime/realtimeContext.js";
import { CommissionerFadPanel } from "./CommissionerFadPanel.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
const seasonId = "22222222-2222-4222-8222-222222222222";
const fadId = "33333333-3333-4333-8333-333333333333";
const userId = "44444444-4444-4444-8444-444444444444";
const teamId = "55555555-5555-4555-8555-555555555555";
const playerId = "66666666-6666-4666-8666-666666666666";
const allocationId = "77777777-7777-4777-8777-777777777777";
const recoveryId = "88888888-8888-4888-8888-888888888888";
const operationId = "99999999-9999-4999-8999-999999999999";
const entryId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const contractId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ownershipId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const correctionId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const activityId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const oldWeekId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const oldMatchupId = "10101010-1010-4010-8010-101010101010";
const oldJobId = "20202020-2020-4020-8020-202020202020";
const newJobId = "30303030-3030-4030-8030-303030303030";
const fingerprint = "a".repeat(64);
const config = {
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function response(data, status = 200) {
  return new Response(
    JSON.stringify({ data, meta: { requestId: "request-fad-recovery" } }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

function sessionResponse() {
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

function team() {
  return {
    teamId,
    name: "Recovery Owls",
    primaryColour: "#112233",
    secondaryColour: "#ffffff",
    tertiaryColour: null,
    patternTemplate: "solid",
    logoReference: null,
  };
}

function rankedOffer(outcomeCode = "restricted_tied") {
  return {
    snapshotEntryId: entryId,
    teamId,
    team: team(),
    slotKey: "F02",
    totalValueCents: null,
    termYears: null,
    aavCents: null,
    valid: true,
    validationCode: null,
    rank: 1,
    outcomeCode,
  };
}

function winner() {
  return {
    teamId,
    snapshotEntryId: entryId,
    contractId,
    ownershipId,
    slotKey: "F02",
    totalValueCents: null,
    termYears: null,
    aavCents: null,
  };
}

function operation() {
  return {
    operationId,
    operationKind: "allocation",
    resourceId: allocationId,
    occurrenceKey: `fad-allocation:${allocationId}`,
    status: "failed",
    attemptCount: 2,
    scheduledForMs: 1_720_000_000_000,
    nextAttemptAtMs: null,
    leaseExpiresAtMs: null,
    startedAtMs: 1_720_000_000_100,
    completedAtMs: 1_720_000_000_200,
    lastErrorCode: "FAD_ALLOCATION_REQUIRES_REPAIR",
    recoveryId,
    blocksCompletion: true,
    version: 2,
  };
}

function rollover(sequence) {
  const rolloverId = `00000000-0000-4${String(sequence).padStart(3, "0")}-8000-${String(sequence).padStart(12, "0")}`;
  return {
    rolloverId,
    sequence,
    opensAtMs: 1_720_000_000_000 + sequence * 1_000,
    creationCutoffAtMs: 1_720_000_000_100 + sequence * 1_000,
    rollsOverAtMs: 1_720_000_000_200 + sequence * 1_000,
    status: "scheduled",
    processingStartedAtMs: null,
    completedAtMs: null,
    lastErrorCode: null,
    recoveryIds: [],
    blocksCompletion: true,
    version: 1,
  };
}

function rolloverAction(rolloverValue) {
  return {
    action: "finalize_rollover",
    resourceId: rolloverValue.rolloverId,
    enabled: false,
    reasonCode: "RECOVERY_NOT_AVAILABLE",
  };
}

function recoveryEvidence(recoveryStatus = "ready") {
  const rollovers = Array.from({ length: 7 }, (_, index) => rollover(index + 1));
  return {
    fad: {
      leagueId,
      seasonId,
      fadId,
      version: 4,
      status: "allocating",
      phase: "allocating",
      openedAtMs: 1_719_000_000_000,
      reminderAtMs: 1_719_100_000_000,
      helpOpensAtMs: 1_719_200_000_000,
      candidateDeadlineAtMs: 1_719_300_000_000,
      deadlineLockedAtMs: 1_719_300_000_100,
      allocationCompletedAtMs: null,
      nextRolloverAtMs: rollovers[0].rollsOverAtMs,
      frozenFadFirstMatchupStartsAtMs: 1_721_664_000_000,
      competitionFirstMatchupStartsAtMs: 1_721_664_000_000,
      scheduleRecoveryOperationId: null,
      completedAtMs: null,
      counts: {
        participatingTeams: 6,
        cardsLocked: 6,
        allocationsPending: 1,
        allocationsAutomatic: 2,
        restrictedPending: 0,
        restrictedFallbackPending: 0,
        rapidAuctionsOpen: 0,
        queuedNominations: 0,
        rolloversPersisted: 7,
        rolloversCompleted: 0,
        recoveriesOpen: 1,
      },
    },
    deadlineOperation: null,
    allocationOperations: [operation()],
    rapidOperations: [],
    completionOperation: null,
    rollovers,
    recoveries: [
      {
        recoveryId,
        kind: "allocation_retry",
        status: recoveryStatus,
        playerId,
        allocationId,
        rolloverId: null,
        auctionId: null,
        jobRunId: operationId,
        nominationQueueId: null,
        earliestActivationAtMs: null,
        targetResolutionAtMs: null,
        lastErrorCode: "FAD_ALLOCATION_REQUIRES_REPAIR",
        commissionerReason: null,
        createdByOperationId: operationId,
        resolvedByUserId: null,
        resolvedByMembershipId: null,
        resolvedAuthority: null,
        createdAtMs: 1_720_000_000_200,
        updatedAtMs: 1_720_000_000_300,
        resolvedAtMs: null,
        version: 1,
      },
    ],
    availableActions: [
      {
        action: "retry_allocation",
        resourceId: allocationId,
        enabled: ["pending", "ready"].includes(recoveryStatus),
        reasonCode: ["pending", "ready"].includes(recoveryStatus)
          ? null
          : "RECOVERY_NOT_AVAILABLE",
      },
      ...rollovers.map(rolloverAction),
    ],
  };
}

function completedRecoveryEvidence() {
  const rollovers = Array.from({ length: 7 }, (_, index) => {
    const value = rollover(index + 1);
    return {
      ...value,
      status: "completed",
      processingStartedAtMs: value.rollsOverAtMs,
      completedAtMs: value.rollsOverAtMs + 100,
      blocksCompletion: false,
    };
  });
  const completedAtMs = 1_720_000_000_500;
  return {
    fad: {
      leagueId,
      seasonId,
      fadId,
      version: 5,
      status: "completed",
      phase: "completed",
      openedAtMs: 1_719_000_000_000,
      reminderAtMs: 1_719_100_000_000,
      helpOpensAtMs: 1_719_200_000_000,
      candidateDeadlineAtMs: 1_719_300_000_000,
      deadlineLockedAtMs: 1_719_300_000_100,
      allocationCompletedAtMs: 1_719_400_000_000,
      nextRolloverAtMs: null,
      frozenFadFirstMatchupStartsAtMs: 1_721_664_000_000,
      competitionFirstMatchupStartsAtMs: 1_722_268_800_000,
      scheduleRecoveryOperationId: operationId,
      completedAtMs,
      counts: {
        participatingTeams: 6,
        cardsLocked: 6,
        allocationsPending: 0,
        allocationsAutomatic: 2,
        restrictedPending: 0,
        restrictedFallbackPending: 0,
        rapidAuctionsOpen: 0,
        queuedNominations: 0,
        rolloversPersisted: 7,
        rolloversCompleted: 7,
        recoveriesOpen: 0,
      },
    },
    deadlineOperation: null,
    allocationOperations: [],
    rapidOperations: [],
    completionOperation: null,
    rollovers,
    recoveries: [],
    availableActions: rollovers.map(rolloverAction),
    scheduleRecoveryEvidence: {
      operationId,
      status: "succeeded",
      oldWeek1StartsAtMs: 1_721_664_000_000,
      newWeek1StartsAtMs: 1_722_268_800_000,
      oldScheduleVersion: 5,
      newScheduleVersion: 6,
      removedWeekIds: [oldWeekId],
      removedMatchupIds: [oldMatchupId],
      replacedJobs: [
        {
          oldJobId,
          oldOccurrenceKey: `matchup:${oldMatchupId}:old`,
          newJobId,
          newOccurrenceKey: `matchup:${oldMatchupId}:new`,
        },
      ],
      completedAtMs,
      version: 1,
    },
  };
}

function recoveryReceipt() {
  return {
    operationId,
    occurrenceKey: `fad-allocation:${allocationId}`,
    action: "retry_allocation",
    resourceId: allocationId,
    status: "pending",
    acceptedAtMs: 1_720_000_000_600,
    pollDescriptor: { kind: "fad_recovery", leagueId, fadId },
  };
}

function currentDecision() {
  return {
    status: "correction_required",
    decisionCode: null,
    rankedOffers: [rankedOffer()],
    winner: null,
    restricted: null,
    recoveryStatus: "correction_required",
  };
}

function recomputedDecision() {
  return {
    status: "automatic_award",
    decisionCode: "highest_total",
    rankedOffers: [rankedOffer("winner")],
    winner: winner(),
    restricted: null,
    recoveryStatus: null,
  };
}

function correctionPreview() {
  return {
    allocationId,
    allocationVersion: 3,
    previewFingerprint: fingerprint,
    reversible: true,
    currentDecision: currentDecision(),
    recomputedDecision: recomputedDecision(),
    deltas: [
      {
        resourceType: "roster_entry",
        resourceId: null,
        action: "create",
        beforeVersion: null,
        afterSummary: {
          ...emptyAfterSummary(),
          team: team(),
          player: {
            playerId,
            fullName: "Corrected Player",
            positionGroup: "F",
          },
          rosterCategory: "Active",
        },
      },
    ],
    warnings: [],
    blockers: [],
    confirmationText: "APPLY FAD CORRECTION",
  };
}

function emptyAfterSummary() {
  return {
    status: null,
    team: null,
    player: null,
    contractId: null,
    ownershipId: null,
    auctionId: null,
    totalValueCents: null,
    termYears: null,
    aavCents: null,
    rosterCategory: null,
  };
}

function correctionResult() {
  return {
    correctionId,
    allocation: {
      allocationId,
      allocationVersion: 4,
      player: { playerId, fullName: "Corrected Player", positionGroup: "F" },
      ...recomputedDecision(),
      fallback: null,
      draws: [],
      resolvedAtMs: 1_720_000_000_800,
    },
    appliedDeltas: [
      {
        resourceType: "activity",
        resourceId: activityId,
        action: "append",
        beforeVersion: null,
        afterSummary: emptyAfterSummary(),
      },
    ],
    activityId,
    completedAtMs: 1_720_000_000_800,
  };
}

function renderRecovery(fetchImpl) {
  vi.stubGlobal("requestAnimationFrame", (callback) => {
    callback();
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  return renderWithProviders(
    <CommissionerFadPanel
      leagueId={leagueId}
      seasonId={null}
      timeZone="America/Vancouver"
    />,
    {
      initialEntries: [
        `/leagues/${leagueId}/commissioner?fadId=${fadId}&recoveryId=${recoveryId}`,
      ],
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    }
  );
}

describe("FAD-16 commissioner recovery and correction", () => {
  it("keeps recovery discoverable without a current season and accepts only the returned action with a secure intent", async () => {
    const requests = [];
    const fetchImpl = vi.fn(async (url, options = {}) => {
      const parsed = new URL(url);
      if (parsed.pathname === "/api/v1/session") return sessionResponse();
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/recovery`)) {
        requests.push({ kind: "recovery", options });
        return response(recoveryEvidence());
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/recovery/actions`)) {
        requests.push({ kind: "action", options });
        return response(recoveryReceipt(), 202);
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    const view = renderRecovery(fetchImpl);

    expect(
      await screen.findByRole("heading", { name: "Recovery and correction" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Set a current season before running/i)).toBeInTheDocument();
    expect(
      fetchImpl.mock.calls.some(([url]) =>
        new URL(url).pathname.endsWith("/free-agent-drafts/readiness")
      )
    ).toBe(false);
    const reviewAction = screen.getByRole("button", { name: "Review action" });
    expect(reviewAction).toBeInTheDocument();
    const page = document.querySelector(
      'section[aria-labelledby="commissioner-fad-recovery-title"]'
    );
    const actionPanel = screen.getByRole("heading", { name: "Needs your action" }).closest("section");
    const recoveryHistory = screen.getByText("Recovery history").closest("details");
    expect(actionPanel.compareDocumentPosition(recoveryHistory)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(recoveryHistory).toHaveAttribute("open");
    expect(screen.getAllByText(/Resolve the earlier blocked draft step/).length).toBeGreaterThan(0);
    expect(page).toContainElement(actionPanel);
    expect(screen.queryByText("Complete Free Agent Draft")).toBeNull();
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute(
        "id",
        `fad-recovery-${recoveryId}`
      )
    );

    await view.user.click(reviewAction);
    let form = screen.getByRole("form", {
      name: "Confirm Retry automatic allocation",
    });
    expect(within(form).getByLabelText("Recovery reason")).toHaveFocus();
    await view.user.click(within(form).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(reviewAction).toHaveFocus());

    await view.user.click(reviewAction);
    form = screen.getByRole("form", {
      name: "Confirm Retry automatic allocation",
    });
    await view.user.type(
      within(form).getByLabelText("Recovery reason"),
      "Retry the exact failed allocation."
    );

    const randomUuid = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockImplementationOnce(() => {
        throw new Error("secure randomness unavailable");
      });
    const submit = within(form).getByRole("button", {
      name: "Submit recovery",
    });
    submit.focus();
    await view.user.keyboard("{Enter}");
    const alert = await within(form).findByRole("alert");
    expect(alert).toHaveTextContent(/recovery action could not be accepted/i);
    expect(form).not.toHaveAttribute("aria-describedby");
    expect(requests.filter((request) => request.kind === "action")).toHaveLength(0);

    randomUuid.mockRestore();
    submit.focus();
    await view.user.keyboard("{Enter}");
    await waitFor(() =>
      expect(requests.filter((request) => request.kind === "action")).toHaveLength(1)
    );
    const action = requests.find((request) => request.kind === "action").options;
    expect(JSON.parse(action.body)).toEqual({
      action: "retry_allocation",
      resourceId: allocationId,
      reason: "Retry the exact failed allocation.",
    });
    expect(action.headers.get("Idempotency-Key")).toMatch(/^fad-recovery:/);
    expect(action.headers.get("If-Match")).toBeNull();
    const receipt = await screen.findByText(
      /Free Agent Draft status has been refreshed/i
    );
    expect(receipt).toHaveFocus();
  });

  it("renders only schedule-recovery evidence that is bound to a completed FAD", async () => {
    const fetchImpl = vi.fn(async (url) => {
      const parsed = new URL(url);
      if (parsed.pathname === "/api/v1/session") return sessionResponse();
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/recovery`)) {
        return response(completedRecoveryEvidence());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderRecovery(fetchImpl);

    expect(
      await screen.findByText(/Competition Week 1 moved from/)
    ).toHaveTextContent(/America\/Vancouver/);
    expect(screen.queryByText(/matchup:.*:old/)).not.toBeInTheDocument();
  });

  it("withholds and remounts commissioner recovery evidence during realtime reauthorization", async () => {
    const fetchImpl = vi.fn(async (url) => {
      const parsed = new URL(url);
      if (parsed.pathname === "/api/v1/session") return sessionResponse();
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/recovery`)) {
        return response(recoveryEvidence());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    function RecoveryReauthorizationHarness() {
      const [realtime, setRealtime] = React.useState({
        status: "connected",
        privacyEpoch: 0,
      });
      return (
        <>
          <button
            onClick={() => setRealtime({ status: "reauthorizing", privacyEpoch: 1 })}
          >
            Reauthorize recovery
          </button>
          <button
            onClick={() => setRealtime({ status: "connected", privacyEpoch: 1 })}
          >
            Finish recovery reauthorization
          </button>
          <RealtimeContext.Provider value={realtime}>
            <CommissionerFadPanel
              leagueId={leagueId}
              seasonId={null}
              timeZone="America/Vancouver"
            />
          </RealtimeContext.Provider>
        </>
      );
    }
    const view = renderWithProviders(<RecoveryReauthorizationHarness />, {
      initialEntries: [
        `/leagues/${leagueId}/commissioner?fadId=${fadId}&recoveryId=${recoveryId}`,
      ],
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    expect(
      await screen.findByRole("heading", { name: "Recovery and correction" })
    ).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Reauthorize recovery" }));
    expect(screen.queryByRole("heading", { name: "Recovery and correction" })).toBeNull();
    expect(
      screen.getByText(/Refreshing secure Free Agent Draft access/i)
    ).toBeInTheDocument();
    await view.user.click(
      screen.getByRole("button", { name: "Finish recovery reauthorization" })
    );
    expect(
      await screen.findByRole("heading", { name: "Recovery and correction" })
    ).toBeInTheDocument();
  });

  it("previews without write headers, then applies the exact fingerprint, version, confirmation, and intent key", async () => {
    const requests = [];
    const fetchImpl = vi.fn(async (url, options = {}) => {
      const parsed = new URL(url);
      if (parsed.pathname === "/api/v1/session") return sessionResponse();
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/recovery`)) {
        return response(recoveryEvidence("correction_required"));
      }
      if (parsed.pathname.endsWith(`/allocations/${allocationId}/correction-previews`)) {
        requests.push({ kind: "preview", options });
        return response(correctionPreview());
      }
      if (parsed.pathname.endsWith(`/allocations/${allocationId}/corrections`)) {
        requests.push({ kind: "apply", options });
        return response(correctionResult());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    const view = renderRecovery(fetchImpl);

    const correctionTrigger = await screen.findByRole("button", {
      name: "Review correction",
    });
    await view.user.click(correctionTrigger);
    expect(
      screen.getByRole("heading", { name: "Allocation correction" })
    ).toHaveFocus();
    const previewButton = screen.getByRole("button", {
      name: "Preview correction",
    });
    previewButton.focus();
    await view.user.keyboard("{Enter}");
    const correctionForm = await screen.findByRole("form", {
      name: "Apply Free Agent Draft correction",
    });
    expect(screen.getByText("Changes if applied")).toBeInTheDocument();
    expect(
      screen.getByText("Create roster spot for Corrected Player for Recovery Owls")
    ).toBeInTheDocument();
    expect(screen.queryByText(/roster_entry/)).not.toBeInTheDocument();
    expect(correctionForm).not.toHaveTextContent(/\$6\.00|AAV|1 year/iu);
    expect(
      within(correctionForm).getByLabelText("Correction reason")
    ).toHaveFocus();

    const preview = requests.find((request) => request.kind === "preview").options;
    expect(JSON.parse(preview.body)).toEqual({
      mode: "recompute_locked_snapshot",
    });
    expect(preview.headers.get("If-Match")).toBeNull();
    expect(preview.headers.get("Idempotency-Key")).toBeNull();

    await view.user.type(
      within(correctionForm).getByLabelText("Correction reason"),
      "Apply the deterministic locked-snapshot repair."
    );
    const confirmation = within(correctionForm).getByLabelText(
      /I reviewed the correction/
    );
    await view.user.click(confirmation);
    const apply = within(correctionForm).getByRole("button", {
      name: "Apply reviewed correction",
    });
    expect(apply).toBeEnabled();
    apply.focus();
    await view.user.keyboard("{Enter}");

    await waitFor(() =>
      expect(requests.filter((request) => request.kind === "apply")).toHaveLength(1)
    );
    const applied = requests.find((request) => request.kind === "apply").options;
    expect(JSON.parse(applied.body)).toEqual({
      mode: "recompute_locked_snapshot",
      previewFingerprint: fingerprint,
      reason: "Apply the deterministic locked-snapshot repair.",
      confirmation: "APPLY FAD CORRECTION",
    });
    expect(applied.headers.get("If-Match")).toBe('"3"');
    expect(applied.headers.get("Idempotency-Key")).toMatch(/^fad-correction:/);
    const committed = await screen.findByText(
      /Correction committed.*automatic award/i
    );
    expect(committed).toHaveFocus();
    expect(committed).not.toHaveTextContent(/\$6\.00|AAV|1 year/iu);
    await view.user.click(screen.getByRole("button", { name: "Close correction" }));
    await waitFor(() => expect(correctionTrigger).toHaveFocus());
  });
});
