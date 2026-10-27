import { Link, useLocation } from "react-router-dom";
import { routePaths } from "../app/routePaths.js";

export function MiniGamesLinks({ leagueId, className, onSelect }) {
  const location = useLocation();
  return <div role="group" aria-label="Mini Games">
    {[["Tip Jar", routePaths.leagueTipJar(leagueId)], ["Mr. Boni", routePaths.leagueMrBoni(leagueId)]].map(([label, to]) =>
      <Link key={to} className={className} to={to} aria-label={`Play ${label}`}
        aria-current={location.pathname === to ? "page" : undefined} onClick={onSelect}>{label}</Link>)}
  </div>;
}
