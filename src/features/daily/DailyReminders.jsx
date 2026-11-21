import { useEffect, useReducer, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { routePaths } from "../../app/routePaths.js";
import { useSession } from "../session/sessionContext.js";
import { dailyNow, dailyRead, formatTime, hasUpcomingRoom } from "./dailyApi.js";

export function DailyReminders({ inDaily = false }) {
  const session = useSession();
  const [dismissed, setDismissed] = useState([]);
  const [, tick] = useReducer((value) => value + 1, 0);
  const now = dailyNow();
  const { data } = useQuery({
    ...dailyRead(session, "/reminders"),
    enabled: session.status === "authenticated" && (inDaily || hasUpcomingRoom(session.user.id)),
    staleTime: 25_000, refetchInterval: 30_000,
    meta: { private: true, suppressGlobalError: true },
  });
  useEffect(() => {
    const next = data?.reminders?.map((item) => Date.parse(item.auctionStartsAt))
      .filter((at) => at > now).sort((a, b) => a - b)[0];
    if (!next) return;
    const timer = setTimeout(tick, Math.max(1, Math.ceil(next - dailyNow())));
    return () => clearTimeout(timer);
  }, [data, now]);
  const reminders = data?.reminders?.filter((item) =>
    !dismissed.includes(item.id) && Date.parse(item.auctionStartsAt) > now
  );
  if (!reminders?.length || session.status !== "authenticated") return null;
  return <aside aria-label="Hundo Daily reminders" className="hl-surface hl-daily-reminders">
    {reminders.map((reminder) => <p key={reminder.id} role="status">
      <strong>Hundo Daily</strong>{" · "}
      <Link to={routePaths.dailyRoom(reminder.roomId)}>{reminder.roomName}</Link>
      {" opens for bidding at "}{formatTime(reminder.auctionStartsAt)}.{" "}
      <button type="button" className="hl-button hl-button--quiet" aria-label={`Dismiss reminder for ${reminder.roomName}`}
        onClick={() => setDismissed((items) => [...items, reminder.id])}>Dismiss</button>
    </p>)}
  </aside>;
}
