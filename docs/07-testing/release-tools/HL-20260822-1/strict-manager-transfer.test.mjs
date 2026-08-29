// @vitest-environment jsdom
// @vitest-environment-options { "url": "https://staging.hundoleago.com/release-qa/hl-20260822-1/strict-manager-transfer" }

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const PAGE =
  "https://staging.hundoleago.com/release-qa/hl-20260822-1/strict-manager-transfer";
const API = "https://api-staging.hundoleago.com";
const MARKER_URL =
  "https://staging.hundoleago.com/release-qa/hl-20260822-1/enabled.json";
const RELEASE_ID = "HL-20260822-1";
const BACKEND_BUILD_ID = "8e313902feefcd683b0f5edd746a9dd2a9029a18";
const FRONTEND_BUILD_ID = "4dfe12d1366314e3d9df722c50771324647743c9";
const LEAGUE_ID = "60c82aa0-54f9-4c93-83f5-73b0d6d6f63e";
const TEAM_ID = "ebc815c7-8a41-4326-8faf-04548aa91c76";
const ADMIN_ID = "dbc0118a-21f9-408c-abf5-b01d9ca05e64";
const MANAGER_A_ID = "e9f723c4-32d2-4823-a1d4-233fe0ce2f45";
const MANAGER_B_ID = "c2684bf0-d30d-4b37-ae14-66620259798e";
const SESSION_ID = "10000000-0000-4000-8000-000000000001";
const OLD_ASSIGNMENT_ID = "20000000-0000-4000-8000-000000000002";
const NEW_ASSIGNMENT_ID = "30000000-0000-4000-8000-000000000003";
const MEMBERSHIP_ID = "40000000-0000-4000-8000-000000000004";
const EVENT_ID = "50000000-0000-4000-8000-000000000005";
const RETURN_ASSIGNMENT_ID = "60000000-0000-4000-8000-000000000006";
const RETURN_EVENT_ID = "70000000-0000-4000-8000-000000000007";
const HELPER_RUNTIME = "./strict-manager-transfer.js";

const html = readFileSync(
  resolve(
    process.cwd(),
    "docs/07-testing/release-tools/HL-20260822-1/strict-manager-transfer.html"
  ),
  "utf8"
);
const bodyMarkup = html.match(/<body>(?<body>[\s\S]*)<\/body>/)?.groups?.body;

function envelope(data) {
  return { data, meta: { requestId: "qa-request" } };
}

function response(payload, status = 200, { url = "", type = "basic" } = {}) {
  const result = new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
  Object.defineProperty(result, "url", { configurable: true, value: url });
  Object.defineProperty(result, "type", { configurable: true, value: type });
  return result;
}

function errorResponse(status = 503, code = "RELEASE_QA_STRICT_MANAGER_OUTBOX_FAILED") {
  return response({
    error: { code, message: "Sanitized failure.", requestId: "qa-request" },
  }, status);
}

function markerResponse(overrides = {}) {
  return response(
    {
      contractVersion: 1,
      enabled: true,
      releaseId: RELEASE_ID,
      frontendBuildId: FRONTEND_BUILD_ID,
      backendBuildId: BACKEND_BUILD_ID,
      frontendOrigin: "https://staging.hundoleago.com",
      apiOrigin: API,
      expiresAt: "2026-08-24T07:00:00.000Z",
      ...overrides,
    },
    200,
    { url: MARKER_URL, type: "basic" }
  );
}

function sessionResponse(userId) {
  return response(
    envelope({
      csrfToken: "A".repeat(43),
      session: {
        id: SESSION_ID,
        userId,
        status: "active",
        createdAtMs: 1,
        lastUsedAtMs: 2,
        idleExpiresAtMs: 3,
        absoluteExpiresAtMs: 4,
        version: 1,
      },
      user: {
        id: userId,
        displayName:
          userId === ADMIN_ID
            ? "Admin"
            : userId === MANAGER_A_ID
              ? "Manager A"
              : "Manager B",
        status: "active",
        version: 1,
      },
    })
  );
}

function teamResponse(
  currentManagerUserId = MANAGER_A_ID,
  currentAssignmentId = OLD_ASSIGNMENT_ID
) {
  return response(
    envelope({
      code: "TEAM_FOUND",
      team: {
        id: TEAM_ID,
        leagueId: LEAGUE_ID,
        name: "Strict Team 1",
        status: "active",
        primaryColour: "#112233",
        secondaryColour: "#445566",
        tertiaryColour: null,
        patternTemplate: "split",
        logoReference: null,
        createdAtMs: 1,
        updatedAtMs: 2,
        version: 1,
        currentManager: {
          assignmentId: currentAssignmentId,
          userId: currentManagerUserId,
          displayName:
            currentManagerUserId === MANAGER_A_ID ? "Manager A" : "Manager B",
          isProtectedPlatformAdministrator: false,
          acceptedAtMs: 1,
          version: 1,
        },
      },
    })
  );
}

