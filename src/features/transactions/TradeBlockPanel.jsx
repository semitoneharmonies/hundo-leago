import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import { LoadingBlock, Surface } from "../../components/HundoUi.jsx";
import { teamWorkspaceQuery } from "../rosters/teamWorkspaceQueries.js";

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
        <div>
          <p className="hl-eyebrow">Available for discussion</p>
          <h2 id="league-trade-block-title">League trade block</h2>
        </div>
        {showTradesLink && (
          <Link className="hl-text-link" to={routePaths.leagueTrades(leagueId)}>
            Open Trades
          </Link>
        )}
      </div>
      <p>Players their current teams have marked as available for trade conversations.</p>
      {pending ? (
        <LoadingBlock>Loading the league trade block…</LoadingBlock>
      ) : failed ? (
        <p className="hl-form-message is-error" role="alert">
          The trade block could not be loaded.
        </p>
      ) : entries.length === 0 ? (
        <p className="hl-trade-block__empty">No players are on the trade block right now.</p>
      ) : (
        <ul className="hl-trade-block__list">
          {entries.map(({ player, team }) => (
            <li
              key={player.ownershipId}
              style={{
                "--trade-block-primary": team.primaryColour || "#16324f",
                "--trade-block-secondary": team.secondaryColour || "#f7f7f7",
              }}
            >
              <Link to={routePaths.player(leagueId, player.playerId)}>
                <strong>{player.name}</strong>
                <span>
                  {team.name} · {player.normalizedPosition} · {player.rosterCategory}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
