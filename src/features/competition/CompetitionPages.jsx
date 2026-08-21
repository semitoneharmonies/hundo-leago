import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  StatusBadge,
  Surface,
  TableScroll,
} from "../../components/HundoUi.jsx";
import { readLeaguePreference } from "../leagues/leaguePreference.js";
import {
  leagueSeasonsQuery,
  leagueTeamsQuery,
  visibleLeaguesQuery,
} from "../leagues/leagueQueries.js";
import { useSession } from "../session/sessionContext.js";
import { CommissionerFadPanel } from "../freeAgentDraft/CommissionerFadPanel.jsx";
import { hasCommissionerAuthority } from "../../shared/leagueAuthority.js";
import { teamColourClass, teamColourStyle } from "../../shared/teamIdentity.js";
import {
  competitionKeys,
  currentMatchupWeekQuery,
  matchupQuery,
  matchupWeekQuery,
  matchupWeeksQuery,
  resultCorrectionCommand,
  scheduleCommand,
  standingsQuery,
  weekTransitionCommand,
} from "./competitionQueries.js";

const card = { border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 14 };

function operationId() {
  return globalThis.crypto?.randomUUID?.() || "00000000-0000-4000-8000-000000000001";
}

function points(value) {
  return (Number(value || 0) / 100).toFixed(2);
}

function matchupStatusLabel(status) {
  return {
    scheduled: "Scheduled",
    live: "Live",
    final: "Final",
    completed: "Final",
  }[status] || "Status unavailable";
}

function scoreInputValue(value) {
  return (Number(value) / 100).toFixed(2);
}

function scoreInputHundredths(value) {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const hundredths =
    Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"));
  return Number.isSafeInteger(hundredths) ? hundredths : null;
}

function weekLabel(sequence, startsAtMs, endsAtMs) {
  const options = { month: "short", day: "numeric", timeZone: "America/Vancouver" };
  const start = new Date(startsAtMs);
  const end = new Date(Math.max(startsAtMs, endsAtMs - 1));
  const startMonth = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    timeZone: "America/Vancouver",
  }).format(start);
  const endMonth = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    timeZone: "America/Vancouver",
  }).format(end);
  const startText =
    startMonth === endMonth
      ? new Intl.DateTimeFormat("en-CA", { day: "numeric", timeZone: options.timeZone }).format(start)
      : new Intl.DateTimeFormat("en-CA", options).format(start);
  const endText = new Intl.DateTimeFormat(
    "en-CA",
    startMonth === endMonth
      ? { day: "numeric", timeZone: options.timeZone }
      : options
  ).format(end);
  return `Week ${sequence}: ${startMonth === endMonth ? `${startMonth} ` : ""}${startText}–${endText}`;
}

function competitionErrorGuidance(error, context) {
  if (context === "schedule") {
    if (error?.code === "MATCHUP_PRECONDITION_FAILED") {
      return {
        fallback: "The schedule preview is out of date.",
        impact: "No schedule was created or changed.",
        recovery: "Refresh the preview so it uses the latest season settings, then review it again.",
      };
    }
    if (error?.code === "FAD_WEEK_ONE_FROZEN") {
      return {
        fallback: "Week 1 can no longer be moved.",
        impact: "The existing competition schedule remains unchanged.",
        recovery: "Candidate Cards are already open. Review the frozen Week 1 date before changing the surrounding schedule.",
      };
    }
    return {
      fallback: "The schedule preview is not ready.",
      impact: "No schedule was created or changed.",
      recovery: "Check that every league team, the NHL regular-season calendar, and the Week 1 date are complete, then try the preview again.",
    };
  }
  if (context === "week") {
    return {
      fallback: "The week transition preview is not ready.",
      impact: "The selected matchup week remains unchanged.",
      recovery: "Refresh the matchup weeks, choose the current week again, and retry the preview.",
    };
  }
  return {
    fallback: "The competition request could not be completed.",
    impact: "The latest competition information is unavailable.",
    recovery: "Refresh the page and try again.",
  };
}

function ErrorMessage({ error, context, onRetry }) {
  if (!error) return null;
  const guidance = competitionErrorGuidance(error, context);
  return (
    <ErrorBlock
      error={error}
      {...guidance}
      action={onRetry ? (
        <button className="hl-button hl-button--secondary" type="button" onClick={onRetry}>
          Try the preview again
        </button>
      ) : null}
    />
  );
}

function Health({ health }) {
  const source = health?.statistics || health?.scoring;
  if (
    !source ||
    source.status === "fresh" ||
    source.status === "not_live"
  ) {
    return null;
  }
  if (source.status === "unavailable") {
    return (
      <p role="alert">
        Scores are temporarily unavailable. Try Refresh again later.
      </p>
    );
  }
  return (
    <p role="status">
      Scores may be delayed because the latest statistics are not current.
    </p>
  );
}

