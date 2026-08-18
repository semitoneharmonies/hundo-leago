import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  ErrorBlock,
  LoadingBlock,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { leagueTeamsQuery } from "../leagues/leagueQueries.js";
import { CandidateSlot } from "./CandidateSlot.jsx";
import {
  publishedCandidateCardQuery,
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

const TEAM_WINS = new Set([
  "automatic_win",
  "restricted_win",
  "fallback_win",
]);

function managerResult(slot) {
  if (TEAM_WINS.has(slot.outcome?.code)) {
    return { code: "won", label: "Signed", tone: "success" };
  }
  if (slot.outcome?.code === "restricted_pending") {
    return { code: "tie", label: "Tie", tone: "warning" };
  }
  return { code: "not_won", label: "Not won", tone: "neutral" };
}

function SelectedTeamResults({
  fadId,
  httpClient,
  leagueId,
  managedTeamIds,
  summary,
}) {
  const [search, setSearch] = useState("");
  const history = useQuery(
    publishedCandidateCardQuery(httpClient, leagueId, fadId, summary.teamId)
  );

  if (history.isPending) {
    return <LoadingBlock>Loading {summary.team.name}&apos;s results…</LoadingBlock>;
  }
  if (history.isError) {
    return (
      <ErrorBlock
        error={history.error}
        fallback={`${summary.team.name}'s results could not be loaded.`}
      />
    );
  }

  const candidates = history.data.slots
    .filter((slot) => slot.occupantKind === "candidate" && slot.player)
    .map((slot) => ({ ...slot, result: managerResult(slot) }));
  const normalizedSearch = search.trim().toLocaleLowerCase("en-CA");
  const visible = candidates.filter((slot) =>
    normalizedSearch === "" ||
    slot.player.fullName.toLocaleLowerCase("en-CA").includes(normalizedSearch)
  );
  const totals = candidates.reduce(
    (counts, slot) => ({
      ...counts,
      [slot.result.code]: counts[slot.result.code] + 1,
    }),
    { won: 0, not_won: 0, tie: 0 }
  );
  const canAct = managedTeamIds.includes(summary.teamId);

  return (
    <div className={styles.selectedTeamResults}>
      <dl className={styles.teamResultTotals} aria-label={`${summary.team.name} result totals`}>
        <div><dt>Signed</dt><dd>{totals.won}</dd></div>
        <div><dt>Not won</dt><dd>{totals.not_won}</dd></div>
        <div><dt>Tied</dt><dd>{totals.tie}</dd></div>
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
        <Link
          className="hl-button hl-button--quiet"
          to={routePaths.draftFreeAgentCard(leagueId, fadId, summary.teamId)}
        >
          View original Candidate Card
        </Link>
      </div>
      {visible.length === 0 ? (
        <p>No players match this search.</p>
      ) : (
        <ul className={styles.teamResultList}>
          {visible.map((slot) => {
            const actionable =
              canAct &&
              slot.result.code === "tie" &&
              Boolean(slot.outcome?.auctionId);
            return (
              <li key={slot.entryId || slot.slotKey}>
                <div>
                  <strong>{slot.player.fullName}</strong>
                  <span>
                    {money(slot.aavCents)} AAV · {slot.termYears} {slot.termYears === 1 ? "year" : "years"}
                  </span>
                </div>
                <div className={styles.teamResultAction}>
                  <StatusBadge tone={slot.result.tone}>
                    {actionable ? "Tie — action required" : slot.result.label}
                  </StatusBadge>
                  {actionable && (
                    <Link
                      className="hl-button hl-button--secondary"
                      to={routePaths.leagueAuctionFocus(leagueId, slot.outcome.auctionId)}
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
    </div>
  );
}

export function PublishedCandidateCards({
  httpClient,
  leagueId,
  fadId,
  currentUserId,
}) {
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
  const [chosenTeamId, setChosenTeamId] = useState("");
  const selectedTeamId = summaries.some(({ teamId }) => teamId === chosenTeamId)
    ? chosenTeamId
    : summaries.some(({ teamId }) => teamId === defaultTeamId)
      ? defaultTeamId
      : summaries[0]?.teamId || "";
  const selectedSummary =
    summaries.find(({ teamId }) => teamId === selectedTeamId) || null;

  return (
    <Surface className={styles.panel} as="section" aria-labelledby="published-candidate-cards-title">
      <div className={styles.panelHeader}>
        <div>
          <h2 id="published-candidate-cards-title">Team results</h2>
        </div>
        {summaries.length > 0 && (
          <label className={styles.teamResultPicker}>
            Team
            <select
              value={selectedTeamId}
              onChange={(event) => setChosenTeamId(event.target.value)}
            >
              {summaries.map((summary) => (
                <option key={summary.teamId} value={summary.teamId}>
                  {summary.team.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {cards.isPending || teams.isPending ? (
        <LoadingBlock>Loading published Candidate Cards…</LoadingBlock>
      ) : cards.isError ? (
        <ErrorBlock error={cards.error} fallback="Published Candidate Cards could not be loaded." />
      ) : teams.isError ? (
        <ErrorBlock error={teams.error} fallback="Team management could not be confirmed." />
      ) : summaries.length === 0 ? (
        <p>No team results are available yet.</p>
      ) : (
        <>
          {selectedSummary && (
            <SelectedTeamResults
              fadId={fadId}
              httpClient={httpClient}
              leagueId={leagueId}
              managedTeamIds={managedTeamIds}
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

export function PublishedCandidateCardView({
  httpClient,
  leagueId,
  fadId,
  teamId,
  currentUserId,
}) {
  const history = useQuery(
    publishedCandidateCardQuery(httpClient, leagueId, fadId, teamId)
  );
  const teams = useQuery(leagueTeamsQuery(httpClient, leagueId));

  if (history.isPending || teams.isPending) {
    return <Surface><LoadingBlock>Loading published Candidate Card history and current team identity…</LoadingBlock></Surface>;
  }
  if (history.isError) {
    return <Surface><ErrorBlock error={history.error} fallback="Published Candidate Card history could not be loaded." /></Surface>;
  }
  if (teams.isError) {
    return <Surface><ErrorBlock error={teams.error} fallback="The current team identity for this Candidate Card could not be confirmed." /></Surface>;
  }

  const card = history.data;
  const cardTeam = teams.data.find((leagueTeam) => leagueTeam.id === card.teamId);
  if (!cardTeam) {
    return (
      <Surface>
        <p className="hl-form-message is-error" role="alert">
          This Candidate Card cannot be matched to a current authorized league team.
        </p>
      </Surface>
    );
  }
  const groups = [
    ["F", "Forwards"],
    ["D", "Defence"],
    ["B", "Bench"],
  ];
  const candidateSlots = card.slots.filter(
    (slot) => slot.occupantKind === "candidate" && slot.player
  );
  const managedByViewer = cardTeam.currentManager?.userId === currentUserId;
  return (
    <>
      <Surface className={styles.panel} as="section" aria-labelledby="published-card-history-title">
        <div className={styles.panelHeader}>
          <div>
            <p className="hl-eyebrow">{cardTeam.name}</p>
            <h2 id="published-card-history-title">Published Candidate Card</h2>
          </div>
          <StatusBadge>Original card</StatusBadge>
        </div>
        <p>Original offers and their final team results.</p>
      </Surface>
      <div className={styles.compactCard} aria-label="Published Candidate Card rows">
        <div className={styles.compactColumnHeader} aria-hidden="true">
          <span>Slot</span>
          <span>Player name</span>
          <span>Cost</span>
          <span>Term</span>
          <span>Total</span>
          <span>Result</span>
        </div>
        {groups.filter(([group]) =>
          candidateSlots.some((slot) => slot.slotGroup === group)
        ).map(([group, label]) => {
          const groupSlots = candidateSlots.filter((slot) => slot.slotGroup === group);
          return (
          <section
            className={styles.compactSlotGroup}
            aria-labelledby={`published-${group}-slots`}
            key={group}
          >
            <div className={styles.compactGroupHeading}>
              <h2 id={`published-${group}-slots`}>{label}</h2>
              <span>{groupSlots.length} requested</span>
            </div>
            {groupSlots.map((slot) => {
              const actionable =
                managedByViewer &&
                slot.outcome?.code === "restricted_pending" &&
                Boolean(slot.outcome.auctionId);
              return (
              <div className={styles.publishedCandidateRow} key={slot.slotKey}>
                <CandidateSlot
                  slot={slot}
                  published
                />
                {actionable && (
                  <div className={styles.publishedCandidateAction}>
                    <Link
                      className="hl-button hl-button--secondary"
                      to={routePaths.leagueAuctionFocus(leagueId, slot.outcome.auctionId)}
                    >
                      Place bid
                    </Link>
                  </div>
                )}
              </div>
              );
            })}
          </section>
          );
        })}
      </div>
    </>
  );
}
