import "./DailySlateGames.css";

export function DailySlateGames({ games = [] }) {
  if (!games.length) return null;
  return <div className="hd-slate-games" role="group" aria-label="Games in this room’s slate">
    <span className="hd-slate-label">Games</span>
    <ul>{games.map(game => <li key={game.id ?? `${game.awayTeam}-${game.homeTeam}`}>
      {game.awayTeam} <span>@</span> {game.homeTeam}
    </li>)}</ul>
  </div>;
}