function useCompetitionContext(leagueId) {
  const session = useSession();
  const leagues = useQuery({
    ...visibleLeaguesQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  const league = leagues.data?.find(({ id }) => id === leagueId) || null;
  return { session, leagues, league, seasonId: league?.currentSeason?.id || null };
}

function CompetitionGate({ context, title, children }) {
  if (context.session.status === "unauthenticated") {
    return <Navigate to={routePaths.home} replace state={{ reason: "sign-in" }} />;
  }
  if (context.session.status === "unknown" || context.leagues.isPending) {
    return <main className="hl-page"><Surface><LoadingBlock>Checking secure league access…</LoadingBlock></Surface></main>;
  }
  if (context.leagues.isError) return <main className="hl-page"><Surface className="hl-state-surface"><ErrorMessage error={context.leagues.error} /></Surface></main>;
  if (!context.league) {
    return <main className="hl-page"><PageHeading eyebrow="Competition" title={title} /><p className="hl-form-message is-error" role="alert">This league is not in your active memberships.</p></main>;
  }
  if (!context.seasonId) {
    return <main className="hl-page"><PageHeading eyebrow={context.league.name} title={title} /><Surface><EmptyBlock title="No active season is configured for this league." /></Surface></main>;
  }
  return (
    <main className="hl-page hl-page--wide hl-competition-page">
      <PageHeading
        eyebrow={context.league.name}
        title={title}
      />
      {children}
    </main>
  );
}

function LegacyLeagueFeatureRedirect({ buildRoute }) {
  const session = useSession();
  const leagues = useQuery({
    ...visibleLeaguesQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  if (session.status === "unauthenticated") {
    return <Navigate to={routePaths.home} replace state={{ reason: "sign-in" }} />;
  }
  if (session.status === "unknown" || leagues.isPending) {
    return <main className="hl-page"><Surface><LoadingBlock>Checking secure league access…</LoadingBlock></Surface></main>;
  }
  if (leagues.isError) {
    return <main className="hl-page"><Surface className="hl-state-surface"><ErrorMessage error={leagues.error} /></Surface></main>;
  }
  const preferredLeagueId = readLeaguePreference();
  const targetLeagueId = leagues.data.some(({ id }) => id === preferredLeagueId)
    ? preferredLeagueId
    : leagues.data.length === 1
      ? leagues.data[0].id
      : null;
  return (
    <Navigate
      to={
        targetLeagueId
          ? buildRoute(targetLeagueId)
          : routePaths.leagues
      }
      replace
    />
  );
}

export function LegacyPlayersRedirect() {
  return (
    <LegacyLeagueFeatureRedirect buildRoute={routePaths.leaguePlayers} />
  );
}

export function LegacyStandingsRedirect() {
  return (
    <LegacyLeagueFeatureRedirect buildRoute={routePaths.leagueStandings} />
  );
}

export function LegacyMatchupsRedirect() {
  return (
    <LegacyLeagueFeatureRedirect buildRoute={routePaths.leagueMatchups} />
  );
}

export function LeagueMatchupsPage() {
  const { leagueId } = useParams();
  const context = useCompetitionContext(leagueId);
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [selectedMatchupId, setSelectedMatchupId] = useState(null);
  const seasons = useQuery({
    ...leagueSeasonsQuery(context.session.httpClient, leagueId),
    enabled:
      context.session.status === "authenticated" && Boolean(context.league),
  });
  const effectiveSeasonId =
    selectedSeasonId &&
    seasons.data?.some(({ id }) => id === selectedSeasonId)
      ? selectedSeasonId
      : seasons.data?.find(({ id }) => id === context.seasonId)?.id ||
        seasons.data?.[0]?.id ||
        null;
  const enabled =
    context.session.status === "authenticated" &&
    Boolean(context.league && effectiveSeasonId);
  const weeks = useQuery({
    ...matchupWeeksQuery(
      context.session.httpClient,
      leagueId,
      effectiveSeasonId || "pending"
    ),
    enabled,
  });
  const teams = useQuery({
    ...leagueTeamsQuery(context.session.httpClient, leagueId),
    enabled: context.session.status === "authenticated" && Boolean(context.league),
  });
  const current = useQuery({
    ...currentMatchupWeekQuery(
      context.session.httpClient,
      leagueId,
      effectiveSeasonId || "pending"
    ),
    enabled,
    refetchInterval: 60_000,
  });

  const effectiveWeekId =
    selectedWeekId &&
    weeks.data?.weeks.some(({ id }) => id === selectedWeekId)
      ? selectedWeekId
      : current.data?.week?.id || weeks.data?.weeks?.[0]?.id || null;

  const week = useQuery({
    ...matchupWeekQuery(
      context.session.httpClient,
      leagueId,
      effectiveSeasonId || "pending",
      effectiveWeekId || "pending"
    ),
    enabled: enabled && Boolean(effectiveWeekId),
  });

  const effectiveMatchupId =
    selectedMatchupId && week.data?.matchups.some(({ id }) => id === selectedMatchupId)
      ? selectedMatchupId
      : week.data?.matchups?.[0]?.id || null;

  const matchup = useQuery({
    ...matchupQuery(
      context.session.httpClient,
      leagueId,
      effectiveSeasonId || "pending",
      effectiveWeekId || "pending",
      effectiveMatchupId || "pending"
    ),
    enabled: enabled && Boolean(effectiveWeekId && effectiveMatchupId),
    refetchInterval: 5 * 60_000,
  });
  const gateContext = {
    ...context,
    seasonId:
      seasons.isPending && context.league
        ? context.seasonId || "pending"
        : effectiveSeasonId,
  };

  return (
    <CompetitionGate context={gateContext} title="Matchups">
      {seasons.isPending || weeks.isPending || current.isPending ? (
        <Surface><LoadingBlock>Loading matchup schedule…</LoadingBlock></Surface>
      ) : seasons.isError ? <ErrorMessage error={seasons.error} />
        : weeks.isError ? <ErrorMessage error={weeks.error} />
        : current.isError ? <ErrorMessage error={current.error} />
          : (
            <>
              <Surface className="hl-competition-toolbar">
              <label className="hl-field">
                Season{" "}
                <select
                  value={effectiveSeasonId || ""}
                  onChange={(event) => {
                    setSelectedSeasonId(event.target.value);
                    setSelectedWeekId(null);
                    setSelectedMatchupId(null);
                  }}
                >
                  {seasons.data.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="hl-field">
                Week{" "}
                <select
                  value={effectiveWeekId || ""}
                  onChange={(event) => {
                    setSelectedWeekId(event.target.value);
                    setSelectedMatchupId(null);
                  }}
                  disabled={weeks.data.weeks.length === 0}
                >
                  {weeks.data.weeks.map((item) => (
                    <option key={item.id} value={item.id}>
                      {weekLabel(item.sequence, item.startsAtMs, item.endsAtMs)}
                    </option>
                  ))}
                </select>
              </label>
              <Health health={current.data.health} />
              </Surface>
              {weeks.data.weeks.length === 0 ? (
                <Surface>
                  <EmptyBlock title="No matchup schedule has been generated yet." />
                </Surface>
                ) : (
                  <>
                  {week.isPending ? <Surface><LoadingBlock>Loading week…</LoadingBlock></Surface>
                    : week.isError ? <ErrorMessage error={week.error} />
                      : (
                        <div className="hl-matchup-workspace">
                          <aside className="hl-surface hl-matchup-sidebar">
                            <header>
                              <p className="hl-eyebrow">Selected week</p>
                              <h2>
                                {weekLabel(
                                  week.data.sequence,
                                  week.data.startsAtMs,
                                  week.data.endsAtMs
                                )}
                              </h2>
                              <StatusBadge>{week.data.status}</StatusBadge>
                            </header>
                            {week.data.matchups.length === 0 ? (
                              <p className="hl-matchup-sidebar__empty">No pairings in this week.</p>
                            ) : (
                              <nav aria-label="Matchups in this week">
                                {week.data.matchups.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    aria-label={`${item.homeTeam.name} vs ${item.awayTeam.name}`}
                                    aria-pressed={item.id === effectiveMatchupId}
                                    onClick={() => setSelectedMatchupId(item.id)}
                                  >
                                    <span>{item.homeTeam.name}</span>
                                    <small>vs</small>
                                    <span>{item.awayTeam.name}</span>
                                  </button>
                                ))}
                              </nav>
                            )}
                            {week.data.byes.length > 0 && (
                              <div className="hl-matchup-byes">
                                {week.data.byes.map((bye) => <p key={bye.id}>Bye: {bye.team.name}</p>)}
                              </div>
                            )}
                          </aside>
                          <div className="hl-matchup-main">
                            {matchup.isPending && effectiveMatchupId ? (
                              <Surface><LoadingBlock>Loading matchup score…</LoadingBlock></Surface>
                            ) : matchup.isError ? (
                              <ErrorMessage error={matchup.error} />
                            ) : matchup.data ? (
                              <>
                                <div className="hl-matchup-actions">
                                  <button
                                    className="hl-button hl-button--quiet"
                                    type="button"
                                    onClick={() =>
                                      queryClient.invalidateQueries({
                                        queryKey: competitionKeys.matchup(
                                          leagueId,
                                          effectiveSeasonId,
                                          effectiveWeekId,
                                          effectiveMatchupId
                                        ),
                                        exact: true,
                                      })
                                    }
                                    disabled={matchup.isFetching}
                                  >
                                    Refresh
                                  </button>
                                  {matchup.isFetching && !matchup.isPending ? (
                                    <p role="status">Refreshing matchup score…</p>
                                  ) : null}
                                </div>
                                <MatchupCard
                                  matchup={matchup.data}
                                  teams={teams.data || []}
                                />
                              </>
                            ) : null}
                          </div>
                        </div>
                      )}
                </>
              )}
            </>
          )}
      <p className="hl-page-backlink"><Link to={routePaths.league(leagueId)}>Back to dashboard</Link></p>
    </CompetitionGate>
  );
}

function scoringSlots(teamScore) {
  const playersBySlot = new Map(
    (teamScore?.players || []).map((player) => [
      `${player.positionGroup}:${player.slotNumber}`,
      player,
    ])
  );
  return [
    ...Array.from({ length: 12 }, (_, index) => ({
      positionGroup: "F",
      slotNumber: index + 1,
    })),
    ...Array.from({ length: 6 }, (_, index) => ({
      positionGroup: "D",
      slotNumber: index + 1,
    })),
  ].map((slot) => ({
    ...slot,
    player:
      playersBySlot.get(`${slot.positionGroup}:${slot.slotNumber}`) || null,
  }));
}

function playerStat(player, field) {
  if (!player || player.dataStatus === "missing") return "—";
  return field === "scoreHundredths"
    ? points(player[field])
    : player[field];
}

function MatchupCard({ matchup, teams = [] }) {
  const official = matchup.result?.currentVersion || null;
  const scoring = matchup.scoring;
  const homeScore =
    official?.homeScoreHundredths ?? scoring?.home.scoreHundredths ?? 0;
  const awayScore =
    official?.awayScoreHundredths ?? scoring?.away.scoreHundredths ?? 0;
  const homeSlots = scoringSlots(scoring?.home);
  const awaySlots = scoringSlots(scoring?.away);
  const homeTeam =
    teams.find(({ id }) => id === matchup.homeTeam.id) || matchup.homeTeam;
  const awayTeam =
    teams.find(({ id }) => id === matchup.awayTeam.id) || matchup.awayTeam;
  return (
    <section className="hl-surface hl-matchup-detail" aria-labelledby="matchup-detail-title">
      <header className="hl-matchup-score">
        <div
          className={teamColourClass("hl-matchup-score__team", homeTeam)}
          style={teamColourStyle(homeTeam)}
        >
          <span>Home</span>
          <strong>{homeTeam.name}</strong>
          <b>{points(homeScore)} FP</b>
          <small>fantasy points</small>
        </div>
        <div className="hl-matchup-score__center">
          <StatusBadge tone={matchup.status === "live" ? "live" : "neutral"}>
            {matchupStatusLabel(matchup.status)}
          </StatusBadge>
          <span>VS</span>
        </div>
        <div
          className={teamColourClass("hl-matchup-score__team", awayTeam)}
          style={teamColourStyle(awayTeam)}
        >
          <span>Away</span>
          <strong>{awayTeam.name}</strong>
          <b>{points(awayScore)} FP</b>
          <small>fantasy points</small>
        </div>
      </header>
      <h2 className="hl-visually-hidden" id="matchup-detail-title">{homeTeam.name} vs {awayTeam.name}</h2>
      <Health health={matchup.health} />
      {!scoring ? (
        <p>
          {official
            ? "Player scoring details are temporarily unavailable."
            : "The week starts on Monday."}
        </p>
      ) : (
        <>
          {!scoring.home.legal ? (
            <p role="alert">
              {matchup.homeTeam.name} did not have a legal locked roster, so
              no fantasy points were awarded.
            </p>
          ) : null}
          {!scoring.away.legal ? (
            <p role="alert">
              {matchup.awayTeam.name} did not have a legal locked roster, so
              no fantasy points were awarded.
            </p>
          ) : null}
          <TableScroll
            label={`${homeTeam.name} versus ${awayTeam.name} player scoring`}
          >
            <table className="hl-data-table hl-matchup-table">
              <caption>Player scoring for this matchup</caption>
              <thead>
                <tr>
                  <th colSpan="6" scope="colgroup">{homeTeam.name}</th>
                  <th colSpan="6" scope="colgroup">{awayTeam.name}</th>
                </tr>
                <tr>
                  <th>Player</th><th>GP</th><th>G</th><th>A</th><th>PTS</th><th>FP</th>
                  <th>Player</th><th>GP</th><th>G</th><th>A</th><th>PTS</th><th>FP</th>
                </tr>
              </thead>
              <tbody>
                {homeSlots.map((homeSlot, index) => {
                  const awaySlot = awaySlots[index];
                  const homePlayer = homeSlot.player;
                  const awayPlayer = awaySlot.player;
                  return (
                    <tr key={`${homeSlot.positionGroup}-${homeSlot.slotNumber}`}>
                      <th
                        className={`hl-matchup-player-name${homePlayer ? "" : " is-empty"}`}
                        scope="row"
                      >
                        {homePlayer
                          ? `${homePlayer.fullName}${
                              homePlayer.dataStatus === "missing"
                                ? " — data unavailable"
                                : ""
                            }`
                          : `Empty ${homeSlot.positionGroup} slot ${homeSlot.slotNumber}`}
                      </th>
                      <td>{playerStat(homePlayer, "gamesPlayedDelta")}</td>
                      <td>{playerStat(homePlayer, "goalDelta")}</td>
                      <td>{playerStat(homePlayer, "assistDelta")}</td>
                      <td>{playerStat(homePlayer, "pointDelta")}</td>
                      <td
                        className={
                          homePlayer?.dataStatus === "available"
                            ? "hl-matchup-player-fp"
                            : ""
                        }
                      >
                        {playerStat(homePlayer, "scoreHundredths")}
                      </td>
                      <th
                        className={`hl-matchup-player-name${awayPlayer ? "" : " is-empty"}`}
                        scope="row"
                      >
                        {awayPlayer
                          ? `${awayPlayer.fullName}${
                              awayPlayer.dataStatus === "missing"
                                ? " — data unavailable"
                                : ""
                            }`
                          : `Empty ${awaySlot.positionGroup} slot ${awaySlot.slotNumber}`}
                      </th>
                      <td>{playerStat(awayPlayer, "gamesPlayedDelta")}</td>
                      <td>{playerStat(awayPlayer, "goalDelta")}</td>
                      <td>{playerStat(awayPlayer, "assistDelta")}</td>
                      <td>{playerStat(awayPlayer, "pointDelta")}</td>
                      <td
                        className={
                          awayPlayer?.dataStatus === "available"
                            ? "hl-matchup-player-fp"
                            : ""
                        }
                      >
                        {playerStat(awayPlayer, "scoreHundredths")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        </>
      )}
      {matchup.result?.status === "corrected" && <p className="hl-inline-copy">Official result corrected.</p>}
    </section>
  );
}

export function LeagueStandingsPage() {
  const { leagueId } = useParams();
  const context = useCompetitionContext(leagueId);
  const queryClient = useQueryClient();
  const [correctionDraft, setCorrectionDraft] = useState(null);
  const [correctionPreview, setCorrectionPreview] = useState(null);
  const [correctionNotice, setCorrectionNotice] = useState("");
  const correctionHeadingRef = useRef(null);
  const correctionTriggerRef = useRef(null);
  const enabled = context.session.status === "authenticated" && Boolean(context.league && context.seasonId);
  const standings = useQuery({
    ...standingsQuery(context.session.httpClient, leagueId, context.seasonId),
    enabled,
  });
  const teams = useQuery({
    ...leagueTeamsQuery(context.session.httpClient, leagueId),
    enabled: context.session.status === "authenticated" && Boolean(context.league),
  });
  const currentTeams = new Map(
    (teams.data || []).map((team) => [team.id, team])
  );
  const commissioner = hasCommissionerAuthority(
    context.league?.membership
  );
  const correctionMutation = useMutation({
    mutationFn: ({ confirmed, draft, version }) => {
      const homeScoreHundredths = scoreInputHundredths(draft.homeScore);
      const awayScoreHundredths = scoreInputHundredths(draft.awayScore);
      if (homeScoreHundredths === null || awayScoreHundredths === null) {
        throw new Error("Enter each score as a non-negative number with no more than two decimals.");
      }
      return resultCorrectionCommand(
        context.session.httpClient,
        leagueId,
        context.seasonId,
        draft.resultId,
        {
          confirmed,
          homeScoreHundredths,
          awayScoreHundredths,
          ...(draft.reason.trim() ? { reason: draft.reason.trim() } : {}),
        },
        version,
        confirmed ? operationId() : undefined
      );
    },
    onSuccess(data, variables) {
      if (!variables.confirmed) {
        setCorrectionPreview(data.preview);
        return;
      }
      setCorrectionDraft(null);
      setCorrectionPreview(null);
      setCorrectionNotice("Result corrected. Standings updated.");
      globalThis.setTimeout(() => correctionTriggerRef.current?.focus(), 0);
      queryClient.invalidateQueries({
        queryKey: ["league", leagueId, "season", context.seasonId],
      });
    },
  });

  const correctionResultId = correctionDraft?.resultId || null;
  useEffect(() => {
    if (!correctionResultId) return;
    correctionHeadingRef.current?.focus();
  }, [correctionResultId]);

  function editResult(result, trigger) {
    correctionTriggerRef.current = trigger;
    setCorrectionDraft({
      resultId: result.id,
      homeScore: scoreInputValue(result.homeScoreHundredths),
      awayScore: scoreInputValue(result.awayScoreHundredths),
      reason: "",
    });
    setCorrectionPreview(null);
    setCorrectionNotice("");
    correctionMutation.reset();
  }

  function closeCorrection() {
    const trigger = correctionTriggerRef.current;
    setCorrectionDraft(null);
    setCorrectionPreview(null);
    correctionMutation.reset();
    globalThis.setTimeout(() => trigger?.focus(), 0);
  }

  function updateCorrectionDraft(fieldName, value) {
    setCorrectionDraft((current) => ({ ...current, [fieldName]: value }));
    setCorrectionPreview(null);
    correctionMutation.reset();
  }

  const selectedResult = standings.data?.results.find(
    ({ id }) => id === correctionDraft?.resultId
  );
  const correctionReady =
    correctionDraft !== null &&
    scoreInputHundredths(correctionDraft.homeScore) !== null &&
    scoreInputHundredths(correctionDraft.awayScore) !== null;
  return (
    <CompetitionGate context={context} title="Standings">
      {standings.isPending || teams.isPending ? <Surface><LoadingBlock>Loading official standings…</LoadingBlock></Surface>
        : standings.isError || teams.isError ? <ErrorMessage error={standings.error || teams.error} />
          : (
            <>
              <Health health={standings.data.health} />
              {standings.data.rows.length === 0 ? <Surface><EmptyBlock title="No teams are registered for this season." /></Surface> : (
                <Surface className="hl-standings-panel">
                <TableScroll label="League standings">
                  <table className="hl-data-table hl-standings-table">
                    <thead>
                      <tr>
                        <th>Rank</th><th>Team</th><th>GP</th><th>W</th><th>L</th>
                        <th>T</th><th>PTS</th><th>PCT</th><th>PF</th><th>PA</th><th>DIFF</th>
                      </tr>
                    </thead>
                    <tbody>{standings.data.rows.map((item) => {
                      const team = currentTeams.get(item.teamId) || null;
                      return (
                      <tr
                        className={teamColourClass("hl-standings-team-row")}
                        key={item.teamId}
                        style={teamColourStyle(team)}
                      >
                        <td>{item.rank}</td><th scope="row">{team?.name || item.teamDisplayName}</th>
                        <td>{item.gamesPlayed}</td><td>{item.wins}</td><td>{item.losses}</td>
                        <td>{item.ties}</td><td>{item.standingsPoints}</td>
                        <td>{points(item.pointsPercentageHundredths)}%</td>
                        <td>{points(item.fantasyPointsForHundredths)}</td>
                        <td>{points(item.fantasyPointsAgainstHundredths)}</td>
                        <td>{points(item.fantasyPointsDifferentialHundredths)}</td>
                      </tr>
                      );
                    })}</tbody>
                  </table>
                </TableScroll>
                </Surface>
              )}
              <p className="hl-standings-note">Scores updated weekly.</p>
              {commissioner && standings.data.results.length > 0 ? (
                <Surface className="hl-standings-results">
                  <header>
                    <h2>Official results</h2>
                  </header>
                  <TableScroll label="Official matchup results">
                    <table className="hl-data-table hl-standings-results__table">
                      <thead>
                        <tr>
                          <th>Week</th>
                          <th>Matchup</th>
                          <th>Score</th>
                          <th><span className="hl-visually-hidden">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.data.results.map((result) => (
                          <tr key={result.id}>
                            <td>
                              {weekLabel(
                                result.week.sequence,
                                result.week.startsAtMs,
                                result.week.endsAtMs
                              )}
                            </td>
                            <th scope="row">
                              {result.matchup.homeTeam.name} vs {result.matchup.awayTeam.name}
                            </th>
                            <td className="is-mono">
                              {points(result.homeScoreHundredths)} - {points(result.awayScoreHundredths)}
                            </td>
                            <td>
                              <button
                                className="hl-button hl-button--quiet"
                                type="button"
                                aria-label={`Edit ${result.matchup.homeTeam.name} vs ${result.matchup.awayTeam.name} result`}
                                onClick={(event) => editResult(result, event.currentTarget)}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableScroll>
                </Surface>
              ) : null}
              {commissioner && selectedResult && correctionDraft ? (
                <Surface
                  className="hl-result-correction"
                  aria-label={`Edit ${selectedResult.matchup.homeTeam.name} vs ${selectedResult.matchup.awayTeam.name} result`}
                >
                  <header>
                    <p className="hl-eyebrow">
                      {weekLabel(
                        selectedResult.week.sequence,
                        selectedResult.week.startsAtMs,
                        selectedResult.week.endsAtMs
                      )}
                    </p>
                    <h2 ref={correctionHeadingRef} tabIndex={-1}>
                      {selectedResult.matchup.homeTeam.name} vs {selectedResult.matchup.awayTeam.name}
                    </h2>
                  </header>
                  <p>
                    Update the official result. Confirming also recalculates the standings.
                  </p>
                  <div className="hl-result-correction__fields">
                    <label className="hl-field">
                      {selectedResult.matchup.homeTeam.name} score
                      <input
                        inputMode="decimal"
                        value={correctionDraft.homeScore}
                        onChange={(event) =>
                          updateCorrectionDraft("homeScore", event.target.value)
                        }
                      />
                    </label>
                    <label className="hl-field">
                      {selectedResult.matchup.awayTeam.name} score
                      <input
                        inputMode="decimal"
                        value={correctionDraft.awayScore}
                        onChange={(event) =>
                          updateCorrectionDraft("awayScore", event.target.value)
                        }
                      />
                    </label>
                    <label className="hl-field">
                      Note (optional)
                      <input
                        value={correctionDraft.reason}
                        onChange={(event) =>
                          updateCorrectionDraft("reason", event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <ErrorMessage error={correctionMutation.error} />
                  {correctionPreview ? (
                    <section
                      className="hl-commissioner-preview"
                      aria-label="Result correction preview"
                    >
                      <p className="hl-eyebrow">Review before confirming</p>
                      <p>
                        {selectedResult.matchup.homeTeam.name} {points(correctionPreview.currentVersion.homeScoreHundredths)} - {points(correctionPreview.currentVersion.awayScoreHundredths)} {selectedResult.matchup.awayTeam.name}
                        {" to "}
                        {selectedResult.matchup.homeTeam.name} {points(correctionPreview.proposedVersion.homeScoreHundredths)} - {points(correctionPreview.proposedVersion.awayScoreHundredths)} {selectedResult.matchup.awayTeam.name}
                      </p>
                      {correctionPreview.standingsImpact.changedTeamIds.length === 0 ? (
                        <p>The visible standings rows will not change.</p>
                      ) : (
                        <TableScroll label="Projected standings after correction">
                          <table className="hl-data-table hl-correction-standings-table">
                            <caption>Projected standings after correction</caption>
                            <thead>
                              <tr>
                                <th>Rank</th>
                                <th>Team</th>
                                <th>W</th>
                                <th>L</th>
                                <th>T</th>
                                <th>PTS</th>
                                <th>DIFF</th>
                              </tr>
                            </thead>
                            <tbody>
                              {correctionPreview.standingsImpact.projectedRows.map((standing) => (
                                <tr
                                  key={standing.teamId}
                                  className={
                                    correctionPreview.standingsImpact.changedTeamIds.includes(standing.teamId)
                                      ? "is-affected"
                                      : undefined
                                  }
                                >
                                  <td>{standing.rank}</td>
                                  <th scope="row">
                                    {currentTeams.get(standing.teamId)?.name || standing.teamDisplayName}
                                  </th>
                                  <td>{standing.wins}</td>
                                  <td>{standing.losses}</td>
                                  <td>{standing.ties}</td>
                                  <td>{standing.standingsPoints}</td>
                                  <td>{points(standing.fantasyPointsDifferentialHundredths)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </TableScroll>
                      )}
                      <div className="hl-button-row">
                        <button
                          className="hl-button hl-button--primary"
                          type="button"
                          onClick={() =>
                            correctionMutation.mutate({
                              confirmed: true,
                              draft: correctionDraft,
                              version: correctionPreview.expectedVersion,
                            })
                          }
                          disabled={correctionMutation.isPending}
                        >
                          Confirm correction and update standings
                        </button>
                        <button
                          className="hl-button hl-button--quiet"
                          type="button"
                          onClick={closeCorrection}
                          disabled={correctionMutation.isPending}
                        >
                          Cancel
                        </button>
                      </div>
                    </section>
                  ) : (
                    <div className="hl-button-row">
                      <button
                        className="hl-button hl-button--primary"
                        type="button"
                        onClick={() =>
                          correctionMutation.mutate({
                            confirmed: false,
                            draft: correctionDraft,
                          })
                        }
                        disabled={!correctionReady || correctionMutation.isPending}
                      >
                        Preview correction
                      </button>
                      <button
                        className="hl-button hl-button--quiet"
                        type="button"
                        onClick={closeCorrection}
                        disabled={correctionMutation.isPending}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </Surface>
              ) : null}
              {correctionNotice ? <p role="status">{correctionNotice}</p> : null}
            </>
          )}
      <p className="hl-page-backlink"><Link to={routePaths.league(leagueId)}>Back to dashboard</Link></p>
    </CompetitionGate>
  );
}

function PreviewAction({
  title,
  mutation,
  preview,
  onPreview,
  onConfirm,
  confirmDisabled = false,
  previewDisabled = false,
  children,
}) {
  const previewMetrics =
    title === "Schedule generation"
      ? [
          ["Teams included", preview?.participantCount ?? 0],
          ["Matchup weeks", preview?.weekCount ?? 0],
          ["Scheduled matchups", preview?.matchupCount ?? 0],
          ["Team byes", preview?.byeCount ?? 0],
          [
            "First week starts",
            previewTimestamp(preview?.firstWeekStartsAtMs),
          ],
          [
            "Regular season ends",
            previewTimestamp(preview?.lastWeekEndsAtMs),
          ],
        ]
      : [
          [
            "Current status",
            humanizeStatus(preview?.currentStatus),
          ],
          [
            "Transition time",
            previewTimestamp(preview?.effectiveAtMs),
          ],
        ];

  return (
    <section className="hl-surface hl-preview-action" style={card}>
      <h2>{title}</h2>
      {children}
      <ErrorMessage
        error={mutation.error}
        context={title === "Schedule generation" ? "schedule" : "week"}
        onRetry={onPreview}
      />
      {!preview ? (
        <button className="hl-button hl-button--primary" type="button" onClick={onPreview} disabled={mutation.isPending || previewDisabled}>
          Preview {title.toLowerCase()}
        </button>
      ) : (
        <div>
          <section
            className="hl-commissioner-preview"
            aria-label={`${title} preview`}
          >
            <p className="hl-eyebrow">Review before confirming</p>
            <dl>
              {previewMetrics.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <div className="hl-button-row">
          <button className="hl-button hl-button--primary" type="button" onClick={onConfirm} disabled={mutation.isPending || confirmDisabled}>
            Confirm {title.toLowerCase()}
          </button>
          <button className="hl-button hl-button--quiet" type="button" onClick={onPreview} disabled={mutation.isPending || previewDisabled}>
            Refresh {title.toLowerCase()} preview
          </button>
          </div>
        </div>
      )}
      {mutation.isSuccess && !preview && <p role="status">Action completed.</p>}
    </section>
  );
}

function humanizeStatus(value) {
  if (typeof value !== "string" || value === "") return "Unavailable";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function previewTimestamp(value) {
  if (!Number.isSafeInteger(value) || value < 0) return "Not set";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Vancouver",
  }).format(new Date(value));
}

export function CommissionerCompetitionPage() {
  const { leagueId } = useParams();
  const context = useCompetitionContext(leagueId);
  const queryClient = useQueryClient();
  const [schedulePreview, setSchedulePreview] = useState(null);
  const [weekPreview, setWeekPreview] = useState(null);
  const [weekId, setWeekId] = useState("");
  const seasonId = context.seasonId;
  const commissioner = hasCommissionerAuthority(
    context.league?.membership
  );
  const weeks = useQuery({
    ...matchupWeeksQuery(context.session.httpClient, leagueId, seasonId),
    enabled:
      context.session.status === "authenticated" &&
      Boolean(context.league && seasonId && commissioner),
  });
  const availableWeeks = weeks.data?.weeks || [];
  const defaultWeek =
    availableWeeks.find(({ status }) => status !== "final") ||
    availableWeeks[0] ||
    null;
  const selectedWeekId = availableWeeks.some(({ id }) => id === weekId)
    ? weekId
    : defaultWeek?.id || "";

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["league", leagueId, "season", seasonId] });
  const scheduleMutation = useMutation({
    mutationFn: ({ confirmed, version }) => scheduleCommand(context.session.httpClient, leagueId, seasonId, confirmed, version),
    onSuccess(data, variables) {
      if (!variables.confirmed) setSchedulePreview(data.preview);
      else { setSchedulePreview(null); invalidate(); }
    },
  });
  const weekMutation = useMutation({
    mutationFn: ({ confirmed, version }) => weekTransitionCommand(
      context.session.httpClient, leagueId, seasonId, selectedWeekId, confirmed, version, confirmed ? operationId() : undefined
    ),
    onSuccess(data, variables) {
      if (!variables.confirmed) setWeekPreview(data.preview);
      else { setWeekPreview(null); invalidate(); }
    },
  });
  return (
    <CompetitionGate context={context} title="Commissioner competition tools">
      {!commissioner ? <p role="alert">Current commissioner authority is required.</p> : (
        <>
          <CommissionerFadPanel
            leagueId={leagueId}
            seasonId={seasonId}
            timeZone={context.league?.timezone}
          />
          <PreviewAction title="Schedule generation" mutation={scheduleMutation} preview={schedulePreview}
            onPreview={() => scheduleMutation.mutate({ confirmed: false })}
            onConfirm={() => scheduleMutation.mutate({ confirmed: true, version: schedulePreview.expectedVersion })} />
          <PreviewAction title="Week transition" mutation={weekMutation} preview={weekPreview}
            previewDisabled={!selectedWeekId || weeks.isPending || weeks.isError}
            confirmDisabled={!selectedWeekId}
            onPreview={() => weekMutation.mutate({ confirmed: false })}
            onConfirm={() => weekMutation.mutate({ confirmed: true, version: weekPreview.expectedVersion })}>
            {weeks.isPending ? <LoadingBlock>Loading matchup weeks...</LoadingBlock> : null}
            {weeks.isError ? <ErrorMessage error={weeks.error} /> : null}
            {!weeks.isPending && !weeks.isError && availableWeeks.length === 0 ? (
              <EmptyBlock title="No matchup weeks are available." />
            ) : null}
            {!weeks.isPending && !weeks.isError && availableWeeks.length > 0 ? (
              <label className="hl-field">
                Week
                <select
                  value={selectedWeekId}
                  onChange={(event) => {
                    setWeekId(event.target.value);
                    setWeekPreview(null);
                    weekMutation.reset();
                  }}
                >
                  {availableWeeks.map((week) => (
                    <option key={week.id} value={week.id}>
                      {weekLabel(week.sequence, week.startsAtMs, week.endsAtMs)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </PreviewAction>
        </>
      )}
      <p className="hl-page-backlink"><Link to={routePaths.league(leagueId)}>Back to dashboard</Link></p>
    </CompetitionGate>
  );
}
