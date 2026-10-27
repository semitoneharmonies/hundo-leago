import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { routePaths } from "../../app/routePaths.js";
import { useSession } from "../session/sessionContext.js";
import { visibleLeaguesQuery } from "../leagues/leagueQueries.js";
import { createMrBoniBridge } from "./mrBoniBridge.js";
import { nameMrBoniGuest, publicMrBoniKey, publicMrBoniLeaderboardQuery, saveMrBoniCheckpoint, startMrBoniRun, mrBoniKey, mrBoniLeaderboardQuery, MR_BONI_RULESET } from "./mrBoniApi.js";
import { createMrBoniOutbox } from "./mrBoniOutbox.js";
import { readMrBoniClaim, readMrBoniGuest, rememberMrBoniClaim, rememberMrBoniGuest } from "./mrBoniGuest.js";
import "./MrBoniPage.css";

function formatMrBoniTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}.${String(milliseconds % 1000).padStart(3, "0")}`;
}

function resultLabel(entry) {
  return entry.highestLevelCompleted > 0 ? `Level ${entry.highestLevelCompleted} completed` : "No levels completed";
}

function Leaderboard({ title, id, query, userId, publicBoard = false }) {
  return <section className="hl-mrboni-leaderboard" aria-labelledby={id}>
    <div className="hl-mrboni-board-heading"><h2 id={id}>{title}</h2>
      <button type="button" aria-label={`Refresh ${title}`} disabled={query.isFetching} onClick={() => query.refetch()}>Refresh</button></div>
    <p className="hl-mrboni-explainer">{publicBoard ? "Top 100 places, including ties. One best result per player." : "Your league’s best runs."} More levels completed ranks higher, then faster total time through the last completed level.</p>
    {query.isPending ? <p role="status">Loading leaderboard…</p>
      : query.isError ? <p role="alert">The leaderboard could not be loaded. Refresh to try again.</p>
        : query.data.entries.length === 0 ? <p>No runs yet. Be the first to play.</p>
          : <div className="hl-mrboni-table"><table>
            <thead><tr><th scope="col">Rank</th><th scope="col">{publicBoard ? "Player" : "Manager"}</th><th scope="col">Best result</th><th scope="col">Time</th></tr></thead>
            <tbody>{query.data.entries.map((entry) => <tr key={publicBoard ? entry.playerId : entry.managerId} className={!publicBoard && entry.managerId === userId ? "is-you" : undefined}>
              <td>{entry.rank}</td><th scope="row">{publicBoard ? entry.playerName : entry.managerName}{publicBoard && entry.isGuest && <small> (Guest)</small>}{!publicBoard && entry.managerId === userId && <small> You</small>}</th>
              <td>{resultLabel(entry)}</td><td>{entry.highestLevelCompleted === 0 ? "—" : formatMrBoniTime(entry.cumulativeTimeMs)}</td>
            </tr>)}</tbody>
          </table></div>}
  </section>;
}

function LeagueGame({ league = null, session }) {
  const queryClient = useQueryClient();
  const frame = useRef(null);
  const viewport = useRef(null);
  const boards = useRef(null);
  const fullscreenButton = useRef(null);
  const hadNativeFullscreen = useRef(false);
  const bridge = useRef(null);
  const [saveState, setSaveState] = useState({ kind: "loading", message: "Loading Mr. Boni…" });
  const [expanded, setExpanded] = useState(false);
  const [gameReady, setGameReady] = useState(false);
  const [frameRevision, setFrameRevision] = useState(0);
  const [guest] = useState(() => league ? null : readMrBoniGuest());
  const [claim, setClaim] = useState(() => guest ? readMrBoniClaim(guest) : null);
  const [name, setName] = useState("");
  const [nameState, setNameState] = useState({ pending: false, error: "", message: "" });
  const [temporaryGuest, setTemporaryGuest] = useState(false);
  const nameRequest = useRef(null);
  const nameInput = useRef(null);
  const leagueId = league?.id ?? null;
  const leaderboard = useQuery({ ...mrBoniLeaderboardQuery(session.httpClient, leagueId), enabled: Boolean(league) });
  const publicLeaderboard = useQuery(publicMrBoniLeaderboardQuery(session.httpClient));
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
    const readyTimeout = setTimeout(() => setSaveState({ kind: "load-error", message: "Mr. Boni has not loaded. Check your connection and reload the game." }), 20000);
    const connection = createMrBoniBridge({
      origin: window.location.origin,
      frameWindow: frame.current.contentWindow,
      publicGame: !leagueId,
      outbox: createMrBoniOutbox({ userId: guest?.id || userId, leagueId: leagueId || "public", rulesetVersion: MR_BONI_RULESET }),
      startRun: (requestId, signal) => {
        if (guest) setTemporaryGuest(!rememberMrBoniGuest(guest));
        return startMrBoniRun(session.httpClient, leagueId, requestId, signal, guest?.key);
      },
      saveCheckpoint: (runId, commands, signal) => saveMrBoniCheckpoint(session.httpClient, leagueId, runId, commands, signal, guest?.key),
      onState: setSaveState,
      onReady: () => { clearTimeout(readyTimeout); setGameReady(true); },
      onFullscreen: updateFullscreen,
      onLeaderboard: () => { updateFullscreen(false); requestAnimationFrame(() => boards.current?.scrollIntoView?.({ behavior: "smooth", block: "start" })); },
      onSaved: (result) => {
        if (leagueId) void queryClient.invalidateQueries({ queryKey: mrBoniKey(leagueId), exact: true });
        void queryClient.invalidateQueries({ queryKey: publicMrBoniKey, exact: true });
        if (guest && result?.named) { setClaim(null); rememberMrBoniClaim(guest, null); }
        else if (guest && result?.qualifies) {
          const next = { runId: result.runId };
          setClaim(next); rememberMrBoniClaim(guest, next);
          if (result.highestLevelCompleted === 3) {
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
      const result = await nameMrBoniGuest(session.httpClient, claim.runId, guest.key, name.trim(), controller.signal);
      if (controller.signal.aborted) return;
      setNameState({ pending: false, error: "", message: result.saved && result.qualifies ? "Your name is on the Hundo Leago leaderboard." : "The leaderboard has moved ahead of this score. Keep playing for another spot!" });
      setClaim(null); rememberMrBoniClaim(guest, null);
      void queryClient.invalidateQueries({ queryKey: publicMrBoniKey, exact: true });
    } catch (error) {
      if (!controller.signal.aborted) setNameState({ pending: false, message: "", error: error?.code === "MR_BONI_NAME_INVALID" ? "Use 1–30 letters, numbers, spaces, periods, hyphens, underscores or apostrophes." : "Your name could not be saved. Please try again." });
    } finally { clearTimeout(timer); }
  }

  async function fullscreen() {
    updateFullscreen(true);
    try {
      await viewport.current.requestFullscreen?.();
    } catch { /* The full-viewport layout also works without the native API. */ }
    frame.current?.focus();
  }

  return <main className="hl-page hl-mrboni" aria-labelledby="mrboni-title">
    <header className="hl-mrboni-heading">
      <div><Link to={league ? routePaths.league(league.id) : routePaths.home}>{league ? league.name : "Hundo Leago"}</Link><h1 id="mrboni-title">Mr. Boni</h1>
        {!league && <p className="hl-mrboni-explainer">Play as a guest—no account needed.{session.status === "authenticated" && <> <Link to={routePaths.leagues}>Play for your league</Link></>}</p>}</div>
      <button ref={fullscreenButton} type="button" onClick={fullscreen}>Fullscreen</button>
    </header>
    <div ref={viewport} className={`hl-mrboni-viewport${expanded ? " is-fullscreen" : ""}`} role={expanded ? "dialog" : undefined} aria-modal={expanded || undefined} aria-label={expanded ? "Mr. Boni fullscreen game" : undefined}>
    {expanded && !gameReady && <button type="button" className="hl-mrboni-exit" aria-label="Exit fullscreen" onClick={() => updateFullscreen(false)}>×</button>}
    <iframe key={frameRevision} ref={frame} className="hl-mrboni-game" title="Mr. Boni ice resurfacing game"
      src="/games/mr-boni/resurface-v1/index.html?league=1" allow="autoplay; fullscreen" allowFullScreen />
    </div>
    {temporaryGuest && <p role="status">Browser storage is unavailable. Keep this page open to save your guest score and name.</p>}
    {claim && <form className="hl-mrboni-name" onSubmit={submitName} aria-labelledby="mrboni-name-title">
      <h2 id="mrboni-name-title">You made the Hundo Leago leaderboard!</h2>
      <p>Choose a name to publish your score. It will appear with “(Guest)” beside it.</p>
      <label htmlFor="mrboni-guest-name">Leaderboard name</label>
      <div><input ref={nameInput} id="mrboni-guest-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="nickname" required maxLength={30} disabled={nameState.pending} />
        <button type="submit" disabled={nameState.pending || !name.trim()}>{nameState.pending ? "Saving…" : "Save name"}</button></div>
      {nameState.error && <p role="alert">{nameState.error}</p>}
    </form>}
    {nameState.message && <p role="status">{nameState.message}</p>}
    <div className={`hl-mrboni-save hl-mrboni-save--${saveState.kind}`}>
      <p role={saveState.kind.endsWith("error") ? "alert" : "status"}>{saveState.message}</p>
      {saveState.kind === "load-error" ? <button type="button" onClick={() => { updateFullscreen(false); setGameReady(false); setSaveState({ kind: "loading", message: "Loading Mr. Boni…" }); setFrameRevision((value) => value + 1); }}>Reload game</button>
        : saveState.kind.endsWith("error") && <button type="button" onClick={() => bridge.current?.retry()}>Retry {saveState.kind === "start-error" ? "start" : "save"}</button>}
    </div>
    <div ref={boards} className={`hl-mrboni-boards${league ? " has-league" : ""}`}>
      {league && <Leaderboard title={`${league.name} leaderboard`} id="mrboni-league-board" query={leaderboard} userId={userId} />}
      <Leaderboard title="Hundo Leago leaderboard" id="mrboni-public-board" query={publicLeaderboard} publicBoard />
    </div>
  </main>;
}

export function PublicMrBoniPage() {
  const session = useSession();
  return <LeagueGame key={`public:${session.user?.id || "guest"}`} session={session} />;
}

export function MrBoniPage() {
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
