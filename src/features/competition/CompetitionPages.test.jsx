import { screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { writeLeaguePreference } from "../leagues/leaguePreference.js";
import {
  CommissionerCompetitionPage,
  LegacyMatchupsRedirect,
  LegacyPlayersRedirect,
  LegacyStandingsRedirect,
  LeagueMatchupsPage,
  LeagueStandingsPage,
} from "./CompetitionPages.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
const otherLeagueId = "11111111-1111-4111-8111-111111111112";
const seasonId = "22222222-2222-4222-8222-222222222222";
const historicalSeasonId = "22222222-2222-4222-8222-222222222223";
const weekId = "33333333-3333-4333-8333-333333333333";
const futureWeekId = "33333333-3333-4333-8333-333333333335";
const historicalWeekId = "33333333-3333-4333-8333-333333333334";
const matchupId = "44444444-4444-4444-8444-444444444444";
const secondMatchupId = "44444444-4444-4444-8444-444444444445";
const historicalMatchupId = "44444444-4444-4444-8444-444444444446";
const homeId = "55555555-5555-4555-8555-555555555555";
const awayId = "66666666-6666-4666-8666-666666666666";
const secondHomeId = "55555555-5555-4555-8555-555555555556";
const secondAwayId = "66666666-6666-4666-8666-666666666667";
const identityId = "77777777-7777-4777-8777-777777777777";
const homePlayerId = "88888888-8888-4888-8888-888888888888";
const awayPlayerId = "99999999-9999-4999-8999-999999999999";
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };

