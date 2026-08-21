import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  ErrorBlock,
  LoadingBlock,
  PositionTag,
  Surface,
  TableScroll,
  TeamMark,
} from "../../components/HundoUi.jsx";
import { fantasyPoints, money } from "../../shared/hundoFormat.js";
import { teamWorkspaceQuery } from "../rosters/teamWorkspaceQueries.js";

function displayStat(value) {
  return Number.isSafeInteger(value) ? value : "—";
}

function fantasyPointsPerGame(statistics) {
  if (
    !Number.isSafeInteger(statistics?.fantasyPointsHundredths) ||
    !Number.isSafeInteger(statistics?.gamesPlayed)
  ) {
    return "—";
  }
  if (statistics.gamesPlayed === 0) return "0.00";
  return (
    statistics.fantasyPointsHundredths /
    100 /
    statistics.gamesPlayed
  ).toFixed(2);
}

export function TradeBlockPanel({
  httpClient,
  leagueId,
  teams,
  enabled = true,
  showTradesLink = false,
}) {
  const workspaces = useQueries({
    queries: teams.map((team) => ({
      ...teamWorkspaceQuery(httpClient, leagueId, team.id),
      enabled,
    })),
  });
  const pending = enabled && workspaces.some((query) => query.isPending);
  const failed = workspaces.some((query) => query.isError);
  const entries = workspaces
    .flatMap((query) => {
      const workspace = query.data;
      if (!workspace) return [];
      return workspace.players
        .filter((player) => player.onTradeBlock === true)
        .map((player) => ({ player, team: workspace.team }));
    })
    .sort(
      (left, right) =>
        left.team.name.localeCompare(right.team.name) ||
        left.player.name.localeCompare(right.player.name)
    );

  return (
    <Surface className="hl-trade-block" as="section" aria-labelledby="league-trade-block-title">
      <div className="hl-trade-block__heading">
        <h2 id="league-trade-block-title">Trade block</h2>
        {showTradesLink && (
          <Link className="hl-text-link" to={routePaths.leagueTrades(leagueId)}>
            Open trades
          </Link>
        )}
      </div>
      {pending ? (
        <LoadingBlock>Loading the trade block…</LoadingBlock>
      ) : failed ? (
        <ErrorBlock
          fallback="The trade block could not be loaded."
          impact="Available players may be missing from this view."
          recovery="Refresh the page and try again."
        />
      ) : entries.length === 0 ? (
        <p className="hl-trade-block__empty">No players are on the trade block right now.</p>
      ) : (
        <TableScroll label="Trade block players">
          <table className="hl-data-table hl-player-row-table hl-trade-block__table">
            <caption className="hl-visually-hidden">
              Players currently available on the trade block
            </caption>
            <thead>
              <tr>
                <th scope="col">Pos</th>
                <th scope="col">Player</th>
                <th scope="col">Fantasy team</th>
                <th scope="col">AAV</th>
                <th scope="col">Age</th>
                <th scope="col">NHL</th>
                <th scope="col">GP</th>
                <th scope="col">G</th>
                <th scope="col">A</th>
                <th scope="col">P</th>
                <th scope="col">FP</th>
                <th scope="col">FP/G</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(({ player, team }) => {
                const statistics = player.statistics || null;
                return (
                  <tr key={player.ownershipId}>
                    <td className="hl-player-col-position">
                      <PositionTag
                        position={player.normalizedPosition}
                        category={player.rosterCategory}
                      />
                    </td>
                    <th className="hl-player-col-name" scope="row">
                      <Link to={routePaths.player(leagueId, player.playerId)}>
                        {player.name}
                      </Link>
                    </th>
                    <td className="hl-trade-block__team">
                      <span className="hl-trade-block__team-identity">
                        <TeamMark
                          team={team}
                          logoUrl={
                            team.logoReference
                              ? httpClient.resourceUrl(team.logoReference)
                              : null
                          }
                          className="hl-trade-block__team-mark"
                        />
                        <span>{team.name}</span>
                      </span>
                    </td>
                    <td className="hl-player-col-aav is-mono">
                      {money(player.contract?.aavCents ?? null)}
                    </td>
                    <td className="hl-player-col-age">{player.age ?? "—"}</td>
                    <td className="hl-player-col-nhl">
                      {player.nhlTeamAbbreviation ||
                        player.provider?.nhlTeamAbbreviation ||
                        "—"}
                    </td>
                    <td className="hl-player-col-stat">
                      {displayStat(statistics?.gamesPlayed)}
                    </td>
                    <td className="hl-player-col-stat">
                      {displayStat(statistics?.goals)}
                    </td>
                    <td className="hl-player-col-stat">
                      {displayStat(statistics?.assists)}
                    </td>
                    <td className="hl-player-col-stat">
                      {displayStat(statistics?.nhlPoints)}
                    </td>
                    <td className="hl-player-col-stat">
                      {fantasyPoints(statistics?.fantasyPointsHundredths)}
                    </td>
                    <td className="hl-player-col-stat">
                      {fantasyPointsPerGame(statistics)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
    </Surface>
  );
}
