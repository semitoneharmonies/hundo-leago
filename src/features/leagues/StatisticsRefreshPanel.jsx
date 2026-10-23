import { useRef, useState } from "react";

import { Surface } from "../../components/HundoUi.jsx";
import { refreshStatistics } from "./statisticsRefreshApi.js";

function refreshErrorMessage(error) {
  if (error?.status === 401) {
    return "Your session has ended. Sign in again before refreshing statistics.";
  }
  if (error?.code === "PLATFORM_ADMINISTRATOR_REQUIRED") {
    return "Only a platform administrator can refresh NHL statistics. Your access may have changed.";
  }
  if (error?.code === "STATISTICS_OPERATION_DISABLED") {
    return "NHL statistics refreshes have not been enabled yet.";
  }
  if (error?.code === "STATISTICS_OPERATION_IN_PROGRESS") {
    return "An NHL statistics refresh is already running. Wait for it to finish before trying again.";
  }
  if (error?.code === "STATISTICS_OPERATION_FAILED") {
    return "NHL statistics could not be updated. The last successful results remain available. Try again later.";
  }
  if (error?.status === 403) {
    return "This refresh was not allowed. Reload the page to check your session and access before trying again.";
  }
  if (error?.status === 429) {
    return "Too many refresh requests. Wait a few minutes before trying again.";
  }
  return "We could not confirm whether the refresh finished. It may still be running. Check the latest player statistics before starting another refresh.";
}

export function StatisticsRefreshPanel({ httpClient }) {
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function refresh() {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setResult(null);
    setErrorMessage("");
    try {
      setResult(await refreshStatistics(httpClient));
    } catch (error) {
      setErrorMessage(refreshErrorMessage(error));
    } finally {
      running.current = false;
      setPending(false);
    }
  }

  return (
    <Surface className="hl-admin-league-panel" aria-labelledby="nhl-statistics-title">
      <p className="hl-eyebrow">Platform administration</p>
      <h2 id="nhl-statistics-title">NHL statistics</h2>
      <p>Update completed-game statistics for the current NHL season across all leagues.</p>
      <div className="hl-button-row">
        <button type="button" className="hl-button" disabled={pending} onClick={refresh}>
          {pending ? "Updating NHL statistics…" : "Refresh now"}
        </button>
      </div>
      <div role="status" aria-live="polite" aria-atomic="true">
        {pending && <p>This can take a few minutes. Keep this page open while the update finishes.</p>}
        {result && (
          <p className="hl-form-message is-success">
            NHL statistics updated for {result.playerCount.toLocaleString()} {result.playerCount === 1 ? "player" : "players"}.
            {" Latest capture: "}
            <time dateTime={new Date(result.capturedAtMs).toISOString()}>
              {new Date(result.capturedAtMs).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </time>
          </p>
        )}
      </div>
      {errorMessage && <p className="hl-form-message is-error" role="alert">{errorMessage}</p>}
    </Surface>
  );
}
