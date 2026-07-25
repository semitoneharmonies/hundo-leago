import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  PanelHeading,
  StatusBadge,
  Surface,
  TextLink,
} from "../../components/HundoUi.jsx";
import {
  dateRange,
  fantasyPoints,
  money,
  relativeTime,
} from "../../shared/hundoFormat.js";
import {
  currentMatchupWeekQuery,
  matchupQuery,
  standingsQuery,
} from "../competition/competitionQueries.js";
import { publicRosterQuery } from "../rosters/publicRosterQueries.js";
import {
  activityQuery,
  auctionsQuery,
  tradesQuery,
} from "../transactions/transactionQueries.js";

function scoreFor(matchup, side) {
  const official = matchup?.result?.currentVersion;
  const scoring = matchup?.scoring;
  return (
    official?.[`${side}ScoreHundredths`] ??
    scoring?.[side]?.scoreHundredths ??
    null
  );
}

function findTeamSide(matchup, teamId) {
  if (matchup?.homeTeam.id === teamId) return "home";
  if (matchup?.awayTeam.id === teamId) return "away";
  return null;
}

function countRoster(players) {
  return (players || []).reduce(
    (totals, player) => {
      totals[player.rosterCategory] =
        (totals[player.rosterCategory] || 0) + 1;
      return totals;
    },
    {
      Active: 0,
      Bench: 0,
      "Injured Reserve": 0,
      Prospect: 0,
    }
  );
}

