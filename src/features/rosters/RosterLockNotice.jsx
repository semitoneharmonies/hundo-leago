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

  return <section className={`hl-surface ${styles.notice}`} aria-label="Roster lock">
    <div>
      <p className="hl-eyebrow">Next roster lock</p>
      {failed ? <p>Roster lock time is unavailable. <button type="button" onClick={onRetry}>Try again</button></p>
        : pending ? <p role="status">Loading roster lock time…</p>
          : upcoming ? <p className={styles.deadline}>
            <span>Week {upcoming.sequence} · </span>
            <time dateTime={new Date(upcoming.locksAtMs).toISOString()}>
              {upcoming.locksAtDisplay || new Intl.DateTimeFormat("en-US", {
                timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric",
                hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short",
              }).format(upcoming.locksAtMs)}
            </time>
          </p> : <p>No upcoming roster lock is scheduled.</p>}
    </div>
    <p className={styles.explanation}>Your active lineup is saved on day one of each matchup week. Only that lineup scores for the week.</p>
  </section>;
}

export function RosterLockNotice({ httpClient, leagueId, seasonId }) {
  const query = useQuery({
    ...matchupWeeksQuery(httpClient, leagueId, seasonId),
    refetchInterval: 60_000,
  });
  return <RosterLockSummary weeks={query.data?.weeks} leagueId={leagueId} seasonId={seasonId}
    pending={query.isPending} failed={query.isError} onRetry={() => query.refetch()} />;
}
