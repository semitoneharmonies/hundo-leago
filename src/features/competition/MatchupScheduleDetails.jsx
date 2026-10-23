import './MatchupScheduleDetails.css';

export function MatchupScheduleDetails({ id, details, team, side, onClose }) {
  const players = new Map();
  for (const game of details.games.filter(game => game.status !== 'collected').toSorted((a,b) => a.startsAtMs - b.startsAtMs)) {
    if (!players.has(game.playerId)) players.set(game.playerId, { name: game.playerName, games: [] });
    players.get(game.playerId).games.push(game);
  }
  return <section className={`hl-matchup-schedule-details hl-matchup-schedule-details--${side}`} id={id} aria-label={`${team.name} remaining games`}
    onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}>
    <button type="button" className="hl-matchup-schedule-details__close" onClick={onClose} aria-label="Close remaining games">×</button>
    <div className="hl-matchup-schedule-details__players">
      <table><thead><tr><th scope="col">Player</th><th scope="col">GR</th><th scope="col">Opp.</th></tr></thead>
        <tbody>{[...players].map(([id, player]) => <tr key={id}>
          <td>{player.name}</td><td>{player.games.length}</td>
          <td>{player.games.map(game => game.opponent || '—').join(' · ')}</td>
        </tr>)}</tbody>
      </table>
      {!players.size && <p>0 GR</p>}
    </div>
  </section>;
}
