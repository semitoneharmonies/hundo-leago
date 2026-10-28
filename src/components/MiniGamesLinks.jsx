import { Link, useLocation } from "react-router-dom";
import { routePaths } from "../app/routePaths.js";
import { TipJarNavLabel } from "./TipJarNavLabel.jsx";
import "./MiniGamesLinks.css";

export function MiniGamesLinks({ leagueId, className, onSelect, publicGames = false }) {
  const location = useLocation();
  const games = publicGames
    ? [["Tip Jar", routePaths.publicTipJar], ["Mr. Boni", routePaths.publicMrBoni]]
    : [["Tip Jar", routePaths.leagueTipJar(leagueId)], ["Mr. Boni", routePaths.leagueMrBoni(leagueId)]];
  return <div className={`hl-mini-games-links${publicGames ? " hl-mini-games-links--public" : ""}`} role="group" aria-label="Mini Games">
    {games.map(([label, to]) =>
      <Link key={to} className={`${className || ""} hl-mini-games-link`} to={to} aria-label={`Play ${label}`}
        aria-current={location.pathname === to ? "page" : undefined} onClick={onSelect}>
        {label === "Tip Jar" ? <TipJarNavLabel logoOnly /> : <img className="hl-mini-games-logo" src="/games/mr-boni/resurface-v1/assets/mr-boni-logo.svg" alt="Mr. Boni" width="2123" height="349" />}
      </Link>)}
  </div>;
}
