import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { routePaths } from "../../app/routePaths.js";
import { useSession } from "../session/sessionContext.js";
import { visibleLeaguesQuery } from "../leagues/leagueQueries.js";
import { createTipJarBridge } from "./tipJarBridge.js";
import { nameTipJarGuest, publicTipJarKey, publicTipJarLeaderboardQuery, saveTipJarCheckpoint, startTipJarRun, tipJarKey, tipJarLeaderboardQuery, TIP_JAR_RULESET } from "./tipJarApi.js";
import { createTipJarOutbox } from "./tipJarOutbox.js";
import { readTipJarClaim, readTipJarGuest, rememberTipJarClaim, rememberTipJarGuest } from "./tipJarGuest.js";
import "./TipJarPage.css";

function resultLabel(entry) {
  if (entry.completed) return "Game beaten";
  return entry.highestLevelCompleted > 0 ? `Level ${entry.highestLevelCompleted} completed` : "No levels completed";
}

function Leaderboard({ title, id, query, userId, publicBoard = false }) {
  return <section className="hl-tipjar-leaderboard" aria-labelledby={id}>
    <div className="hl-tipjar-board-heading"><h2 id={id}>{title}</h2>
      <button type="button" aria-label={`Refresh ${title}`} disabled={query.isFetching} onClick={() => query.refetch()}>Refresh</button></div>
    <p className="hl-tipjar-explainer">{publicBoard ? "Top 100 places, including ties. One best result per player." : "Your league’s best runs."} More levels completed ranks higher, then fewer shots through the last completed level.</p>
    {query.isPending ? <p role="status">Loading leaderboard…</p>
      : query.isError ? <p role="alert">The leaderboard could not be loaded. Refresh to try again.</p>
        : query.data.entries.length === 0 ? <p>No runs yet. Be the first to play.</p>
          : <div className="hl-tipjar-table"><table>
            <thead><tr><th scope="col">Rank</th><th scope="col">{publicBoard ? "Player" : "Manager"}</th><th scope="col">Best result</th><th scope="col">Shots</th></tr></thead>
            <tbody>{query.data.entries.map((entry) => <tr key={publicBoard ? entry.playerId : entry.managerId} className={!publicBoard && entry.managerId === userId ? "is-you" : undefined}>
              <td>{entry.rank}</td><th scope="row">{publicBoard ? entry.playerName : entry.managerName}{publicBoard && entry.isGuest && <small> (Guest)</small>}{!publicBoard && entry.managerId === userId && <small> You</small>}</th>
              <td>{resultLabel(entry)}</td><td>{entry.highestLevelCompleted === 0 ? "—" : entry.shotsToCompletion}</td>
            </tr>)}</tbody>
          </table></div>}
  </section>;
}

