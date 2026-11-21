import { useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { routePaths } from "../../app/routePaths.js";
import { useSession } from "../session/sessionContext.js";
import { DailyHeader } from "./DailyHeader.jsx";
import { DailyReminders } from "./DailyReminders.jsx";
import { DailyRoom } from "./DailyRoom.jsx";
import { DailyHistory } from "./DailyHistory.jsx";
import { DailyProfile } from "./DailyProfile.jsx";
import { DailyHelp } from "./DailyHelp.jsx";
import { DailyScoringGuide } from "./DailyScoringGuide.jsx";
import { DailyAudioProvider, DailySoundToggle } from "./DailyAudio.jsx";
import { DailyAudioContext } from "./dailyAudioContext.js";
import { dailyGameDate, isDailyHistoryRoom } from "./dailyHistory.js";
import { DailyCreateScreen, DailyLobbyScreen } from "./HundoDailyRoomScreens.jsx";
import { dailyKey, dailyRead, dailyWrite, formatDay, rememberParticipation, roomPath } from "./dailyApi.js";
import "./daily.css";

const dayNames = { today: "Today", tomorrow: "Tomorrow", next: "Next game day" };
const slateMessages = {
  no_games: "No NHL games are scheduled for this day.",
  locked: "No future auction start times remain for this day. Choose another game day.",
  unavailable: "The NHL schedule for this day is temporarily unavailable.",
};

function DailyDesk({ session, screen, roomId }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const audio = useContext(DailyAudioContext);
  const creating = screen === "create" || screen === "practice";
  const practice = screen === "practice";
  const [clockDay, setClockDay] = useState(dailyGameDate);
  const lobby = useQuery({ ...dailyRead(session, "/rooms"), refetchInterval: 15_000 });
  const mutation = useMutation({
    mutationFn: ({ path, body, key }) => dailyWrite(session, path, body, key),
    onSuccess: async ({ room }, { path }) => {
      if (path === "/rooms") audio.roomCreated(room);
      rememberParticipation(session.user.id, room.auctionStartsAt);
      const key = dailyKey(session.user.id, roomPath(room.id));
      await client.cancelQueries({ queryKey: key });
      client.setQueryData(key, { room });
      void client.invalidateQueries({ queryKey: dailyKey(session.user.id, "/rooms") });
      navigate(routePaths.dailyRoom(room.id));
    },
    onError: () => { void lobby.refetch(); },
  });
  const { rooms = [], slate, practiceSlate, slateOptions } = lobby.data ?? {};
  useEffect(() => {
    const refresh = () => setClockDay(dailyGameDate());
    refresh();
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, [lobby.data]);
  const today = slateOptions?.find(option => option.day === "today")?.date ?? practiceSlate?.date ?? clockDay;
  const currentRooms = rooms.filter(room => !isDailyHistoryRoom(room, today));
  const historyRooms = rooms.filter(room => isDailyHistoryRoom(room, today));
  const viewingHistoryRoom = isDailyHistoryRoom(rooms.find(room => room.id === roomId) ?? {}, today);
  const options = slateOptions ?? (slate ? [{ ...slate, status: "open" }] : []);
  const showCreateLinks = screen === "lobby" || ["auction", "waiting"].includes(rooms.find(room => room.id === roomId)?.phase);
  useEffect(() => {
    for (const room of lobby.data?.rooms ?? []) {
      if (room.joined) rememberParticipation(session.user.id, room.auctionStartsAt);
    }
  }, [lobby.data, session.user.id]);
  return <>
    <nav className="hd-nav hd-nav-actions" aria-label="Daily navigation">
      {screen !== "lobby" && <Link className="hd-action hd-back" to={routePaths.daily}>
        <ArrowLeft size={15} aria-hidden="true" />All rooms</Link>}
      {screen !== "history" && <Link className="hd-history-link" to={routePaths.dailyHistory}>View your Hundo Daily history</Link>}
      <DailySoundToggle />
      <DailyHelp />
      <DailyScoringGuide />
      {showCreateLinks && practiceSlate?.status === "available" && <Link className="hd-action hd-practice-link" to={routePaths.dailyPractice}>Practice now</Link>}
      {showCreateLinks && slate && <Link className="hd-action hd-primary" to={routePaths.dailyCreate}>Open a room</Link>}
    </nav>
    <main className="hd-content">
      <DailyReminders inDaily />
      {lobby.isError && <p className="hd-error" role="alert">{lobby.error.message}{" "}
        <button className="hd-action" onClick={() => lobby.refetch()}>Try again</button></p>}
      {mutation.isError && <p className="hd-error" role="alert">{mutation.error.message}</p>}
      {lobby.isPending && !roomId && <p role="status">Loading rooms…</p>}
      {screen === "lobby" && lobby.data && <>
        <DailyLobbyScreen rooms={currentRooms} slate={slate} viewer={session.user} pending={mutation.isPending}
          onJoin={(id) => mutation.mutate({ path: roomPath(id) + "/join", body: {} })} />
        {!slate && (options.length ? options.map(option => <p className="hd-note" key={option.date} role="status">
          {dayNames[option.day]} · {formatDay(option.date + "T12:00:00Z")} · {slateMessages[option.status]}</p>)
          : <p className="hd-note" role="status">{lobby.data.slateUnavailable ? slateMessages.unavailable : "No upcoming NHL games are available."}</p>)}
      </>}
      {screen === "history" && lobby.data && <DailyHistory rooms={historyRooms} viewer={session.user}/>}
      {screen === "profile" && <DailyProfile session={session}/>}
      {creating && lobby.data && <DailyCreateScreen key={screen} options={options}
        today={today}
        initialDate={(practice ? practiceSlate : slate)?.date ?? options[0]?.date ?? ""}
        practice={practice} practiceSlate={practiceSlate} viewer={session.user} pending={mutation.isPending}
        onCreate={(body, key) => mutation.mutate({ path: "/rooms", body, key })}
        onCancel={() => navigate(routePaths.daily)} />}
      {roomId && <div className="hd-room-stack">
        <DailyRoom key={roomId} session={session} roomId={roomId} primary />
        {!viewingHistoryRoom && currentRooms.filter(room => room.joined && room.id !== roomId).map(room =>
          <DailyRoom key={room.id} session={session} roomId={room.id} />)}
      </div>}
    </main>
  </>;
}

export function DailyPage({ screen = "lobby" }) {
  const session = useSession();
  const { roomId } = useParams();
  const { pathname } = useLocation();
  useEffect(() => {
    const previous = document.title;
    document.title = "Hundo Daily";
    return () => { document.title = previous; };
  }, []);
  return <div className="hl-app-shell hd-site">
    <DailyHeader />
    {session.status === "authenticated"
      ? <DailyAudioProvider key={session.user.id} userId={session.user.id}><DailyDesk key={session.user.id + screen} session={session} roomId={roomId} screen={roomId ? "room" : screen} /></DailyAudioProvider>
      : <><main className="hd-content"><section className="hd-account">
          <h1>Hundo Daily</h1>
          {session.status === "unknown" ? (session.bootstrapError ? <p role="alert">Account service unavailable.{" "}
            <button onClick={session.retryBootstrap}>Try again</button></p> : <p role="status">Checking your account…</p>)
            : <><p>Sign in with your Hundo account to join a free daily auction room.</p>
              <Link className="hd-primary hd-action" to="/#account-access"
                state={{ dailyReturnTo: pathname }}>Sign in or create an account</Link></>}
        </section></main></>}
  </div>;
}
