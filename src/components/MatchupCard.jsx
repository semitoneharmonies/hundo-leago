import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { routePaths } from "../app/routePaths.js";
import { matchupQuery } from "../features/competition/competitionQueries.js";
import { fantasyPoints } from "../shared/hundoFormat.js";
import { teamColourClass, teamColourStyle } from "../shared/teamIdentity.js";
import { StatusBadge, TeamMark } from "./HundoUi.jsx";
import "./MatchupCard.css";

export function MatchupCard({ leagueId, seasonId, week, matchup, teams, httpClient, managedTeamId, sidebar = false, current = false, onSelect, retryOnMount = true }) {
  const detail = useQuery({
    ...matchupQuery(httpClient, leagueId, seasonId, week.id, matchup.id),
    refetchInterval: 5 * 60_000,
    retryOnMount,
  });
  const to = `${routePaths.leagueMatchups(leagueId)}?${new URLSearchParams({ season: seasonId, week: week.id, matchup: matchup.id })}`;
  const data = detail.data;
  const status = data?.scoring?.mode === "live" ? "Live" : ({ scheduled: "Scheduled", live: "Live", final: "Final", completed: "Final" }[data?.status || matchup.status] || "");
  const delayed = data?.health?.scoring?.status && data.health.scoring.status !== "fresh";
  return <div className="hl-week-matchup">
    <Link to={to} className={`hl-week-matchup__link${sidebar ? " hl-sidebar-matchup" : " hl-week-matchup__link--scoreboard"}`}
      aria-label={`${matchup.homeTeam.name} vs ${matchup.awayTeam.name}`}
      aria-current={current ? "page" : undefined} onClick={(event) => onSelect?.(event, to)}>
      {["home", "away"].map((side) => {
        const summary = matchup[`${side}Team`];
        const team = teams?.find(({ id }) => id === summary.id) || summary;
        const score = data?.result?.currentVersion?.[`${side}ScoreHundredths`] ?? data?.scoring?.[side]?.scoreHundredths ?? null;
        return <div key={side} className={teamColourClass("hl-week-matchup__team")} style={teamColourStyle(team)}>
          {sidebar && <TeamMark team={team} logoUrl={team.logoReference ? httpClient.resourceUrl(team.logoReference) : null} />}
          <span className="hl-week-matchup__name">
            {!sidebar && <small>{team.id === managedTeamId ? "Your team" : [matchup.homeTeam.id, matchup.awayTeam.id].includes(managedTeamId) ? "Opponent" : side === "home" ? "Home" : "Away"}</small>}
            <strong>{team.name}</strong>
          </span>
          <span className="hl-week-matchup__score" aria-label={`${team.name}: ${detail.isPending ? "loading score" : `${fantasyPoints(score)} fantasy points`}`}>
            <b>{detail.isPending ? "…" : fantasyPoints(score)}</b><small>FP</small>
          </span>
        </div>;
      })}
      {!sidebar && <span className="hl-week-matchup__versus">{status && <StatusBadge tone={status === "Live" ? "live" : "neutral"}>{status}</StatusBadge>}<span>VS</span></span>}
    </Link>
    {detail.isError ? <p className="hl-week-matchup__notice" role="alert">Scores unavailable. <button type="button" onClick={() => detail.refetch()}>Retry</button></p>
      : delayed ? <p className="hl-week-matchup__notice">Scores may be delayed.</p> : null}
  </div>;
}
