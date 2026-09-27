import { useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { routePaths } from '../../app/routePaths.js';
import { PlayerCardContext } from './playerCardContext.js';

export function PlayerName({ playerId, leagueId: suppliedLeagueId, httpClient, children, className = '', ...props }) {
  const params = useParams();
  const leagueId = suppliedLeagueId || params.leagueId;
  const card = useContext(PlayerCardContext);
  if (!playerId || !leagueId) return <span className={className} {...props}>{children}</span>;
  return <Link {...props} className={`hl-player-card-trigger ${className}`}
    to={routePaths.player(leagueId, playerId)} aria-haspopup="dialog"
    onClick={event => {
      if (!card || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      const anchor = event.currentTarget;
      const bounds = anchor.getBoundingClientRect();
      card.open({ leagueId, playerId, httpClient, name: anchor.textContent,
        anchor, x: event.detail ? event.clientX : bounds.right,
        y: event.detail ? event.clientY : bounds.top });
    }}>{children}</Link>;
}