function MatchupScoreboard({
  leagueId,
  week,
  matchupSummary,
  matchup,
  managedTeam,
  isPending,
  error,
}) {
  if (isPending && !week) {
    return (
      <Surface className="hl-dashboard-matchup">
        <LoadingBlock>Loading the current matchup week…</LoadingBlock>
      </Surface>
    );
  }
  if (error && !week) {
    return (
      <Surface className="hl-dashboard-matchup">
        <ErrorBlock
          error={error}
          fallback="The current matchup week could not be loaded."
        />
      </Surface>
    );
  }
  if (!week) {
    return (
      <Surface
        className="hl-dashboard-matchup"
        aria-labelledby="dashboard-matchup-title"
      >
        <PanelHeading
          eyebrow="Current competition"
          title="No current matchup week"
          id="dashboard-matchup-title"
          action={
            <TextLink to={routePaths.leagueMatchups(leagueId)}>
              Matchups
            </TextLink>
          }
        />
        <EmptyBlock title="No matchup is active">
          The schedule page will show upcoming or completed weeks when
          available.
        </EmptyBlock>
      </Surface>
    );
  }
  if (!managedTeam) {
    return (
      <Surface
        className="hl-dashboard-matchup"
        aria-labelledby="dashboard-matchup-title"
      >
        <PanelHeading
          eyebrow="Current competition"
          title={`Week ${week.sequence}`}
          description={`${dateRange(week.startsAtMs, week.endsAtMs)} · ${
            week.status
          }`}
          id="dashboard-matchup-title"
          action={
            <TextLink to={routePaths.leagueMatchups(leagueId)}>
              View matchups
            </TextLink>
          }
        />
        <div className="hl-dashboard-week-summary">
          <CalendarDays aria-hidden="true" />
          <div>
            <strong>{week.matchups.length} scheduled matchups</strong>
            <span>
              {week.byes.length
                ? `${week.byes.length} team bye`
                : "No team byes"}
            </span>
          </div>
        </div>
      </Surface>
    );
  }
  const bye = week.byes.find(({ team }) => team.id === managedTeam.id);
  if (!matchupSummary && bye) {
    return (
      <Surface
        className="hl-dashboard-matchup"
        aria-labelledby="dashboard-matchup-title"
      >
        <PanelHeading
          eyebrow="Your current week"
          title={`${managedTeam.name} has a bye`}
          description={`${dateRange(
            week.startsAtMs,
            week.endsAtMs
          )} · Week ${week.sequence}`}
          id="dashboard-matchup-title"
          action={
            <TextLink to={routePaths.leagueMatchups(leagueId)}>
              League matchups
            </TextLink>
          }
        />
        <EmptyBlock title="No head-to-head opponent this week">
          Your league’s other scheduled matchups remain available.
        </EmptyBlock>
      </Surface>
    );
  }
  if (!matchupSummary) {
    return (
      <Surface
        className="hl-dashboard-matchup"
        aria-labelledby="dashboard-matchup-title"
      >
        <PanelHeading
          eyebrow="Your current week"
          title="No pairing is available"
          id="dashboard-matchup-title"
          action={
            <TextLink to={routePaths.leagueMatchups(leagueId)}>
              Matchups
            </TextLink>
          }
        />
        <EmptyBlock title="No matchup found">
          The current week does not contain a pairing or bye for your managed
          team.
        </EmptyBlock>
      </Surface>
    );
  }
  if (isPending) {
    return (
      <Surface className="hl-dashboard-matchup">
        <LoadingBlock>Loading your current matchup…</LoadingBlock>
      </Surface>
    );
  }
  if (error) {
    return (
      <Surface className="hl-dashboard-matchup">
        <ErrorBlock
          error={error}
          fallback="The current matchup could not be loaded."
        />
      </Surface>
    );
  }
  const homeScore = scoreFor(matchup, "home");
  const awayScore = scoreFor(matchup, "away");
  return (
    <Surface
      className="hl-dashboard-matchup"
      aria-labelledby="dashboard-matchup-title"
    >
      <PanelHeading
        eyebrow="Your current matchup"
        title={`Week ${week.sequence}`}
        description={`${dateRange(week.startsAtMs, week.endsAtMs)} · ${
          matchup.status
        }`}
        id="dashboard-matchup-title"
        action={
          <TextLink to={routePaths.leagueMatchups(leagueId)}>
            Full matchup
          </TextLink>
        }
      />
      <div className="hl-scoreboard">
        <div className="hl-scoreboard__team">
          <span>
            {matchup.homeTeam.id === managedTeam.id
              ? "Your team"
              : "Opponent"}
          </span>
          <strong>{matchup.homeTeam.name}</strong>
          <b className="is-accent">{fantasyPoints(homeScore)}</b>
          <small>fantasy points</small>
        </div>
        <div className="hl-scoreboard__middle">
          <span>VS</span>
          <StatusBadge
            tone={matchup.scoring?.mode === "live" ? "live" : "neutral"}
          >
            {matchup.scoring?.mode || matchup.status}
          </StatusBadge>
        </div>
        <div className="hl-scoreboard__team is-away">
          <span>
            {matchup.awayTeam.id === managedTeam.id
              ? "Your team"
              : "Opponent"}
          </span>
          <strong>{matchup.awayTeam.name}</strong>
          <b>{fantasyPoints(awayScore)}</b>
          <small>fantasy points</small>
        </div>
      </div>
      {matchup.health?.scoring?.status &&
        matchup.health.scoring.status !== "fresh" && (
          <p className="hl-inline-warning" role="status">
            Scores may be delayed because the latest statistics are not
            current.
          </p>
        )}
    </Surface>
  );
}