function envelope(data, status = 200) {
  return new Response(JSON.stringify({ data, meta: { requestId: "request-1" } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function session() {
  return {
    csrfToken: "D".repeat(43),
    session: { id: identityId, userId: identityId, status: "active", createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3, version: 1 },
    user: { id: identityId, displayName: "Manager", status: "active", version: 1 },
  };
}

function league(
  permissionCategory = "manager",
  id = leagueId,
  name = "Test League",
  effectiveAuthority = permissionCategory
) {
  return {
    id,
    name,
    status: "active",
    timezone: "America/Vancouver",
    currentSeason: { id: seasonId, label: "2026-27", status: "active", version: 1 },
    membership: {
      effectiveAuthority,
      id: identityId,
      permissionCategory,
      status: "active",
      version: 1,
    },
    version: 1,
  };
}

function matchupSummary() {
  return {
    id: matchupId,
    leagueId,
    seasonId,
    weekId,
    homeTeam: { id: homeId, name: "Home Team" },
    awayTeam: { id: awayId, name: "Away Team" },
    status: "live",
    version: 2,
  };
}

function leagueTeam(id, name, primaryColour, secondaryColour, tertiaryColour = null) {
  return {
    id,
    leagueId,
    name,
    status: "active",
    primaryColour,
    secondaryColour,
    tertiaryColour,
    logoReference: null,
    createdAtMs: 1,
    updatedAtMs: 1,
    version: 1,
    currentManager: null,
  };
}

function secondMatchupSummary() {
  return {
    id: secondMatchupId,
    leagueId,
    seasonId,
    weekId,
    homeTeam: { id: secondHomeId, name: "Third Team" },
    awayTeam: { id: secondAwayId, name: "Fourth Team" },
    status: "live",
    version: 2,
  };
}

function week({
  id = weekId,
  season = seasonId,
  key = "2026-W01",
  sequence = 1,
  status = "live",
  matchups = [matchupSummary()],
} = {}) {
  return {
    id,
    leagueId,
    seasonId: season,
    weekKey: key,
    sequence,
    startsAtMs: 1,
    baselineAtMs: 2,
    locksAtMs: 3,
    endsAtMs: 99,
    rollsOverAtMs: 100,
    status,
    version: 2,
    matchups,
    byes: [],
  };
}

function seasonList(includeHistorical = false) {
  const listed = [
    {
      id: seasonId,
      label: "2026-27",
      nhlSeasonKey: "20262027",
      status: "active",
      regularSeasonStartsAtMs: 1,
      regularSeasonEndsAtMs: 100,
      fantasyPlayoffsStartAtMs: null,
      fantasyPlayoffsEndAtMs: null,
      version: 1,
    },
  ];
  if (includeHistorical) {
    listed.push({
      id: historicalSeasonId,
      label: "2025-26",
      nhlSeasonKey: "20252026",
      status: "completed",
      regularSeasonStartsAtMs: 1,
      regularSeasonEndsAtMs: 100,
      fantasyPlayoffsStartAtMs: null,
      fantasyPlayoffsEndAtMs: null,
      version: 1,
    });
  }
  return { code: "LEAGUE_SEASONS_FOUND", leagueId, seasons: listed };
}

function playerScore({
  playerId,
  fullName,
  positionGroup = "F",
  slotNumber = 1,
  goals = 0,
  assists = 0,
  scoreHundredths = 0,
  dataStatus = "available",
}) {
  return {
    playerId,
    fullName,
    positionGroup,
    slotNumber,
    gamesPlayedDelta: goals || assists ? 1 : 0,
    goalDelta: goals,
    assistDelta: assists,
    pointDelta: goals + assists,
    scoreHundredths,
    dataStatus,
  };
}

function teamScore(teamId, players = []) {
  return {
    teamId,
    legal: true,
    scoreHundredths: players.reduce(
      (total, player) => total + player.scoreHundredths,
      0
    ),
    players,
  };
}

function matchupDetail(
  summary,
  {
    homePlayers = [],
    awayPlayers = [],
    scoringStatus = "fresh",
    mode = "live",
  } = {}
) {
  const home = teamScore(summary.homeTeam.id, homePlayers);
  const away = teamScore(summary.awayTeam.id, awayPlayers);
  return {
    code: "MATCHUP_FOUND",
    matchup: {
      ...summary,
      week: {
        id: summary.weekId,
        weekKey: "2026-W01",
        sequence: 1,
        startsAtMs: 1,
        locksAtMs: 3,
        endsAtMs: 99,
        status: summary.status,
        version: 2,
      },
      liveScore:
        mode === "live"
          ? {
              matchupId: summary.id,
              status: summary.status,
              source: {
                refreshId: identityId,
                completedAtMs: 10,
                ageMs: 20,
                freshnessStatus: scoringStatus,
              },
              home,
              away,
            }
          : null,
      scoring: { mode, home, away },
      result: null,
      health: {
        scoring: { status: scoringStatus, completedAtMs: 10, ageMs: 20 },
      },
    },
  };
}

function health(status = "stale") {
  return { statistics: { status, completedAtMs: 10, ageMs: 20 } };
}

function renderPage(path, route, element, fetchImpl) {
  return renderWithProviders(<Routes><Route path={route} element={element} /></Routes>, {
    initialEntries: [path], enableSession: true, config, sessionOptions: { fetchImpl },
  });
}

function baseFetch(
  extra,
  permission = "manager",
  visibleLeagues = [league(permission)]
) {
  return vi.fn(async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === "/api/v1/session") return envelope(session());
    if (path === "/api/v1/leagues") {
      return envelope({ code: "LEAGUES_FOUND", leagues: visibleLeagues });
    }
    return extra(path, options);
  });
}

describe("M6-12 authenticated competition pages", () => {
  it("redirects a signed-out protected route without waiting on a disabled league query", async () => {
    const fetchImpl = vi.fn(async () => envelope({ code: "SESSION_MISSING" }, 401));
    renderWithProviders(
      <Routes>
        <Route path="/" element={<p>Sign in required</p>} />
        <Route path="/leagues/:leagueId/standings" element={<LeagueStandingsPage />} />
      </Routes>,
      {
        initialEntries: [`/leagues/${leagueId}/standings`],
        enableSession: true,
        config,
        sessionOptions: { fetchImpl },
      }
    );
    expect(await screen.findByText("Sign in required")).toBeInTheDocument();
    expect(screen.queryByText("Checking secure league access…")).not.toBeInTheDocument();
  });

  it("renders canonical player scoring and switches between same-week matchups", async () => {
    const prefix = `/api/v1/leagues/${leagueId}/seasons/${seasonId}`;
    const homePlayer = playerScore({
      playerId: homePlayerId,
      fullName: "Connor Example",
      goals: 1,
      assists: 1,
      scoreHundredths: 225,
    });
    const awayPlayer = playerScore({
      playerId: awayPlayerId,
      fullName: "Jamie Missing",
      dataStatus: "missing",
    });
    const fetchImpl = baseFetch((path) => {
      if (path === `/api/v1/leagues/${leagueId}/teams`) {
        return envelope({
          code: "TEAMS_FOUND",
          teams: [
            leagueTeam(homeId, "Home Team", "#112233", "#ddeeff", "#cc3300"),
            leagueTeam(awayId, "Away Team", "#334455", "#ffffff"),
            leagueTeam(secondHomeId, "Third Team", "#123456", "#abcdef"),
            leagueTeam(secondAwayId, "Fourth Team", "#654321", "#fedcba"),
          ],
        });
      }
      if (path === `/api/v1/leagues/${leagueId}/seasons`) {
        return envelope(seasonList());
      }
      const matchupWeek = week({
        matchups: [matchupSummary(), secondMatchupSummary()],
      });
      const futureWeek = week({
        id: futureWeekId,
        key: "2026-W02",
        sequence: 2,
        status: "scheduled",
        matchups: [],
      });
      if (path === `${prefix}/matchup-weeks`) {
        return envelope({
          code: "MATCHUP_WEEKS_FOUND",
          leagueId,
          seasonId,
          health: health(),
          weeks: [matchupWeek, futureWeek],
        });
      }
      if (path === `${prefix}/matchup-weeks/current`) {
        return envelope({
          code: "CURRENT_MATCHUP_WEEK_FOUND",
          leagueId,
          seasonId,
          health: health(),
          week: matchupWeek,
        });
      }
      if (path === `${prefix}/matchup-weeks/${weekId}`) {
        return envelope({ code: "MATCHUP_WEEK_FOUND", week: matchupWeek });
      }
      if (path === `${prefix}/matchup-weeks/${futureWeekId}`) {
        return envelope({ code: "MATCHUP_WEEK_FOUND", week: futureWeek });
      }
      if (path === `${prefix}/matchup-weeks/${weekId}/matchups/${matchupId}`) {
        return envelope(
          matchupDetail(matchupSummary(), {
            homePlayers: [homePlayer],
            awayPlayers: [awayPlayer],
            scoringStatus: "stale",
          })
        );
      }
      if (path === `${prefix}/matchup-weeks/${weekId}/matchups/${secondMatchupId}`) {
        return envelope(matchupDetail(secondMatchupSummary()));
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderPage(
      `/leagues/${leagueId}/matchups`,
      "/leagues/:leagueId/matchups",
      <LeagueMatchupsPage />,
      fetchImpl
    );
    expect(await screen.findByRole("heading", { name: "Home Team vs Away Team" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Week" })
    ).toHaveValue(weekId);
    expect(
      within(screen.getByRole("combobox", { name: "Week" }))
        .getAllByRole("option")
    ).toHaveLength(2);
    expect(screen.getByText("2.25 FP", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: "Player scoring for this matchup" })
    ).toBeInTheDocument();
    const scoringTable = screen.getByRole("table", {
      name: "Player scoring for this matchup",
    });
    expect(within(scoringTable).getAllByText("GP")).toHaveLength(2);
    const scoreHeader = document.querySelector(".hl-matchup-score");
    expect(
      within(scoreHeader)
        .getByText("Home Team")
        .closest(".hl-matchup-score__team")
    ).toHaveClass("has-three-colours");
    expect(
      within(scoreHeader)
        .getByText("Away Team")
        .closest(".hl-matchup-score__team")
    ).not.toHaveClass("has-three-colours");
    expect(screen.getByText("Connor Example")).toBeInTheDocument();
    expect(screen.getByText("Jamie Missing — data unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("Empty F slot 2")).toHaveLength(2);
    expect(
      screen.getAllByText(
        "Scores may be delayed because the latest statistics are not current."
      ).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/Data health:/)).not.toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledTimes(8);

    await view.user.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(9));

    await view.user.click(
      screen.getByRole("button", { name: "Third Team vs Fourth Team" })
    );
    expect(
      await screen.findByRole("heading", {
        name: "Third Team vs Fourth Team",
      })
    ).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledTimes(10);

    await view.user.selectOptions(
      screen.getByRole("combobox", { name: "Week" }),
      futureWeekId
    );
    expect(
      await screen.findByRole("heading", { name: /Week 2:/ })
    ).toBeInTheDocument();
    expect(screen.getByText("No pairings in this week.")).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledTimes(11);
  });

  it("loads a historical matchup after an explicit season selection", async () => {
    const currentPrefix = `/api/v1/leagues/${leagueId}/seasons/${seasonId}`;
    const historicalPrefix =
      `/api/v1/leagues/${leagueId}/seasons/${historicalSeasonId}`;
    const historicalSummary = {
      id: historicalMatchupId,
      leagueId,
      seasonId: historicalSeasonId,
      weekId: historicalWeekId,
      homeTeam: { id: homeId, name: "Historical Home" },
      awayTeam: { id: awayId, name: "Historical Away" },
      status: "final",
      version: 3,
    };
    const historicalWeek = week({
      id: historicalWeekId,
      season: historicalSeasonId,
      key: "2025-W01",
      matchups: [historicalSummary],
    });
    const fetchImpl = baseFetch((path) => {
      if (path === `/api/v1/leagues/${leagueId}/seasons`) {
        return envelope(seasonList(true));
      }
      if (path === `${currentPrefix}/matchup-weeks`) {
        return envelope({
          code: "MATCHUP_WEEKS_FOUND",
          leagueId,
          seasonId,
          health: health("fresh"),
          weeks: [],
        });
      }
      if (path === `${currentPrefix}/matchup-weeks/current`) {
        return envelope({
          code: "CURRENT_MATCHUP_WEEK_FOUND",
          leagueId,
          seasonId,
          health: health("fresh"),
          week: null,
        });
      }
      if (path === `${historicalPrefix}/matchup-weeks`) {
        return envelope({
          code: "MATCHUP_WEEKS_FOUND",
          leagueId,
          seasonId: historicalSeasonId,
          health: health("fresh"),
          weeks: [historicalWeek],
        });
      }
      if (path === `${historicalPrefix}/matchup-weeks/current`) {
        return envelope({
          code: "CURRENT_MATCHUP_WEEK_FOUND",
          leagueId,
          seasonId: historicalSeasonId,
          health: health("fresh"),
          week: historicalWeek,
        });
      }
      if (path === `${historicalPrefix}/matchup-weeks/${historicalWeekId}`) {
        return envelope({
          code: "MATCHUP_WEEK_FOUND",
          week: historicalWeek,
        });
      }
      if (
        path ===
        `${historicalPrefix}/matchup-weeks/${historicalWeekId}/matchups/${historicalMatchupId}`
      ) {
        return envelope(
          matchupDetail(historicalSummary, {
            mode: "final",
            scoringStatus: "not_live",
            homePlayers: [
              playerScore({
                playerId: homePlayerId,
                fullName: "Past Player",
                goals: 1,
                scoreHundredths: 125,
              }),
            ],
          })
        );
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderPage(
      `/leagues/${leagueId}/matchups`,
      "/leagues/:leagueId/matchups",
      <LeagueMatchupsPage />,
      fetchImpl
    );
    expect(
      await screen.findByText("No matchup schedule has been generated yet.")
    ).toBeInTheDocument();
    await view.user.selectOptions(
      screen.getByRole("combobox", { name: "Season" }),
      historicalSeasonId
    );
    expect(
      await screen.findByRole("heading", {
        name: "Historical Home vs Historical Away",
      })
    ).toBeInTheDocument();
    expect(
      fetchImpl.mock.calls.some(
        ([url]) => new URL(url).pathname.startsWith(historicalPrefix)
      )
    ).toBe(true);
  });

  it.each([
    [
      "players",
      "/free-agents",
      LegacyPlayersRedirect,
      "/leagues/:leagueId/players",
      "Canonical players",
    ],
    [
      "standings",
      "/standings",
      LegacyStandingsRedirect,
      "/leagues/:leagueId/standings",
      "Canonical standings",
    ],
    [
      "matchups",
      "/matchups",
      LegacyMatchupsRedirect,
      "/leagues/:leagueId/matchups",
      "Canonical matchups",
    ],
  ])(
    "redirects the legacy %s URL to the only visible league",
    async (_feature, legacyPath, LegacyRedirect, canonicalPath, heading) => {
      const fetchImpl = baseFetch((path) => {
        throw new Error(`Unexpected request: ${path}`);
      });
      renderWithProviders(
        <Routes>
          <Route path={legacyPath} element={<LegacyRedirect />} />
          <Route path={canonicalPath} element={<p>{heading}</p>} />
        </Routes>,
        {
          initialEntries: [legacyPath],
          enableSession: true,
          config,
          sessionOptions: { fetchImpl },
        }
      );
      expect(await screen.findByText(heading)).toBeInTheDocument();
    }
  );

  it("sends a multi-league legacy URL to league selection without a preference", async () => {
    globalThis.localStorage.clear();
    const visibleLeagues = [
      league("manager", leagueId, "First League"),
      league("manager", otherLeagueId, "Second League"),
    ];
    const fetchImpl = baseFetch(
      (path) => {
        throw new Error(`Unexpected request: ${path}`);
      },
      "manager",
      visibleLeagues
    );

    renderWithProviders(
      <Routes>
        <Route path="/standings" element={<LegacyStandingsRedirect />} />
        <Route path="/leagues" element={<p>Choose a league</p>} />
      </Routes>,
      {
        initialEntries: ["/standings"],
        enableSession: true,
        config,
        sessionOptions: { fetchImpl },
      }
    );

    expect(await screen.findByText("Choose a league")).toBeInTheDocument();
  });

  it("uses an authorized remembered league for a multi-league legacy URL", async () => {
    globalThis.localStorage.clear();
    expect(writeLeaguePreference(otherLeagueId)).toBe(true);
    const visibleLeagues = [
      league("manager", leagueId, "First League"),
      league("manager", otherLeagueId, "Second League"),
    ];
    const fetchImpl = baseFetch(
      (path) => {
        throw new Error(`Unexpected request: ${path}`);
      },
      "manager",
      visibleLeagues
    );

    try {
      renderWithProviders(
        <Routes>
          <Route path="/free-agents" element={<LegacyPlayersRedirect />} />
          <Route
            path={`/leagues/${otherLeagueId}/players`}
            element={<p>Remembered league players</p>}
          />
        </Routes>,
        {
          initialEntries: ["/free-agents"],
          enableSession: true,
          config,
          sessionOptions: { fetchImpl },
        }
      );

      expect(
        await screen.findByText("Remembered league players")
      ).toBeInTheDocument();
    } finally {
      globalThis.localStorage.clear();
    }
  });

  it("renders every approved standings column from authoritative rows", async () => {
    const prefix = `/api/v1/leagues/${leagueId}/seasons/${seasonId}`;
    const fetchImpl = baseFetch((path) => {
      if (path === `${prefix}/standings`) return envelope({
        code: "MATCHUP_STANDINGS_FOUND", leagueId, seasonId, finalizedResultCount: 1,
        sourceResultVersion: 1,
        rows: [{
          teamId: homeId,
          teamDisplayName: "Complete Team",
          rank: 1,
          gamesPlayed: 1,
          wins: 1,
          losses: 0,
          ties: 0,
          standingsPoints: 2,
          pointsPercentageHundredths: 10_000,
          fantasyPointsForHundredths: 725,
          fantasyPointsAgainstHundredths: 600,
          fantasyPointsDifferentialHundredths: 125,
        }],
        health: health("fresh"),
      });
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(`/leagues/${leagueId}/standings`, "/leagues/:leagueId/standings", <LeagueStandingsPage />, fetchImpl);
    const row = await screen.findByRole("row", { name: /Complete Team/ });
    for (const heading of ["Rank", "Team", "GP", "W", "L", "T", "PTS", "PCT", "PF", "PA", "DIFF"]) {
      expect(screen.getByRole("columnheader", { name: heading })).toBeInTheDocument();
    }
    expect(row).toHaveTextContent("100.00%");
    expect(row).toHaveTextContent("7.25");
    expect(row).toHaveTextContent("1.25");
  });

  it("renders an explicit no-participant standings state safely", async () => {
    const prefix = `/api/v1/leagues/${leagueId}/seasons/${seasonId}`;
    const fetchImpl = baseFetch((path) => {
      if (path === `${prefix}/standings`) return envelope({
        code: "MATCHUP_STANDINGS_FOUND", leagueId, seasonId, finalizedResultCount: 0,
        sourceResultVersion: 0, rows: [], health: health("fresh"),
      });
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(`/leagues/${leagueId}/standings`, "/leagues/:leagueId/standings", <LeagueStandingsPage />, fetchImpl);
    expect(await screen.findByText("No teams are registered for this season.")).toBeInTheDocument();
    expect(screen.getByText("0 finalized results counted.")).toBeInTheDocument();
  });

  it("requires commissioner authority before rendering any recovery controls", async () => {
    const fetchImpl = baseFetch((path) => { throw new Error(`Unexpected request: ${path}`); });
    renderPage(`/leagues/${leagueId}/commissioner`, "/leagues/:leagueId/commissioner", <CommissionerCompetitionPage />, fetchImpl);
    expect(await screen.findByRole("alert")).toHaveTextContent("Current commissioner authority is required.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders recovery controls for inherited platform-administrator authority", async () => {
    const fetchImpl = baseFetch(
      (path) => {
        throw new Error(`Unexpected request: ${path}`);
      },
      "member",
      [
        league(
          "member",
          leagueId,
          "Test League",
          "platform_administrator"
        ),
      ]
    );
    renderPage(
      `/leagues/${leagueId}/commissioner`,
      "/leagues/:leagueId/commissioner",
      <CommissionerCompetitionPage />,
      fetchImpl
    );

    expect(
      await screen.findByRole("button", {
        name: "Preview schedule generation",
      })
    ).toBeInTheDocument();
  });

  it("previews and confirms schedule generation with CSRF and the preview version", async () => {
    const requests = [];
    const prefix = `/api/v1/leagues/${leagueId}/seasons/${seasonId}`;
    const fetchImpl = baseFetch((path, options) => {
      if (path === `${prefix}/matchup-schedules`) {
        const body = JSON.parse(options.body);
        requests.push({ body, headers: options.headers });
        if (!body.confirmed) {
          return envelope({
            code: "MATCHUP_SCHEDULE_PREVIEWED",
            preview: {
              expectedVersion: 3,
              participantCount: 6,
              weekCount: 22,
              matchupCount: 66,
              byeCount: 0,
              firstWeekStartsAtMs: Date.parse("2026-10-12T07:00:00.000Z"),
              lastWeekEndsAtMs: Date.parse("2027-03-15T07:00:00.000Z"),
            },
          });
        }
        return envelope({ code: "MATCHUP_SCHEDULE_GENERATED", result: { weekCount: 22 } }, 201);
      }
      throw new Error(`Unexpected request: ${path}`);
    }, "commissioner");
    const view = renderPage(
      `/leagues/${leagueId}/commissioner`,
      "/leagues/:leagueId/commissioner",
      <CommissionerCompetitionPage />,
      fetchImpl
    );
    await view.user.click(await screen.findByRole("button", { name: "Preview schedule generation" }));
    const preview = await screen.findByRole("region", {
      name: "Schedule generation preview",
    });
    expect(preview).toHaveTextContent("Teams included");
    expect(preview).toHaveTextContent("Scheduled matchups");
    expect(preview).toHaveTextContent("66");
    expect(preview).toHaveTextContent("Current season version");
    expect(preview).not.toHaveTextContent("expectedVersion");
    expect(preview.querySelector("pre")).toBeNull();
    await view.user.click(screen.getByRole("button", { name: "Confirm schedule generation" }));
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests.map(({ body }) => body)).toEqual([{ confirmed: false }, { confirmed: true }]);
    expect(requests[1].headers.get("If-Match")).toBe('"3"');
    expect(requests[1].headers.get("X-CSRF-Token")).toBe("D".repeat(43));
  });
});
