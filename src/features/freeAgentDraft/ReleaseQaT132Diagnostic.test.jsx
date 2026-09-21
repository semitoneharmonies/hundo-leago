import { act, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "../../shared/query/queryClient.js";
import {
  REALTIME_RELATED_ID_KEYS,
  applyRealtimeInvalidation,
  parseRealtimeEnvelope,
} from "../../shared/realtime/realtimeInvalidation.js";
import { renderWithProviders } from "../../test/render.jsx";
import { freeAgentDraftInvalidationActions } from "./freeAgentDraftInvalidation.js";
import { publishedCandidateCardQuery } from "./freeAgentDraftQueries.js";
import { ReleaseQaT132Diagnostic } from "./ReleaseQaT132Diagnostic.jsx";
import {
  classifyReleaseQaT132Offers,
  isReleaseQaT132DiagnosticRequested,
} from "./releaseQaT132Diagnostic.js";

const IDS = Object.freeze({
  league: "11111111-1111-4111-8111-111111111111",
  season: "22222222-2222-4222-8222-222222222222",
  fad: "33333333-3333-4333-8333-333333333333",
  team: "44444444-4444-4444-8444-444444444444",
  player: "55555555-5555-4555-8555-555555555555",
  event: "66666666-6666-4666-8666-666666666666",
  resource: "77777777-7777-4777-8777-777777777777",
});

const stagingConfig = Object.freeze({
  appEnv: "staging",
  apiOrigin: "https://api-staging.hundoleago.com",
  socketOrigin: "https://api-staging.hundoleago.com",
  buildId: "release-qa-t132-test",
});

function card(offer) {
  return {
    leagueId: IDS.league,
    seasonId: IDS.season,
    fadId: IDS.fad,
    teamId: IDS.team,
    team: {
      teamId: IDS.team,
      name: "Strict Privacy Team",
      primaryColour: "#112233",
      secondaryColour: "#ddeeff",
      tertiaryColour: null,
      patternTemplate: "solid",
      logoReference: null,
    },
    results: [
      {
        player: {
          playerId: IDS.player,
          fullName: "Privacy Fixture Player",
          positionGroup: "F",
        },
        status: "signed",
        offer,
        tieAuctionId: null,
      },
    ],
  };
}

const completeOffer = Object.freeze({
  totalValueCents: 1_950,
  aavCents: 975,
  termYears: 2,
});

function httpClient(responses) {
  let index = 0;
  return {
    request: vi.fn(async (path, options) => {
      const data = responses[Math.min(index, responses.length - 1)];
      index += 1;
      options.validateData(data);
      return { data, meta: { requestId: `request-${index}` } };
    }),
  };
}

function renderDiagnostic({
  active = true,
  appEnv = "staging",
  client = httpClient([card(completeOffer)]),
  queryClient = createQueryClient(),
  requested = true,
} = {}) {
  return {
    client,
    ...renderWithProviders(
      <ReleaseQaT132Diagnostic
        active={active}
        appEnv={appEnv}
        fadId={IDS.fad}
        httpClient={client}
        leagueId={IDS.league}
        requested={requested}
        selectedTeamId={IDS.team}
      />,
      { config: stagingConfig, queryClient }
    ),
  };
}

function managerAssignmentEnvelope(sequence) {
  const related = Object.fromEntries(
    REALTIME_RELATED_ID_KEYS.map((key) => [
      key,
      key === "teamId" ? IDS.team : null,
    ])
  );
  return parseRealtimeEnvelope("team.changed", {
    eventId: `${String(sequence).padStart(8, "0")}-0000-4000-8000-000000000000`,
    type: "team.changed",
    leagueId: IDS.league,
    resourceId: IDS.resource,
    version: sequence,
    reasonCode: "manager_assignment_changed",
    occurredAt: 1_786_432_100_000 + sequence,
    related,
  });
}

function diagnosticValue(label) {
  return within(screen.getByLabelText("Release QA T132 cache diagnostic"))
    .getByText(label).nextSibling;
}

describe("release-QA T132 diagnostic", () => {
  it("is off by default and rejects production, malformed, or duplicate flags", () => {
    expect(
      isReleaseQaT132DiagnosticRequested(
        "staging",
        new URLSearchParams("teamId=one")
      )
    ).toBe(false);
    expect(
      isReleaseQaT132DiagnosticRequested(
        "production",
        new URLSearchParams("releaseQaT132=1")
      )
    ).toBe(false);
    expect(
      isReleaseQaT132DiagnosticRequested(
        "staging",
        new URLSearchParams("releaseQaT132=true")
      )
    ).toBe(false);
    expect(
      isReleaseQaT132DiagnosticRequested(
        "staging",
        new URLSearchParams("releaseQaT132=1&releaseQaT132=1")
      )
    ).toBe(false);
    expect(
      isReleaseQaT132DiagnosticRequested(
        "staging",
        new URLSearchParams("releaseQaT132=1")
      )
    ).toBe(true);
  });

  it("does not mount or request T132 when disabled or outside staging", () => {
    const disabledClient = httpClient([card(completeOffer)]);
    renderDiagnostic({ client: disabledClient, requested: false });
    expect(
      screen.queryByLabelText("Release QA T132 cache diagnostic")
    ).not.toBeInTheDocument();
    expect(disabledClient.request).not.toHaveBeenCalled();

    const productionClient = httpClient([card(completeOffer)]);
    renderDiagnostic({ appEnv: "production", client: productionClient });
    expect(
      screen.queryByLabelText("Release QA T132 cache diagnostic")
    ).not.toBeInTheDocument();
    expect(productionClient.request).not.toHaveBeenCalled();
  });

  it("binds the real T132 query to the selected team and renders no money", async () => {
    const client = httpClient([card(completeOffer)]);
    renderDiagnostic({ client });

    expect(await screen.findByText("complete")).toBeInTheDocument();
    expect(diagnosticValue("Selected team ID")).toHaveTextContent(IDS.team);
    expect(client.request).toHaveBeenCalledTimes(1);
    expect(client.request.mock.calls[0][0]).toBe(
      `/api/v1/leagues/${IDS.league}/free-agent-drafts/${IDS.fad}/candidate-cards/${IDS.team}/history`
    );
    const diagnostic = screen.getByLabelText(
      "Release QA T132 cache diagnostic"
    );
    expect(diagnostic).not.toHaveTextContent(/\$|AAV|totalValueCents|1,?950|975/iu);
  });

  it("counts an already-successful cached Query exactly once", async () => {
    const queryClient = createQueryClient();
    const client = httpClient([card(completeOffer)]);
    await queryClient.fetchQuery(
      publishedCandidateCardQuery(client, IDS.league, IDS.fad, IDS.team)
    );

    renderDiagnostic({ client, queryClient });

    expect(await screen.findByText("complete")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        diagnosticValue("Successful Query instances")
      ).toHaveTextContent("1")
    );
    expect(client.request).toHaveBeenCalledTimes(1);
  });

  it("ignores same-Query focus-style successes before physical replacement", async () => {
    const queryClient = createQueryClient();
    const client = httpClient([
      card(completeOffer),
      card(completeOffer),
      card(null),
    ]);
    renderDiagnostic({ client, queryClient });
    expect(await screen.findByText("complete")).toBeInTheDocument();
    const queryKey = [
      "league",
      IDS.league,
      "free-agent-draft",
      IDS.fad,
      "history-card",
      IDS.team,
    ];
    const initialQuery = queryClient.getQueryCache().find({
      queryKey,
      exact: true,
    });

    await act(async () => {
      await queryClient.refetchQueries({ queryKey, exact: true });
    });
    expect(client.request).toHaveBeenCalledTimes(2);
    expect(
      queryClient.getQueryCache().find({ queryKey, exact: true })
    ).toBe(initialQuery);
    expect(
      diagnosticValue("Successful Query instances")
    ).toHaveTextContent("1");
    expect(diagnosticValue("Physical evictions")).toHaveTextContent("0");
    expect(diagnosticValue("Successful replacements")).toHaveTextContent("0");

    await act(async () => {
      await applyRealtimeInvalidation(
        queryClient,
        managerAssignmentEnvelope(1),
        [freeAgentDraftInvalidationActions]
      );
    });
    expect(await screen.findByText("null")).toBeInTheDocument();
    await waitFor(() => expect(client.request).toHaveBeenCalledTimes(3));
    expect(
      queryClient.getQueryCache().find({ queryKey, exact: true })
    ).not.toBe(initialQuery);
    expect(
      diagnosticValue("Successful Query instances")
    ).toHaveTextContent("2");
    expect(diagnosticValue("Physical evictions")).toHaveTextContent("1");
    expect(diagnosticValue("Successful replacements")).toHaveTextContent("1");
  });

  it("classifies a fully redacted projection as null without payload details", async () => {
    renderDiagnostic({ client: httpClient([card(null)]) });

    expect(await screen.findByText("null")).toBeInTheDocument();
    const diagnostic = screen.getByLabelText(
      "Release QA T132 cache diagnostic"
    );
    expect(diagnostic).not.toHaveTextContent(/Privacy Fixture Player|signed/iu);
    expect(classifyReleaseQaT132Offers({ results: [] })).toBe("empty");
    expect(
      classifyReleaseQaT132Offers({
        results: [{ offer: null }, { offer: completeOffer }],
      })
    ).toBe("inconsistent");
  });

  it("physically observes A-to-B-to-A eviction and refetches without a remount", async () => {
    const queryClient = createQueryClient();
    const client = httpClient([
      card(completeOffer),
      card(null),
      card(completeOffer),
    ]);
    renderDiagnostic({ client, queryClient });
    expect(await screen.findByText("complete")).toBeInTheDocument();
    await waitFor(() =>
      expect(diagnosticValue("Successful Query instances")).toHaveTextContent(
        "1"
      )
    );
    expect(diagnosticValue("Physical evictions")).toHaveTextContent("0");
    expect(diagnosticValue("Successful replacements")).toHaveTextContent("0");
    const initialQuery = queryClient.getQueryCache().find({
      queryKey: [
        "league",
        IDS.league,
        "free-agent-draft",
        IDS.fad,
        "history-card",
        IDS.team,
      ],
      exact: true,
    });

    await act(async () => {
      await applyRealtimeInvalidation(
        queryClient,
        managerAssignmentEnvelope(1),
        [freeAgentDraftInvalidationActions]
      );
    });
    expect(await screen.findByText("null")).toBeInTheDocument();
    await waitFor(() => expect(client.request).toHaveBeenCalledTimes(2));
    const replacementQuery = queryClient.getQueryCache().find({
      queryKey: initialQuery.queryKey,
      exact: true,
    });
    expect(replacementQuery).not.toBe(initialQuery);
    expect(diagnosticValue("Successful Query instances")).toHaveTextContent(
      "2"
    );
    expect(diagnosticValue("Physical evictions")).toHaveTextContent("1");
    expect(diagnosticValue("Successful replacements")).toHaveTextContent("1");

    await act(async () => {
      await applyRealtimeInvalidation(
        queryClient,
        managerAssignmentEnvelope(2),
        [freeAgentDraftInvalidationActions]
      );
    });
    expect(await screen.findByText("complete")).toBeInTheDocument();
    await waitFor(() => expect(client.request).toHaveBeenCalledTimes(3));
    expect(diagnosticValue("Successful Query instances")).toHaveTextContent(
      "3"
    );
    expect(diagnosticValue("Physical evictions")).toHaveTextContent("2");
    expect(diagnosticValue("Successful replacements")).toHaveTextContent("2");
  });
});