function assignmentResponse({
  code,
  accepted = false,
  targetUserId = MANAGER_B_ID,
  previousManagerUserId = MANAGER_A_ID,
  assignmentId = NEW_ASSIGNMENT_ID,
  replacedAssignmentId = OLD_ASSIGNMENT_ID,
} = {}) {
  return response(
    envelope({
      code:
        code ||
        (accepted
          ? "TEAM_MANAGER_ASSIGNMENT_ACCEPTED"
          : "TEAM_MANAGER_ASSIGNMENT_FOUND"),
      assignment: {
        id: assignmentId,
        status: accepted ? "accepted" : "pending",
        assignedAtMs: 10,
        acceptedAtMs: accepted ? 11 : null,
        endedAtMs: null,
        assignedByUserId: ADMIN_ID,
        replacesAssignmentId: replacedAssignmentId,
        version: accepted ? 2 : 1,
      },
      league: {
        id: LEAGUE_ID,
        name: "Strict League",
        status: "active",
        version: 1,
      },
      team: {
        id: TEAM_ID,
        name: "Strict Team 1",
        status: "active",
        version: 1,
        currentManager: {
          assignmentId: accepted ? assignmentId : replacedAssignmentId,
          userId: accepted ? targetUserId : previousManagerUserId,
          displayName:
            (accepted ? targetUserId : previousManagerUserId) === MANAGER_A_ID
              ? "Manager A"
              : "Manager B",
          version: accepted ? 2 : 1,
        },
      },
      proposedUser: {
        id: targetUserId,
        displayName: targetUserId === MANAGER_A_ID ? "Manager A" : "Manager B",
      },
      membership: {
        id: MEMBERSHIP_ID,
        permissionCategory: "manager",
        status: "active",
        version: 1,
      },
      replacedManager: {
        assignmentId: replacedAssignmentId,
        userId: previousManagerUserId,
        displayName:
          previousManagerUserId === MANAGER_A_ID ? "Manager A" : "Manager B",
        status: accepted ? "ended" : "accepted",
        version: accepted ? 2 : 1,
      },
    }),
    code === "TEAM_MANAGER_ASSIGNMENT_PROPOSED" ? 201 : 200
  );
}

function publisherResponse({
  replayed = false,
  eventId = EVENT_ID,
  phase = "team1-to-manager-b",
  assignmentId = NEW_ASSIGNMENT_ID,
} = {}) {
  return response(
    envelope({
      code: "RELEASE_QA_STRICT_MANAGER_OUTBOX_PUBLISHED",
      contractVersion: 1,
      releaseId: RELEASE_ID,
      phase,
      environmentId: "test:release-qa",
      databaseId: "m7-release-qa-fixture",
      schemaVersion: 54,
      backendBuildId: BACKEND_BUILD_ID,
      frontendBuildId: FRONTEND_BUILD_ID,
      leagueId: LEAGUE_ID,
      teamId: TEAM_ID,
      assignmentId,
      eventId,
      outcome: "published",
      replayed,
      databaseWriteCount: replayed ? 0 : 2,
      schedulerRemainedDisabled: true,
    })
  );
}

