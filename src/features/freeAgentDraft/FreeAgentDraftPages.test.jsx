import { screen, waitFor, within } from "@testing-library/react";
import { infiniteQueryOptions } from "@tanstack/react-query";
import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { routePaths } from "../../app/routePaths.js";
import { ApiError } from "../../shared/api/ApiError.js";
import { createQueryClient } from "../../shared/query/queryClient.js";
import { RealtimeContext } from "../../shared/realtime/realtimeContext.js";
import { renderWithProviders } from "../../test/render.jsx";
import { CandidateCardBuilder } from "./CandidateCardBuilder.jsx";
import {
  CandidateCardPage,
  CurrentFreeAgentDraftPage,
  DraftsPage,
  FreeAgentDraftAllocationResultsPage,
  FreeAgentDraftPage,
  FreeAgentDraftResultsPage,
} from "./FreeAgentDraftPages.jsx";
import { freeAgentDraftKeys } from "./freeAgentDraftQueries.js";
import { validatePublishedCandidateCard } from "./freeAgentDraftContracts.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const seasonId = "22222222-2222-4222-8222-222222222222";
const fadId = "33333333-3333-4333-8333-333333333333";
const teamId = "44444444-4444-4444-8444-444444444444";
const secondTeamId = "55555555-5555-4555-8555-555555555555";
const cardId = "66666666-6666-4666-8666-666666666666";
const assignmentId = "77777777-7777-4777-8777-777777777777";
const helpId = "88888888-8888-4888-8888-888888888888";
const replacementHelpId = "99999999-9999-4999-8999-999999999999";
const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const playerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const entryId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const restrictedAuctionId = "12121212-1212-4212-8212-121212121212";
const config = Object.freeze({
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
});