function LeagueGame({ league = null, session }) {
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
  const [guest] = useState(() => league ? null : readTipJarGuest());
  const [claim, setClaim] = useState(() => guest ? readTipJarClaim(guest) : null);
  const [name, setName] = useState("");
  const [nameState, setNameState] = useState({ pending: false, error: "", message: "" });
  const [temporaryGuest, setTemporaryGuest] = useState(false);
  const nameRequest = useRef(null);
  const nameInput = useRef(null);
  const leagueId = league?.id ?? null;
  const leaderboard = useQuery({ ...tipJarLeaderboardQuery(session.httpClient, leagueId), enabled: Boolean(league) });
  const publicLeaderboard = useQuery(publicTipJarLeaderboardQuery(session.httpClient));
  const userId = session.user?.id;

  useEffect(() => () => nameRequest.current?.abort(), [guest, session.httpClient]);

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
      publicGame: !leagueId,
      outbox: createTipJarOutbox({ userId: guest?.id || userId, leagueId: leagueId || "public", rulesetVersion: TIP_JAR_RULESET }),
      startRun: (requestId, signal) => {
        if (guest) setTemporaryGuest(!rememberTipJarGuest(guest));
        return startTipJarRun(session.httpClient, leagueId, requestId, signal, guest?.key);
      },
      saveCheckpoint: (runId, shots, signal) => saveTipJarCheckpoint(session.httpClient, leagueId, runId, shots, signal, guest?.key),
      onState: setSaveState,
      onReady: () => { clearTimeout(readyTimeout); setGameReady(true); },
      onFullscreen: updateFullscreen,
      onSaved: (result) => {
        if (leagueId) void queryClient.invalidateQueries({ queryKey: tipJarKey(leagueId), exact: true });
        void queryClient.invalidateQueries({ queryKey: publicTipJarKey, exact: true });
        if (guest && result?.named) { setClaim(null); rememberTipJarClaim(guest, null); }
        else if (guest && result?.qualifies) {
          const next = { runId: result.runId };
          setClaim(next); rememberTipJarClaim(guest, next);
          if (result.completed || result.failed) {
            updateFullscreen(false);
            requestAnimationFrame(() => nameInput.current?.focus());
          }
        }
      },
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
  }, [frameRevision, guest, leagueId, queryClient, session.httpClient, updateFullscreen, userId]);

  async function submitName(event) {
    event.preventDefault();
    if (!claim || nameState.pending) return;
    const controller = new AbortController();
    nameRequest.current = controller;
    setNameState({ pending: true, error: "", message: "" });
    const timer = setTimeout(() => {
      if (controller.signal.aborted) return;
      controller.abort();
      setNameState({ pending: false, message: "", error: "Saving your name timed out. Please try again." });
    }, 15000);
    try {
      const result = await nameTipJarGuest(session.httpClient, claim.runId, guest.key, name.trim(), controller.signal);
      if (controller.signal.aborted) return;
      setNameState({ pending: false, error: "", message: result.saved && result.qualifies ? "Your name is on the Hundo Leago leaderboard." : "The leaderboard has moved ahead of this score. Keep playing for another spot!" });
      setClaim(null); rememberTipJarClaim(guest, null);
      void queryClient.invalidateQueries({ queryKey: publicTipJarKey, exact: true });
    } catch (error) {
      if (!controller.signal.aborted) setNameState({ pending: false, message: "", error: error?.code === "TIP_JAR_NAME_INVALID" ? "Use 1–30 letters, numbers, spaces, periods, hyphens, underscores or apostrophes." : "Your name could not be saved. Please try again." });
    } finally { clearTimeout(timer); }
  }

  async function fullscreen() {
    updateFullscreen(true);
    try {
      await viewport.current.requestFullscreen?.();
    } catch { /* The full-viewport layout also works without the native API. */ }
    frame.current?.focus();
  }

  return <main className="hl-page hl-tipjar" aria-labelledby="tipjar-title">
    <header className="hl-tipjar-heading">
      <div><Link to={league ? routePaths.league(league.id) : routePaths.home}>{league ? league.name : "Hundo Leago"}</Link><h1 id="tipjar-title">Tip Jar</h1>
        {!league && <p className="hl-tipjar-explainer">Play as a guest—no account needed.{session.status === "authenticated" && <> <Link to={routePaths.leagues}>Play for your league</Link></>}</p>}</div>
      <button ref={fullscreenButton} type="button" onClick={fullscreen}>Fullscreen</button>
    </header>
    <div ref={viewport} className={`hl-tipjar-viewport${expanded ? " is-fullscreen" : ""}`} role={expanded ? "dialog" : undefined} aria-modal={expanded || undefined} aria-label={expanded ? "Tip Jar fullscreen game" : undefined}>
    {expanded && !gameReady && <button type="button" className="hl-tipjar-exit" aria-label="Exit fullscreen" onClick={() => updateFullscreen(false)}>×</button>}
    <iframe key={frameRevision} ref={frame} className="hl-tipjar-game" title="Tip Jar hockey game"
      src="/games/tip-jar/campaign-v1/index.html?league=1" allow="autoplay; fullscreen" allowFullScreen />
    </div>
    {temporaryGuest && <p role="status">Browser storage is unavailable. Keep this page open to save your guest score and name.</p>}
    {claim && <form className="hl-tipjar-name" onSubmit={submitName} aria-labelledby="tipjar-name-title">
      <h2 id="tipjar-name-title">You made the Hundo Leago leaderboard!</h2>
      <p>Choose a name to publish your score. It will appear with “(Guest)” beside it.</p>
      <label htmlFor="tipjar-guest-name">Leaderboard name</label>
      <div><input ref={nameInput} id="tipjar-guest-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="nickname" required maxLength={30} disabled={nameState.pending} />
        <button type="submit" disabled={nameState.pending || !name.trim()}>{nameState.pending ? "Saving…" : "Save name"}</button></div>
      {nameState.error && <p role="alert">{nameState.error}</p>}
    </form>}
    {nameState.message && <p role="status">{nameState.message}</p>}
    <div className={`hl-tipjar-save hl-tipjar-save--${saveState.kind}`}>
      <p role={saveState.kind.endsWith("error") ? "alert" : "status"}>{saveState.message}</p>
      {saveState.kind === "load-error" ? <button type="button" onClick={() => { updateFullscreen(false); setGameReady(false); setSaveState({ kind: "loading", message: "Loading Tip Jar…" }); setFrameRevision((value) => value + 1); }}>Reload game</button>
        : saveState.kind.endsWith("error") && <button type="button" onClick={() => bridge.current?.retry()}>Retry {saveState.kind === "start-error" ? "start" : "save"}</button>}
    </div>
    <div className={`hl-tipjar-boards${league ? " has-league" : ""}`}>
      {league && <Leaderboard title={`${league.name} leaderboard`} id="tipjar-league-board" query={leaderboard} userId={userId} />}
      <Leaderboard title="Hundo Leago leaderboard" id="tipjar-public-board" query={publicLeaderboard} publicBoard />
    </div>
  </main>;
}

export function PublicTipJarPage() {
  const session = useSession();
  return <LeagueGame key={`public:${session.user?.id || "guest"}`} session={session} />;
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
