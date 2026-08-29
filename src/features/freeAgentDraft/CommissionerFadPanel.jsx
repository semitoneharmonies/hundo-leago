import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  ErrorBlock,
  LoadingBlock,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { createIdempotencyKey } from "../../shared/api/idempotency.js";
import { leagueDateTime } from "../../shared/hundoFormat.js";
import { useRealtime } from "../../shared/realtime/realtimeContext.js";
import { useSession } from "../session/sessionContext.js";
import { CommissionerFadRecovery } from "./CommissionerFadRecovery.jsx";
import { retryFreeAgentDraftReadiness } from "./freeAgentDraftApi.js";
import {
  freeAgentDraftKeys,
  freeAgentDraftReadinessQuery,
} from "./freeAgentDraftQueries.js";
import styles from "./FreeAgentDraftPage.module.css";

const RETRY_CONFIRMATION = "RETRY FREE AGENT DRAFT READINESS";
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function readableStatus(status) {
  return {
    not_triggered: "Not triggered",
    pending: "Pending automatic worker",
    running: "Opening check in progress",
    blocked: "Blocked",
    succeeded: "Succeeded",
  }[status] || "Unavailable";
}

function CommissionerFadPanelContent({ leagueId, seasonId, timeZone }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [confirming, setConfirming] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState("");
  const readinessOptions = seasonId
    ? freeAgentDraftReadinessQuery(session.httpClient, leagueId, seasonId)
    : {
        queryKey: ["league", leagueId, "free-agent-draft", "readiness-unavailable"],
        queryFn: () => Promise.resolve(null),
      };
  const readiness = useQuery({
    ...readinessOptions,
    enabled: session.status === "authenticated" && Boolean(seasonId),
  });
  const requestedFadId = searchParams.get("fadId");
  const requestedRecoveryId = searchParams.get("recoveryId");
  const [panelRequestedOpen, setPanelRequestedOpen] = useState(
    Boolean(requestedFadId || requestedRecoveryId)
  );
  const requestedFadValid = requestedFadId === null || UUID_V4.test(requestedFadId);
  const requestedRecoveryValid =
    requestedRecoveryId === null || UUID_V4.test(requestedRecoveryId);
  const recoveryFadId = requestedFadValid
    ? requestedFadId || readiness.data?.resultFadId || null
    : null;
  const panelOpen =
    panelRequestedOpen || readiness.data?.status === "blocked";
  const retry = useMutation({
    mutationFn: ({ data, version, idempotencyKey }) =>
      retryFreeAgentDraftReadiness(session.httpClient, leagueId, data, {
        version,
        idempotencyKey,
      }),
    onSuccess: async (result) => {
      setReceipt(result);
      setConfirming(false);
      setMessage(
        "The opening check was queued. Every requirement will be checked again."
      );
      await queryClient.invalidateQueries({
        queryKey: freeAgentDraftKeys.readiness(leagueId, seasonId),
      });
    },
    onError: async (error) => {
      setConfirming(false);
      setReceipt(null);
      if (
        error.status === 412 ||
        error.code === "FAD_READINESS_PRECONDITION_FAILED"
      ) {
        setMessage(
          "Readiness changed before this retry was accepted. The current state has been refreshed; review it before retrying."
        );
        await queryClient.invalidateQueries({
          queryKey: freeAgentDraftKeys.readiness(leagueId, seasonId),
        });
      } else {
        setMessage("");
      }
    },
  });

  function submitRetry() {
    if (!readiness.data?.operationId || !readiness.data.operationVersion) return;
    let idempotencyKey;
    try {
      idempotencyKey = createIdempotencyKey("fad-readiness-retry");
    } catch (error) {
      setMessage(error.message);
      setConfirming(false);
      return;
    }
    retry.mutate({
      data: {
        seasonId,
        readinessOperationId: readiness.data.operationId,
        confirmation: RETRY_CONFIRMATION,
      },
      version: readiness.data.operationVersion,
      idempotencyKey,
    });
  }

  return (
    <>
      <details
        className={styles.commissionerDisclosure}
        open={panelOpen}
        onToggle={(event) => setPanelRequestedOpen(event.currentTarget.open)}
      >
        <summary>
          <span>
            <strong>Free Agent Draft opening</strong>
            <small>Seasonal opening, team capacity, and recovery</small>
          </span>
          {readiness.data && (
            <StatusBadge
              tone={
                readiness.data.status === "succeeded"
                  ? "success"
                  : readiness.data.status === "blocked"
                    ? "warning"
                    : "neutral"
              }
            >
              {readableStatus(readiness.data.status)}
            </StatusBadge>
          )}
        </summary>
      <Surface
        className={styles.panel}
        as="section"
        aria-labelledby="commissioner-fad-readiness-title"
      >
      <div className={styles.panelHeader}>
        <div>
          <p className="hl-eyebrow">Free Agent Draft</p>
          <h2 id="commissioner-fad-readiness-title">
            Opening check
          </h2>
        </div>
      </div>

      {!seasonId ? (
        <p role="status">
          Set a current season before running the Free Agent Draft opening
          check.
        </p>
      ) : readiness.isPending ? (
        <LoadingBlock>Loading opening checks…</LoadingBlock>
      ) : readiness.isError ? (
        <ErrorBlock
          error={readiness.error}
          fallback="The Free Agent Draft opening check could not be loaded."
        />
      ) : (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span>Participating teams</span>
              <strong>{readiness.data.participatingTeamCount}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span>Candidate deadline</span>
              <strong>
                {leagueDateTime(
                  readiness.data.candidateDeadlineAtMs,
                  readiness.data.timeZone
                )}
              </strong>
            </div>
            <div className={styles.summaryCard}>
              <span>Projected Week 1</span>
              <strong>
                {leagueDateTime(
                  readiness.data.firstMatchupWeekAfter?.startsAtMs ?? null,
                  readiness.data.timeZone
                )}
              </strong>
            </div>
          </div>

          {readiness.data.firstMatchupWeekBefore &&
            readiness.data.firstMatchupWeekAfter &&
            readiness.data.firstMatchupWeekBefore.startsAtMs !==
              readiness.data.firstMatchupWeekAfter.startsAtMs && (
              <p className={styles.notice}>
                Week 1 will move from {leagueDateTime(
                  readiness.data.firstMatchupWeekBefore.startsAtMs,
                  readiness.data.timeZone
                )} to {leagueDateTime(
                  readiness.data.firstMatchupWeekAfter.startsAtMs,
                  readiness.data.timeZone
                )} so it starts on Monday.
              </p>
            )}

          {readiness.data.blockers.length > 0 && (
            <section aria-labelledby="fad-readiness-blockers-title">
              <h3 id="fad-readiness-blockers-title">Needs attention</h3>
              <ul className={styles.diagnostics}>
                {readiness.data.blockers.map((blocker) => (
                  <li key={`${blocker.code}:${blocker.resourceId || "league"}`}>
                    {blocker.message}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {readiness.data.warnings.length > 0 && (
            <section aria-labelledby="fad-readiness-warnings-title">
              <h3 id="fad-readiness-warnings-title">Things to review</h3>
              <ul className={styles.diagnostics}>
                {readiness.data.warnings.map((warning) => (
                  <li key={`${warning.code}:${warning.resourceId || "league"}`}>
                    {warning.message}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {readiness.data.teamProjections.length > 0 && (
            <section aria-labelledby="fad-readiness-teams-title">
              <h3 id="fad-readiness-teams-title">Participating teams</h3>
              <div className={styles.readinessTeams}>
                {readiness.data.teamProjections.map((team) => (
                  <div className={styles.readinessTeam} key={team.teamId}>
                    <strong>{team.team.name}</strong>
                    <span>{team.carryoverCount} carryovers</span>
                    <span>{team.openForwardSlots} F open</span>
                    <span>{team.openDefenceSlots} D open</span>
                    <span>{team.openBenchSlots} Bench open</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {readiness.data.resultFadId && (
            <p>
              <Link
                className="hl-button hl-button--secondary"
                to={routePaths.freeAgentDraft(
                  leagueId,
                  readiness.data.resultFadId
                )}
              >
                Open Free Agent Draft
              </Link>
            </p>
          )}

          {readiness.data.retryReadiness.allowed && !confirming && (
            <button
              type="button"
              className="hl-button hl-button--secondary"
              disabled={retry.isPending}
              onClick={() => {
                setMessage("");
                setConfirming(true);
              }}
            >
              Run opening check again
            </button>
          )}

          {confirming && (
            <div className={styles.pendingConfirmation} role="group" aria-label="Confirm readiness retry">
              <p>
                Run the opening check again using the league’s current teams,
                rosters, and schedule.
              </p>
              <div className={styles.readinessActions}>
                <button
                  type="button"
                  className="hl-button hl-button--primary"
                  disabled={retry.isPending}
                  onClick={submitRetry}
                >
                  {retry.isPending ? "Starting check…" : "Run opening check"}
                </button>
                <button
                  type="button"
                  className="hl-button hl-button--quiet"
                  disabled={retry.isPending}
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {message && (
            <p className={styles.notice} role="status">
              {message}
            </p>
          )}
          {receipt && (
            <p className={styles.success}>
              The opening check was queued.
            </p>
          )}
          {retry.error &&
            retry.error.status !== 412 &&
            retry.error.code !== "FAD_READINESS_PRECONDITION_FAILED" && (
              <ErrorBlock
                error={retry.error}
                fallback="The opening check could not be started again."
              />
            )}
        </>
      )}
      </Surface>
      </details>
      {(!requestedFadValid || !requestedRecoveryValid) && (
        <p className={styles.error} role="alert">
          This Free Agent Draft recovery link is invalid.
        </p>
      )}
      {recoveryFadId && requestedRecoveryValid && (
        <CommissionerFadRecovery
          leagueId={leagueId}
          fadId={recoveryFadId}
          requestedRecoveryId={requestedRecoveryId}
          timeZone={timeZone}
        />
      )}
    </>
  );
}

export function CommissionerFadPanel(props) {
  const realtime = useRealtime();
  if (realtime.status === "reauthorizing") {
    return (
      <Surface>
        <LoadingBlock>Refreshing secure Free Agent Draft access…</LoadingBlock>
      </Surface>
    );
  }
  return (
    <CommissionerFadPanelContent
      key={`${realtime.privacyEpoch}:${props.leagueId}:${props.seasonId || "no-season"}`}
      {...props}
    />
  );
}