function envelope(data, status = 200) {
  return new Response(
    JSON.stringify({ data, meta: { requestId: "request-fad-ui" } }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

function session() {
  return {
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
      displayName: "FAD Manager",
      status: "active",
      version: 1,
    },
  };
}

function visibleLeague(permissionCategory = "manager") {
  return {
    id: leagueId,
    name: "Candidate League",
    status: "active",
    timezone: "America/Vancouver",
    currentSeason: {
      id: seasonId,
      label: "2026-27",
      status: "active",
      version: 1,
    },
    membership: {
      effectiveAuthority: permissionCategory,
      id: userId,
      permissionCategory,
      status: "active",
      version: 1,
    },
    version: 1,
  };
}

function team(id = teamId, name = "Candidate Owls") {
  return {
    teamId: id,
    name,
    primaryColour: "#112233",
    secondaryColour: "#ffffff",
    tertiaryColour: null,
    patternTemplate: "solid",
    logoReference: null,
  };
}

function leagueTeam(id = teamId, name = "Candidate Owls", currentManager = null) {
  return {
    id,
    leagueId,
    name,
    currentManager,
    version: 1,
  };
}

function currentManager() {
  return {
    assignmentId,
    userId,
    displayName: "FAD Manager",
    version: 1,
  };
}

function teamsFound(teams = [leagueTeam()]) {
  return { code: "TEAMS_FOUND", teams };
}

function authorizationEvidence(kind = "manager_assignment", id = assignmentId) {
  return { kind, id };
}

function descriptor({
  mode = "private_card",
  evidence = authorizationEvidence(),
} = {}) {
  return {
    mode,
    seasonId,
    fadId,
    teamId,
    cardId,
    authorizationEvidence: mode === "private_card" ? evidence : null,
  };
}

function managedCard({ includeDescriptor = true } = {}) {
  return {
    teamId,
    team: team(),
    cardId,
    managerAssignmentId: assignmentId,
    cardVersion: 1,
    lifecycleStatus: "open",
    completenessCode: "incomplete",
    missingMandatoryCount: 17,
    conflictCount: 0,
    capStatus: "compliant",
    allocationEligibility: "eligible",
    helpRequestStatus: "not_requested",
    ...(includeDescriptor ? { cardDescriptor: descriptor() } : {}),
  };
}

function overview({
  serverNowMs = 1_000_000,
  candidateDeadlineAtMs = serverNowMs + 60_000,
  managedCards = [managedCard()],
  commissionerCards = [],
} = {}) {
  return {
    leagueId,
    seasonId,
    fadId,
    version: 1,
    status: "cards_open",
    phase: "cards_open",
    serverNowMs,
    timeZone: "America/Vancouver",
    openedAtMs: serverNowMs - 10_000,
    reminderAtMs: serverNowMs + 10_000,
    helpOpensAtMs: serverNowMs + 20_000,
    candidateDeadlineAtMs,
    deadlineLockedAtMs: null,
    allocationCompletedAtMs: null,
    nextRolloverAtMs: serverNowMs + 70_000,
    frozenFadFirstMatchupStartsAtMs: serverNowMs + 100_000,
    competitionFirstMatchupStartsAtMs: serverNowMs + 100_000,
    scheduleRecoveryOperationId: null,
    completedAtMs: null,
    counts: {
      participatingTeams: 1,
      cardsLocked: 0,
      allocationsPending: 0,
      allocationsAutomatic: 0,
      restrictedPending: 0,
      restrictedFallbackPending: 0,
      rapidAuctionsOpen: 0,
      rolloversPersisted: 7,
      rolloversCompleted: 0,
      recoveriesOpen: 0,
    },
    viewer: {
      managedCards,
      commissionerCards,
      queuedNominations: [],
    },
    presentation: null,
    capabilities: {
      viewPublishedCards: { allowed: false, reasonCode: "PHASE_CLOSED" },
      viewRecovery: { allowed: false, reasonCode: "NOT_AUTHORIZED" },
      completeRecoveryAction: {
        allowed: false,
        reasonCode: "NOT_AUTHORIZED",
      },
    },
  };
}

function navigation({
  rosterLinks = [],
  managedCards = [
    { ...managedCard({ includeDescriptor: false }), urgencyCode: "CARD_INCOMPLETE" },
  ],
} = {}) {
  return {
    serverNowMs: 1_000_000,
    timeZone: "America/Vancouver",
    fadId,
    seasonId,
    phase: "cards_open",
    showMainNavigation: true,
    candidateDeadlineAtMs: 1_060_000,
    nextRolloverAtMs: 1_070_000,
    frozenFadFirstMatchupStartsAtMs: 1_100_000,
    competitionFirstMatchupStartsAtMs: 1_100_000,
    managedCards,
    rosterLinks,
    urgencyCode: "CARD_INCOMPLETE",
  };
}

const denied = (reasonCode = "ENTRY_NOT_EDITABLE") => ({
  allowed: false,
  reasonCode,
});

function emptySlot(slotKey) {
  const group = slotKey[0];
  return {
    slotKey,
    slotGroup: group,
    required: group !== "B",
    occupantKind: "empty",
    entryId: null,
    entryVersion: null,
    player: null,
    authoritativeRosterCategory: null,
    locked: false,
    totalValueCents: null,
    termYears: null,
    aavCents: null,
    remainingYears: null,
    validation: { status: "valid", codes: [] },
    outcome: null,
    lastEditedAtMs: null,
    lastEditedBy: null,
    capabilities: {
      addCandidate: { allowed: true, reasonCode: null },
      editCandidate: denied(),
      moveCandidate: denied(),
      moveCarryover: denied(),
      removeCandidate: denied(),
    },
  };
}

function slotKeys() {
  return [
    ...Array.from({ length: 12 }, (_, index) => `F${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 6 }, (_, index) => `D${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 4 }, (_, index) => `B${String(index + 1).padStart(2, "0")}`),
  ];
}

function candidateCard({
  accessReason = "team_manager",
  evidence = authorizationEvidence(),
  helpContext = null,
  privatePlayerName = null,
  candidatePlayerName = null,
} = {}) {
  const slots = slotKeys().map(emptySlot);
  if (privatePlayerName) {
    slots[0] = {
      ...emptySlot("F01"),
      occupantKind: "carryover",
      entryId,
      entryVersion: 1,
      player: { playerId, fullName: privatePlayerName, positionGroup: "F" },
      authoritativeRosterCategory: "Active",
      locked: true,
      totalValueCents: 1_200,
      termYears: 3,
      aavCents: 400,
      remainingYears: 2,
      lastEditedAtMs: 1,
      lastEditedBy: {
        userId: null,
        displayName: null,
        authority: "system",
      },
      capabilities: {
        addCandidate: denied("SLOT_OCCUPIED"),
        editCandidate: denied("SLOT_LOCKED"),
        moveCandidate: denied("SLOT_LOCKED"),
        moveCarryover: { allowed: true, reasonCode: null },
        removeCandidate: denied("SLOT_LOCKED"),
      },
    };
  }
  if (candidatePlayerName) {
    slots[1] = {
      ...emptySlot("F02"),
      occupantKind: "candidate",
      entryId,
      entryVersion: 1,
      player: { playerId, fullName: candidatePlayerName, positionGroup: "F" },
      locked: false,
      totalValueCents: 600,
      termYears: 1,
      aavCents: 600,
      lastEditedAtMs: 2,
      lastEditedBy: {
        userId,
        displayName: "FAD Manager",
        authority: "manager",
      },
      capabilities: {
        addCandidate: denied("SLOT_OCCUPIED"),
        editCandidate: { allowed: true, reasonCode: null },
        moveCandidate: { allowed: true, reasonCode: null },
        moveCarryover: denied("ENTRY_NOT_EDITABLE"),
        removeCandidate: { allowed: true, reasonCode: null },
      },
    };
  }
  return {
    leagueId,
    seasonId,
    fadId,
    teamId,
    cardId,
    cardVersion: 1,
    phase: "cards_open",
    visibilityMode: "private_editable",
    accessReason,
    authorizationEvidence: evidence,
    lifecycleStatus: "open",
    completeness: {
      code: "incomplete",
      filledMandatoryCount:
        (privatePlayerName ? 1 : 0) + (candidatePlayerName ? 1 : 0),
      missingMandatoryCount:
        18 - (privatePlayerName ? 1 : 0) - (candidatePlayerName ? 1 : 0),
      filledBenchCount: 0,
      emptyBenchCount: 4,
      blockingValidationCount: 0,
      structuralConflictCount: 0,
      carriedRosterStructuralConflictCount: 0,
    },
    capProjection: {
      capLimitCents: 10_000,
      carriedActivePlayerAmountCents: privatePlayerName ? 400 : 0,
      retentionObligationCents: 0,
      buyoutPenaltyCents: 0,
      carriedCapUsageCents: privatePlayerName ? 400 : 0,
      proposedCandidateAavCents: candidatePlayerName ? 600 : 0,
      maximumPossibleCapCents:
        (privatePlayerName ? 400 : 0) + (candidatePlayerName ? 600 : 0),
      maximumCapSpaceCents:
        10_000 -
        (privatePlayerName ? 400 : 0) -
        (candidatePlayerName ? 600 : 0),
    },
    capStatus: "compliant",
    allocationEligibility: "eligible",
    allocationExclusionReason: null,
    slots,
    conflicts: [],
    helpContext,
    commissionerInterventions: [],
    capabilities: {
      editCard: { allowed: true, reasonCode: null },
      requestHelp: { allowed: true, reasonCode: null },
      viewPublishedHistory: denied("PHASE_CLOSED"),
    },
  };
}

function publishedOverview() {
  const data = overview({ managedCards: [] });
  return {
    ...data,
    status: "allocating",
    phase: "allocating",
    deadlineLockedAtMs: data.serverNowMs - 5_000,
    counts: {
      ...data.counts,
      cardsLocked: 1,
      allocationsPending: 1,
    },
    capabilities: {
      viewPublishedCards: { allowed: true, reasonCode: null },
      viewRecovery: denied("NOT_AUTHORIZED"),
      completeRecoveryAction: denied("NOT_AUTHORIZED"),
    },
  };
}

function publishedSummary(summaryTeam = team()) {
  return {
    leagueId,
    seasonId,
    fadId,
    teamId: summaryTeam.teamId,
    team: summaryTeam,
    lifecycleStatus: "locked_incomplete",
    outcomeCounts: {
      signed: 1,
      notWon: 1,
      tied: 1,
    },
  };
}

function publishedResultsCard(
  resultTeam = team(),
  results = [
    ["Won Player", "signed", null, true],
    ["Tied Player", "tied", restrictedAuctionId, true],
    ["Not Won Player", "not_won", null, true],
  ]
) {
  return {
    leagueId,
    seasonId,
    fadId,
    teamId: resultTeam.teamId,
    team: resultTeam,
    results: results.map(
      ([fullName, status, tieAuctionId, includeOffer], index) => ({
        player: {
          playerId: `bbbbbbb${index}-bbbb-4bbb-8bbb-bbbbbbbbbbb${index}`,
          fullName,
          positionGroup: "F",
        },
        status,
        offer: includeOffer
          ? {
              totalValueCents: 300 * (index + 1),
              aavCents: 300,
              termYears: index + 1,
            }
          : null,
        tieAuctionId,
      })
    ),
  };
}

function collectionEnvelope(data, page = { nextCursor: null, hasMore: false }) {
  return new Response(
    JSON.stringify({ data, page, meta: { requestId: "request-fad-ui" } }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function helpContext(expiresAtMs) {
  return {
    helpRequestId: helpId,
    status: "active",
    message: "Please help with this card.",
    requestedByUserId: userId,
    requestedByDisplayName: "FAD Manager",
    requestedAtMs: expiresAtMs - 1_000,
    expiresAtMs,
  };
}

function baseFetch(extra, permissionCategory = "manager") {
  return vi.fn(async (url, options = {}) => {
    const parsed = new URL(url);
    if (parsed.pathname === "/api/v1/session") return envelope(session());
    if (parsed.pathname === "/api/v1/leagues") {
      return envelope({ code: "LEAGUES_FOUND", leagues: [visibleLeague(permissionCategory)] });
    }
    return extra(parsed, options);
  });
}

function renderRoute({
  path = `/leagues/${leagueId}/free-agent-draft/${fadId}/cards/${teamId}`,
  route = "/leagues/:leagueId/free-agent-draft/:fadId/cards/:teamId",
  element = <CandidateCardPage />,
  fetchImpl,
  queryClient,
  realtime = { status: "disconnected", privacyEpoch: 0 },
  additionalRoute = null,
}) {
  return renderWithProviders(
    <RealtimeContext.Provider value={realtime}>
      <Routes>
        <Route path={route} element={element} />
        {additionalRoute}
      </Routes>
    </RealtimeContext.Provider>,
    {
      initialEntries: [path],
      queryClient,
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    }
  );
}

function ResultsLocation() {
  const location = useLocation();
  return (
    <p data-testid="results-location">
      {location.pathname}
      {location.search}
    </p>
  );
}

function completedOverview() {
  const data = publishedOverview();
  return {
    ...data,
    status: "completed",
    phase: "completed",
    allocationCompletedAtMs: data.serverNowMs - 2_000,
    nextRolloverAtMs: null,
    completedAtMs: data.serverNowMs - 1_000,
    counts: {
      ...data.counts,
      allocationsPending: 0,
      rolloversCompleted: 7,
    },
  };
}

function completedNavigation() {
  return {
    ...navigation({ managedCards: [] }),
    phase: "completed",
    nextRolloverAtMs: null,
    urgencyCode: "NONE",
  };
}

function renderDraftsRoute(fetchImpl, path = routePaths.leagueDrafts(leagueId)) {
  return renderWithProviders(
    <RealtimeContext.Provider value={{ status: "disconnected", privacyEpoch: 0 }}>
      <Routes>
        <Route path="/leagues/:leagueId/drafts" element={<DraftsPage />} />
        <Route path="/leagues/:leagueId/drafts/:draftType" element={<DraftsPage />} />
        <Route
          path="/leagues/:leagueId/drafts/free-agent/:fadId/cards/:teamId"
          element={<CandidateCardPage />}
        />
        <Route
          path="/leagues/:leagueId/drafts/free-agent/:fadId/results"
          element={<FreeAgentDraftAllocationResultsPage />}
        />
      </Routes>
    </RealtimeContext.Provider>,
    {
      initialEntries: [path],
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    }
  );
}

describe("league Drafts area", () => {
  it("keeps the open Free Agent Draft editor reachable from the permanent area", async () => {
    const requests = [];
    const fetchImpl = baseFetch((parsed) => {
      requests.push(parsed.pathname);
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(navigation({ rosterLinks: [descriptor()] }));
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(overview());
      }
      if (parsed.pathname.endsWith(`/candidate-cards/${teamId}/private`)) {
        return envelope(candidateCard());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    const view = renderDraftsRoute(fetchImpl);

    expect(await screen.findByRole("heading", { name: "Drafts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Free Agent Draft/ })).toHaveAttribute(
      "href",
      routePaths.leagueFreeAgentDrafts(leagueId)
    );
    expect(screen.getByRole("link", { name: /Entry Draft/ })).toHaveTextContent(
      "Coming soon"
    );
    const cardLink = await screen.findByRole("link", { name: /Candidate Owls/ });
    expect(cardLink).toHaveAttribute(
      "href",
      routePaths.draftFreeAgentCard(leagueId, fadId, teamId)
    );
    expect(screen.queryByText("Published Candidate Cards")).toBeNull();

    await view.user.click(cardLink);
    expect(
      await screen.findByRole("button", { name: "Save Candidate Card" })
    ).toBeInTheDocument();
    expect(
      requests.some((pathname) => pathname.endsWith(`/candidate-cards/${teamId}/private`))
    ).toBe(true);
  });

  it("shows concise selected-team results without linking to the original card", async () => {
    const requests = [];
    const fetchImpl = baseFetch((parsed) => {
      requests.push(parsed.pathname);
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(completedNavigation());
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(completedOverview());
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/candidate-cards`)) {
        return collectionEnvelope([publishedSummary()]);
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/results`)) {
        expect(parsed.searchParams.get("teamId")).toBe(teamId);
        return collectionEnvelope(publishedResultsCard().results);
      }
      if (parsed.pathname.endsWith(`/leagues/${leagueId}/teams`)) {
        return envelope(teamsFound([leagueTeam(teamId, "Candidate Owls", currentManager())]));
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderDraftsRoute(
      fetchImpl,
      routePaths.leagueFreeAgentDrafts(leagueId)
    );

    expect(
      await screen.findByRole("heading", { name: "Free Agent Draft results" })
    ).toBeInTheDocument();
    const resultsHeading = screen.getByRole("heading", { name: "Team results" });
    expect(resultsHeading).toBeInTheDocument();
    expect(screen.getByText("Candidate card deadline:")).toBeInTheDocument();
    expect(screen.queryByText(/Next auction rollover/i)).toBeNull();
    expect(screen.queryByText(/Week 1 starts/i)).toBeNull();
    const teamPicker = await screen.findByLabelText("Team");
    expect(
      resultsHeading.parentElement.parentElement.nextElementSibling
    ).toContainElement(teamPicker);
    expect(await screen.findByText("Won Player")).toBeInTheDocument();
    expect(screen.getByText("Tied Player")).toBeInTheDocument();
    expect(screen.getByText("Not Won Player")).toBeInTheDocument();
    expect(screen.getByText("Tie — action required")).toBeInTheDocument();
    expect(screen.queryByText(/Pending/)).toBeNull();
    expect(screen.queryByText(/authoritative|immutable|server/i)).toBeNull();
    expect(
      requests.some((pathname) =>
        pathname.endsWith(`/free-agent-drafts/${fadId}/results`)
      )
    ).toBe(true);
    expect(
      screen.queryByRole("link", { name: "View original Candidate Card" })
    ).toBeNull();
    expect(
      requests.some((pathname) =>
        pathname.endsWith(`/candidate-cards/${teamId}/private`)
      )
    ).toBe(false);
  });

  it("keeps the legacy allocation URL on the same selected-team experience", async () => {
    const requests = [];
    const fetchImpl = baseFetch((parsed) => {
      requests.push(parsed.pathname);
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(completedOverview());
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/candidate-cards`)) {
        return collectionEnvelope([publishedSummary()]);
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/results`)) {
        expect(parsed.searchParams.get("teamId")).toBe(teamId);
        return collectionEnvelope(publishedResultsCard().results);
      }
      if (parsed.pathname.endsWith(`/leagues/${leagueId}/teams`)) {
        return envelope(teamsFound());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderDraftsRoute(
      fetchImpl,
      routePaths.draftFreeAgentAllocationResults(leagueId, fadId)
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Free Agent Draft results",
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Team results" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Won Player")).toBeInTheDocument();
    expect(screen.getByLabelText("Search players")).toBeInTheDocument();
    expect(screen.queryByLabelText("Allocation status")).toBeNull();
    expect(
      requests.some((pathname) =>
        pathname.endsWith(`/free-agent-drafts/${fadId}/results`)
      )
    ).toBe(true);
    expect(
      requests.some((pathname) => pathname.endsWith("/candidate-cards"))
    ).toBe(true);
  });

  it("labels Entry Draft as unavailable without inventing a data request", async () => {
    const fetchImpl = baseFetch((parsed) => {
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderDraftsRoute(fetchImpl, routePaths.leagueEntryDrafts(leagueId));

    expect(
      await screen.findByRole("heading", { name: "Entry Draft is coming soon" })
    ).toBeInTheDocument();
    expect(screen.getByText(/No Entry Draft data or workflow has been added/i)).toBeInTheDocument();
    expect(
      fetchImpl.mock.calls.some(([url]) =>
        new URL(url).pathname.includes("/free-agent-drafts")
      )
    ).toBe(false);
  });
});

describe("FAD-15 Candidate Card frontend", () => {
  it("resolves the current route from T-126 to the one authorized stable card", async () => {
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(navigation());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderWithProviders(
      <RealtimeContext.Provider value={{ status: "disconnected", privacyEpoch: 0 }}>
        <Routes>
          <Route
            path="/leagues/:leagueId/free-agent-draft"
            element={<CurrentFreeAgentDraftPage />}
          />
          <Route
            path="/leagues/:leagueId/free-agent-draft/:fadId/cards/:teamId"
            element={<p>Stable Candidate Card route</p>}
          />
        </Routes>
      </RealtimeContext.Provider>,
      {
        initialEntries: [routePaths.leagueFreeAgentDraft(leagueId)],
        enableSession: true,
        config,
        sessionOptions: { fetchImpl },
      }
    );

    expect(await screen.findByText("Stable Candidate Card route")).toBeInTheDocument();
  });

  it("keeps multiple managed teams on the stable selector instead of inferring one global team", async () => {
    const second = {
      ...managedCard(),
      teamId: secondTeamId,
      team: team(secondTeamId, "Second Team"),
      cardId: replacementHelpId,
      managerAssignmentId: helpId,
      cardDescriptor: {
        ...descriptor(),
        teamId: secondTeamId,
        cardId: replacementHelpId,
        authorizationEvidence: authorizationEvidence("manager_assignment", helpId),
      },
    };
    const data = overview({ managedCards: [managedCard(), second] });
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) return envelope(data);
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderRoute({
      path: routePaths.freeAgentDraft(leagueId, fadId),
      route: "/leagues/:leagueId/free-agent-draft/:fadId",
      element: <FreeAgentDraftPage />,
      fetchImpl,
    });

    expect(await screen.findByRole("link", { name: /Candidate Owls/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Second Team/ })).toBeInTheDocument();
  });

  it("does not request scoped navigation until T-129 supplies the exact season ID", async () => {
    let resolveOverview;
    const overviewResponse = new Promise((resolve) => {
      resolveOverview = resolve;
    });
    const requests = [];
    const fetchImpl = baseFetch((parsed) => {
      requests.push(parsed);
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return overviewResponse;
      }
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(navigation({ rosterLinks: [descriptor()] }));
      }
      if (parsed.pathname.endsWith(`/candidate-cards/${teamId}/private`)) {
        return envelope(candidateCard({ privatePlayerName: "Sequenced Carryover" }));
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderRoute({ fetchImpl });

    await waitFor(() =>
      expect(
        requests.some((request) => request.pathname.endsWith(`/free-agent-drafts/${fadId}`))
      ).toBe(true)
    );
    expect(
      requests.some((request) => request.pathname.endsWith("/navigation"))
    ).toBe(false);

    resolveOverview(envelope(overview()));
    expect(await screen.findByText("Sequenced Carryover")).toBeInTheDocument();
    const scoped = requests.filter((request) => request.pathname.endsWith("/navigation"));
    expect(scoped.length).toBeGreaterThan(0);
    for (const request of scoped) {
      expect(request.searchParams.get("rosterSeasonId")).toBe(seasonId);
      expect(request.searchParams.get("rosterTeamId")).toBe(teamId);
      expect(request.search).not.toContain(fadId);
    }
  });

  it("withholds the old same-team private DOM across an evidence rotation and realtime epoch", async () => {
    let rotated = false;
    const managerEvidence = authorizationEvidence();
    const rotatedEvidence = authorizationEvidence("help_request", replacementHelpId);
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(overview());
      }
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(
          navigation({
            rosterLinks: [
              descriptor({ evidence: rotated ? rotatedEvidence : managerEvidence }),
            ],
          })
        );
      }
      if (parsed.pathname.endsWith(`/candidate-cards/${teamId}/private`)) {
        return envelope(
          rotated
            ? candidateCard({
                accessReason: "help_grant_commissioner",
                evidence: rotatedEvidence,
                helpContext: helpContext(1_100_000),
                privatePlayerName: "Replacement Help View",
              })
            : candidateCard({
                evidence: managerEvidence,
                privatePlayerName: "Old Manager View",
              })
        );
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    }, "commissioner");

    function RealtimeHarness() {
      const [value, setValue] = React.useState({
        status: "disconnected",
        privacyEpoch: 0,
      });
      return (
        <>
          <button
            onClick={() => {
              rotated = true;
              setValue({ status: "reauthorizing", privacyEpoch: 1 });
            }}
          >
            Rotate evidence
          </button>
          <button onClick={() => setValue({ status: "connected", privacyEpoch: 1 })}>
            Finish reauthorization
          </button>
          <RealtimeContext.Provider value={value}>
            <Routes>
              <Route
                path="/leagues/:leagueId/free-agent-draft/:fadId/cards/:teamId"
                element={<CandidateCardPage />}
              />
            </Routes>
          </RealtimeContext.Provider>
        </>
      );
    }

    const view = renderWithProviders(<RealtimeHarness />, {
      initialEntries: [routePaths.freeAgentDraftCard(leagueId, fadId, teamId)],
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });
    expect(await screen.findByText("Old Manager View")).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Rotate evidence" }));
    expect(screen.queryByText("Old Manager View")).toBeNull();
    expect(screen.getByText(/Reauthorizing.*Candidate Card/i)).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Finish reauthorization" }));
    expect(await screen.findByText("Replacement Help View")).toBeInTheDocument();
    expect(screen.queryByText("Old Manager View")).toBeNull();
  });

  it("fails closed on a remount-style cached overview whose measured deadline already passed", async () => {
    const queryClient = createQueryClient();
    const staleOverview = overview({
      serverNowMs: 1_000_000,
      candidateDeadlineAtMs: 1_001_000,
    });
    queryClient.setQueryData(
      freeAgentDraftKeys.overview(leagueId, fadId),
      staleOverview,
      { updatedAt: Date.now() - 4_000 }
    );
    const requests = [];
    const fetchImpl = baseFetch((parsed) => {
      requests.push(parsed.pathname);
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(navigation({ rosterLinks: [descriptor()] }));
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return new Promise(() => {});
      }
      if (parsed.pathname.endsWith(`/candidate-cards/${teamId}/private`)) {
        return envelope(candidateCard({ privatePlayerName: "Must Stay Hidden" }));
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderRoute({ fetchImpl, queryClient });

    expect(
      await screen.findByText(/measured deadline has passed/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Must Stay Hidden")).toBeNull();
    expect(
      requests.some((path) => path.endsWith(`/candidate-cards/${teamId}/private`))
    ).toBe(false);
  });

  it("hides a help-authorized card at its measured grant expiry without relying on a socket event", async () => {
    const helpEvidence = authorizationEvidence("help_request", helpId);
    const serverNowMs = 1_000_000;
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(overview({ serverNowMs }));
      }
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(
          navigation({ rosterLinks: [descriptor({ evidence: helpEvidence })] })
        );
      }
      if (parsed.pathname.endsWith(`/candidate-cards/${teamId}/private`)) {
        return envelope(
          candidateCard({
            accessReason: "help_grant_commissioner",
            evidence: helpEvidence,
            helpContext: helpContext(serverNowMs + 250),
            privatePlayerName: "Temporary Help View",
          })
        );
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    }, "commissioner");
    renderRoute({ fetchImpl });

    expect(await screen.findByText("Temporary Help View")).toBeInTheDocument();
    expect(
      await screen.findByText(/help authorization has expired/i, {}, { timeout: 2_000 })
    ).toBeInTheDocument();
    expect(screen.queryByText("Temporary Help View")).toBeNull();
  });

  it("sends an explicit exact-card help request and displays its league-timezone expiry", async () => {
    const card = candidateCard();
    const requests = [];
    const httpClient = {
      request: vi.fn(async (path, options) => {
        requests.push({ path, options });
        return {
          data: {
            helpRequestId: helpId,
            leagueId,
            seasonId,
            fadId,
            cardId,
            teamId,
            status: "active",
            message: "Please review my card.",
            requestedByUserId: userId,
            requestedByDisplayName: "FAD Manager",
            requestedAtMs: Date.parse("2026-08-11T19:00:00.000Z"),
            expiresAtMs: Date.parse("2026-08-12T19:00:00.000Z"),
            version: 1,
          },
        };
      }),
    };
    const onAuthoritativeCard = vi.fn();
    const view = renderWithProviders(
      <CandidateCardBuilder
        card={card}
        httpClient={httpClient}
        timeZone="America/Vancouver"
        buildEligibleQueryOptions={() =>
          infiniteQueryOptions({
            queryKey: ["unused-help-eligible"],
            initialPageParam: null,
            queryFn: async () => ({
              items: [],
              page: { nextCursor: null, hasMore: false },
            }),
            getNextPageParam: () => undefined,
          })
        }
        onAuthoritativeCard={onAuthoritativeCard}
        onProtectedFailure={vi.fn()}
      />,
      { enableSession: false, config }
    );

    await view.user.type(
      screen.getByLabelText("Private message (optional)"),
      "  Please review my card.  "
    );
    const helpButton = screen.getByRole("button", {
      name: "Request commissioner help",
    });
    helpButton.focus();
    await view.user.keyboard("{Enter}");
    expect(
      await screen.findByText(/Commissioner help is available.*America\/Vancouver/)
    ).toBeInTheDocument();
    expect(requests).toHaveLength(1);
    expect(requests[0].path).toMatch(/\/help-requests$/);
    expect(requests[0].options.body).toEqual({
      message: "Please review my card.",
    });
    expect(requests[0].options).not.toHaveProperty("version");
    expect(requests[0].options.idempotencyKey).toMatch(/^candidate-help:/);
    expect(onAuthoritativeCard).toHaveBeenCalledWith(null);
  });

  it("associates a keyboard-submitted help error with the exact help form and message", async () => {
    const card = candidateCard();
    const httpClient = {
      request: vi.fn(async () => {
        throw new ApiError({
          status: 409,
          code: "CANDIDATE_HELP_REQUEST_UNAVAILABLE",
          message: "Commissioner help is not available for this card.",
        });
      }),
    };
    const view = renderWithProviders(
      <CandidateCardBuilder
        card={card}
        httpClient={httpClient}
        timeZone="America/Vancouver"
        buildEligibleQueryOptions={() =>
          infiniteQueryOptions({
            queryKey: ["help-error-eligible"],
            initialPageParam: null,
            queryFn: async () => ({
              items: [],
              page: { nextCursor: null, hasMore: false },
            }),
            getNextPageParam: () => undefined,
          })
        }
        onAuthoritativeCard={vi.fn()}
        onProtectedFailure={vi.fn()}
      />,
      { enableSession: false, config }
    );

    const helpButton = screen.getByRole("button", {
      name: "Request commissioner help",
    });
    helpButton.focus();
    await view.user.keyboard("{Enter}");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveAttribute("id", "candidate-help-error");
    expect(alert).toHaveTextContent(/help is not available/i);
    expect(
      screen.getByRole("form", { name: "Ask the commissioner for help" })
    ).toHaveAttribute("aria-describedby", "candidate-help-error");
    expect(screen.getByLabelText("Private message (optional)")).toHaveAttribute(
      "aria-describedby",
      "candidate-help-error"
    );
  });

});

describe("FAD-16 published Candidate Card and allocation history", () => {
  it("redirects a stable post-deadline card link to that team's results", async () => {
    const requests = [];
    const fetchImpl = baseFetch((parsed) => {
      requests.push(parsed);
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(publishedOverview());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });

    renderRoute({
      fetchImpl,
      additionalRoute: (
        <Route
          path="/leagues/:leagueId/drafts/free-agent/:fadId/results"
          element={<ResultsLocation />}
        />
      ),
    });

    expect(await screen.findByTestId("results-location")).toHaveTextContent(
      `${routePaths.draftFreeAgentAllocationResults(
        leagueId,
        fadId
      )}?teamId=${teamId}`
    );
    expect(screen.queryByText("Original card")).not.toBeInTheDocument();
    expect(
      requests.some((request) =>
        request.pathname.endsWith(`/candidate-cards/${teamId}/private`)
      )
    ).toBe(false);
    expect(
      requests.some((request) => request.pathname.endsWith("/navigation"))
    ).toBe(false);
  });

  it("withholds the post-deadline results redirect during realtime reauthorization", async () => {
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(publishedOverview());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    function PublishedHistoryReauthorizationHarness() {
      const [realtime, setRealtime] = React.useState({
        status: "reauthorizing",
        privacyEpoch: 1,
      });
      return (
        <>
          <button
            onClick={() => setRealtime({ status: "reauthorizing", privacyEpoch: 1 })}
          >
            Reauthorize history
          </button>
          <button
            onClick={() => setRealtime({ status: "connected", privacyEpoch: 1 })}
          >
            Finish history reauthorization
          </button>
          <RealtimeContext.Provider value={realtime}>
            <Routes>
              <Route
                path="/leagues/:leagueId/free-agent-draft/:fadId/cards/:teamId"
                element={<CandidateCardPage />}
              />
              <Route
                path="/leagues/:leagueId/drafts/free-agent/:fadId/results"
                element={<ResultsLocation />}
              />
            </Routes>
          </RealtimeContext.Provider>
        </>
      );
    }
    const view = renderWithProviders(<PublishedHistoryReauthorizationHarness />, {
      initialEntries: [routePaths.freeAgentDraftCard(leagueId, fadId, teamId)],
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    expect(
      await screen.findByText(/Reauthorizing league-only Candidate Card history/i)
    ).toBeInTheDocument();
    await view.user.click(
      screen.getByRole("button", { name: "Finish history reauthorization" })
    );
    expect(await screen.findByTestId("results-location")).toHaveTextContent(
      `?teamId=${teamId}`
    );
  });

  it("uses exact selected-team T-140 searches and never renders another team's offer", async () => {
    expect(validatePublishedCandidateCard(publishedResultsCard())).toBe(true);
    const resultRequests = [];
    let selectedTeamDefaultRequests = 0;
    let resolveRefreshedTeamResults;
    const managedOverview = publishedOverview();
    managedOverview.viewer.managedCards = [managedCard()];
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(managedOverview);
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/candidate-cards`)) {
        return collectionEnvelope([
          publishedSummary(team(secondTeamId, "Second Team")),
          publishedSummary(),
        ]);
      }
      if (parsed.pathname.endsWith(`/leagues/${leagueId}/teams`)) {
        return envelope(teamsFound([
          leagueTeam(secondTeamId, "Second Team"),
          leagueTeam(teamId, "Candidate Owls", currentManager()),
        ]));
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/results`)) {
        const selectedTeamId = parsed.searchParams.get("teamId");
        const q = parsed.searchParams.get("q");
        resultRequests.push({ teamId: selectedTeamId, q });
        const projection = selectedTeamId === teamId
          ? publishedResultsCard()
          : publishedResultsCard(team(secondTeamId, "Second Team"), [
              ["Other Team Player", "not_won", null, false],
            ]);
        if (selectedTeamId === teamId && q === "") {
          selectedTeamDefaultRequests += 1;
          if (selectedTeamDefaultRequests === 2) {
            projection.results[0].offer = {
              totalValueCents: 1_950,
              aavCents: 975,
              termYears: 2,
            };
            return new Promise((resolve) => {
              resolveRefreshedTeamResults = () =>
                resolve(collectionEnvelope(projection.results));
            });
          }
        }
        return collectionEnvelope(
          projection.results.filter((result) =>
            q === "" || result.player.fullName.toLocaleLowerCase("en-CA").includes(q)
          )
        );
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    const view = renderRoute({
      path: `${routePaths.freeAgentDraftResults(
        leagueId,
        fadId
      )}?teamId=${secondTeamId}`,
      route: "/leagues/:leagueId/free-agent-draft/:fadId/results",
      element: <FreeAgentDraftResultsPage />,
      fetchImpl,
    });

    const teamPicker = await screen.findByLabelText("Team");
    expect(teamPicker).toHaveValue(secondTeamId);
    const redactedName = await screen.findByText("Other Team Player");
    expect(redactedName.closest("li")).not.toHaveTextContent(/\$|AAV|year/iu);
    expect(screen.queryByRole("link", { name: "Place bid" })).toBeNull();
    await view.user.selectOptions(teamPicker, teamId);
    const initialWonPlayer = await screen.findByText("Won Player");
    expect(initialWonPlayer.closest("li")).toHaveTextContent(/\$3\.00 AAV/iu);
    expect(screen.getAllByText(/AAV/iu).length).toBeGreaterThan(0);
    const totals = screen.getByLabelText("Candidate Owls result totals");
    expect(within(totals).getByText("Signed").nextSibling).toHaveTextContent("1");
    expect(within(totals).getByText("Not won").nextSibling).toHaveTextContent("1");
    expect(within(totals).getByText("Tied").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Tie — action required")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Place bid" })).toHaveAttribute(
      "href",
      routePaths.leagueAuctionFocus(leagueId, restrictedAuctionId)
    );
    expect(screen.queryByText(/Pending|immutable|server/i)).toBeNull();
    await view.user.selectOptions(teamPicker, secondTeamId);
    expect(await screen.findByText("Other Team Player")).toBeInTheDocument();
    await view.user.selectOptions(teamPicker, teamId);
    await waitFor(() => expect(selectedTeamDefaultRequests).toBe(2));
    expect(screen.queryByText("Won Player")).toBeNull();
    expect(screen.getByText(/Loading Candidate Owls.+results/iu)).toBeInTheDocument();
    resolveRefreshedTeamResults();
    const refreshedWonPlayer = await screen.findByText("Won Player");
    expect(refreshedWonPlayer.closest("li")).toHaveTextContent(/\$9\.75 AAV/iu);
    await view.user.type(screen.getByLabelText("Search players"), "Not Won");
    expect(await screen.findByText("Not Won Player")).toBeInTheDocument();
    await waitFor(() =>
      expect(resultRequests).toContainEqual({ teamId, q: "not won" })
    );
    expect(resultRequests).toContainEqual({ teamId: secondTeamId, q: "" });
    expect(
      resultRequests.filter(
        ({ teamId: requestedTeamId, q }) => requestedTeamId === teamId && q === ""
      )
    ).toHaveLength(2);
    expect(
      resultRequests.every(({ teamId: requestedTeamId }) =>
        [teamId, secondTeamId].includes(requestedTeamId)
      )
    ).toBe(true);
  });

  it("withholds and remounts published result evidence across realtime reauthorization", async () => {
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(publishedOverview());
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/candidate-cards`)) {
        return collectionEnvelope([publishedSummary()]);
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/results`)) {
        expect(parsed.searchParams.get("teamId")).toBe(teamId);
        const q = parsed.searchParams.get("q");
        return collectionEnvelope(
          publishedResultsCard().results.filter((result) =>
            q === "" || result.player.fullName.toLocaleLowerCase("en-CA").includes(q)
          )
        );
      }
      if (parsed.pathname.endsWith(`/leagues/${leagueId}/teams`)) {
        return envelope(teamsFound([leagueTeam(teamId, "Candidate Owls", currentManager())]));
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    function ReauthorizationHarness() {
      const [realtime, setRealtime] = React.useState({
        status: "connected",
        privacyEpoch: 0,
      });
      return (
        <>
          <button
            onClick={() => setRealtime({ status: "reauthorizing", privacyEpoch: 1 })}
          >
            Reauthorize results
          </button>
          <button
            onClick={() => setRealtime({ status: "connected", privacyEpoch: 1 })}
          >
            Finish results reauthorization
          </button>
          <RealtimeContext.Provider value={realtime}>
            <Routes>
              <Route
                path="/leagues/:leagueId/free-agent-draft/:fadId/results"
                element={<FreeAgentDraftResultsPage />}
              />
            </Routes>
          </RealtimeContext.Provider>
        </>
      );
    }
    const view = renderWithProviders(<ReauthorizationHarness />, {
      initialEntries: [routePaths.freeAgentDraftResults(leagueId, fadId)],
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    expect(await screen.findByText("Won Player")).toBeInTheDocument();
    await view.user.type(screen.getByLabelText("Search players"), "private filter");
    await view.user.click(screen.getByRole("button", { name: "Reauthorize results" }));
    expect(screen.queryByText("Won Player")).toBeNull();
    expect(screen.getByText(/Reauthorizing league-only Free Agent Draft results/i)).toBeInTheDocument();
    await view.user.click(
      screen.getByRole("button", { name: "Finish results reauthorization" })
    );
    expect(await screen.findByText("Won Player")).toBeInTheDocument();
    expect(screen.getByLabelText("Search players")).toHaveValue("");
  });
});
