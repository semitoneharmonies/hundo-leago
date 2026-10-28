import { useQuery } from '@tanstack/react-query';
import { matchupGameProgressQuery } from './matchupGameProgressQueries.js';
import './MatchupGameProgress.css';

function description(count, pending) {
  if (pending) return 'Loading games…';
  if (!count) return 'Game totals unavailable';
  if (count.status === 'not_scoring') return 'Not scoring';
  if (count.status === 'not_started') return 'Lineup not locked';
  if (count.tallied === null) return 'Game totals unavailable';
  return 'Player-games for the locked matchup lineup. GP counts games accepted by Hundo. GR includes games not yet accepted; confirmed non-appearances are excluded.';
}

export function MatchupGameProgress({matchup,httpClient,onSelectSide,selectedSide,panelId,scheduleDetails,retryOnMount=true}) {
  const query=useQuery({...matchupGameProgressQuery(httpClient,matchup),retryOnMount});
  return <span className="hl-matchup-game-progress" aria-label="Matchup player-game totals">
    {['home','away'].map(side => {
      const count = query.isError ? null : query.data?.[side];
      return <span className="hl-matchup-game-progress__team" key={side} aria-label={`${matchup[`${side}Team`].name} games`}>
        {[['GP', 'Games played', 'tallied'], ['GR', 'Games remaining', 'remaining']].map(([label, name, key]) => {
          const value = query.isPending ? '…' : count?.[key] ?? '—';
          const interactive = key === 'remaining' && onSelectSide && scheduleDetails?.[side] && count?.remaining != null;
          const Pill = interactive ? 'button' : 'span';
          return <Pill className="hl-matchup-game-progress__pill" key={key}
            {...(interactive ? { type: 'button', 'aria-expanded': selectedSide === side, 'aria-controls': panelId,
              onClick: event => { event.preventDefault(); event.stopPropagation(); onSelectSide(side, event.currentTarget); } } : {})}
            aria-label={`${name}: ${query.isPending ? 'loading' : count?.[key] ?? 'unavailable'}`}
            title={`${name}. ${description(count, query.isPending)}`}>
            <span>{label}</span> <strong>{value}</strong>
          </Pill>;
        })}
      </span>;
    })}
  </span>;
}