function createFetchRouter({
  sessionUsers = [],
  team = teamResponse(),
  publisher = [],
  marker = [],
  assignmentTargetUserId = MANAGER_B_ID,
  assignmentPreviousManagerUserId = MANAGER_A_ID,
  proposalAssignmentId = NEW_ASSIGNMENT_ID,
  proposalReplacedAssignmentId = OLD_ASSIGNMENT_ID,
} = {}) {
  const calls = [];
  const users = [...sessionUsers];
  const publisherQueue = [...publisher];
  const markerQueue = [...marker];
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method || "GET";
    calls.push({ url: String(url), method, options });
    if (url === MARKER_URL) {
      const next = markerQueue.shift();
      return typeof next === "function" ? next() : next || markerResponse();
    }
    if (url === `${API}/api/v1/session`) {
      return sessionResponse(users.shift() || MANAGER_B_ID);
    }
    if (url === `${API}/api/v1/leagues/${LEAGUE_ID}/teams/${TEAM_ID}`) {
      return team;
    }
    if (
      url === `${API}/api/v1/leagues/${LEAGUE_ID}/teams/${TEAM_ID}/manager-assignment`
    ) {
      return assignmentResponse({
        code: "TEAM_MANAGER_ASSIGNMENT_PROPOSED",
        targetUserId: assignmentTargetUserId,
        previousManagerUserId: assignmentPreviousManagerUserId,
        assignmentId: proposalAssignmentId,
        replacedAssignmentId: proposalReplacedAssignmentId,
      });
    }
    if (url === `${API}/api/v1/team-manager-assignments/${NEW_ASSIGNMENT_ID}`) {
      return assignmentResponse();
    }
    if (url === `${API}/api/v1/team-manager-assignments/${RETURN_ASSIGNMENT_ID}`) {
      return assignmentResponse({
        targetUserId: MANAGER_A_ID,
        previousManagerUserId: MANAGER_B_ID,
        assignmentId: RETURN_ASSIGNMENT_ID,
        replacedAssignmentId: NEW_ASSIGNMENT_ID,
      });
    }
    if (
      url ===
      `${API}/api/v1/team-manager-assignments/${NEW_ASSIGNMENT_ID}/accept`
    ) {
      return assignmentResponse({ accepted: true });
    }
    if (
      url ===
      `${API}/api/v1/team-manager-assignments/${RETURN_ASSIGNMENT_ID}/accept`
    ) {
      return assignmentResponse({
        accepted: true,
        targetUserId: MANAGER_A_ID,
        previousManagerUserId: MANAGER_B_ID,
        assignmentId: RETURN_ASSIGNMENT_ID,
        replacedAssignmentId: NEW_ASSIGNMENT_ID,
      });
    }
    if (
      url === `${API}/api/v1/operations/release-qa/strict-manager-outbox`
    ) {
      const next = publisherQueue.shift();
      return typeof next === "function" ? next() : next || errorResponse();
    }
    throw new Error(`Unexpected test request: ${method} ${url}`);
  });
  return { calls, fetchMock };
}

function expectExactUnsafeRequest(call, { body, idempotencyKey }) {
  expect(call.method).toBe("POST");
  expect(call.options.cache).toBe("no-store");
  expect(call.options.credentials).toBe("include");
  expect(call.options.mode).toBe("cors");
  expect(call.options.redirect).toBe("error");
  expect(call.options.referrerPolicy).toBe("no-referrer");
  expect(Object.keys(call.options.headers).sort()).toEqual([
    "Accept",
    "Content-Type",
    "Idempotency-Key",
    "X-CSRF-Token",
  ]);
  expect(call.options.headers).toEqual({
    Accept: "application/json",
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
    "X-CSRF-Token": "A".repeat(43),
  });
  expect(call.options.body).toBe(JSON.stringify(body));
}

function expectExactMarkerRequest(call) {
  expect(call.url).toBe(MARKER_URL);
  expect(call.method).toBe("GET");
  expect(call.options).toEqual({
    cache: "no-store",
    credentials: "same-origin",
    method: "GET",
    redirect: "error",
    referrerPolicy: "no-referrer",
  });
  expect(call.options.body).toBeUndefined();
}

async function boot(fetchMock, fragment = "") {
  document.body.innerHTML = bodyMarkup;
  window.history.replaceState(null, "", `${PAGE}${fragment}`);
  vi.stubGlobal("fetch", fetchMock);
  vi.resetModules();
  await import(HELPER_RUNTIME);
}

async function verifyAndArm() {
  document.getElementById("verify-session").click();
  await vi.waitFor(() =>
    expect(document.getElementById("session-output").textContent).toContain(
      "SESSION_VERIFIED"
    )
  );
  document.getElementById("arm-writes").click();
}

async function acceptManagerB(fetchMock) {
  await boot(
    fetchMock,
    `#phase=team1-to-manager-b&assignmentId=${NEW_ASSIGNMENT_ID}`
  );
  await verifyAndArm();
  document.getElementById("accept-to-b").click();
  await vi.waitFor(() =>
    expect(document.getElementById("output-to-b").textContent).toContain(
      "ACCEPTANCE_OK"
    )
  );
}

