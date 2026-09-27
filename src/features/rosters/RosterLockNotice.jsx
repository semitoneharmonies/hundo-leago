import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { matchupWeeksQuery } from "../competition/competitionQueries.js";
import styles from "./RosterLockNotice.module.css";

export function RosterLockSummary({ weeks = [], leagueId, seasonId, pending, failed, onRetry }) {
  const [nowMs, setNowMs] = useState(Date.now);
  const upcoming = weeks
    .filter((week) => week.leagueId === leagueId && week.seasonId === seasonId &&
      !["locked", "live", "final", "cancelled"].includes(week.status) && week.locksAtMs > nowMs)
    .sort((a, b) => a.locksAtMs - b.locksAtMs)[0];

  useEffect(() => {
    const refresh = () => setNowMs(Date.now());
    const timer = setTimeout(refresh, Math.min(60_000, Math.max(1, (upcoming?.locksAtMs ?? nowMs + 60_000) - nowMs)));
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [nowMs, upcoming?.locksAtMs]);

  const fullTime = upcoming && (upcoming.locksAtDisplay || new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short",
  }).format(upcoming.locksAtMs));
  // Shorten the server's league-local display; do not convert it to the browser's timezone.
  const parts = upcoming?.locksAtDisplay?.match(/^([A-Za-z]+),.*?\bat\s+(\d{1,2}:\d{2})\s*([AP]M)/);
  const compactTime = parts ? `${parts[1]} at ${parts[2]}${parts[3]}` : fullTime;
  return <div className={styles.notice} aria-label="Roster lock">
    {failed ? <span>Next roster lock: unavailable. <button type="button" onClick={onRetry}>Try again</button></span>
      : pending ? <span role="status">Loading roster lock time…</span>
        : upcoming ? <span>Next roster lock: <time dateTime={new Date(upcoming.locksAtMs).toISOString()} title={fullTime} aria-label={fullTime}>{compactTime}</time></span>
          : <span>Next roster lock: not scheduled</span>}
  </div>;
}

export function RosterLockNotice({ httpClient, leagueId, seasonId }) {
  const query = useQuery({
    ...matchupWeeksQuery(httpClient, leagueId, seasonId),
    refetchInterval: 60_000,
  });
  return <RosterLockSummary weeks={query.data?.weeks} leagueId={leagueId} seasonId={seasonId}
    pending={query.isPending} failed={query.isError} onRetry={() => query.refetch()} />;
}
