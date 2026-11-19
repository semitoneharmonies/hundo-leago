import { RoomCard } from "./HundoDailyRoomScreens.jsx";
import { formatDay } from "./dailyApi.js";

export function DailyHistory({ rooms, viewer }) {
  const mine = rooms.filter(room => room.joined);
  // Keep commissioners/admins able to reach and close older rooms they manage.
  const managed = rooms.filter(room => !room.joined && room.canClose);
  return <section className="hds-lobby hds-skin" aria-label="Hundo Daily history">
    <header className="hds-titleband"><h1>Your Hundo Daily history</h1><p>Finished rooms from previous game days.</p></header>
    {[["Your finished rooms",mine],["Other rooms you manage",managed]].map(([label,list]) => {
      if (!list.length && label !== "Your finished rooms") return null;
      const dates = [...new Set(list.map(room => room.date))].sort().reverse();
      return <section className="hds-room-group" key={label} aria-label={label}>
        {label !== "Your finished rooms" && <h2>{label}</h2>}
        {!list.length && <p className="hds-empty">Your finished rooms will appear here after their game day ends.</p>}
        {dates.map(date => <section key={date} className="hd-history-day" aria-label={date}>
          <h2>{formatDay(date + "T12:00:00Z")}</h2>
          <ul className="hds-room-cards">{list.filter(room => room.date === date).map(room => <RoomCard key={room.id} room={room} viewer={viewer}/>)}</ul>
        </section>)}
      </section>;
    })}
  </section>;
}
