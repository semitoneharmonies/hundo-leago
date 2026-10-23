import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { routePaths } from "../../app/routePaths.js";
import { useSession } from "../session/sessionContext.js";
import { visibleLeaguesQuery } from "../leagues/leagueQueries.js";
import { createTipJarBridge } from "./tipJarBridge.js";
import { saveTipJarCheckpoint, startTipJarRun, tipJarKey, tipJarLeaderboardQuery, TIP_JAR_RULESET } from "./tipJarApi.js";
import { createTipJarOutbox } from "./tipJarOutbox.js";
import "./TipJarPage.css";

function resultLabel(entry) {
  if (entry.completed) return "Game beaten";
  return entry.highestLevelCompleted > 0 ? `Level ${entry.highestLevelCompleted} completed` : "No levels completed";
}

function LeagueGame({ league, session }) {
  const queryClient = useQueryClient();
  const frame = useRef(null);
  const viewport = useRef(null);
  const fullscreenButton = useRef(null);
  const hadNativeFullscreen = useRef(false);
  const bridge = useRef(null);
  const [saveState, setSaveState] = useState({ kind: "loading", message: "Loading Tip Jar…" });
  const [expanded, setExpanded] = useState(false);
  const [gameReady, setGameReady] = useState(false);
  const [frameRevision, setFrameRevision] = useState(0);
  const leaderboard = useQuery(tipJarLeaderboardQuery(session.httpClient, league.id));
  const userId = session.user.id;

  const updateFullscreen = useCallback((active) => {
    setExpanded(active);
    bridge.current?.fullscreen(active);
    if (active) return;
    bridge.current?.pause();
    const native = document.fullscreenElement;
    if (native && (native === frame.current || viewport.current?.contains(native))) {
      void document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const returnFocus = fullscreenButton.current;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    const siblings = [];
    // Keep the same iframe mounted so switching presentation never resets a run.
    for (let node = viewport.current; node?.parentElement; node = node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling !== node && !sibling.hasAttribute("inert")) {
          siblings.push(sibling);
          sibling.setAttribute("inert", "");
        }
      }
      if (node.parentElement === document.body) break;
    }
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    frame.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); updateFullscreen(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      for (const sibling of siblings) sibling.removeAttribute("inert");
      window.removeEventListener("keydown", onKeyDown);
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, [expanded, updateFullscreen]);

  useEffect(() => {
    const readyTimeout = setTimeout(() => setSaveState({ kind: "load-error", message: "Tip Jar has not loaded. Check your connection and reload the game." }), 20000);
    const connection = createTipJarBridge({
      origin: window.location.origin,
      frameWindow: frame.current.contentWindow,
      outbox: createTipJarOutbox({ userId, leagueId: league.id, rulesetVersion: TIP_JAR_RULESET }),
      startRun: (requestId, signal) => startTipJarRun(session.httpClient, league.id, requestId, signal),
      saveCheckpoint: (runId, shots, signal) => saveTipJarCheckpoint(session.httpClient, league.id, runId, shots, signal),
      onState: setSaveState,
      onReady: () => { clearTimeout(readyTimeout); setGameReady(true); },
      onFullscreen: updateFullscreen,
      onSaved: () => { void queryClient.invalidateQueries({ queryKey: tipJarKey(league.id), exact: true }); },
    });
    bridge.current = connection;
    const onMessage = (event) => connection.receive(event);
    const onVisibility = () => { if (document.hidden) connection.pause(); };
    const onFullscreenChange = () => {
      const native = document.fullscreenElement;
      const ownFullscreen = Boolean(native && (native === frame.current || viewport.current?.contains(native)));
      if (ownFullscreen || hadNativeFullscreen.current) updateFullscreen(ownFullscreen);
      hadNativeFullscreen.current = ownFullscreen;
    };
    const onBeforeUnload = (event) => {
      if (!connection.hasPending) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      connection.fullscreen(false);
      connection.dispose();
      clearTimeout(readyTimeout);
      bridge.current = null;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (hadNativeFullscreen.current) {
        hadNativeFullscreen.current = false;
        void document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [frameRevision, league.id, queryClient, session.httpClient, updateFullscreen, userId]);

  async function fullscreen() {
    updateFullscreen(true);
    try {
      await viewport.current.requestFullscreen?.();
    } catch { /* The full-viewport layout also works without the native API. */ }
    frame.current?.focus();
  }

  return <main className="hl-page hl-tipjar" aria-labelledby="tipjar-title">
    <header className="hl-tipjar-heading">
      <div><Link to={routePaths.league(league.id)}>{league.name}</Link><h1 id="tipjar-title">Tip Jar</h1></div>
      <button ref={fullscreenButton} type="button" onClick={fullscreen}>Fullscreen</button>
    </header>
    <div ref={viewport} className={`hl-tipjar-viewport${expanded ? " is-fullscreen" : ""}`} role={expanded ? "dialog" : undefined} aria-modal={expanded || undefined} aria-label={expanded ? "Tip Jar fullscreen game" : undefined}>
    {expanded && !gameReady && <button type="button" className="hl-tipjar-exit" aria-label="Exit fullscreen" onClick={() => updateFullscreen(false)}>×</button>}
    <iframe key={frameRevision} ref={frame} className="hl-tipjar-game" title="Tip Jar hockey game"
      src="/games/tip-jar/campaign-v1/index.html?league=1" allow="autoplay; fullscreen" allowFullScreen />
    </div>
    <div className={`hl-tipjar-save hl-tipjar-save--${saveState.kind}`}>
      <p role={saveState.kind.endsWith("error") ? "alert" : "status"}>{saveState.message}</p>
      {saveState.kind === "load-error" ? <button type="button" onClick={() => { updateFullscreen(false); setGameReady(false); setSaveState({ kind: "loading", message: "Loading Tip Jar…" }); setFrameRevision((value) => value + 1); }}>Reload game</button>
        : saveState.kind.endsWith("error") && <button type="button" onClick={() => bridge.current?.retry()}>Retry {saveState.kind === "start-error" ? "start" : "save"}</button>}
    </div>
    <section className="hl-tipjar-leaderboard" aria-labelledby="tipjar-leaderboard-title">
      <div className="hl-tipjar-board-heading"><h2 id="tipjar-leaderboard-title">{league.name} leaderboard</h2>
        <button type="button" disabled={leaderboard.isFetching} onClick={() => leaderboard.refetch()}>Refresh</button></div>
      <p className="hl-tipjar-explainer">Your best run counts. More levels completed ranks higher, then fewer shots through the last completed level. Just for fun—fantasy hockey is unchanged.</p>
      {leaderboard.isPending ? <p role="status">Loading leaderboard…</p>
        : leaderboard.isError ? <p role="alert">The leaderboard could not be loaded. Refresh to try again.</p>
        : leaderboard.data.entries.length === 0 ? <p>No runs yet. Be the first to play.</p>
        : <div className="hl-tipjar-table"><table>
          <thead><tr><th scope="col">Rank</th><th scope="col">Manager</th><th scope="col">Best result</th><th scope="col">Shots</th></tr></thead>
          <tbody>{leaderboard.data.entries.map((entry) => <tr key={entry.managerId} className={entry.managerId === userId ? "is-you" : undefined}>
            <td>{entry.rank}</td><th scope="row">{entry.managerName}{entry.managerId === userId && <small> You</small>}</th>
            <td>{resultLabel(entry)}</td><td>{entry.highestLevelCompleted === 0 ? "—" : entry.shotsToCompletion}</td>
          </tr>)}</tbody>
        </table></div>}
    </section>
  </main>;
}

export function TipJarPage() {
  const { leagueId } = useParams();
  const session = useSession();
  const leagues = useQuery({ ...visibleLeaguesQuery(session.httpClient), enabled: session.status === "authenticated" });
  if (session.status === "unauthenticated") return <Navigate to={routePaths.home} replace state={{ reason: "sign-in" }} />;
  if (session.status !== "authenticated" || leagues.isPending) return <main className="hl-page"><p role="status">Confirming league access…</p></main>;
  if (leagues.isError) return <main className="hl-page"><p role="alert">League access could not be checked.</p><button type="button" onClick={() => leagues.refetch()}>Retry</button></main>;
  const league = leagues.data.find((item) => item.id === leagueId);
  if (!league || !session.user?.id) return <main className="hl-page"><h1>League access unavailable</h1><p>This league is not in your active memberships.</p><Link to={routePaths.leagues}>Return to your leagues</Link></main>;
  return <LeagueGame key={`${league.id}:${session.user.id}:${session.session?.id || ""}`} league={league} session={session} />;
}