function TeamStatus({
  leagueId,
  managedTeam,
  roster,
  standingsRow,
  pending,
  error,
}) {
  if (!managedTeam) {
    return (
      <Surface
        className="hl-dashboard-team"
        aria-labelledby="dashboard-team-title"
      >
        <PanelHeading
          eyebrow="League role"
          title="League overview"
          id="dashboard-team-title"
          action={
            <TextLink to={routePaths.leagueTeams(leagueId)}>
              All teams
            </TextLink>
          }
        />
        <EmptyBlock title="No team is assigned to this account">
          League-wide information remains available. Team operations appear
          only for an assigned manager.
        </EmptyBlock>
      </Surface>
    );
  }
  if (pending) {
    return (
      <Surface className="hl-dashboard-team">
        <LoadingBlock>Loading team status…</LoadingBlock>
      </Surface>
    );
  }
  if (error) {
    return (
      <Surface className="hl-dashboard-team">
        <ErrorBlock error={error} fallback="Team status could not be loaded." />
      </Surface>
    );
  }
  if (!roster) {
    return (
      <Surface className="hl-dashboard-team">
        <EmptyBlock title="Roster projection unavailable">
          Open the team roster for current details.
        </EmptyBlock>
      </Surface>
    );
  }
  const counts = countRoster(roster.players);
  const overCap = roster.cap.capSpaceCents < 0;
  return (
    <Surface
      className={`hl-dashboard-team${overCap ? " has-warning" : ""}`}
      aria-labelledby="dashboard-team-title"
    >
      {overCap && (
        <div className="hl-action-banner">
          <AlertTriangle aria-hidden="true" />
          <strong>Cap review required</strong>
        </div>
      )}
      <PanelHeading
        eyebrow="Your team"
        title={managedTeam.name}
        id="dashboard-team-title"
        action={
          <TextLink to={routePaths.teamRoster(leagueId, managedTeam.id)}>
            Full roster
          </TextLink>
        }
      />
      <div className="hl-team-record">
        <div>
          <span>Standing</span>
          <strong>{standingsRow ? `#${standingsRow.rank}` : "—"}</strong>
        </div>
        <div>
          <span>Record</span>
          <strong>
            {standingsRow
              ? `${standingsRow.wins}-${standingsRow.losses}-${standingsRow.ties}`
              : "—"}
          </strong>
        </div>
      </div>
      <div className="hl-cap-summary">
        <div>
          <span>Salary cap</span>
          <strong>
            {money(roster.cap.capUsageCents)} /{" "}
            {money(roster.cap.capLimitCents)}
          </strong>
        </div>
        <div
          className="hl-cap-summary__bar"
          aria-label={`${money(
            roster.cap.capUsageCents
          )} used of ${money(roster.cap.capLimitCents)}`}
        >
          <span
            style={{
              width: `${Math.min(
                100,
                (roster.cap.capUsageCents / roster.cap.capLimitCents) * 100
              )}%`,
            }}
          />
        </div>
        <small className={overCap ? "is-warning" : ""}>
          {overCap
            ? `${money(Math.abs(roster.cap.capSpaceCents))} over cap`
            : `${money(roster.cap.capSpaceCents)} available`}
        </small>
      </div>
      <dl className="hl-team-facts">
        <div>
          <dt>Active</dt>
          <dd>{counts.Active}</dd>
        </div>
        <div>
          <dt>Bench</dt>
          <dd>{counts.Bench}</dd>
        </div>
        <div>
          <dt>IR</dt>
          <dd>{counts["Injured Reserve"]}</dd>
        </div>
        <div>
          <dt>Prospects</dt>
          <dd>{counts.Prospect}</dd>
        </div>
        <div>
          <dt>Retained</dt>
          <dd>{money(roster.cap.retainedSalaryTotalCents)}</dd>
        </div>
        <div>
          <dt>Buyouts</dt>
          <dd>{money(roster.cap.buyoutPenaltyTotalCents)}</dd>
        </div>
      </dl>
      <p className="hl-dashboard-team__note">
        Cap status uses the authoritative projection. Structural roster
        legality is not inferred in the browser.
      </p>
    </Surface>
  );
}

