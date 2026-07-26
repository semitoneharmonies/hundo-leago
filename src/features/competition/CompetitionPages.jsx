import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  LoadingBlock,
  PageHeading,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { readLeaguePreference } from "../leagues/leaguePreference.js";
import {
  leagueSeasonsQuery,
  leagueTeamsQuery,
  visibleLeaguesQuery,
} from "../leagues/leagueQueries.js";
import { useSession } from "../session/sessionContext.js";
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
  standingsRebuildCommand,
  weekTransitionCommand,
} from "./competitionQueries.js";

const card = { border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 14 };
const row = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" };
const field = { display: "grid", gap: 5, minWidth: 180 };
const input = { padding: 8, borderRadius: 6, border: "1px solid #475569" };

function operationId() {
  return globalThis.crypto?.randomUUID?.() || "00000000-0000-4000-8000-000000000001";
}

function points(value) {
  return (Number(value || 0) / 100).toFixed(2);
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

function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <div role="alert">
      <p>{error.message || "The competition request could not be completed."}</p>
      {error.requestId && <p>Request ID: {error.requestId}</p>}
    </div>
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
        description={
          title === "Matchups"
            ? "Authoritative head-to-head scoring by matchup period."
            : title === "Standings"
              ? "Official W-L-T league table from finalized results."
              : "Preview-and-confirm competition administration."
        }
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
          <strong>{matchup.homeTeam.name}</strong>
          <b>{points(homeScore)} FP</b>
          <small>fantasy points</small>
        </div>
        <div>
          <StatusBadge tone={matchup.status === "live" ? "live" : "neutral"}>
            {matchup.status}
          </StatusBadge>
          <span>VS</span>
        </div>
        <div
          className={teamColourClass("hl-matchup-score__team", awayTeam)}
          style={teamColourStyle(awayTeam)}
        >
          <span>Away</span>
          <strong>{matchup.awayTeam.name}</strong>
          <b>{points(awayScore)} FP</b>
          <small>fantasy points</small>
        </div>
      </header>
      <h2 className="hl-visually-hidden" id="matchup-detail-title">{matchup.homeTeam.name} vs {matchup.awayTeam.name}</h2>
      <Health health={matchup.health} />
      {!scoring ? (
        <p>
          {official
            ? "Player scoring details are temporarily unavailable."
            : "Scoring begins after the roster lock and baseline are available."}
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
          <div className="hl-table-scroll">
            <table className="hl-data-table hl-matchup-table">
              <caption>Player scoring for this matchup</caption>
              <thead>
                <tr>
                  <th colSpan="6" scope="colgroup">{matchup.homeTeam.name}</th>
                  <th colSpan="6" scope="colgroup">{matchup.awayTeam.name}</th>
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
                      <th className={homePlayer ? "" : "is-empty"} scope="row">
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
                      <td>{playerStat(homePlayer, "scoreHundredths")}</td>
                      <th className={awayPlayer ? "" : "is-empty"} scope="row">
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
                      <td>{playerStat(awayPlayer, "scoreHundredths")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {matchup.result?.status === "corrected" && <p className="hl-inline-copy">Official result corrected (version {matchup.result.currentVersion.versionNumber}).</p>}
    </section>
  );
}

export function LeagueStandingsPage() {
  const { leagueId } = useParams();
  const context = useCompetitionContext(leagueId);
  const enabled = context.session.status === "authenticated" && Boolean(context.league && context.seasonId);
  const standings = useQuery({
    ...standingsQuery(context.session.httpClient, leagueId, context.seasonId),
    enabled,
  });
  return (
    <CompetitionGate context={context} title="Standings">
      {standings.isPending ? <Surface><LoadingBlock>Loading official standings…</LoadingBlock></Surface>
        : standings.isError ? <ErrorMessage error={standings.error} />
          : (
            <>
              <Health health={standings.data.health} />
              {standings.data.rows.length === 0 ? <Surface><EmptyBlock title="No teams are registered for this season." /></Surface> : (
                <Surface className="hl-standings-panel">
                <div className="hl-table-scroll">
                  <table className="hl-data-table hl-standings-table">
                    <thead>
                      <tr>
                        <th>Rank</th><th>Team</th><th>GP</th><th>W</th><th>L</th>
                        <th>T</th><th>PTS</th><th>PCT</th><th>PF</th><th>PA</th><th>DIFF</th>
                      </tr>
                    </thead>
                    <tbody>{standings.data.rows.map((item) => (
                      <tr key={item.teamId}>
                        <td>{item.rank}</td><th scope="row">{item.teamDisplayName}</th>
                        <td>{item.gamesPlayed}</td><td>{item.wins}</td><td>{item.losses}</td>
                        <td>{item.ties}</td><td>{item.standingsPoints}</td>
                        <td>{points(item.pointsPercentageHundredths)}%</td>
                        <td>{points(item.fantasyPointsForHundredths)}</td>
                        <td>{points(item.fantasyPointsAgainstHundredths)}</td>
                        <td>{points(item.fantasyPointsDifferentialHundredths)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                </Surface>
              )}
              <p className="hl-standings-note">{standings.data.finalizedResultCount} finalized results counted.</p>
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
  return (
    <section className="hl-surface hl-preview-action" style={card}>
      <h2>{title}</h2>
      {children}
      <ErrorMessage error={mutation.error} />
      {!preview ? (
        <button className="hl-button hl-button--primary" type="button" onClick={onPreview} disabled={mutation.isPending || previewDisabled}>
          Preview {title.toLowerCase()}
        </button>
      ) : (
        <div>
          <pre className="hl-snapshot">{JSON.stringify(preview, null, 2)}</pre>
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

export function CommissionerCompetitionPage() {
  const { leagueId } = useParams();
  const context = useCompetitionContext(leagueId);
  const queryClient = useQueryClient();
  const [schedulePreview, setSchedulePreview] = useState(null);
  const [weekPreview, setWeekPreview] = useState(null);
  const [resultPreview, setResultPreview] = useState(null);
  const [standingsPreview, setStandingsPreview] = useState(null);
  const [weekId, setWeekId] = useState("");
  const [resultId, setResultId] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [rebuildReason, setRebuildReason] = useState("");
  const seasonId = context.seasonId;

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
      context.session.httpClient, leagueId, seasonId, weekId, confirmed, version, confirmed ? operationId() : undefined
    ),
    onSuccess(data, variables) {
      if (!variables.confirmed) setWeekPreview(data.preview);
      else { setWeekPreview(null); invalidate(); }
    },
  });
  const resultMutation = useMutation({
    mutationFn: ({ confirmed, version }) => resultCorrectionCommand(
      context.session.httpClient,
      leagueId,
      seasonId,
      resultId,
      confirmed ? {
        confirmed: true,
        homeScoreHundredths: Number(homeScore),
        awayScoreHundredths: Number(awayScore),
        reason: correctionReason,
      } : { confirmed: false },
      version,
      confirmed ? operationId() : undefined
    ),
    onSuccess(data, variables) {
      if (!variables.confirmed) setResultPreview(data.preview);
      else { setResultPreview(null); invalidate(); }
    },
  });
  const standingsMutation = useMutation({
    mutationFn: ({ confirmed, version }) => standingsRebuildCommand(
      context.session.httpClient,
      leagueId,
      seasonId,
      confirmed ? {
        confirmed: true,
        expectedCurrentSnapshotId: standingsPreview.currentSnapshotId,
        reason: rebuildReason,
      } : { confirmed: false },
      version,
      confirmed ? operationId() : undefined
    ),
    onSuccess(data, variables) {
      if (!variables.confirmed) setStandingsPreview(data.preview);
      else { setStandingsPreview(null); invalidate(); }
    },
  });

  const commissioner = hasCommissionerAuthority(
    context.league?.membership
  );
  return (
    <CompetitionGate context={context} title="Commissioner competition tools">
      {!commissioner ? <p role="alert">Current commissioner authority is required.</p> : (
        <>
          <p>Every change requires a fresh preview, matching version, and explicit confirmation.</p>
          <PreviewAction title="Schedule generation" mutation={scheduleMutation} preview={schedulePreview}
            onPreview={() => scheduleMutation.mutate({ confirmed: false })}
            onConfirm={() => scheduleMutation.mutate({ confirmed: true, version: schedulePreview.expectedVersion })} />
          <PreviewAction title="Week transition" mutation={weekMutation} preview={weekPreview}
            previewDisabled={!weekId}
            confirmDisabled={!weekId}
            onPreview={() => weekMutation.mutate({ confirmed: false })}
            onConfirm={() => weekMutation.mutate({ confirmed: true, version: weekPreview.expectedVersion })}>
            <label style={field}>Week ID<input style={input} value={weekId} onChange={(event) => { setWeekId(event.target.value); setWeekPreview(null); }} /></label>
          </PreviewAction>
          <PreviewAction title="Result correction" mutation={resultMutation} preview={resultPreview}
            previewDisabled={!resultId}
            confirmDisabled={!resultId || !correctionReason || !/^\d+$/.test(homeScore) || !/^\d+$/.test(awayScore)}
            onPreview={() => resultMutation.mutate({ confirmed: false })}
            onConfirm={() => resultMutation.mutate({ confirmed: true, version: resultPreview.expectedVersion })}>
            <div style={row}>
              <label style={field}>Result ID<input style={input} value={resultId} onChange={(event) => { setResultId(event.target.value); setResultPreview(null); }} /></label>
              <label style={field}>Home score (hundredths)<input style={input} inputMode="numeric" value={homeScore} onChange={(event) => setHomeScore(event.target.value)} /></label>
              <label style={field}>Away score (hundredths)<input style={input} inputMode="numeric" value={awayScore} onChange={(event) => setAwayScore(event.target.value)} /></label>
              <label style={field}>Reason<input style={input} value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} /></label>
            </div>
          </PreviewAction>
          <PreviewAction title="Standings rebuild" mutation={standingsMutation} preview={standingsPreview}
            confirmDisabled={!rebuildReason}
            onPreview={() => standingsMutation.mutate({ confirmed: false })}
            onConfirm={() => standingsMutation.mutate({ confirmed: true, version: standingsPreview.expectedVersion })}>
            <label style={field}>Reason<input style={input} value={rebuildReason} onChange={(event) => setRebuildReason(event.target.value)} /></label>
          </PreviewAction>
        </>
      )}
      <p className="hl-page-backlink"><Link to={routePaths.league(leagueId)}>Back to dashboard</Link></p>
    </CompetitionGate>
  );
}
