import { useEffect, useRef } from "react";
import { formatDay, formatTime } from "./dailyApi.js";

export function DailyCreateConfirmation({ date, startsAt, tomorrow, onConfirm, onCancel }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement;
    node.showModal();
    return () => { node.close(); if (previous?.isConnected) previous.focus({preventScroll:true}); };
  }, []);
  return <dialog className="hds-confirm-dialog hds-skin" ref={dialog} aria-labelledby="daily-confirm-title"
    onCancel={event => { event.preventDefault(); onCancel(); }}>
    <h2 id="daily-confirm-title">{tomorrow ? "Create a room for tomorrow?" : "Create a room for this game day?"}</h2>
    <p>This room is for <strong>{tomorrow ? "tomorrow’s" : "a future"} slate of games</strong> — {formatDay(date + "T12:00:00Z")}.</p>
    <p>The auction starts at <strong>{formatTime(startsAt)}</strong> and lasts 30 minutes.</p>
    <div className="hds-confirm-actions"><button type="button" className="hds-button" autoFocus onClick={onCancel}>Go back</button>
      <button type="button" className="hds-button hds-button-solid" onClick={onConfirm}>{tomorrow ? "Create tomorrow’s room" : "Confirm room"}</button></div>
  </dialog>;
}
