import { useState } from "react";

import styles from "./StatisticsPeriodFilter.module.css";
import { SEASON_STATISTICS_PERIOD } from "./playerStatisticsPeriod.js";

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}

export function StatisticsPeriodFilter({ value, onChange, seasonKey }) {
  const [mode, setMode] = useState(value.statsPeriod);
  const [startDate, setStartDate] = useState(value.startDate || "");
  const [endDate, setEndDate] = useState(value.endDate || "");
  const [lastGames, setLastGames] = useState(String(value.lastGames || 10));
  const [error, setError] = useState(null);
  const seasonStart = /^\d{8}$/.test(seasonKey || "") ? `${seasonKey.slice(0, 4)}-07-01` : undefined;
  const seasonEnd = seasonStart ? `${seasonKey.slice(4)}-06-30` : undefined;
  const draft = mode === "dateRange" ? { statsPeriod: mode, startDate, endDate }
    : mode === "lastGames" ? { statsPeriod: mode, lastGames: Number(lastGames) } : SEASON_STATISTICS_PERIOD;
  const changed = JSON.stringify(draft) !== JSON.stringify(value);

  function apply() {
    if (mode === "dateRange") {
      if (!validDate(startDate) || !validDate(endDate)) return setError("Choose a valid start and end date.");
      if (startDate > endDate) return setError("The end date must be on or after the start date.");
      if (seasonStart && (startDate < seasonStart || endDate > seasonEnd)) return setError("Choose dates within the current NHL season.");
    }
    if (mode === "lastGames" && (!/^\d+$/.test(lastGames) || !Number.isInteger(Number(lastGames)) || Number(lastGames) < 1 || Number(lastGames) > 200)) {
      return setError("Choose between 1 and 200 games.");
    }
    setError(null);
    onChange(draft);
  }

  function changeMode(event) {
    const next = event.target.value;
    setMode(next);
    setError(null);
    if (next === "season") onChange(SEASON_STATISTICS_PERIOD);
  }

  return <fieldset className={styles.period} onKeyDown={(event) => {
    if (event.key === "Enter" && event.target.tagName === "INPUT") { event.preventDefault(); apply(); }
  }}>
    <legend>Stats period</legend>
    <div className={styles.controls}>
      <label className="hl-field">
        Show stats for
        <select value={mode} onChange={changeMode}>
          <option value="season">Season to date</option>
          <option value="dateRange">Date range</option>
          <option value="lastGames">Last X games</option>
        </select>
      </label>
      {mode === "dateRange" && <>
        <label className="hl-field">Start date
          <input type="date" value={startDate} min={seasonStart} max={seasonEnd}
            onChange={(event) => { setStartDate(event.target.value); setError(null); }} aria-describedby="player-period-help" />
        </label>
        <label className="hl-field">End date
          <input type="date" value={endDate} min={seasonStart} max={seasonEnd}
            onChange={(event) => { setEndDate(event.target.value); setError(null); }} aria-describedby="player-period-help" />
        </label>
      </>}
      {mode === "lastGames" && <label className="hl-field">Games per player
        <input type="number" inputMode="numeric" min="1" max="200" step="1" value={lastGames}
          onChange={(event) => { setLastGames(event.target.value); setError(null); }} aria-describedby="player-period-help" />
      </label>}
      {mode !== "season" && <button type="button" className="hl-button hl-button--primary" disabled={!changed} onClick={apply}>Apply period</button>}
    </div>
    <p id="player-period-help">
      {mode === "lastGames" ? "Each player’s most recent completed appearances this season. GP shows the actual games available."
        : "Completed games this season. Both dates are included, using your league’s time zone."}
    </p>
    {changed && <p>Apply to update the stats shown below.</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </fieldset>;
}