describe("HL-20260822-1 strict manager-transfer helper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(
      Date.parse("2026-08-23T15:00:00.000Z")
    );
  });

  it("starts inert with a distinct empty QueryClient and no FAD or socket activity", async () => {
    const fetchMock = vi.fn();
    await boot(fetchMock);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById("session-output").textContent).toContain(
      '"queryClientPresent": true'
    );
    expect(document.getElementById("session-output").textContent).toContain(
      '"queryCacheSize": 0'
    );
    expect(document.getElementById("session-output").textContent).toContain(
      '"mutationCacheSize": 0'
    );
  });

  it("stops before the team read or proposal when the fresh actor is wrong", async () => {
    const router = createFetchRouter({ sessionUsers: [ADMIN_ID, MANAGER_A_ID] });
    await boot(router.fetchMock);
    await verifyAndArm();
    document.getElementById("propose-to-b").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "CALLER_IDENTITY_MISMATCH"
      )
    );
    expect(router.calls.filter((call) => call.method === "POST")).toHaveLength(0);
    expect(router.calls.some((call) => call.url.includes(`/teams/${TEAM_ID}`))).toBe(false);
  });

  it("stops before proposal when the exact Team 1 predecessor precheck mismatches", async () => {
    const router = createFetchRouter({
      sessionUsers: [ADMIN_ID, ADMIN_ID],
      team: teamResponse(MANAGER_B_ID),
    });
    await boot(router.fetchMock);
    await verifyAndArm();
    document.getElementById("propose-to-b").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "TEAM_PRECHECK_MISMATCH"
      )
    );
    expect(router.calls.filter((call) => call.method === "POST")).toHaveLength(0);
  });

  it("locks synchronously against a double-click and emits one proposal POST", async () => {
    const router = createFetchRouter({ sessionUsers: [ADMIN_ID, ADMIN_ID] });
    await boot(router.fetchMock);
    await verifyAndArm();
    const button = document.getElementById("propose-to-b");
    button.click();
    button.click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "PROPOSAL_OK"
      )
    );
    const proposalCalls = router.calls.filter(
      (call) => call.method === "POST" && call.url.endsWith("/manager-assignment")
    );
    expect(proposalCalls).toHaveLength(1);
    expectExactUnsafeRequest(proposalCalls[0], {
      body: { userId: MANAGER_B_ID },
      idempotencyKey: "HL-20260822-1-team1-to-b-propose",
    });
    expect(
      router.calls[router.calls.indexOf(proposalCalls[0]) - 1].url
    ).toBe(MARKER_URL);
    expect(window.location.hash).toContain(`assignmentId=${NEW_ASSIGNMENT_ID}`);
  });

  it("rejects an activation-marker mismatch before issuing a write POST", async () => {
    const router = createFetchRouter({
      sessionUsers: [ADMIN_ID, ADMIN_ID],
      marker: [markerResponse({ enabled: false })],
    });
    await boot(router.fetchMock);
    await verifyAndArm();
    document.getElementById("propose-to-b").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "ACTIVATION_MARKER_CONTENT_MISMATCH"
      )
    );
    expect(router.calls.filter((call) => call.method === "POST")).toHaveLength(0);
  });

  it("hard-stops at the exact fixture horizon before any write POST", async () => {
    const router = createFetchRouter({ sessionUsers: [ADMIN_ID, ADMIN_ID] });
    await boot(router.fetchMock);
    await verifyAndArm();
    Date.now.mockReturnValue(Date.parse("2026-08-24T07:00:00.000Z"));
    document.getElementById("propose-to-b").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "FIXTURE_ACTION_HORIZON_EXPIRED"
      )
    );
    expect(router.calls.filter((call) => call.method === "POST")).toHaveLength(0);
  });

  it("keeps the return proposal unavailable before exact phase-one publication", async () => {
    const router = createFetchRouter({ sessionUsers: [ADMIN_ID] });
    await boot(router.fetchMock);
    await verifyAndArm();
    expect(document.getElementById("propose-to-a").disabled).toBe(true);
    document.getElementById("propose-to-a").click();
    expect(router.calls.filter((call) => call.method === "POST")).toHaveLength(0);
  });

  it("uses the exact Admin return proposal actor, path, body, and key after phase one", async () => {
    const router = createFetchRouter({
      sessionUsers: [
        MANAGER_B_ID,
        MANAGER_B_ID,
        MANAGER_B_ID,
        MANAGER_B_ID,
        ADMIN_ID,
        ADMIN_ID,
      ],
      team: teamResponse(MANAGER_B_ID),
      publisher: [publisherResponse(), publisherResponse({ replayed: true })],
      assignmentTargetUserId: MANAGER_A_ID,
      assignmentPreviousManagerUserId: MANAGER_B_ID,
    });
    await acceptManagerB(router.fetchMock);
    document.getElementById("publish-to-b").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "PUBLISH_AND_REPLAY_OK"
      )
    );
    document.getElementById("verify-session").click();
    await vi.waitFor(() =>
      expect(document.getElementById("session-output").textContent).toContain(
        ADMIN_ID
      )
    );
    document.getElementById("propose-to-a").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-a").textContent).toContain(
        "PROPOSAL_OK"
      )
    );
    const proposal = router.calls.find(
      (call) => call.method === "POST" && call.url.endsWith("/manager-assignment")
    );
    expect(proposal.url).toBe(
      `${API}/api/v1/leagues/${LEAGUE_ID}/teams/${TEAM_ID}/manager-assignment`
    );
    expectExactUnsafeRequest(proposal, {
      body: { userId: MANAGER_A_ID },
      idempotencyKey: "HL-20260822-1-team1-to-a-propose",
    });
  });

  it("accepts and publishes the exact Manager A return phase with one replay", async () => {
    const router = createFetchRouter({
      sessionUsers: [
        MANAGER_B_ID,
        MANAGER_B_ID,
        MANAGER_B_ID,
        MANAGER_B_ID,
        ADMIN_ID,
        ADMIN_ID,
        MANAGER_A_ID,
        MANAGER_A_ID,
        MANAGER_A_ID,
        MANAGER_A_ID,
      ],
      team: teamResponse(MANAGER_B_ID, NEW_ASSIGNMENT_ID),
      publisher: [
        publisherResponse(),
        publisherResponse({ replayed: true }),
        publisherResponse({
          phase: "team1-return-to-manager-a",
          assignmentId: RETURN_ASSIGNMENT_ID,
          eventId: RETURN_EVENT_ID,
        }),
        publisherResponse({
          replayed: true,
          phase: "team1-return-to-manager-a",
          assignmentId: RETURN_ASSIGNMENT_ID,
          eventId: RETURN_EVENT_ID,
        }),
      ],
      assignmentTargetUserId: MANAGER_A_ID,
      assignmentPreviousManagerUserId: MANAGER_B_ID,
      proposalAssignmentId: RETURN_ASSIGNMENT_ID,
      proposalReplacedAssignmentId: NEW_ASSIGNMENT_ID,
    });
    await acceptManagerB(router.fetchMock);
    document.getElementById("publish-to-b").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "PUBLISH_AND_REPLAY_OK"
      )
    );
    document.getElementById("verify-session").click();
    await vi.waitFor(() =>
      expect(document.getElementById("session-output").textContent).toContain(
        ADMIN_ID
      )
    );
    document.getElementById("propose-to-a").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-a").textContent).toContain(
        "PROPOSAL_OK"
      )
    );
    expect(document.getElementById("assignment-to-a").value).toBe(
      RETURN_ASSIGNMENT_ID
    );
    document.getElementById("verify-session").click();
    await vi.waitFor(() =>
      expect(document.getElementById("session-output").textContent).toContain(
        MANAGER_A_ID
      )
    );
    document.getElementById("accept-to-a").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-a").textContent).toContain(
        "ACCEPTANCE_OK"
      )
    );
    document.getElementById("publish-to-a").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-a").textContent).toContain(
        "PUBLISH_AND_REPLAY_OK"
      )
    );

    const acceptance = router.calls.find((call) =>
      call.url.endsWith(`/${RETURN_ASSIGNMENT_ID}/accept`)
    );
    expectExactUnsafeRequest(acceptance, {
      body: {},
      idempotencyKey: "HL-20260822-1-team1-to-a-accept",
    });
    const phaseAPublishers = router.calls.filter(
      (call) =>
        call.url.endsWith("strict-manager-outbox") &&
        JSON.parse(call.options.body).phase === "team1-return-to-manager-a"
    );
    expect(phaseAPublishers).toHaveLength(2);
    const phaseABody = {
      backendBuildId: BACKEND_BUILD_ID,
      confirmation: "PUBLISH-HL-20260822-1-TEAM1-RETURN-TO-MANAGER-A",
      phase: "team1-return-to-manager-a",
      releaseId: RELEASE_ID,
    };
    for (const publisher of phaseAPublishers) {
      expectExactUnsafeRequest(publisher, {
        body: phaseABody,
        idempotencyKey: "HL-20260822-1-outbox-team1-return-to-manager-a",
      });
      expectExactMarkerRequest(
        router.calls[router.calls.indexOf(publisher) - 1]
      );
    }
  });

  it("does not retry or attempt replay after a failed fresh publisher response", async () => {
    const router = createFetchRouter({
      sessionUsers: [MANAGER_B_ID, MANAGER_B_ID, MANAGER_B_ID],
      publisher: [errorResponse()],
    });
    await acceptManagerB(router.fetchMock);
    document.getElementById("publish-to-b").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "STRICT_STOP"
      )
    );
    expect(
      router.calls.filter((call) => call.url.endsWith("strict-manager-outbox"))
    ).toHaveLength(1);
  });

  it("stops after one mismatched fresh publisher response without replay", async () => {
    const router = createFetchRouter({
      sessionUsers: [MANAGER_B_ID, MANAGER_B_ID, MANAGER_B_ID],
      publisher: [publisherResponse({ replayed: true })],
    });
    await acceptManagerB(router.fetchMock);
    document.getElementById("publish-to-b").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "PUBLISHER_FRESH_MISMATCH"
      )
    );
    expect(
      router.calls.filter((call) => call.url.endsWith("strict-manager-outbox"))
    ).toHaveLength(1);
  });

  it("issues exactly the fresh publisher call and one exact zero-write replay", async () => {
    const router = createFetchRouter({
      sessionUsers: [MANAGER_B_ID, MANAGER_B_ID, MANAGER_B_ID],
      publisher: [publisherResponse(), publisherResponse({ replayed: true })],
    });
    await acceptManagerB(router.fetchMock);
    document.getElementById("publish-to-b").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "PUBLISH_AND_REPLAY_OK"
      )
    );
    const publisherCalls = router.calls.filter((call) =>
      call.url.endsWith("strict-manager-outbox")
    );
    const acceptanceCall = router.calls.find((call) =>
      call.url.endsWith(`/${NEW_ASSIGNMENT_ID}/accept`)
    );
    expectExactUnsafeRequest(acceptanceCall, {
      body: {},
      idempotencyKey: "HL-20260822-1-team1-to-b-accept",
    });
    expect(
      router.calls[router.calls.indexOf(acceptanceCall) - 1].url
    ).toBe(MARKER_URL);
    expect(publisherCalls).toHaveLength(2);
    const publisherBody = {
      backendBuildId: BACKEND_BUILD_ID,
      confirmation: "PUBLISH-HL-20260822-1-TEAM1-TO-MANAGER-B",
      phase: "team1-to-manager-b",
      releaseId: RELEASE_ID,
    };
    for (const publisherCall of publisherCalls) {
      expectExactUnsafeRequest(publisherCall, {
        body: publisherBody,
        idempotencyKey: "HL-20260822-1-outbox-team1-to-manager-b",
      });
      expectExactMarkerRequest(
        router.calls[router.calls.indexOf(publisherCall) - 1]
      );
    }
    expect(publisherCalls[1].options.body).toBe(publisherCalls[0].options.body);
    expect(
      publisherCalls[1].options.headers["Idempotency-Key"]
    ).toBe(publisherCalls[0].options.headers["Idempotency-Key"]);
  });

  it("stops after a replay failure and does not issue a third publisher call", async () => {
    const router = createFetchRouter({
      sessionUsers: [MANAGER_B_ID, MANAGER_B_ID, MANAGER_B_ID],
      publisher: [publisherResponse(), errorResponse()],
    });
    await acceptManagerB(router.fetchMock);
    document.getElementById("publish-to-b").click();
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "STRICT_STOP"
      )
    );
    expect(
      router.calls.filter((call) => call.url.endsWith("strict-manager-outbox"))
    ).toHaveLength(2);
  });

  it("guards navigation while an unsafe publisher sequence is unresolved", async () => {
    let resolvePublisher;
    const pendingPublisher = new Promise((resolve) => {
      resolvePublisher = resolve;
    });
    const router = createFetchRouter({
      sessionUsers: [MANAGER_B_ID, MANAGER_B_ID, MANAGER_B_ID],
      publisher: [() => pendingPublisher],
    });
    await acceptManagerB(router.fetchMock);
    document.getElementById("publish-to-b").click();
    await vi.waitFor(() =>
      expect(
        router.calls.filter((call) => call.url.endsWith("strict-manager-outbox"))
      ).toHaveLength(1)
    );
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    resolvePublisher(errorResponse());
    await vi.waitFor(() =>
      expect(document.getElementById("output-to-b").textContent).toContain(
        "STRICT_STOP"
      )
    );
  });
});
