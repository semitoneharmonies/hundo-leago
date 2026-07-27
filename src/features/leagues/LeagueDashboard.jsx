import { useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  teamColourClass,
  teamColourStyle,
} from "../../shared/teamIdentity.js";
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
import {
  inviteLeagueUser,
  invitableUsersQuery,
  leagueKeys,
  leagueMembershipsQuery,
  removeLeagueMembership,
} from "./leagueQueries.js";
import { createIntentKey } from "../accounts/accountApi.js";
import { hasCommissionerAuthority } from "../../shared/leagueAuthority.js";

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
  commissionerView = false,
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
  if (!managedTeam && !matchupSummary) {
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
  const bye = managedTeam
    ? week.byes.find(({ team }) => team.id === managedTeam.id)
    : null;
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
        eyebrow={
          commissionerView ? "League matchup spotlight" : "Your current matchup"
        }
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
            {managedTeam
              ? matchup.homeTeam.id === managedTeam.id
                ? "Your team"
                : "Opponent"
              : "Home"}
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
            {managedTeam
              ? matchup.awayTeam.id === managedTeam.id
                ? "Your team"
                : "Opponent"
              : "Away"}
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

function CommissionerLeaguePanel({
  leagueId,
  teams,
  auctions,
  trades,
}) {
  const pendingTrades = trades.filter(
    ({ storageStatus }) => storageStatus === "proposed"
  ).length;
  return (
    <Surface
      className="hl-dashboard-team hl-commissioner-overview"
      aria-labelledby="commissioner-overview-title"
    >
      <PanelHeading
        eyebrow="League control"
        title="Commissioner overview"
        id="commissioner-overview-title"
        action={
          <TextLink to={routePaths.leagueCommissioner(leagueId)}>
            Commissioner tools
          </TextLink>
        }
      />
      <dl className="hl-team-facts">
        <div>
          <dt>Teams</dt>
          <dd>{teams.length}</dd>
        </div>
        <div>
          <dt>Managed</dt>
          <dd>{teams.filter(({ currentManager }) => currentManager).length}</dd>
        </div>
        <div>
          <dt>Live auctions</dt>
          <dd>{auctions.length}</dd>
        </div>
        <div>
          <dt>Pending trades</dt>
          <dd>{pendingTrades}</dd>
        </div>
      </dl>
      <p className="hl-dashboard-team__note">
        This account governs league operations. It does not control a team
        roster while acting as commissioner.
      </p>
    </Surface>
  );
}

function CommissionerMembersPanel({ league, teams, session }) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [message, setMessage] = useState("");
  const memberships = useQuery(
    leagueMembershipsQuery(session.httpClient, league.id)
  );
  const invitableUsers = useQuery(
    invitableUsersQuery(session.httpClient, league.id)
  );
  const availableTeams = teams.filter(({ currentManager }) => !currentManager);
  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteLeagueUser(
        session.httpClient,
        league.id,
        teamId
          ? { userId, workflow: "manage_team", teamId }
          : { userId, workflow: "create_team" },
        createIntentKey("league-invitation")
      ),
    onSuccess: async () => {
      setMessage("Invitation sent. The user must accept it before joining.");
      setUserId("");
      setTeamId("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: leagueKeys.invitableUsers(league.id),
        }),
        queryClient.invalidateQueries({
          queryKey: leagueKeys.memberships(league.id),
        }),
        queryClient.invalidateQueries({
          queryKey: leagueKeys.teams(league.id),
        }),
      ]);
    },
    onError: () => setMessage(""),
  });
  const removeMutation = useMutation({
    mutationFn: (membership) =>
      removeLeagueMembership(
        session.httpClient,
        league.id,
        membership.id,
        membership.version
      ),
    onSuccess: async (_result, membership) => {
      setMessage(`${membership.user.displayName} was removed from the league.`);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: leagueKeys.memberships(league.id),
        }),
        queryClient.invalidateQueries({
          queryKey: leagueKeys.invitableUsers(league.id),
        }),
        queryClient.invalidateQueries({
          queryKey: leagueKeys.teams(league.id),
        }),
      ]);
    },
    onError: () => setMessage(""),
  });

  return (
    <Surface
      className="hl-dashboard-members"
      aria-labelledby="commissioner-members-title"
    >
      <PanelHeading
        eyebrow="League access"
        title="Members and invitations"
        id="commissioner-members-title"
      />
      <form
        className="hl-commissioner-invite"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
          inviteMutation.mutate();
        }}
      >
        <label className="hl-field">
          User
          <select
            value={userId}
            required
            disabled={invitableUsers.isPending}
            onChange={(event) => setUserId(event.target.value)}
          >
            <option value="">Choose an existing account</option>
            {(invitableUsers.data || []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName} ({user.email})
              </option>
            ))}
          </select>
        </label>
        <label className="hl-field">
          Team
          <select
            value={teamId}
            required={league.status !== "setup"}
            onChange={(event) => setTeamId(event.target.value)}
          >
            {league.status === "setup" && (
              <option value="">User creates a team</option>
            )}
            {league.status !== "setup" && (
              <option value="">Choose an unassigned team</option>
            )}
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="hl-button hl-button--primary"
          type="submit"
          disabled={
            inviteMutation.isPending ||
            !userId ||
            (league.status !== "setup" && !teamId)
          }
        >
          {inviteMutation.isPending ? "Sending…" : "Invite user"}
        </button>
      </form>
      {memberships.isPending ? (
        <LoadingBlock>Loading league members…</LoadingBlock>
      ) : memberships.isError ? (
        <ErrorBlock
          error={memberships.error}
          fallback="League members could not be loaded."
        />
      ) : (
        <ul className="hl-commissioner-member-list">
          {memberships.data
            .filter(({ status }) => status === "active" || status === "invited")
            .map((membership) => {
            const protectedMember =
              membership.user.id === session.user.id ||
              membership.permissionCategory === "commissioner";
            return (
              <li key={membership.id}>
                <span>
                  <strong>{membership.user.displayName}</strong>
                  <small>
                    {membership.permissionCategory} · {membership.status}
                  </small>
                </span>
                {!protectedMember && (
                  <button
                    type="button"
                    className="hl-button hl-button--danger"
                    disabled={removeMutation.isPending}
                    onClick={() => {
                      if (
                        globalThis.confirm(
                          `Remove ${membership.user.displayName} from ${league.name}? Their active team assignment will also end.`
                        )
                      ) {
                        setMessage("");
                        removeMutation.mutate(membership);
                      }
                    }}
                  >
                    {membership.status === "invited"
                      ? "Cancel invitation"
                      : "Remove"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {message && <p className="hl-form-message">{message}</p>}
      {(inviteMutation.error || removeMutation.error) && (
        <ErrorBlock
          error={inviteMutation.error || removeMutation.error}
          fallback="The league membership change could not be completed."
        />
      )}
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

function TradesPanel({ leagueId, trades, pending, error, managedTeamId = null }) {
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
            <li
              key={trade.id}
              className={
                managedTeamId &&
                [trade.proposingTeam.id, trade.receivingTeam.id].includes(
                  managedTeamId
                )
                  ? "is-managed-team"
                  : undefined
              }
            >
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
                className={teamColourClass("hl-team-grid__team", team)}
                style={teamColourStyle(team)}
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
  const commissioner = hasCommissionerAuthority(league.membership);
  const managedTeam = commissioner
    ? null
    : teams.find(
        ({ currentManager }) => currentManager?.userId === session.user.id
      ) || null;
  const enabled = Boolean(seasonId);
  const [matchupSpotlightIndex, setMatchupSpotlightIndex] = useState(0);

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
  useEffect(() => {
    if (!commissioner || !week || week.matchups.length <= 1) return undefined;
    const timer = globalThis.setInterval(
      () =>
        setMatchupSpotlightIndex(
          (current) => (current + 1) % week.matchups.length
        ),
      5_000
    );
    return () => globalThis.clearInterval(timer);
  }, [commissioner, week]);
  const matchupSummary =
    week
      ? commissioner
        ? week.matchups[matchupSpotlightIndex % week.matchups.length] || null
        : managedTeam
          ? week.matchups.find(
              ({ homeTeam, awayTeam }) =>
                homeTeam.id === managedTeam.id ||
                awayTeam.id === managedTeam.id
            ) || null
          : null
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
        eyebrow={`${
          commissioner ? "Commissioner" : league.membership.permissionCategory
        } workspace`}
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
            {commissioner && (
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
          commissionerView={commissioner}
          isPending={enabled && (currentWeek.isPending || matchup.isPending)}
          error={currentWeek.error || matchup.error}
        />
        {commissioner ? (
          <CommissionerLeaguePanel
            leagueId={leagueId}
            teams={teams}
            auctions={auctions.data || []}
            trades={trades.data || []}
          />
        ) : (
          <TeamStatus
            leagueId={leagueId}
            managedTeam={managedTeam}
            roster={roster.data}
            standingsRow={standingsRow}
            pending={enabled && (roster.isPending || standings.isPending)}
            error={roster.error || standings.error}
          />
        )}
      </div>

      {commissioner ? (
        <div className="hl-dashboard__commissioner-content">
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
          <CommissionerMembersPanel
            league={league}
            teams={teams}
            session={session}
          />
        </div>
      ) : (
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
              managedTeamId={managedTeam?.id || null}
            />
          </aside>
        </div>
      )}

      <ActivityPanel
        leagueId={leagueId}
        activity={activity.data?.activity || []}
        pending={enabled && activity.isPending}
        error={activity.error}
      />
      <TeamsPanel
        leagueId={leagueId}
        teams={teams}
        currentUserId={commissioner ? null : session.user.id}
      />
    </div>
  );
}
