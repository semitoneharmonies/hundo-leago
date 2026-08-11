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
import { leagueDateTime } from "../../shared/hundoFormat.js";
import { leagueTeamsQuery } from "../leagues/leagueQueries.js";
import { CandidateSlot } from "./CandidateSlot.jsx";
import {
  freeAgentDraftResultsQuery,
  publishedCandidateCardQuery,
  publishedCandidateCardsQuery,
} from "./freeAgentDraftQueries.js";
import styles from "./FreeAgentDraftPage.module.css";

const RESULT_STATUSES = Object.freeze([
  ["", "All allocation states"],
  ["pending", "Pending"],
  ["automatic_award", "Automatic award"],
  ["restricted_scheduled", "Restricted auction scheduled"],
  ["restricted_active", "Restricted auction active"],
  ["restricted_fallback_open", "Fallback auction open"],
  ["restricted_resolved", "Restricted result resolved"],
  ["fallback_open_resolved", "Fallback result resolved"],
  ["no_valid_offer", "No valid offer"],
  ["invalid", "Invalid snapshot"],
  ["correction_required", "Correction required"],
]);

function money(cents) {
  if (!Number.isSafeInteger(cents)) return "Not available";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function statusLabel(status) {
  return RESULT_STATUSES.find(([value]) => value === status)?.[1] || "Unavailable";
}

function decisionLabel(code) {
  return {
    sole_valid_offer: "Only valid offer",
    highest_total: "Highest total contract value",
    highest_equal_total_aav: "Highest AAV among equal totals",
    exact_total_and_term_tie: "Exact total and term tie",
    no_valid_offer: "No valid offer",
    invalid_snapshot: "Invalid locked snapshot",
    candidate_card_structural_conflict: "Card-wide structural conflict",
    candidate_card_over_cap: "Card-wide cap exclusion",
    restricted_auction_result: "Restricted auction result",
    restricted_no_improvement_fallback: "Restricted auction moved to fallback",
    fallback_open_result: "Fallback auction result",
    fallback_open_no_winner: "Fallback closed without a winner",
    corrected: "Corrected from the locked snapshot",
  }[code] || "Decision not yet recorded";
}

function offerOutcomeLabel(code) {
  return {
    pending: "Pending — no rank assigned",
    winner: "Winner",
    lost_lower_total: "Lost on total contract value",
    lost_lower_aav: "Lost on equal-total AAV",
    restricted_tied: "Restricted tie participant",
    invalid: "Invalid offer",
  }[code] || "Outcome unavailable";
}

function fallbackExplanation(fallback) {
  if (fallback.status !== "no_winner") return null;
  if (fallback.noWinnerReason === "no_winner") {
    return "No eligible bid won. The player returned to the unclaimed pool and may be nominated again.";
  }
  if (fallback.noWinnerReason === "player_unavailable") {
    return "No winner was assigned because the player was no longer available.";
  }
  if (fallback.noWinnerReason === "season_closed") {
    return "No winner was assigned because the season was closed.";
  }
  return "No winner was assigned by the authoritative auction result.";
}

function AllocationResult({ result, teamNames, timeZone }) {
  const titleId = `fad-allocation-${result.allocationId}`;
  const pending = result.status === "pending";
  const winnerName = result.winner ? teamNames.get(result.winner.teamId) : null;
  return (
    <article className={styles.resultCard} aria-labelledby={titleId}>
      <div className={styles.panelHeader}>
        <div>
          <p className="hl-eyebrow">{result.player.positionGroup === "F" ? "Forward" : "Defence"}</p>
          <h3 id={titleId}>{result.player.fullName}</h3>
        </div>
        <StatusBadge tone={pending ? "warning" : result.status === "correction_required" ? "danger" : "neutral"}>
          {statusLabel(result.status)}
        </StatusBadge>
      </div>

      {pending ? (
        <p className={styles.pendingConfirmation} role="status">
          Allocation is pending. No decision, winner, rank, restricted result,
          fallback result, recovery status, resolution time, or draw has been
          inferred.
        </p>
      ) : (
        <p>
          Decision: <strong>{decisionLabel(result.decisionCode)}</strong>
          {result.resolvedAtMs !== null
            ? ` · ${leagueDateTime(result.resolvedAtMs, timeZone)}`
            : ""}
        </p>
      )}

      <div className={styles.offerList} aria-label={`${result.player.fullName} locked offers`}>
        {result.rankedOffers.map((offer) => (
          <div className={styles.offerRow} key={offer.snapshotEntryId}>
            <div>
              <strong>{offer.team.name}</strong>
              <span>{offer.slotKey}</span>
            </div>
            <span>{money(offer.totalValueCents)} total</span>
            <span>{offer.termYears} {offer.termYears === 1 ? "year" : "years"}</span>
            <span>{money(offer.aavCents)} AAV</span>
            <span>
              {pending || offer.rank === null ? "No rank" : `Rank ${offer.rank}`}
              {` · ${offerOutcomeLabel(offer.outcomeCode)}`}
            </span>
          </div>
        ))}
      </div>

      {result.winner && (
        <p className={styles.success}>
          Winner: <strong>{winnerName}</strong>. Winning contract: {money(result.winner.totalValueCents)} over {result.winner.termYears} {result.winner.termYears === 1 ? "year" : "years"} ({money(result.winner.aavCents)} AAV), assigned to {result.winner.slotKey}.
        </p>
      )}
      {result.restricted && (
        <p>
          Restricted path: <strong>{result.restricted.status.replaceAll("_", " ")}</strong>.
          Candidate values shown above are immutable minimums, not active bids or leaders.
        </p>
      )}
      {result.fallback && (
        <div className={styles.resultEvidence}>
          <p>
            Fallback path: <strong>{result.fallback.status.replaceAll("_", " ")}</strong>.
            {` The league-wide floor was ${money(result.fallback.minimumTotalValueCents)} total value.`}
          </p>
          {fallbackExplanation(result.fallback) && (
            <p className={styles.pendingConfirmation}>
              {fallbackExplanation(result.fallback)}
            </p>
          )}
        </div>
      )}
      {result.draws.length > 0 && (
        <details>
          <summary>Terminal draw evidence ({result.draws.length})</summary>
          <ul className={styles.diagnostics}>
            {result.draws.map((draw) => (
              <li key={draw.auctionId}>
                {draw.auctionType === "fad_restricted" ? "Restricted" : "Open rapid"} auction — {draw.drawReveal?.selectionUsed
                  ? `${teamNames.get(draw.drawReveal.selectedTeamId)} was selected by the committed equal-chance draw`
                  : draw.drawReveal
                    ? "no random selection was used because there was no exact top tie"
                    : "correction is required before the draw can be revealed"}.
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function PublishedCards({ httpClient, leagueId, fadId }) {
  const cards = useInfiniteQuery(
    publishedCandidateCardsQuery(httpClient, leagueId, fadId)
  );
  const summaries = cards.data?.pages.flatMap((page) => page.items) || [];

  return (
    <Surface className={styles.panel} as="section" aria-labelledby="published-candidate-cards-title">
      <div className={styles.panelHeader}>
        <div>
          <p className="hl-eyebrow">Immutable team history</p>
          <h2 id="published-candidate-cards-title">Published Candidate Cards</h2>
        </div>
        {!cards.isPending && !cards.isError && <StatusBadge>{summaries.length} loaded</StatusBadge>}
      </div>
      {cards.isPending ? (
        <LoadingBlock>Loading published Candidate Cards…</LoadingBlock>
      ) : cards.isError ? (
        <ErrorBlock error={cards.error} fallback="Published Candidate Cards could not be loaded." />
      ) : summaries.length === 0 ? (
        <p>No published Candidate Cards were returned.</p>
      ) : (
        <>
          <div className={styles.teamSelector}>
            {summaries.map((summary) => (
              <Link
                className={styles.teamChoice}
                key={summary.snapshotId}
                to={routePaths.freeAgentDraftCard(leagueId, fadId, summary.teamId)}
              >
                <strong>{summary.team.name}</strong>
                <span>{summary.counts.carryovers} carryovers · {summary.counts.candidates} requested candidates</span>
                <small>
                  {summary.outcomeCounts.automaticWins + summary.outcomeCounts.restrictedWins + summary.outcomeCounts.fallbackWins} wins · {summary.outcomeCounts.losses} losses
                </small>
              </Link>
            ))}
          </div>
          {cards.hasNextPage && (
            <button
              type="button"
              className="hl-button hl-button--secondary"
              disabled={cards.isFetchingNextPage}
              onClick={() => cards.fetchNextPage()}
            >
              {cards.isFetchingNextPage ? "Loading more…" : "Load more Candidate Cards"}
            </button>
          )}
        </>
      )}
    </Surface>
  );
}

export function FreeAgentDraftResultsContent({
  httpClient,
  leagueId,
  fadId,
  timeZone,
}) {
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [filters, setFilters] = useState({ q: "", status: null });
  const results = useInfiniteQuery(
    freeAgentDraftResultsQuery(httpClient, leagueId, fadId, filters)
  );
  const teams = useQuery(leagueTeamsQuery(httpClient, leagueId));
  const allocations = results.data?.pages.flatMap((page) => page.items) || [];
  const teamNames = new Map(
    (teams.data || []).map((leagueTeam) => [leagueTeam.id, leagueTeam.name])
  );
  const unresolvedTeamIdentity = allocations.some(
    (result) =>
      (result.winner !== null && !teamNames.has(result.winner.teamId)) ||
      result.draws.some(
        (draw) =>
          Boolean(draw.drawReveal?.selectedTeamId) &&
          !teamNames.has(draw.drawReveal.selectedTeamId)
      )
  );

  function applyFilters(event) {
    event.preventDefault();
    setFilters({
      q: searchInput,
      status: statusInput || null,
    });
  }

  return (
    <>
      <PublishedCards httpClient={httpClient} leagueId={leagueId} fadId={fadId} />
      <Surface className={styles.panel} as="section" aria-labelledby="allocation-results-title">
        <div className={styles.panelHeader}>
          <div>
            <p className="hl-eyebrow">Player-by-player result history</p>
            <h2 id="allocation-results-title">Allocation results</h2>
          </div>
          {!results.isPending && !results.isError && <StatusBadge>{allocations.length} loaded</StatusBadge>}
        </div>
        <form className={styles.resultFilters} aria-label="Filter allocation results" onSubmit={applyFilters}>
          <label>
            Search player name
            <input
              type="search"
              maxLength={200}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
          <label>
            Allocation status
            <select value={statusInput} onChange={(event) => setStatusInput(event.target.value)}>
              {RESULT_STATUSES.map(([value, label]) => (
                <option key={value || "all"} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="hl-button hl-button--secondary">
            Apply filters
          </button>
        </form>

        {results.isPending || teams.isPending ? (
          <LoadingBlock>Loading allocation results and current team identities…</LoadingBlock>
        ) : results.isError ? (
          <ErrorBlock error={results.error} fallback="Allocation results could not be loaded." />
        ) : teams.isError ? (
          <ErrorBlock
            error={teams.error}
            fallback="Current league team identities could not be confirmed. Results remain hidden."
          />
        ) : unresolvedTeamIdentity ? (
          <p className="hl-form-message is-error" role="alert">
            A winning team could not be resolved from the current authorized league team list. Results remain hidden.
          </p>
        ) : allocations.length === 0 ? (
          <p>No allocation results match these filters.</p>
        ) : (
          <div className={styles.resultList}>
            {allocations.map((result) => (
              <AllocationResult
                key={result.allocationId}
                result={result}
                teamNames={teamNames}
                timeZone={timeZone}
              />
            ))}
          </div>
        )}

        {results.hasNextPage && (
          <button
            type="button"
            className="hl-button hl-button--secondary"
            disabled={results.isFetchingNextPage}
            onClick={() => results.fetchNextPage()}
          >
            {results.isFetchingNextPage ? "Loading more…" : "Load more allocation results"}
          </button>
        )}
      </Surface>
    </>
  );
}

export function PublishedCandidateCardView({
  httpClient,
  leagueId,
  fadId,
  teamId,
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
  return (
    <>
      <Surface className={styles.panel} as="section" aria-labelledby="published-card-history-title">
        <div className={styles.panelHeader}>
          <div>
            <p className="hl-eyebrow">{cardTeam.name} · Immutable locked request</p>
            <h2 id="published-card-history-title">Published Candidate Card</h2>
          </div>
          <StatusBadge tone={card.allocationEligibility === "eligible" ? "success" : "warning"}>
            {card.allocationEligibility === "eligible" ? "Allocation eligible" : "Offers excluded"}
          </StatusBadge>
        </div>
        <p>
          This is the original 22-slot locked card. Later wins, losses, auctions,
          and corrections appear as outcomes without rewriting what the team requested.
        </p>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}><span>Maximum cap use</span><strong>{money(card.capProjection.maximumPossibleCapCents)}</strong></div>
          <div className={styles.summaryCard}><span>Carried cap use</span><strong>{money(card.capProjection.carriedCapUsageCents)}</strong></div>
          <div className={styles.summaryCard}><span>Missing mandatory</span><strong>{card.completeness.missingMandatoryCount}</strong></div>
          <div className={styles.summaryCard}><span>Commissioner interventions</span><strong>{card.commissionerInterventions.length}</strong></div>
        </div>
      </Surface>
      <div className={styles.slots}>
        {groups.map(([group, label]) => (
          <section className={styles.slotGroup} aria-labelledby={`published-${group}-slots`} key={group}>
            <h2 id={`published-${group}-slots`}>{label}</h2>
            <div className={styles.slotGrid}>
              {card.slots.filter((slot) => slot.slotGroup === group).map((slot) => (
                <CandidateSlot key={slot.slotKey} slot={slot} busy />
              ))}
            </div>
          </section>
        ))}
      </div>
      {card.commissionerInterventions.length > 0 && (
        <Surface className={styles.panel} as="section" aria-labelledby="published-interventions-title">
          <h2 id="published-interventions-title">Commissioner interventions</h2>
          <ul className={styles.diagnostics}>
            {card.commissionerInterventions.map((intervention) => (
              <li key={intervention.revisionId}>
                {intervention.actorDisplayName} — {intervention.action.replaceAll("_", " ")}
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </>
  );
}
