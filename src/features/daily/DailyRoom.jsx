import { useEffect, useReducer, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { routePaths } from "../../app/routePaths.js";
import { dailyKey, dailyNow, dailyRead, dailyWrite, formatDay, formatTime, phaseLabels, rememberParticipation, roomPath } from "./dailyApi.js";
import { AuctionBoard } from "./DailyAuctionBoard.jsx";
import { DailyScoreboard } from "./HundoDailyRoomScreens.jsx";
import { useDailyRoomAudio } from "./dailyAudioContext.js";
import { DailyChat } from "./DailyChat.jsx";
import { useDailyOpeningRefresh } from "./useDailyOpeningRefresh.js";
import { DailySlateGames } from "./DailySlateGames.jsx";
import { DailyAuctionOpeningBanner } from "./DailyAuctionOpeningBanner.jsx";

function RoomClock({ room }) {
  const waiting = room.phase === "waiting";
  const end = waiting ? room.auctionStartsAt : room.auctionEndsAt ?? room.firstGameAt;
  const [, tick] = useReducer(value => value + 1, 0);
  useEffect(() => {
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.ceil((Date.parse(end) - dailyNow()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = String(Math.floor(seconds / 60) % 60).padStart(2, "0");
  const remaining = [hours || null, minutes, String(seconds % 60).padStart(2, "0")].filter(value => value !== null).join(":");
  return <span className="hd-room-clock" title={formatDay(end) + " · " + formatTime(end)}>
    {waiting ? "Opens in " : "Locks in "}<time dateTime={end}>{remaining}</time>
  </span>;
}

export function DailyRoom({ session, roomId, primary = false, outlineColour }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [confirmClose, setConfirmClose] = useState(false);
  const path = roomPath(roomId);
  const result = useQuery({ ...dailyRead(session, path),
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const phase = query.state.data?.room.phase;
      return phase === "auction" ? 3000 : phase === "waiting" ? 5000 : 30_000;
    },
  });
  const room = result.data?.room;
  useDailyOpeningRefresh(room?.phase === "waiting" ? room.auctionStartsAt : null, result.refetch);
  const unavailable = [403, 404, 410].includes(result.error?.status);
  const audio = useDailyRoomAudio(unavailable ? undefined : room, session.user.id);
  const command = useMutation({
    mutationFn: ({ action, body = {} }) => dailyWrite(session, path + "/" + action, body),
    onSuccess: async (data, { action, body }) => {
      if (action === "bids") audio?.confirmedBid(roomId, body.playerId);
      const key = dailyKey(session.user.id, path);
      const lobbyKey = dailyKey(session.user.id, "/rooms");
      await client.cancelQueries({ queryKey: key });
      if (action === "close") {
        client.setQueryData(lobbyKey, old => old && ({ ...old, rooms: old.rooms.filter(item => item.id !== roomId) }));
        if (primary) navigate(routePaths.daily);
        client.removeQueries({ queryKey: key, exact: true });
      } else {
        client.setQueryData(key, data);
      }
      void client.invalidateQueries({ queryKey: lobbyKey });
    },
    onError: () => { void result.refetch(); },
  });
  useEffect(() => {
    if (room?.joined) rememberParticipation(session.user.id, room.auctionStartsAt);
  }, [room?.joined, room?.auctionStartsAt, session.user.id]);
  if (!room || unavailable) return <section className="hd-room-box">
    {result.isPending ? <p className="hd-room-message" role="status">Loading room…</p> :
      <p className="hd-error" role="alert">{result.error?.message || "This room is unavailable."}{" "}
        <button className="hd-action" onClick={() => result.refetch()}>Try again</button></p>}
  </section>;
  const bidding = room.phase === "waiting" || room.phase === "auction";
  const canJoin = !room.joined && room.memberCount < room.capacity && bidding;
  const commish = room.commissionerName || room.members.find(member => member.id === room.commissionerId)?.name;
  const Heading = primary ? "h1" : "h2";
  return <article className="hd-room-box" data-room-outline={outlineColour} aria-labelledby={"hd-room-" + room.id}>
    {(room.joined || room.allowSpectatorChat) && <DailyChat session={session} room={room}/>}
    <header className="hd-room-bar">
      <Heading id={"hd-room-" + room.id}>{room.name}</Heading>
      <span>Commish <b>{commish ?? "—"}</b></span>
      <span>{room.memberCount}/{room.capacity} managers</span>
      {bidding ? <RoomClock room={room} /> : <strong className="hd-room-status">{phaseLabels[room.phase]}</strong>}
    </header>
    {!room.joined && <p className="hd-note hd-room-footnote">Watching as a spectator.</p>}
    {result.isError && <p className="hd-error" role="alert">Room updates paused. {result.error.message}{" "}
      <button className="hd-action" onClick={() => result.refetch()}>Retry</button></p>}
    {command.error && <p className="hd-error" role="alert">{command.error.message}</p>}
    {canJoin && <button className="hd-action hd-primary hd-room-join" disabled={command.isPending}
      onClick={() => command.mutate({ action: "join" })}>Join room</button>}
    {bidding ? <>
      <DailyAuctionOpeningBanner room={room} viewerId={session.user.id}/>
      {room.phase === "waiting" && <section className="hd-waiting" aria-label="Auction schedule">
        <div><h2>{formatDay(room.firstGameAt)}</h2>
          <p>Auction opens <strong>{formatDay(room.auctionStartsAt)} · {formatTime(room.auctionStartsAt)}</strong> · Rosters lock <strong>{formatDay(room.auctionEndsAt ?? room.firstGameAt)} · {formatTime(room.auctionEndsAt ?? room.firstGameAt)}</strong> · Puck drop <strong>{formatDay(room.firstGameAt)} · {formatTime(room.firstGameAt)}</strong></p></div>
        <DailySlateGames games={room.games}/>
        {room.joined && room.mode !== "practice" && <p className="hd-note">Reminder 10 minutes before bidding opens.{" "}
          <Link to={routePaths.dailyNotifications}>Daily notifications</Link></p>}
      </section>}
      {room.phase === "auction" && <div className="hd-room-slate"><DailySlateGames games={room.games}/></div>}
      <AuctionBoard room={room} session={session} command={command} />
      <details className="hd-participants" open={room.phase === "waiting"}>
        <summary>Participants · {room.memberCount}</summary>
        <ul>{room.members.map(member => <li key={member.id}>{member.name}{member.id === session.user.id && " (you)"}</li>)}</ul>
      </details>
      {room.mode === "practice" && <p className="hd-note hd-room-footnote"><strong>Practice roster lock</strong> {formatTime(room.auctionEndsAt ?? room.firstGameAt)}.
        {" "}Practice scoring includes stats from the full day’s games, including plays before this room opened.</p>}
    </> : <DailyScoreboard room={room} viewer={session.user} />}
    {room.canClose && <section className="hd-controls" aria-label="Room administration">
      <small>Room commissioner · {commish ?? "—"}</small>
      {confirmClose ? <><span>Close “{room.name}” and remove it from the lobby?</span>
        <button className="hd-action" disabled={command.isPending} onClick={() => setConfirmClose(false)}>Keep room</button>
        <button className="hd-action hd-danger" disabled={command.isPending} onClick={() => command.mutate({ action: "close" })}>Confirm close</button></>
        : <button className="hd-action hd-danger" onClick={() => setConfirmClose(true)}>Close room</button>}
    </section>}
  </article>;
}
