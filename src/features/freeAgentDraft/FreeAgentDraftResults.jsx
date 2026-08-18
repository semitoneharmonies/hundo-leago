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

function allocationOutcome(result) {
  if (result.status === "pending") return "Pending";
  if (result.winner) return "Obtained";
  if (result.status === "correction_required") return "Correction required";
  return "Not obtained";
}

function managerLabel(team) {
  return team.currentManager?.displayName || "No manager assigned";
}

function RestrictedTieParticipants({ participantTeamIds, teamDetails }) {
  return (
    <ul className={styles.restrictedParticipantList}>
      {participantTeamIds.map((teamId) => {
        const team = teamDetails.get(teamId);
        return (
          <li key={teamId}>
            <strong>{team.name}</strong>
            <span>Manager: {managerLabel(team)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function RestrictedTieSummary({ leagueId, result, teamDetails, compact = false }) {
  const restricted = result.restricted;
  if (!restricted || restricted.participantTeamIds.length === 0) return null;

  return (
    <div className={styles.restrictedTieSummary}>
      <div className={styles.restrictedTieHeader}>
        <div>
          <strong>{compact ? result.player.fullName : "Restricted Candidate tie"}</strong>
          <span>
            {money(restricted.minimumTotalValueCents)} over {restricted.minimumTermYears}{" "}
            {restricted.minimumTermYears === 1 ? "year" : "years"} ·{" "}
            {money(restricted.minimumAavCents)} AAV minimum
          </span>
        </div>
        <StatusBadge tone="warning">
          {restricted.status.replaceAll("_", " ")}
        </StatusBadge>
      </div>
      <p>
        Only the tied teams below may bid. Their Candidate Card offer is a
        minimum, not an active bid or current leader; a manager must improve it
        to contend.
      </p>
      <RestrictedTieParticipants
        participantTeamIds={restricted.participantTeamIds}
        teamDetails={teamDetails}
      />
      {restricted.auctionId && (
        <p className={styles.restrictedTieAction}>
          <Link
            className="hl-button hl-button--secondary"
            to={routePaths.auctionDetail(leagueId, restricted.auctionId)}
          >
            View restricted auction
          </Link>
        </p>
      )}
    </div>
  );
}

function AllocationResult({ leagueId, result, teamDetails }) {
  const titleId = `fad-allocation-${result.allocationId}`;
  const pending = result.status === "pending";
  const winnerName = result.winner
    ? teamDetails.get(result.winner.teamId)?.name
    : null;
  const otherOffers = result.winner
    ? result.rankedOffers.filter(
        (offer) => offer.snapshotEntryId !== result.winner.snapshotEntryId
      )
    : result.rankedOffers;
  const hasMoreDetail =
    otherOffers.length > 0 ||
    result.restricted !== null ||
    result.fallback !== null ||
    result.draws.length > 0;
  return (
    <article className={styles.resultCard} aria-labelledby={titleId}>
      <div className={styles.resultCardHeader}>
        <div className={styles.resultPlayer}>
          <h3 id={titleId}>{result.player.fullName}</h3>
          <span>{result.player.positionGroup === "F" ? "Forward" : "Defence"}</span>
        </div>
        <StatusBadge
          tone={
            pending
              ? "warning"
              : result.status === "correction_required"
                ? "danger"
                : result.winner
                  ? "success"
                  : "neutral"
          }
        >
          {statusLabel(result.status)}
        </StatusBadge>
      </div>

      <dl
        className={styles.resultSummary}
        aria-label={`${result.player.fullName} allocation summary`}
      >
        <div>
          <dt>Outcome</dt>
          <dd className={result.winner ? styles.resultObtained : undefined}>
            {allocationOutcome(result)}
          </dd>
        </div>
        {result.winner && (
          <>
            <div className={styles.resultWinningTeam}>
              <dt>Winning team</dt>
              <dd>{winnerName}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{money(result.winner.totalValueCents)}</dd>
            </div>
            <div>
              <dt>Term</dt>
              <dd>
                {result.winner.termYears}{" "}
                {result.winner.termYears === 1 ? "year" : "years"}
              </dd>
            </div>
            <div>
              <dt>AAV</dt>
              <dd>{money(result.winner.aavCents)}</dd>
            </div>
          </>
        )}
      </dl>

      {pending && (
        <p className={styles.pendingConfirmation} role="status">
          Allocation is pending. No winner or contract has been recorded.
        </p>
      )}

      <RestrictedTieSummary
        leagueId={leagueId}
        result={result}
        teamDetails={teamDetails}
      />

      {hasMoreDetail && (
        <details className={styles.resultDisclosure}>
          <summary>
            More allocation detail
            {otherOffers.length > 0
              ? ` · ${otherOffers.length} ${
                  result.winner ? "other" : "locked"
                } ${otherOffers.length === 1 ? "offer" : "offers"}`
              : ""}
          </summary>
          <div className={styles.resultEvidence}>
            {otherOffers.length > 0 && (
              <>
                <p className={styles.resultDetailLabel}>
                  {result.winner ? "Other locked offers" : "Locked offers"}
                </p>
                <div
                  className={styles.offerList}
                  aria-label={`${result.player.fullName} ${
                    result.winner ? "other locked offers" : "locked offers"
                  }`}
                >
                  {otherOffers.map((offer) => (
                    <div className={styles.offerRow} key={offer.snapshotEntryId}>
                      <strong>{offer.team.name}</strong>
                      <span>{money(offer.totalValueCents)} total</span>
                      <span>
                        {offer.termYears}{" "}
                        {offer.termYears === 1 ? "year" : "years"}
                      </span>
                      <span>{money(offer.aavCents)} AAV</span>
                      <span>
                        {pending || offer.rank === null ? "No rank" : `Rank ${offer.rank}`}
                        {` · ${offerOutcomeLabel(offer.outcomeCode)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {result.fallback && (
              <>
                <p>
                  Fallback path:{" "}
                  <strong>{result.fallback.status.replaceAll("_", " ")}</strong>.
                  {` The league-wide floor was ${money(
                    result.fallback.minimumTotalValueCents
                  )} total value.`}
                </p>
                {fallbackExplanation(result.fallback) && (
                  <p className={styles.pendingConfirmation}>
                    {fallbackExplanation(result.fallback)}
                  </p>
                )}
              </>
            )}
            {result.draws.length > 0 && (
              <>
                <p className={styles.resultDetailLabel}>
                  Terminal draw evidence ({result.draws.length})
                </p>
                <ul className={styles.diagnostics}>
                  {result.draws.map((draw) => (
                    <li key={draw.auctionId}>
                      {draw.auctionType === "fad_restricted"
                        ? "Restricted"
                        : "Open rapid"}{" "}
                      auction —{` `}
                      {draw.drawReveal?.selectionUsed
                        ? `${teamDetails.get(
                          draw.drawReveal.selectedTeamId
                          )?.name} was selected by the committed equal-chance draw`
                        : draw.drawReveal
                          ? "no random selection was used because there was no exact top tie"
                          : "correction is required before the draw can be revealed"}
                      .
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </details>
      )}
    </article>
  );
}

function outcomeCounts(summary) {
  return {
    obtained:
      summary.outcomeCounts.automaticWins +
      summary.outcomeCounts.restrictedWins +
      summary.outcomeCounts.fallbackWins,
    notObtained:
      summary.outcomeCounts.losses +
      summary.outcomeCounts.fallbackNoWinner +
      summary.outcomeCounts.invalidOffers,
    pending:
      summary.outcomeCounts.restrictedPending +
      summary.outcomeCounts.fallbackPending,
  };
}

export function PublishedCandidateCards({ httpClient, leagueId, fadId }) {
  const cards = useInfiniteQuery(
    publishedCandidateCardsQuery(httpClient, leagueId, fadId)
  );
  const summaries = cards.data?.pages.flatMap((page) => page.items) || [];
  const totals = summaries.reduce(
    (combined, summary) => {
      const counts = outcomeCounts(summary);
      return {
        obtained: combined.obtained + counts.obtained,
        notObtained: combined.notObtained + counts.notObtained,
        pending: combined.pending + counts.pending,
      };
    },
    { obtained: 0, notObtained: 0, pending: 0 }
  );

  return (
    <Surface className={styles.panel} as="section" aria-labelledby="published-candidate-cards-title">
      <div className={styles.panelHeader}>
        <div>
          <p className="hl-eyebrow">Immutable team history</p>
          <h2 id="published-candidate-cards-title">Published Candidate Cards</h2>
        </div>
        {!cards.isPending && !cards.isError && <StatusBadge>{summaries.length} teams</StatusBadge>}
      </div>
      {cards.isPending ? (
        <LoadingBlock>Loading published Candidate Cards…</LoadingBlock>
      ) : cards.isError ? (
        <ErrorBlock error={cards.error} fallback="Published Candidate Cards could not be loaded." />
      ) : summaries.length === 0 ? (
        <p>No published Candidate Cards were returned.</p>
      ) : (
        <>
          <p className={styles.compactOutcomeSummary}>
            <strong>{totals.obtained} obtained</strong>
            <span>{totals.notObtained} not obtained</span>
            {totals.pending > 0 && <span>{totals.pending} pending</span>}
          </p>
          <div className={styles.teamSelector}>
            {summaries.map((summary) => {
              const counts = outcomeCounts(summary);
              return (
                <Link
                  className={styles.teamChoice}
                  key={summary.snapshotId}
                  to={routePaths.draftFreeAgentCard(leagueId, fadId, summary.teamId)}
                >
                  <strong>{summary.team.name}</strong>
                  <span>{summary.counts.carryovers} carryovers · {summary.counts.candidates} requested candidates</span>
                  <small>
                    {counts.obtained} obtained · {counts.notObtained} not obtained
                    {counts.pending > 0 ? ` · ${counts.pending} pending` : ""}
                  </small>
                </Link>
              );
            })}
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

export function ActiveRestrictedTies({ httpClient, leagueId, fadId }) {
  const results = useInfiniteQuery(
    freeAgentDraftResultsQuery(httpClient, leagueId, fadId, {
      status: "restricted_active",
      limit: 100,
    })
  );
  const teams = useQuery(leagueTeamsQuery(httpClient, leagueId));
  const allocations = results.data?.pages.flatMap((page) => page.items) || [];
  const teamDetails = new Map(
    (teams.data || []).map((leagueTeam) => [leagueTeam.id, leagueTeam])
  );
  const unresolvedTeamIdentity = allocations.some((result) =>
    result.restricted?.participantTeamIds.some(
      (teamId) => !teamDetails.has(teamId)
    )
  );

  return (
    <Surface
      className={styles.panel}
      as="section"
      aria-labelledby="active-restricted-ties-title"
    >
      <div className={styles.panelHeader}>
        <div>
          <p className="hl-eyebrow">Candidate Card ties</p>
          <h2 id="active-restricted-ties-title">Active restricted ties</h2>
        </div>
        {!results.isPending && !results.isError && (
          <StatusBadge tone={allocations.length > 0 ? "warning" : "neutral"}>
            {allocations.length} active
          </StatusBadge>
        )}
      </div>
      <p>
        These players had an exact top Candidate Card tie. Only the listed
        teams and managers are eligible to bid in each restricted auction.
      </p>
      {results.isPending || teams.isPending ? (
        <LoadingBlock>Loading active ties and eligible managers…</LoadingBlock>
      ) : results.isError ? (
        <ErrorBlock
          error={results.error}
          fallback="Active restricted ties could not be loaded."
        />
      ) : teams.isError ? (
        <ErrorBlock
          error={teams.error}
          fallback="Current manager identities could not be confirmed. Active ties remain hidden."
        />
      ) : unresolvedTeamIdentity ? (
        <p className="hl-form-message is-error" role="alert">
          An eligible tied team could not be resolved from the current
          authorized league team list. Active ties remain hidden.
        </p>
      ) : allocations.length === 0 ? (
        <p>No restricted Candidate Card ties are active.</p>
      ) : (
        <div className={styles.restrictedTieList}>
          {allocations.map((result) => (
            <RestrictedTieSummary
              compact
              key={result.allocationId}
              leagueId={leagueId}
              result={result}
              teamDetails={teamDetails}
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
          {results.isFetchingNextPage ? "Loading more…" : "Load more active ties"}
        </button>
      )}
    </Surface>
  );
}

export function FreeAgentDraftAllocationResults({
  httpClient,
  leagueId,
  fadId,
}) {
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [filters, setFilters] = useState({ q: "", status: null });
  const results = useInfiniteQuery(
    freeAgentDraftResultsQuery(httpClient, leagueId, fadId, filters)
  );
  const teams = useQuery(leagueTeamsQuery(httpClient, leagueId));
  const allocations = results.data?.pages.flatMap((page) => page.items) || [];
  const teamDetails = new Map(
    (teams.data || []).map((leagueTeam) => [leagueTeam.id, leagueTeam])
  );
  const unresolvedTeamIdentity = allocations.some(
    (result) =>
      (result.winner !== null && !teamDetails.has(result.winner.teamId)) ||
      result.restricted?.participantTeamIds.some(
        (teamId) => !teamDetails.has(teamId)
      ) ||
      result.draws.some(
        (draw) =>
          Boolean(draw.drawReveal?.selectedTeamId) &&
          !teamDetails.has(draw.drawReveal.selectedTeamId)
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
                leagueId={leagueId}
                result={result}
                teamDetails={teamDetails}
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
  );
}

export function FreeAgentDraftResultsContent(props) {
  return (
    <>
      <PublishedCandidateCards
        httpClient={props.httpClient}
        leagueId={props.leagueId}
        fadId={props.fadId}
      />
      <FreeAgentDraftAllocationResults {...props} />
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
      <div className={styles.compactCard} aria-label="Published Candidate Card rows">
        <div className={styles.compactColumnHeader} aria-hidden="true">
          <span>Slot</span>
          <span>Player name</span>
          <span>Cost</span>
          <span>Term</span>
          <span>Result</span>
        </div>
        {groups.map(([group, label]) => (
          <section
            className={styles.compactSlotGroup}
            aria-labelledby={`published-${group}-slots`}
            key={group}
          >
            <div className={styles.compactGroupHeading}>
              <h2 id={`published-${group}-slots`}>{label}</h2>
              <span>
                {group === "F" ? "12 rows" : group === "D" ? "6 rows" : "4 rows"}
              </span>
            </div>
            {card.slots
              .filter((slot) => slot.slotGroup === group)
              .map((slot) => (
                <CandidateSlot
                  key={slot.slotKey}
                  slot={slot}
                  published
                />
              ))}
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
