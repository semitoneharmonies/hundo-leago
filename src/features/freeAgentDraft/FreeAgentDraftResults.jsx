import { useEffect, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  ErrorBlock,
  LoadingBlock,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { leagueTeamsQuery } from "../leagues/leagueQueries.js";
import { removeViewerSensitiveFadResultQueries } from "./freeAgentDraftCache.js";
import {
  freeAgentDraftResultsQuery,
  publishedCandidateCardsQuery,
} from "./freeAgentDraftQueries.js";
import styles from "./FreeAgentDraftPage.module.css";

function money(cents) {
  if (!Number.isSafeInteger(cents)) return "Not available";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

const RESULT_PRESENTATION = Object.freeze({
  signed: Object.freeze({ label: "Signed", tone: "success" }),
  not_won: Object.freeze({ label: "Not won", tone: "neutral" }),
  tied: Object.freeze({ label: "Tied", tone: "warning" }),
});

function SelectedTeamResults({
  fadId,
  httpClient,
  leagueId,
  summary,
}) {
  const [search, setSearch] = useState("");
  const results = useInfiniteQuery(
    freeAgentDraftResultsQuery(httpClient, leagueId, fadId, {
      teamId: summary.teamId,
      q: search,
      limit: 50,
    })
  );

  const visible = results.data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className={styles.selectedTeamResults}>
      <dl className={styles.teamResultTotals} aria-label={`${summary.team.name} result totals`}>
        <div><dt>Signed</dt><dd>{summary.outcomeCounts.signed}</dd></div>
        <div><dt>Not won</dt><dd>{summary.outcomeCounts.notWon}</dd></div>
        <div><dt>Tied</dt><dd>{summary.outcomeCounts.tied}</dd></div>
      </dl>
      <div className={styles.teamResultTools}>
        <label>
          Search players
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      {results.isPending ? (
        <LoadingBlock>Loading {summary.team.name}&apos;s results…</LoadingBlock>
      ) : results.isError ? (
        <ErrorBlock
          error={results.error}
          fallback={`${summary.team.name}'s results could not be loaded.`}
        />
      ) : visible.length === 0 ? (
        <p>
          {search.trim()
            ? "No players match this search."
            : "No final results are available for this team."}
        </p>
      ) : (
        <ul className={styles.teamResultList}>
          {visible.map((result) => {
            const presentation = RESULT_PRESENTATION[result.status];
            const actionable =
              result.status === "tied" &&
              result.offer !== null &&
              result.tieAuctionId !== null;
            return (
              <li key={result.player.playerId}>
                <div>
                  <strong>{result.player.fullName}</strong>
                  {result.offer !== null && (
                    <span>
                      {money(result.offer.aavCents)} AAV · {result.offer.termYears}{" "}
                      {result.offer.termYears === 1 ? "year" : "years"}
                    </span>
                  )}
                </div>
                <div className={styles.teamResultAction}>
                  <StatusBadge tone={presentation.tone}>
                    {actionable ? "Tie — action required" : presentation.label}
                  </StatusBadge>
                  {actionable && (
                    <Link
                      className="hl-button hl-button--secondary"
                      to={routePaths.leagueAuctionFocus(leagueId, result.tieAuctionId)}
                    >
                      Place bid
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!results.isPending && !results.isError && results.hasNextPage && (
        <button
          type="button"
          className="hl-button hl-button--secondary"
          disabled={results.isFetchingNextPage}
          onClick={() => results.fetchNextPage()}
        >
          {results.isFetchingNextPage ? "Loading more…" : "Load more players"}
        </button>
      )}
    </div>
  );
}

export function PublishedCandidateCards({
  httpClient,
  leagueId,
  fadId,
  currentUserId,
  onSelectedTeamIdChange,
}) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const cards = useInfiniteQuery(
    publishedCandidateCardsQuery(httpClient, leagueId, fadId)
  );
  const teams = useQuery(leagueTeamsQuery(httpClient, leagueId));
  const summaries = (cards.data?.pages.flatMap((page) => page.items) || [])
    .slice()
    .sort(
      (left, right) =>
        left.team.name.localeCompare(right.team.name, "en-CA") ||
        left.teamId.localeCompare(right.teamId)
    );
  const managedTeamIds = (teams.data || [])
    .filter(({ currentManager }) => currentManager?.userId === currentUserId)
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name, "en-CA") || left.id.localeCompare(right.id)
    )
    .map(({ id }) => id);
  const defaultTeamId = managedTeamIds.find((teamId) =>
    summaries.some((summary) => summary.teamId === teamId)
  ) || null;
  const [chosenTeamId, setChosenTeamId] = useState(
    () => searchParams.get("teamId") || ""
  );
  const [teamSelectionPending, setTeamSelectionPending] = useState(false);
  const selectedTeamId = summaries.some(({ teamId }) => teamId === chosenTeamId)
    ? chosenTeamId
    : summaries.some(({ teamId }) => teamId === defaultTeamId)
      ? defaultTeamId
      : summaries[0]?.teamId || "";
  const selectedSummary =
    summaries.find(({ teamId }) => teamId === selectedTeamId) || null;

  useEffect(() => {
    if (typeof onSelectedTeamIdChange === "function" && selectedSummary) {
      onSelectedTeamIdChange(selectedSummary.teamId);
    }
  }, [onSelectedTeamIdChange, selectedSummary]);

  return (
    <Surface className={styles.panel} as="section" aria-labelledby="published-candidate-cards-title">
      <div className={styles.panelHeader}>
        <div>
          <h2 id="published-candidate-cards-title">Team results</h2>
        </div>
      </div>
      {summaries.length > 0 && (
        <label className={styles.teamResultPicker}>
          Team
          <select
            value={selectedTeamId}
            disabled={teamSelectionPending}
            onChange={async (event) => {
              const nextTeamId = event.target.value;
              setTeamSelectionPending(true);
              try {
                await removeViewerSensitiveFadResultQueries(queryClient, {
                  leagueId,
                  fadId,
                  teamId: nextTeamId,
                });
                setChosenTeamId(nextTeamId);
                const nextParams = new URLSearchParams(searchParams);
                nextParams.set("teamId", nextTeamId);
                setSearchParams(nextParams, { replace: true });
              } finally {
                setTeamSelectionPending(false);
              }
            }}
          >
            {summaries.map((summary) => (
              <option key={summary.teamId} value={summary.teamId}>
                {summary.team.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {teamSelectionPending ? (
        <LoadingBlock>Refreshing selected team results…</LoadingBlock>
      ) : cards.isPending || teams.isPending ? (
        <LoadingBlock>Loading team results…</LoadingBlock>
      ) : cards.isError ? (
        <ErrorBlock error={cards.error} fallback="Team results could not be loaded." />
      ) : teams.isError ? (
        <ErrorBlock error={teams.error} fallback="Team management could not be confirmed." />
      ) : summaries.length === 0 ? (
        <p>No team results are available yet.</p>
      ) : (
        <>
          {selectedSummary && (
            <SelectedTeamResults
              key={selectedSummary.teamId}
              fadId={fadId}
              httpClient={httpClient}
              leagueId={leagueId}
              summary={selectedSummary}
            />
          )}
          {cards.hasNextPage && (
            <button
              type="button"
              className="hl-button hl-button--secondary"
              disabled={cards.isFetchingNextPage}
              onClick={() => cards.fetchNextPage()}
            >
              {cards.isFetchingNextPage ? "Loading more…" : "Load more teams"}
            </button>
          )}
        </>
      )}
    </Surface>
  );
}
