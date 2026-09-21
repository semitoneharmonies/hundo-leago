import { QueryClient } from "@tanstack/react-query";

"use strict";

(() => {
  const FRONTEND_ORIGIN = "https://staging.hundoleago.com";
  const EXPECTED_PATH =
    "/release-qa/hl-20260821-3/strict-manager-transfer";
  const API_ORIGIN = "https://api-staging.hundoleago.com";
  const ACTIVATION_URL =
    "https://staging.hundoleago.com/release-qa/hl-20260821-3/enabled.json";
  const RELEASE_ID = "HL-20260821-3";
  const EXPIRES_AT = "2026-08-23T07:00:00.000Z";
  const EXPIRES_AT_MS = Date.parse(EXPIRES_AT);
  const BACKEND_BUILD_ID = "23971a4d66ee6383c6ad54339e769dbc9a76561e";
  const FRONTEND_BUILD_ID = "0e8eee92e2e323dd7f25ec3112988feaf23f96f0";
  const ENVIRONMENT_ID = "test:release-qa";
  const DATABASE_ID = "m7-release-qa-fixture";
  const LEAGUE_ID = "60c82aa0-54f9-4c93-83f5-73b0d6d6f63e";
  const TEAM_ID = "ebc815c7-8a41-4326-8faf-04548aa91c76";
  const ADMIN_ID = "dbc0118a-21f9-408c-abf5-b01d9ca05e64";
  const MANAGER_A_ID = "e9f723c4-32d2-4823-a1d4-233fe0ce2f45";
  const MANAGER_B_ID = "c2684bf0-d30d-4b37-ae14-66620259798e";
  const UUID_V4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const CSRF_VALUE = /^[A-Za-z0-9_-]{43}$/;
  const SAFE_SERVER_CODE = /^[A-Z][A-Z0-9_]{2,99}$/;

  const actionQueryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  const PHASES = Object.freeze({
    toB: Object.freeze({
      assignmentInputId: "assignment-to-b",
      outputId: "output-to-b",
      proposeButtonId: "propose-to-b",
      acceptButtonId: "accept-to-b",
      publishButtonId: "publish-to-b",
      targetUserId: MANAGER_B_ID,
      previousManagerUserId: MANAGER_A_ID,
      proposalKey: "HL-20260821-3-team1-to-b-propose",
      acceptanceKey: "HL-20260821-3-team1-to-b-accept",
      publisherKey: "HL-20260821-3-outbox-team1-to-manager-b",
      publisherPhase: "team1-to-manager-b",
      confirmation: "PUBLISH-HL-20260821-3-TEAM1-TO-MANAGER-B",
    }),
    toA: Object.freeze({
      assignmentInputId: "assignment-to-a",
      outputId: "output-to-a",
      proposeButtonId: "propose-to-a",
      acceptButtonId: "accept-to-a",
      publishButtonId: "publish-to-a",
      targetUserId: MANAGER_A_ID,
      previousManagerUserId: MANAGER_B_ID,
      proposalKey: "HL-20260821-3-team1-to-a-propose",
      acceptanceKey: "HL-20260821-3-team1-to-a-accept",
      publisherKey: "HL-20260821-3-outbox-team1-return-to-manager-a",
      publisherPhase: "team1-return-to-manager-a",
      confirmation: "PUBLISH-HL-20260821-3-TEAM1-RETURN-TO-MANAGER-A",
    }),
  });

  class StrictHelperError extends Error {
    constructor(code, safeDetails = {}) {
      super(code);
      this.name = "StrictHelperError";
      this.code = code;
      this.safeDetails = Object.freeze({ ...safeDetails });
    }
  }

  const state = {
    activeUserId: null,
    armed: false,
    busy: false,
    stopped: false,
    unsafeSequenceInFlight: false,
    phases: {
      toB: { assignmentId: null, acceptedAssignmentId: null, published: false },
      toA: { assignmentId: null, acceptedAssignmentId: null, published: false },
    },
  };

  const elements = {
    guardStatus: document.getElementById("guard-status"),
    verifySession: document.getElementById("verify-session"),
    sessionOutput: document.getElementById("session-output"),
    armWrites: document.getElementById("arm-writes"),
  };

  function isPlainObject(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function hasExactKeys(value, keys) {
    return (
      isPlainObject(value) &&
      Object.keys(value).sort().join("\u0000") ===
        [...keys].sort().join("\u0000")
    );
  }

  function requireCondition(condition, code, safeDetails = {}) {
    if (!condition) throw new StrictHelperError(code, safeDetails);
  }

  function setOutput(element, value) {
    element.textContent = JSON.stringify(value, null, 2);
  }

  function queryClientAssertion() {
    const queryCacheSize = actionQueryClient.getQueryCache().getAll().length;
    const mutationCacheSize =
      actionQueryClient.getMutationCache().getAll().length;
    requireCondition(
      actionQueryClient instanceof QueryClient &&
        queryCacheSize === 0 &&
        mutationCacheSize === 0,
      "ACTION_QUERY_CLIENT_BOUNDARY_MISMATCH"
    );
    return { queryClientPresent: true, queryCacheSize, mutationCacheSize };
  }

  function safeServerErrorCode(payload) {
    const value = payload?.error?.code;
    return typeof value === "string" && SAFE_SERVER_CODE.test(value)
      ? value
      : "UNAVAILABLE";
  }

  function responseMediaType(response) {
    return (response.headers.get("content-type") || "")
      .split(";", 1)[0]
      .trim()
      .toLowerCase();
  }

  function safeFailure(error) {
    if (error instanceof StrictHelperError) {
      return { reason: error.code, ...error.safeDetails };
    }
    return { reason: "NETWORK_OR_BROWSER_FAILURE" };
  }

  function roleForUser(userId) {
    if (userId === ADMIN_ID) return "Admin";
    if (userId === MANAGER_A_ID) return "Manager A";
    if (userId === MANAGER_B_ID) return "Manager B";
    return null;
  }

  function phaseElements(phase) {
    return {
      assignmentInput: document.getElementById(phase.assignmentInputId),
      output: document.getElementById(phase.outputId),
      proposeButton: document.getElementById(phase.proposeButtonId),
      acceptButton: document.getElementById(phase.acceptButtonId),
      publishButton: document.getElementById(phase.publishButtonId),
    };
  }

  function currentAssignmentId(phase) {
    return phaseElements(phase).assignmentInput.value.trim().toLowerCase();
  }

  function phaseKeyForPublisherPhase(publisherPhase) {
    return (
      Object.entries(PHASES).find(
        ([, phase]) => phase.publisherPhase === publisherPhase
      )?.[0] || null
    );
  }

  function readAssignmentFragment() {
    if (window.location.hash === "") return null;
    const values = new URLSearchParams(window.location.hash.slice(1));
    const entries = [...values.entries()];
    const publisherPhase = values.get("phase");
    const assignmentId = values.get("assignmentId")?.toLowerCase() || "";
    const phaseKey = phaseKeyForPublisherPhase(publisherPhase);
    requireCondition(
      entries.length === 2 &&
        values.getAll("phase").length === 1 &&
        values.getAll("assignmentId").length === 1 &&
        phaseKey !== null &&
        UUID_V4.test(assignmentId),
      "ASSIGNMENT_FRAGMENT_MISMATCH"
    );
    return { assignmentId, phaseKey };
  }

  function setAssignmentFragment(phase, assignmentId) {
    const fragment = new URLSearchParams({
      phase: phase.publisherPhase,
      assignmentId,
    });
    window.history.replaceState(null, "", `#${fragment.toString()}`);
    return `${FRONTEND_ORIGIN}${EXPECTED_PATH}#${fragment.toString()}`;
  }

  function renderControls() {
    const unavailable = state.stopped || state.busy;
    elements.verifySession.disabled = unavailable;
    elements.armWrites.disabled = state.stopped;
    state.armed = elements.armWrites.checked && !state.stopped;

    for (const [phaseKey, phase] of Object.entries(PHASES)) {
      const controls = phaseElements(phase);
      const runtime = state.phases[phaseKey];
      const assignmentId = currentAssignmentId(phase);
      const exactAssignment = UUID_V4.test(assignmentId);
      controls.assignmentInput.disabled = state.stopped || runtime.published;
      controls.proposeButton.disabled =
        unavailable ||
        !state.armed ||
        state.activeUserId !== ADMIN_ID ||
        runtime.assignmentId !== null ||
        (phaseKey === "toA" && state.phases.toB.published !== true);
      controls.acceptButton.disabled =
        unavailable ||
        !state.armed ||
        state.activeUserId !== phase.targetUserId ||
        !exactAssignment ||
        runtime.acceptedAssignmentId === assignmentId ||
        runtime.published;
      controls.publishButton.disabled =
        unavailable ||
        !state.armed ||
        state.activeUserId !== phase.targetUserId ||
        runtime.acceptedAssignmentId !== assignmentId ||
        runtime.published;
    }
  }

  function strictStop(action, error, output) {
    state.stopped = true;
    state.activeUserId = null;
    elements.armWrites.checked = false;
    elements.guardStatus.className = "status status-stop";
    elements.guardStatus.textContent =
      "STRICT STOP — do not reload or retry. Restore the full hold and use abort recovery.";
    setOutput(output, {
      status: "STRICT_STOP",
      action,
      ...safeFailure(error),
      releaseId: RELEASE_ID,
    });
    renderControls();
  }

  async function requestJson(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API_ORIGIN}${path}`, {
        cache: "no-store",
        credentials: "include",
        mode: "cors",
        redirect: "error",
        referrerPolicy: "no-referrer",
        ...options,
      });
    } catch {
      throw new StrictHelperError("NETWORK_OR_BROWSER_FAILURE");
    }
    requireCondition(
      responseMediaType(response) === "application/json",
      "NON_JSON_RESPONSE",
      { httpStatus: response.status }
    );
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new StrictHelperError("MALFORMED_JSON_RESPONSE", {
        httpStatus: response.status,
      });
    }
    requireCondition(isPlainObject(payload), "INVALID_RESPONSE_ENVELOPE", {
      httpStatus: response.status,
    });
    return { httpStatus: response.status, ok: response.ok, payload };
  }

  async function requireActivationMarker() {
    requireCondition(
      Date.now() < EXPIRES_AT_MS,
      "FIXTURE_ACTION_HORIZON_EXPIRED"
    );
    let response;
    try {
      response = await fetch(ACTIVATION_URL, {
        cache: "no-store",
        credentials: "same-origin",
        method: "GET",
        redirect: "error",
        referrerPolicy: "no-referrer",
      });
    } catch {
      throw new StrictHelperError("ACTIVATION_MARKER_UNAVAILABLE");
    }
    requireCondition(
      response.status === 200 &&
        response.ok &&
        response.url === ACTIVATION_URL &&
        response.type === "basic" &&
        responseMediaType(response) === "application/json",
      "ACTIVATION_MARKER_RESPONSE_MISMATCH",
      { httpStatus: response.status }
    );
    let marker;
    try {
      marker = await response.json();
    } catch {
      throw new StrictHelperError("ACTIVATION_MARKER_JSON_MISMATCH");
    }
    requireCondition(
      hasExactKeys(marker, [
        "contractVersion",
        "enabled",
        "releaseId",
        "frontendBuildId",
        "backendBuildId",
        "frontendOrigin",
        "apiOrigin",
        "expiresAt",
      ]) &&
        marker.contractVersion === 1 &&
        marker.enabled === true &&
        marker.releaseId === RELEASE_ID &&
        marker.frontendBuildId === FRONTEND_BUILD_ID &&
        marker.backendBuildId === BACKEND_BUILD_ID &&
        marker.frontendOrigin === FRONTEND_ORIGIN &&
        marker.apiOrigin === API_ORIGIN &&
        marker.expiresAt === EXPIRES_AT &&
        Date.now() < EXPIRES_AT_MS,
      "ACTIVATION_MARKER_CONTENT_MISMATCH"
    );
  }

  function requireSuccessfulEnvelope(result, expectedStatus) {
    requireCondition(
      result.ok && result.httpStatus === expectedStatus,
      "UNEXPECTED_HTTP_RESPONSE",
      {
        httpStatus: result.httpStatus,
        serverCode: safeServerErrorCode(result.payload),
      }
    );
    requireCondition(
      hasExactKeys(result.payload, ["data", "meta"]) &&
        hasExactKeys(result.payload.meta, ["requestId"]) &&
        typeof result.payload.meta.requestId === "string" &&
        /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(
          result.payload.meta.requestId
        ),
      "INVALID_RESPONSE_ENVELOPE",
      { httpStatus: result.httpStatus }
    );
    return result.payload.data;
  }

  async function loadSession(expectedUserId = null) {
    const result = await requestJson("/api/v1/session", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const data = requireSuccessfulEnvelope(result, 200);
    requireCondition(
      hasExactKeys(data, ["csrfToken", "session", "user"]) &&
        CSRF_VALUE.test(data.csrfToken || "") &&
        hasExactKeys(data.session, [
          "id",
          "userId",
          "status",
          "createdAtMs",
          "lastUsedAtMs",
          "idleExpiresAtMs",
          "absoluteExpiresAtMs",
          "version",
        ]) &&
        hasExactKeys(data.user, ["id", "displayName", "status", "version"]) &&
        UUID_V4.test(data.session.id || "") &&
        UUID_V4.test(data.user.id || "") &&
        data.session.userId === data.user.id &&
        data.session.status === "active" &&
        data.user.status === "active" &&
        typeof data.user.displayName === "string" &&
        data.user.displayName === data.user.displayName.trim() &&
        data.user.displayName.length > 0 &&
        data.user.displayName.length <= 80 &&
        Number.isSafeInteger(data.session.createdAtMs) &&
        data.session.createdAtMs >= 0 &&
        Number.isSafeInteger(data.session.lastUsedAtMs) &&
        data.session.lastUsedAtMs >= data.session.createdAtMs &&
        Number.isSafeInteger(data.session.idleExpiresAtMs) &&
        data.session.idleExpiresAtMs >= data.session.lastUsedAtMs &&
        Number.isSafeInteger(data.session.absoluteExpiresAtMs) &&
        data.session.absoluteExpiresAtMs >= data.session.idleExpiresAtMs &&
        Number.isSafeInteger(data.session.version) &&
        data.session.version > 0 &&
        Number.isSafeInteger(data.user.version) &&
        data.user.version > 0,
      "SESSION_RESPONSE_MISMATCH"
    );
    const role = roleForUser(data.user.id);
    requireCondition(role !== null, "UNRECOGNIZED_RELEASE_QA_ACCOUNT");
    if (expectedUserId !== null) {
      requireCondition(data.user.id === expectedUserId, "CALLER_IDENTITY_MISMATCH", {
        expectedRole: roleForUser(expectedUserId),
        actualRole: role,
      });
    }
    return { csrfValue: data.csrfToken, userId: data.user.id, role };
  }

  async function verifySession() {
    if (state.stopped || state.busy) return;
    state.busy = true;
    state.activeUserId = null;
    renderControls();
    try {
      queryClientAssertion();
      const session = await loadSession();
      queryClientAssertion();
      state.activeUserId = session.userId;
      setOutput(elements.sessionOutput, {
        status: "SESSION_VERIFIED",
        role: session.role,
        userId: session.userId,
        releaseId: RELEASE_ID,
        ...queryClientAssertion(),
      });
    } catch (error) {
      setOutput(elements.sessionOutput, {
        status: "SESSION_NOT_VERIFIED",
        ...safeFailure(error),
        releaseId: RELEASE_ID,
      });
    } finally {
      state.busy = false;
      renderControls();
    }
  }

  function requireTeamPrecheckData(data, phase) {
    requireCondition(
      hasExactKeys(data, ["code", "team"]) &&
        data.code === "TEAM_FOUND" &&
        hasExactKeys(data.team, [
          "id",
          "leagueId",
          "name",
          "status",
          "primaryColour",
          "secondaryColour",
          "tertiaryColour",
          "patternTemplate",
          "logoReference",
          "createdAtMs",
          "updatedAtMs",
          "version",
          "currentManager",
        ]) &&
        data.team.id === TEAM_ID &&
        data.team.leagueId === LEAGUE_ID &&
        data.team.status === "active" &&
        typeof data.team.name === "string" &&
        data.team.name.trim().length > 0 &&
        Number.isSafeInteger(data.team.createdAtMs) &&
        data.team.createdAtMs > 0 &&
        Number.isSafeInteger(data.team.updatedAtMs) &&
        data.team.updatedAtMs >= data.team.createdAtMs &&
        Number.isSafeInteger(data.team.version) &&
        data.team.version > 0 &&
        hasExactKeys(data.team.currentManager, [
          "assignmentId",
          "userId",
          "displayName",
          "isProtectedPlatformAdministrator",
          "acceptedAtMs",
          "version",
        ]) &&
        UUID_V4.test(data.team.currentManager.assignmentId || "") &&
        data.team.currentManager.userId === phase.previousManagerUserId &&
        typeof data.team.currentManager.displayName === "string" &&
        data.team.currentManager.displayName.trim().length > 0 &&
        data.team.currentManager.isProtectedPlatformAdministrator === false &&
        Number.isSafeInteger(data.team.currentManager.acceptedAtMs) &&
        data.team.currentManager.acceptedAtMs > 0 &&
        Number.isSafeInteger(data.team.currentManager.version) &&
        data.team.currentManager.version > 0,
      "TEAM_PRECHECK_MISMATCH"
    );
    return data.team.currentManager.assignmentId;
  }

  function requireAssignmentData(
    data,
    phase,
    assignmentId,
    stage,
    expectedReplacedAssignmentId = null
  ) {
    const expectedCode =
      stage === "accepted"
        ? "TEAM_MANAGER_ASSIGNMENT_ACCEPTED"
        : stage === "pending-read"
          ? "TEAM_MANAGER_ASSIGNMENT_FOUND"
          : "TEAM_MANAGER_ASSIGNMENT_PROPOSED";
    const expectedCurrentManager =
      stage === "accepted"
        ? phase.targetUserId
        : phase.previousManagerUserId;
    requireCondition(
      hasExactKeys(data, [
        "code",
        "assignment",
        "league",
        "team",
        "proposedUser",
        "membership",
        "replacedManager",
      ]) &&
        data.code === expectedCode &&
        hasExactKeys(data.assignment, [
          "id",
          "status",
          "assignedAtMs",
          "acceptedAtMs",
          "endedAtMs",
          "assignedByUserId",
          "replacesAssignmentId",
          "version",
        ]) &&
        data.assignment.id === assignmentId &&
        data.assignment.status === (stage === "accepted" ? "accepted" : "pending") &&
        data.assignment.assignedByUserId === ADMIN_ID &&
        UUID_V4.test(data.assignment.replacesAssignmentId || "") &&
        Number.isSafeInteger(data.assignment.assignedAtMs) &&
        data.assignment.assignedAtMs > 0 &&
        data.assignment.endedAtMs === null &&
        Number.isSafeInteger(data.assignment.version) &&
        data.assignment.version === (stage === "accepted" ? 2 : 1) &&
        (stage === "accepted"
          ? Number.isSafeInteger(data.assignment.acceptedAtMs) &&
            data.assignment.acceptedAtMs >= data.assignment.assignedAtMs
          : data.assignment.acceptedAtMs === null) &&
        hasExactKeys(data.league, ["id", "name", "status", "version"]) &&
        data.league.id === LEAGUE_ID &&
        data.league.status === "active" &&
        typeof data.league.name === "string" &&
        data.league.name.trim().length > 0 &&
        Number.isSafeInteger(data.league.version) &&
        data.league.version > 0 &&
        hasExactKeys(data.team, [
          "id",
          "name",
          "status",
          "version",
          "currentManager",
        ]) &&
        data.team.id === TEAM_ID &&
        data.team.status === "active" &&
        typeof data.team.name === "string" &&
        data.team.name.trim().length > 0 &&
        Number.isSafeInteger(data.team.version) &&
        data.team.version > 0 &&
        hasExactKeys(data.team.currentManager, [
          "assignmentId",
          "userId",
          "displayName",
          "version",
        ]) &&
        data.team.currentManager.userId === expectedCurrentManager &&
        UUID_V4.test(data.team.currentManager.assignmentId || "") &&
        Number.isSafeInteger(data.team.currentManager.version) &&
        data.team.currentManager.version > 0 &&
        (stage === "accepted"
          ? data.team.currentManager.assignmentId === assignmentId
          : data.team.currentManager.assignmentId ===
            data.assignment.replacesAssignmentId) &&
        hasExactKeys(data.proposedUser, ["id", "displayName"]) &&
        data.proposedUser.id === phase.targetUserId &&
        typeof data.proposedUser.displayName === "string" &&
        data.proposedUser.displayName.trim().length > 0 &&
        hasExactKeys(data.membership, [
          "id",
          "permissionCategory",
          "status",
          "version",
        ]) &&
        UUID_V4.test(data.membership.id || "") &&
        data.membership.permissionCategory === "manager" &&
        data.membership.status === "active" &&
        Number.isSafeInteger(data.membership.version) &&
        data.membership.version > 0 &&
        hasExactKeys(data.replacedManager, [
          "assignmentId",
          "userId",
          "displayName",
          "status",
          "version",
        ]) &&
        data.replacedManager.assignmentId ===
          data.assignment.replacesAssignmentId &&
        data.replacedManager.userId === phase.previousManagerUserId &&
        typeof data.replacedManager.displayName === "string" &&
        data.replacedManager.displayName.trim().length > 0 &&
        Number.isSafeInteger(data.replacedManager.version) &&
        data.replacedManager.version > 0 &&
        data.replacedManager.status ===
          (stage === "accepted" ? "ended" : "accepted") &&
        (expectedReplacedAssignmentId === null ||
          data.assignment.replacesAssignmentId ===
            expectedReplacedAssignmentId),
      "ASSIGNMENT_RESPONSE_MISMATCH"
    );
    return data;
  }

  async function writeJson(path, body, idempotencyKey, csrfValue) {
    await requireActivationMarker();
    return requestJson(path, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "X-CSRF-Token": csrfValue,
      },
      body: JSON.stringify(body),
    });
  }

  async function runWrite(action, output, operation) {
    if (state.stopped || state.busy || !state.armed) return;
    state.busy = true;
    state.unsafeSequenceInFlight = true;
    renderControls();
    try {
      queryClientAssertion();
      await operation();
      queryClientAssertion();
    } catch (error) {
      strictStop(action, error, output);
    } finally {
      state.unsafeSequenceInFlight = false;
      state.busy = false;
      renderControls();
    }
  }

  async function propose(phaseKey) {
    const phase = PHASES[phaseKey];
    const controls = phaseElements(phase);
    await runWrite(`PROPOSE_${phase.publisherPhase}`, controls.output, async () => {
      requireCondition(
        phaseKey !== "toA" || state.phases.toB.published === true,
        "PHASE_ONE_PUBLICATION_NOT_PROVEN_IN_THIS_TAB"
      );
      const session = await loadSession(ADMIN_ID);
      const teamPrecheck = await requestJson(
        `/api/v1/leagues/${LEAGUE_ID}/teams/${TEAM_ID}`,
        { method: "GET", headers: { Accept: "application/json" } }
      );
      const replacedAssignmentId = requireTeamPrecheckData(
        requireSuccessfulEnvelope(teamPrecheck, 200),
        phase
      );
      const result = await writeJson(
        `/api/v1/leagues/${LEAGUE_ID}/teams/${TEAM_ID}/manager-assignment`,
        { userId: phase.targetUserId },
        phase.proposalKey,
        session.csrfValue
      );
      const data = requireSuccessfulEnvelope(result, 201);
      const assignmentId = data?.assignment?.id;
      requireCondition(UUID_V4.test(assignmentId || ""), "ASSIGNMENT_ID_MISMATCH");
      requireAssignmentData(
        data,
        phase,
        assignmentId,
        "proposed",
        replacedAssignmentId
      );
      state.phases[phaseKey].assignmentId = assignmentId;
      controls.assignmentInput.value = assignmentId;
      const acceptingManagerActionUrl = setAssignmentFragment(
        phase,
        assignmentId
      );
      setOutput(controls.output, {
        status: "PROPOSAL_OK",
        httpStatus: result.httpStatus,
        phase: phase.publisherPhase,
        assignmentId,
        acceptingManagerActionUrl,
        currentManagerUserId: phase.previousManagerUserId,
        proposedUserId: phase.targetUserId,
        releaseId: RELEASE_ID,
        ...queryClientAssertion(),
      });
    });
  }

  async function accept(phaseKey) {
    const phase = PHASES[phaseKey];
    const controls = phaseElements(phase);
    const assignmentId = currentAssignmentId(phase);
    await runWrite(`ACCEPT_${phase.publisherPhase}`, controls.output, async () => {
      requireCondition(UUID_V4.test(assignmentId), "ASSIGNMENT_ID_MISMATCH");
      const session = await loadSession(phase.targetUserId);
      const preflight = await requestJson(
        `/api/v1/team-manager-assignments/${assignmentId}`,
        { method: "GET", headers: { Accept: "application/json" } }
      );
      requireAssignmentData(
        requireSuccessfulEnvelope(preflight, 200),
        phase,
        assignmentId,
        "pending-read"
      );
      const result = await writeJson(
        `/api/v1/team-manager-assignments/${assignmentId}/accept`,
        {},
        phase.acceptanceKey,
        session.csrfValue
      );
      requireAssignmentData(
        requireSuccessfulEnvelope(result, 200),
        phase,
        assignmentId,
        "accepted"
      );
      state.phases[phaseKey].acceptedAssignmentId = assignmentId;
      setOutput(controls.output, {
        status: "ACCEPTANCE_OK",
        httpStatus: result.httpStatus,
        phase: phase.publisherPhase,
        assignmentId,
        currentManagerUserId: phase.targetUserId,
        releaseId: RELEASE_ID,
        ...queryClientAssertion(),
      });
    });
  }

  function requirePublisherData(data, phase, assignmentId, replayed) {
    requireCondition(
      hasExactKeys(data, [
        "code",
        "contractVersion",
        "releaseId",
        "phase",
        "environmentId",
        "databaseId",
        "schemaVersion",
        "backendBuildId",
        "frontendBuildId",
        "leagueId",
        "teamId",
        "assignmentId",
        "eventId",
        "outcome",
        "replayed",
        "databaseWriteCount",
        "schedulerRemainedDisabled",
      ]) &&
        data.code === "RELEASE_QA_STRICT_MANAGER_OUTBOX_PUBLISHED" &&
        data.contractVersion === 1 &&
        data.releaseId === RELEASE_ID &&
        data.phase === phase.publisherPhase &&
        data.environmentId === ENVIRONMENT_ID &&
        data.databaseId === DATABASE_ID &&
        data.schemaVersion === 54 &&
        data.backendBuildId === BACKEND_BUILD_ID &&
        data.frontendBuildId === FRONTEND_BUILD_ID &&
        data.leagueId === LEAGUE_ID &&
        data.teamId === TEAM_ID &&
        data.assignmentId === assignmentId &&
        UUID_V4.test(data.eventId || "") &&
        data.outcome === "published" &&
        data.replayed === replayed &&
        data.databaseWriteCount === (replayed ? 0 : 2) &&
        data.schedulerRemainedDisabled === true,
      replayed ? "PUBLISHER_REPLAY_MISMATCH" : "PUBLISHER_FRESH_MISMATCH"
    );
    return data;
  }

  async function publishAndVerifyReplay(phaseKey) {
    const phase = PHASES[phaseKey];
    const controls = phaseElements(phase);
    const assignmentId = currentAssignmentId(phase);
    await runWrite(`PUBLISH_${phase.publisherPhase}`, controls.output, async () => {
      requireCondition(
        state.phases[phaseKey].acceptedAssignmentId === assignmentId,
        "ACCEPTANCE_NOT_PROVEN_IN_THIS_TAB"
      );
      const session = await loadSession(phase.targetUserId);
      const body = {
        backendBuildId: BACKEND_BUILD_ID,
        confirmation: phase.confirmation,
        phase: phase.publisherPhase,
        releaseId: RELEASE_ID,
      };
      const freshResult = await writeJson(
        "/api/v1/operations/release-qa/strict-manager-outbox",
        body,
        phase.publisherKey,
        session.csrfValue
      );
      const fresh = requirePublisherData(
        requireSuccessfulEnvelope(freshResult, 200),
        phase,
        assignmentId,
        false
      );
      const replaySession = await loadSession(phase.targetUserId);
      const replayResult = await writeJson(
        "/api/v1/operations/release-qa/strict-manager-outbox",
        body,
        phase.publisherKey,
        replaySession.csrfValue
      );
      const replay = requirePublisherData(
        requireSuccessfulEnvelope(replayResult, 200),
        phase,
        assignmentId,
        true
      );
      requireCondition(replay.eventId === fresh.eventId, "PUBLISHER_EVENT_ID_MISMATCH");
      state.phases[phaseKey].published = true;
      setOutput(controls.output, {
        status: "PUBLISH_AND_REPLAY_OK",
        phase: phase.publisherPhase,
        assignmentId,
        eventId: fresh.eventId,
        fresh: {
          httpStatus: freshResult.httpStatus,
          replayed: false,
          databaseWriteCount: 2,
          schedulerRemainedDisabled: true,
        },
        replay: {
          httpStatus: replayResult.httpStatus,
          replayed: true,
          databaseWriteCount: 0,
          schedulerRemainedDisabled: true,
        },
        releaseId: RELEASE_ID,
        ...queryClientAssertion(),
      });
    });
  }

  function bindControls() {
    window.addEventListener("beforeunload", (event) => {
      if (!state.unsafeSequenceInFlight) return;
      event.preventDefault();
      event.returnValue = "";
    });
    elements.verifySession.addEventListener("click", () => {
      void verifySession();
    });
    elements.armWrites.addEventListener("change", renderControls);
    for (const [phaseKey, phase] of Object.entries(PHASES)) {
      const controls = phaseElements(phase);
      controls.assignmentInput.addEventListener("input", renderControls);
      controls.proposeButton.addEventListener("click", () => {
        void propose(phaseKey);
      });
      controls.acceptButton.addEventListener("click", () => {
        void accept(phaseKey);
      });
      controls.publishButton.addEventListener("click", () => {
        void publishAndVerifyReplay(phaseKey);
      });
    }
  }

  function initialize() {
    bindControls();
    if (
      window.location.origin !== FRONTEND_ORIGIN ||
      window.location.pathname !== EXPECTED_PATH ||
      window.location.protocol !== "https:" ||
      window.location.search !== ""
    ) {
      strictStop(
        "ORIGIN_GUARD",
        new StrictHelperError("EXACT_STAGING_ORIGIN_REQUIRED"),
        elements.sessionOutput
      );
      return;
    }
    let fragment = null;
    try {
      queryClientAssertion();
      requireCondition(
        Date.now() < EXPIRES_AT_MS,
        "FIXTURE_ACTION_HORIZON_EXPIRED"
      );
      fragment = readAssignmentFragment();
    } catch (error) {
      strictStop("LOCAL_BOUNDARY_GUARD", error, elements.sessionOutput);
      return;
    }
    if (fragment !== null) {
      const phase = PHASES[fragment.phaseKey];
      phaseElements(phase).assignmentInput.value = fragment.assignmentId;
    }
    elements.guardStatus.className = "status status-ready";
    elements.guardStatus.textContent =
      "Exact staging page boundary and separate empty QueryClient verified locally. No helper fetch, API, XHR, or WebSocket request has run after the static asset loads.";
    setOutput(elements.sessionOutput, {
      status: "READY_NO_SESSION_REQUEST",
      releaseId: RELEASE_ID,
      fragmentAssignmentLoaded: fragment !== null,
      ...queryClientAssertion(),
    });
    elements.verifySession.disabled = false;
    elements.armWrites.disabled = false;
    renderControls();
  }

  initialize();
})();