function RosterSnapshot({ leagueId, managedTeam, roster, matchup }) {
  const side = managedTeam ? findTeamSide(matchup, managedTeam.id) : null;
  const scoringPlayers = side ? matchup?.scoring?.[side]?.players || [] : [];
  const players = scoringPlayers.length
    ? scoringPlayers.map((player) => ({
        id: player.playerId,
        name: player.fullName,
        position: player.positionGroup,
        gamesPlayed: player.gamesPlayedDelta,
        goals: player.goalDelta,
        assists: player.assistDelta,
        points: player.pointDelta,
        fantasyPoints:
          player.dataStatus === "missing" ? null : player.scoreHundredths,
        dataStatus: player.dataStatus,
      }))
    : (roster?.players || [])
        .filter((player) => player.rosterCategory === "Active")
        .map((player) => ({
          id: player.playerReference,
          name: player.name,
          position: player.normalizedPosition,
          gamesPlayed: player.seasonStatistics?.gamesPlayed ?? null,
          goals: player.seasonStatistics?.goals ?? null,
          assists: player.seasonStatistics?.assists ?? null,
          points: player.seasonStatistics?.nhlPoints ?? null,
          fantasyPoints:
            player.seasonStatistics?.fantasyPointsHundredths ?? null,
          dataStatus: player.seasonStatistics ? "available" : "missing",
        }));

  return (
    <Surface
      className="hl-dashboard-roster"
      aria-labelledby="dashboard-roster-title"
    >
      <PanelHeading
        eyebrow={
          scoringPlayers.length
            ? "Matchup-period statistics"
            : "Season statistics"
        }
        title={managedTeam ? `${managedTeam.name} roster` : "Managed roster"}
        id="dashboard-roster-title"
        action={
          managedTeam ? (
            <TextLink to={routePaths.teamRoster(leagueId, managedTeam.id)}>
              Full roster
            </TextLink>
          ) : null
        }
      />
      {!managedTeam ? (
        <EmptyBlock title="No managed team">
          Roster details are available from the Teams page.
        </EmptyBlock>
      ) : players.length === 0 ? (
        <EmptyBlock title="No active players available">
          Roster or scoring data has not been published yet.
        </EmptyBlock>
      ) : (
        <div className="hl-table-wrap">
          <table className="hl-data-table">
            <thead>
              <tr>
                <th scope="col">Player</th>
                <th scope="col">Pos</th>
                <th scope="col">GP</th>
                <th scope="col">G</th>
                <th scope="col">A</th>
                <th scope="col">PTS</th>
                <th scope="col">FP</th>
              </tr>
            </thead>
            <tbody>
              {players.slice(0, 10).map((player) => (
                <tr key={player.id}>
                  <th scope="row">
                    <Link to={routePaths.player(leagueId, player.id)}>
                      {player.name}
                    </Link>
                    {player.dataStatus === "missing" && (
                      <small>Data unavailable</small>
                    )}
                  </th>
                  <td>
                    <StatusBadge>{player.position}</StatusBadge>
                  </td>
                  <td>{player.gamesPlayed ?? "—"}</td>
                  <td>{player.goals ?? "—"}</td>
                  <td>{player.assists ?? "—"}</td>
                  <td>{player.points ?? "—"}</td>
                  <td className="is-highlight">
                    {fantasyPoints(player.fantasyPoints)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Surface>
  );
}

function AuctionsPanel({ leagueId, auctions, pending, error }) {
  return (
    <Surface
      className="hl-dashboard-list"
      aria-labelledby="dashboard-auctions-title"
    >
      <PanelHeading
        eyebrow="Sealed bidding"
        title="Open auctions"
        id="dashboard-auctions-title"
        action={
          <TextLink to={routePaths.leagueAuctions(leagueId)}>
            All auctions
          </TextLink>
        }
      />
      {pending ? (
        <LoadingBlock>Loading auctions…</LoadingBlock>
      ) : error ? (
        <ErrorBlock error={error} fallback="Auctions could not be loaded." />
      ) : auctions.length === 0 ? (
        <EmptyBlock title="No open auctions" />
      ) : (
        <ul className="hl-compact-list">
          {auctions.slice(0, 3).map((auction) => (
            <li key={auction.id}>
              <div>
                <StatusBadge>
                  {auction.player.fullName.slice(0, 1)}
                </StatusBadge>
                <span>
                  <strong>{auction.player.fullName}</strong>
                  <small>{relativeTime(auction.bidClosesAtMs)}</small>
                </span>
              </div>
              <span className="hl-compact-list__value">
                {auction.ownBid
                  ? money(auction.ownBid.totalValueCents)
                  : "No bid"}
                <small>
                  {auction.ownBid
                    ? "Your bid"
                    : `${auction.participantCount} bidders`}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}

function TradesPanel({ leagueId, trades, pending, error }) {
  const pendingTrades = trades.filter(
    ({ storageStatus }) => storageStatus === "proposed"
  );
  return (
    <Surface
      className="hl-dashboard-list"
      aria-labelledby="dashboard-trades-title"
    >
      <PanelHeading
        eyebrow="Proposals"
        title="Pending trades"
        id="dashboard-trades-title"
        action={
          <TextLink to={routePaths.leagueTrades(leagueId)}>
            All trades
          </TextLink>
        }
      />
      {pending ? (
        <LoadingBlock>Loading trades…</LoadingBlock>
      ) : error ? (
        <ErrorBlock error={error} fallback="Trades could not be loaded." />
      ) : pendingTrades.length === 0 ? (
        <EmptyBlock title="No pending proposals" />
      ) : (
        <ul className="hl-compact-list">
          {pendingTrades.slice(0, 3).map((trade) => (
            <li key={trade.id}>
              <div>
                <ArrowLeftRight aria-hidden="true" />
                <span>
                  <strong>{trade.proposingTeam.name}</strong>
                  <small>to {trade.receivingTeam.name}</small>
                </span>
              </div>
              <Link to={routePaths.trade(leagueId, trade.id)}>
                Review trade
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}

function ActivityPanel({ leagueId, activity, pending, error }) {
  return (
    <Surface
      className="hl-dashboard-activity"
      aria-labelledby="dashboard-activity-title"
    >
      <PanelHeading
        eyebrow="League history"
        title="Recent activity"
        id="dashboard-activity-title"
        action={
          <TextLink to={routePaths.leagueActivity(leagueId)}>
            Full log
          </TextLink>
        }
      />
      {pending ? (
        <LoadingBlock>Loading league activity…</LoadingBlock>
      ) : error ? (
        <ErrorBlock
          error={error}
          fallback="League activity could not be loaded."
        />
      ) : activity.length === 0 ? (
        <EmptyBlock title="No activity yet" />
      ) : (
        <ol className="hl-activity-list">
          {activity.slice(0, 5).map((item) => (
            <li key={item.id}>
              <span aria-hidden="true" />
              <p>{item.summary}</p>
              <time dateTime={new Date(item.occurredAtMs).toISOString()}>
                {relativeTime(item.occurredAtMs)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </Surface>
  );
}

function TeamsPanel({ leagueId, teams, currentUserId }) {
  return (
    <Surface
      className="hl-dashboard-teams"
      aria-labelledby="dashboard-teams-title"
    >
      <PanelHeading
        eyebrow="League membership"
        title="League teams"
        id="dashboard-teams-title"
        action={
          <TextLink to={routePaths.leagueTeams(leagueId)}>
            Team index
          </TextLink>
        }
      />
      {teams.length === 0 ? (
        <EmptyBlock title="No teams have been created" />
      ) : (
        <div className="hl-team-grid">
          {teams.map((team) => {
            const managed = team.currentManager?.userId === currentUserId;
            return (
              <Link
                key={team.id}
                to={routePaths.teamRoster(leagueId, team.id)}
                aria-label={team.name}
              >
                <span className="hl-team-grid__mark" aria-hidden="true">
                  {team.name.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <strong>{team.name}</strong>
                  <small>
                    {managed
                      ? "Managed by you"
                      : team.currentManager?.displayName ||
                        "Manager unassigned"}
                  </small>
                </span>
                {managed && (
                  <StatusBadge tone="success">Your team</StatusBadge>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </Surface>
  );
}

export function LeagueDashboard({ league, teams, session }) {
  const leagueId = league.id;
  const seasonId = league.currentSeason?.id || null;
  const managedTeam =
    teams.find(
      ({ currentManager }) => currentManager?.userId === session.user.id
    ) || null;
  const enabled = Boolean(seasonId);

  const currentWeek = useQuery({
    ...currentMatchupWeekQuery(
      session.httpClient,
      leagueId,
      seasonId || "pending"
    ),
    enabled,
    refetchInterval: 60_000,
  });
  const week = currentWeek.data?.week || null;
  const matchupSummary =
    managedTeam && week
      ? week.matchups.find(
          ({ homeTeam, awayTeam }) =>
            homeTeam.id === managedTeam.id ||
            awayTeam.id === managedTeam.id
        ) || null
      : null;
  const matchup = useQuery({
    ...matchupQuery(
      session.httpClient,
      leagueId,
      seasonId || "pending",
      week?.id || "pending",
      matchupSummary?.id || "pending"
    ),
    enabled: enabled && Boolean(week && matchupSummary),
    refetchInterval: 5 * 60_000,
  });
  const standings = useQuery({
    ...standingsQuery(session.httpClient, leagueId, seasonId || "pending"),
    enabled,
  });
  const roster = useQuery({
    ...publicRosterQuery(
      session.httpClient,
      leagueId,
      managedTeam?.id || "pending"
    ),
    enabled: enabled && Boolean(managedTeam),
  });
  const auctions = useQuery({
    ...auctionsQuery(session.httpClient, leagueId),
    enabled,
  });
  const trades = useQuery({
    ...tradesQuery(session.httpClient, leagueId),
    enabled,
  });
  const activity = useQuery({
    ...activityQuery(session.httpClient, leagueId),
    enabled,
  });
  const standingsRow = managedTeam
    ? standings.data?.rows.find(({ teamId }) => teamId === managedTeam.id) ||
      null
    : null;

  return (
    <div className="hl-dashboard">
      <PageHeading
        eyebrow={`${league.membership.permissionCategory} workspace`}
        title={league.name}
        description={
          league.currentSeason
            ? `${
                league.currentSeason.label || "Current season"
              } · Your authoritative league overview`
            : "Your authoritative league overview"
        }
        id="league-title"
        actions={
          <>
            <StatusBadge
              tone={league.status === "active" ? "success" : "neutral"}
            >
              {league.status}
            </StatusBadge>
            {league.membership.permissionCategory === "commissioner" && (
              <Link
                className="hl-button hl-button--secondary"
                to={routePaths.leagueCommissioner(leagueId)}
              >
                <ShieldCheck aria-hidden="true" />
                Commissioner tools
              </Link>
            )}
          </>
        }
      />

      {!seasonId && (
        <div className="hl-inline-notice" role="status">
          <CalendarDays aria-hidden="true" />
          <div>
            <strong>No active season is configured</strong>
            <span>
              Teams remain available, but competition and transaction summaries
              are not loaded.
            </span>
          </div>
        </div>
      )}

      <div className="hl-dashboard__hero">
        <MatchupScoreboard
          leagueId={leagueId}
          week={week}
          matchupSummary={matchupSummary}
          matchup={matchup.data}
          managedTeam={managedTeam}
          isPending={enabled && (currentWeek.isPending || matchup.isPending)}
          error={currentWeek.error || matchup.error}
        />
        <TeamStatus
          leagueId={leagueId}
          managedTeam={managedTeam}
          roster={roster.data}
          standingsRow={standingsRow}
          pending={enabled && (roster.isPending || standings.isPending)}
          error={roster.error || standings.error}
        />
      </div>

      <div className="hl-dashboard__content">
        <RosterSnapshot
          leagueId={leagueId}
          managedTeam={managedTeam}
          roster={roster.data}
          matchup={matchup.data}
        />
        <aside
          className="hl-dashboard__aside"
          aria-label="Items needing attention"
        >
          <AuctionsPanel
            leagueId={leagueId}
            auctions={auctions.data || []}
            pending={enabled && auctions.isPending}
            error={auctions.error}
          />
          <TradesPanel
            leagueId={leagueId}
            trades={trades.data || []}
            pending={enabled && trades.isPending}
            error={trades.error}
          />
        </aside>
      </div>

      <ActivityPanel
        leagueId={leagueId}
        activity={activity.data?.activity || []}
        pending={enabled && activity.isPending}
        error={activity.error}
      />
      <TeamsPanel
        leagueId={leagueId}
        teams={teams}
        currentUserId={session.user.id}
      />
    </div>
  );
}
