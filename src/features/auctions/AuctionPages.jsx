import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { createIdempotencyKey } from "../../shared/api/idempotency.js";
import { hasCommissionerAuthority } from "../../shared/leagueAuthority.js";
import {
  leagueDateTime,
  money,
  shortLeagueDateTime,
} from "../../shared/hundoFormat.js";
import { useRealtime } from "../../shared/realtime/realtimeContext.js";
import { visibleLeaguesQuery } from "../leagues/leagueQueries.js";
import {
  leaguePlayerDetailQuery,
  playerKeys,
  playerSearchQuery,
} from "../players/playerQueries.js";
import { useSession } from "../session/sessionContext.js";
import {
  cancelAuctionAsCommissioner,
  editAuctionBidAsCommissioner,
  putMyAuctionBid,
  removeAuctionBidAsCommissioner,
  requestAuctionResolutionAsCommissioner,
  startAuction,
} from "./auctionApi.js";
import {
  auctionDetailQuery,
  auctionKeys,
  auctionListQuery,
} from "./auctionQueries.js";
import {
  auctionTotalPreview,
  capabilityMessage,
  initialAuctionOffer,
  sourceLabel,
  validateAuctionOffer,
} from "./auctionUi.js";
import styles from "./AuctionPages.module.css";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const EMPTY_ID = "00000000-0000-4000-8000-000000000000";

function useAuctionLeagueContext(leagueId) {
  const session = useSession();
  const leagues = useQuery({
    ...visibleLeaguesQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  const league = leagues.data?.find(({ id }) => id === leagueId) || null;
  return { session, leagues, league };
}

function useAuctionPrivacyGate(leagueId) {
  const queryClient = useQueryClient();
  const realtime = useRealtime();
  const privacyKey = realtime.status === "reauthorizing"
    ? null
    : `${realtime.privacyEpoch}:${leagueId}`;
  const [authorizedPrivacyKey, setAuthorizedPrivacyKey] = useState(privacyKey);

  useEffect(() => {
    if (authorizedPrivacyKey === privacyKey) return undefined;
    let active = true;
    const predicate = (query) =>
      query.meta?.private === true &&
      query.meta?.leagueId === leagueId &&
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === "league" &&
      query.queryKey[1] === leagueId &&
      query.queryKey[2] === "auctions";
    const reauthorize = async () => {
      await queryClient.cancelQueries({ predicate });
      queryClient.removeQueries({ predicate });
      if (active) setAuthorizedPrivacyKey(privacyKey);
    };
    void reauthorize();
    return () => {
      active = false;
    };
  }, [authorizedPrivacyKey, leagueId, privacyKey, queryClient]);

  return Object.freeze({
    key: privacyKey,
    ready: privacyKey !== null && authorizedPrivacyKey === privacyKey,
  });
}

function AuctionGate({ context, title, children }) {
  if (context.session.status === "unauthenticated") {
    return (
      <Navigate
        to={routePaths.home}
        replace
        state={{ reason: "sign-in" }}
      />
    );
  }
  if (context.session.status === "unknown" || context.leagues.isPending) {
    return (
      <main className="hl-page">
        <Surface>
          <LoadingBlock>Checking secure league access…</LoadingBlock>
        </Surface>
      </main>
    );
  }
  if (context.leagues.isError) {
    return (
      <main className="hl-page">
        <Surface>
          <ErrorBlock
            error={context.leagues.error}
            fallback="League access could not be confirmed."
          />
        </Surface>
      </main>
    );
  }
  if (!context.league) {
    return (
      <main className="hl-page">
        <PageHeading eyebrow="Auctions" title={title} />
        <p className="hl-form-message is-error" role="alert">
          This league is not in your current active memberships.
        </p>
      </main>
    );
  }
  return (
    <main
      className={`hl-page hl-page--wide ${styles.page}`}
      aria-labelledby="auction-page-title"
    >
      {children}
    </main>
  );
}

function statusLabel(status) {
  return {
    active: "Active",
    resolved: "Resolved",
    no_winner: "No winner",
    cancelled: "Cancelled",
    correction_required: "Correction required",
  }[status] || status;
}

function statusTone(status) {
  if (status === "resolved") return "success";
  if (status === "correction_required") return "danger";
  return status === "active" ? "warning" : "neutral";
}

function teamName(team) {
  return team?.name || "Team";
}

function safeAuctionSearch(value) {
  if (typeof value !== "string" || Array.from(value).length > 200) return "";
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return (
      codePoint <= 31 ||
      (codePoint >= 127 && codePoint <= 159) ||
      codePoint === 8_232 ||
      codePoint === 8_233
    );
  })
    ? ""
    : value;
}

function FormFeedback({ error, fallback, id, message, focusKey }) {
  const feedbackRef = useRef(null);
  useEffect(() => {
    if ((error || message) && feedbackRef.current) {
      feedbackRef.current.focus();
    }
  }, [error, focusKey, message]);
  if (error) {
    return (
      <ErrorBlock
        elementRef={feedbackRef}
        error={error}
        fallback={error.message || fallback}
        id={id}
        tabIndex={-1}
      />
    );
  }
  if (message) {
    return (
      <p
        className={styles.success}
        id={id}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        ref={feedbackRef}
      >
        {message}
      </p>
    );
  }
  return null;
}

function TotalContractPreview({ aav, describedBy, term }) {
  const total = auctionTotalPreview(aav, term);
  return (
    <label className={styles.calculatedField}>
      Total contract value (calculated)
      <output
        aria-describedby={describedBy}
        aria-label="Total contract value"
      >
        {total ? `$${total}` : "—"}
      </output>
    </label>
  );
}

function PlayerCombobox({
  client,
  describedBy,
  leagueId,
  playerSearch,
  selectedPlayer,
  setPlayerSearch,
  setSelectedPlayer,
}) {
  const listboxId = useId();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const players = useQuery({
    ...playerSearchQuery(client, {
      query: playerSearch,
      status: "active",
      limit: 12,
      leagueId,
      auctionEligible: true,
    }),
    enabled: playerSearch.trim().length > 0,
  });
  const suggestions = players.data?.players || [];
  const currentActiveIndex = activeIndex < suggestions.length ? activeIndex : -1;

  function choose(player) {
    setSelectedPlayer(player);
    setPlayerSearch(player.fullName);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (suggestions.length === 0) return;
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        if (current < 0) return direction > 0 ? 0 : suggestions.length - 1;
        return (current + direction + suggestions.length) % suggestions.length;
      });
      return;
    }
    if (event.key === "Enter" && open) {
      const index = currentActiveIndex >= 0
        ? currentActiveIndex
        : suggestions.length === 1
          ? 0
          : -1;
      if (index >= 0) {
        event.preventDefault();
        choose(suggestions[index]);
      }
    }
  }

  return (
    <div className={styles.playerPicker}>
      <label htmlFor={inputId}>Player</label>
      <input
        id={inputId}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-describedby={describedBy}
        aria-expanded={open && playerSearch.trim().length > 0}
        aria-activedescendant={
          open && currentActiveIndex >= 0
            ? `${listboxId}-option-${currentActiveIndex}`
            : undefined
        }
        autoComplete="off"
        required
        value={playerSearch}
        onChange={(event) => {
          setPlayerSearch(event.target.value);
          setSelectedPlayer(null);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && playerSearch.trim().length > 0 && (
        <div
          className={styles.suggestions}
          id={listboxId}
          role="listbox"
          aria-label="Available players"
        >
          {players.isPending ? (
            <span role="status">Searching available players…</span>
          ) : players.isError ? (
            <ErrorBlock
              error={players.error}
              fallback="Available players could not be searched."
              impact="You cannot select a player for this auction yet."
              recovery="Check the player name and try again."
            />
          ) : suggestions.length === 0 ? (
            <span>No searchable available players match that search.</span>
          ) : (
            suggestions.map((player, index) => (
              <button
                id={`${listboxId}-option-${index}`}
                key={player.id}
                type="button"
                role="option"
                aria-selected={selectedPlayer?.id === player.id}
                className={index === currentActiveIndex ? styles.activeSuggestion : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(player)}
              >
                <strong>{player.fullName}</strong>
                <span>
                  {[
                    player.provider?.normalizedPosition,
                    player.provider?.nhlTeamAbbreviation,
                  ].filter(Boolean).join(" · ") || "Available player"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StartAuctionPanel({ context, leagueId, startTeams }) {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [teamId, setTeamId] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [aav, setAav] = useState("1.00");
  const [term, setTerm] = useState("1");
  const [clientError, setClientError] = useState(null);
  const [prefillConsumed, setPrefillConsumed] = useState(false);
  const feedbackId = useId();
  const prefilledPlayerId = searchParams.get("playerId");
  const validPrefill = UUID_V4.test(prefilledPlayerId || "");
  const prefilledPlayer = useQuery({
    ...leaguePlayerDetailQuery(
      context.session.httpClient,
      leagueId,
      validPrefill ? prefilledPlayerId : EMPTY_ID
    ),
    enabled:
      context.session.status === "authenticated" &&
      Boolean(context.league) &&
      validPrefill &&
      !prefillConsumed,
  });
  const selectedStartTeam =
    startTeams.find((team) => team.teamId === teamId) || startTeams[0] || null;
  const isFad = selectedStartTeam?.sourceKind === "fad_open_rapid";
  const mutation = useMutation({
    gcTime: 0,
    mutationFn: ({ body, idempotencyKey }) =>
      startAuction(context.session.httpClient, leagueId, body, {
        idempotencyKey,
      }),
    onSuccess: async (result) => {
      if (result.kind === "auction_opened") {
        queryClient.setQueryData(
          auctionKeys.detail(leagueId, result.auction.auctionId),
          result.auction
        );
      }
      setPlayerSearch("");
      setSelectedPlayer(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: auctionKeys.root(leagueId) }),
        queryClient.invalidateQueries({ queryKey: playerKeys.searches }),
        queryClient.invalidateQueries({
          queryKey: ["league", leagueId, "free-agent-draft"],
        }),
      ]);
    },
  });

  useEffect(() => {
    if (!prefilledPlayer.data || prefillConsumed) return;
    setPrefillConsumed(true);
    if (prefilledPlayer.data.league.ownership) {
      setClientError(new Error("That player is already assigned in this league."));
      return;
    }
    setSelectedPlayer(prefilledPlayer.data);
    setPlayerSearch(prefilledPlayer.data.fullName);
  }, [prefillConsumed, prefilledPlayer.data]);

  useEffect(() => {
    if (
      startTeams.length > 0 &&
      !startTeams.some((team) => team.teamId === teamId)
    ) {
      setTeamId(startTeams[0].teamId);
    }
  }, [startTeams, teamId]);

  function submit(event) {
    event.preventDefault();
    try {
      if (!selectedStartTeam?.startAuction.allowed) {
        throw new Error(
          capabilityMessage(selectedStartTeam?.startAuction.reasonCode)
        );
      }
      if (!selectedPlayer || selectedPlayer.fullName !== playerSearch) {
        throw new Error("Select a player from the available search results.");
      }
      const offer = validateAuctionOffer(aav, term, { action: "start" });
      const body = {
        teamId: selectedStartTeam.teamId,
        playerId: selectedPlayer.id,
        aavCents: offer.aavCents,
        termYears: offer.termYears,
      };
      setClientError(null);
      mutation.mutate({
        body,
        idempotencyKey: createIdempotencyKey("auction-start"),
      });
    } catch (error) {
      setClientError(error);
    }
  }

  const result = mutation.data;
  const openedAuctionId = result?.kind === "auction_opened"
    ? result.auction.auctionId
    : result?.auction?.id || null;
  const queued = result?.kind === "nomination_queued"
    ? result.queuedNomination
    : null;
  const successMessage = queued
    ? `${queued.player.fullName} is queued for ${teamName(
        selectedStartTeam?.team
      )} at ${money(queued.aavCents)} AAV for ${queued.termYears} ${queued.termYears === 1 ? "year" : "years"}.`
    : openedAuctionId
      ? "The auction and your opening bid were accepted."
      : null;

  return (
    <Surface className={styles.panel} aria-labelledby="start-auction-title">
      <div className={styles.panelHeader}>
        <div>
          <h2 id="start-auction-title">Start an auction</h2>
        </div>
      </div>
      {startTeams.length === 0 ? (
        <p>Nominations aren&apos;t available for your teams right now.</p>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.formGrid}>
            {startTeams.length > 1 && (
              <label>
                Team
                <select
                  aria-describedby={feedbackId}
                  value={selectedStartTeam?.teamId || ""}
                  onChange={(event) => {
                    setTeamId(event.target.value);
                    setClientError(null);
                    mutation.reset();
                  }}
                >
                  {startTeams.map((team) => (
                    <option key={team.teamId} value={team.teamId}>
                      {teamName(team.team)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <PlayerCombobox
              client={context.session.httpClient}
              describedBy={feedbackId}
              leagueId={leagueId}
              playerSearch={playerSearch}
              selectedPlayer={selectedPlayer}
              setPlayerSearch={(value) => {
                setPlayerSearch(value);
                setClientError(null);
                mutation.reset();
              }}
              setSelectedPlayer={setSelectedPlayer}
            />
            <label>
              AAV (dollars per year)
              <input
                aria-describedby={feedbackId}
                type="number"
                inputMode="decimal"
                min="1.00"
                step="0.25"
                required
                value={aav}
                onChange={(event) => {
                  setAav(event.target.value);
                  setClientError(null);
                  mutation.reset();
                }}
              />
            </label>
            <label>
              Contract term
              <select
                aria-describedby={feedbackId}
                value={term}
                onChange={(event) => {
                  setTerm(event.target.value);
                  setClientError(null);
                  mutation.reset();
                }}
              >
                <option value="1">1 year</option>
                <option value="2">2 years</option>
                <option value="3">3 years</option>
              </select>
            </label>
            <TotalContractPreview
              aav={aav}
              describedBy={feedbackId}
              term={term}
            />
          </div>
          {selectedStartTeam?.sourceKind === "fad_open_rapid" && (
            <p className={styles.timingNotice}>
              Next rollover: {shortLeagueDateTime(
                selectedStartTeam.targetRolloverAtMs,
                context.league.timezone
              )}
            </p>
          )}
          {!selectedStartTeam?.startAuction.allowed && (
            <p className={styles.denied}>
              {capabilityMessage(selectedStartTeam?.startAuction.reasonCode)}
            </p>
          )}
          <div className={styles.actions}>
            <button
              className="hl-button hl-button--primary"
              disabled={
                mutation.isPending ||
                !selectedPlayer ||
                !selectedStartTeam?.startAuction.allowed
              }
            >
              {mutation.isPending
                ? "Submitting…"
                : isFad
                  ? "Nominate player"
                  : "Start auction"}
            </button>
            {openedAuctionId && (
              <Link
                className="hl-button hl-button--secondary"
                to={routePaths.auctionDetail(leagueId, openedAuctionId)}
              >
                View auction
              </Link>
            )}
          </div>
          <FormFeedback
            error={clientError || prefilledPlayer.error || mutation.error}
            id={feedbackId}
            message={successMessage}
            focusKey={result || mutation.error || clientError}
          />
        </form>
      )}
    </Surface>
  );
}

function MinimumNotice({ auction }) {
  if (auction.minimumContract === null) return null;
  return (
    <div className={styles.minimumNotice}>
      <strong>Minimum offer</strong>
      <span>
        {money(auction.minimumContract.totalValueCents)} over {auction.minimumContract.termYears} {auction.minimumContract.termYears === 1 ? "year" : "years"} · {money(auction.minimumContract.aavCents)} AAV
      </span>
    </div>
  );
}

function AuctionTiming({ auction, timeZone }) {
  const target = auction.sourceKind === "ordinary_weekly"
    ? auction.resolvesAtMs
    : auction.targetRolloverAtMs;
  return (
    <p className={styles.compactTiming}>
      {auction.status === "active" ? "Closes" : "Closed"} {shortLeagueDateTime(target, timeZone)}
    </p>
  );
}

function OwnBidSummary({ compact = false, viewerTeam, timeZone }) {
  if (!viewerTeam.bid) {
    return <p>No bid from this managed team.</p>;
  }
  const bid = viewerTeam.bid;
  if (compact) {
    return (
      <p className={styles.compactOwnBid}>
        <strong>Your bid for {teamName(viewerTeam.team)}:</strong>{" "}
        {money(bid.aavCents)} AAV · {bid.termYears}{" "}
        {bid.termYears === 1 ? "year" : "years"} · {money(bid.totalValueCents)} total
      </p>
    );
  }
  return (
    <div className={styles.ownBid}>
      <strong>Your sealed bid for {teamName(viewerTeam.team)}</strong>
      <dl className={styles.bidGrid}>
        <div><dt>Total</dt><dd>{money(bid.totalValueCents)}</dd></div>
        <div><dt>Term</dt><dd>{bid.termYears} {bid.termYears === 1 ? "year" : "years"}</dd></div>
        <div><dt>AAV</dt><dd>{money(bid.aavCents)}</dd></div>
        <div><dt>Status</dt><dd>{statusLabel(bid.status)}</dd></div>
        <div><dt>Manager edits remaining</dt><dd>{Math.max(0, bid.editLimit - bid.editCount)}</dd></div>
        <div><dt>Recorded cooldown end</dt><dd>{leagueDateTime(bid.cooldownEndsAtMs, timeZone)}</dd></div>
      </dl>
    </div>
  );
}

function TerminalSummary({ auction }) {
  if (auction.status === "active") return null;
  if (auction.status === "resolved") {
    return (
      <p>
        Won by <strong>{teamName(auction.result.winningTeam)}</strong> at a final
        contract value of {money(auction.result.finalContractValueCents)}.
      </p>
    );
  }
  if (auction.status === "no_winner" && auction.sourceKind === "fad_restricted") {
    return (
      <p>
        No eligible improvement was placed. The player moves to an open
        auction for the league.
      </p>
    );
  }
  if (auction.status === "no_winner" && auction.sourceKind === "fad_open_rapid") {
    return (
      <p>
        No eligible bid won. The player returned to the unclaimed pool and may
        be nominated again.
      </p>
    );
  }
  if (auction.status === "correction_required") {
    return <p>This auction needs commissioner review.</p>;
  }
  return <p>This auction ended without assigning the player.</p>;
}

function AuctionCard({ auction, context, focused, leagueId, timeZone }) {
  const ownBids = auction.viewerTeams.filter((viewerTeam) => viewerTeam.bid !== null);
  const eligibleTeams = auction.viewerTeams.filter((viewerTeam) => viewerTeam.eligible);
  const restricted = auction.sourceKind === "fad_restricted";
  const actionRequired = restricted && auction.status === "active" && eligibleTeams.length > 0;
  return (
    <article
      className={`${styles.card} ${focused ? styles.focusedCard : ""}`}
      aria-labelledby={`auction-title-${auction.auctionId}`}
      id={`auction-${auction.auctionId}`}
    >
      <div className={styles.cardHeader}>
        <div>
          <p className="hl-eyebrow">{actionRequired ? "Action required" : sourceLabel(auction)}</p>
          <h2 id={`auction-title-${auction.auctionId}`}>
            {restricted ? auction.player.fullName : (
              <Link to={routePaths.auctionDetail(leagueId, auction.auctionId)}>
                {auction.player.fullName}
              </Link>
            )}
          </h2>
          <span>{auction.player.positionGroup}</span>
        </div>
        <StatusBadge tone={actionRequired ? "warning" : statusTone(auction.status)}>
          {actionRequired ? "Tie — bid needed" : statusLabel(auction.status)}
        </StatusBadge>
      </div>
      <AuctionTiming auction={auction} timeZone={timeZone} />
      <MinimumNotice auction={auction} />
      {!restricted && ownBids.map((viewerTeam) => (
        <OwnBidSummary
          compact
          key={viewerTeam.teamId}
          viewerTeam={viewerTeam}
          timeZone={timeZone}
        />
      ))}
      {actionRequired && eligibleTeams.map((viewerTeam) => (
        <div className={styles.inlineBid} key={viewerTeam.teamId}>
          {eligibleTeams.length > 1 && <h3>{teamName(viewerTeam.team)}</h3>}
          <BidEditor
            auction={auction}
            context={context}
            leagueId={leagueId}
            viewerTeam={viewerTeam}
          />
        </div>
      ))}
      <TerminalSummary auction={auction} />
      {!restricted && (
        <Link
          className="hl-text-link"
          to={routePaths.auctionDetail(leagueId, auction.auctionId)}
        >
          View auction details
        </Link>
      )}
    </article>
  );
}

function AuctionFilters({
  appliedSearch,
  onApplySearch,
  search,
  setSearch,
}) {
  return (
    <Surface className={styles.filters} aria-labelledby="auction-filters-title">
      <h2 id="auction-filters-title">Active auctions</h2>
      <form
        className={styles.searchFilter}
        onSubmit={(event) => {
          event.preventDefault();
          onApplySearch(search);
        }}
      >
        <label>
          Search players
          <input
            maxLength={200}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button className="hl-button hl-button--secondary">Search</button>
      </form>
      {appliedSearch && <p>Showing player matches for “{appliedSearch}”.</p>}
    </Surface>
  );
}

function AuctionsPrivateContent({ context, leagueId }) {
  const [searchParams] = useSearchParams();
  const linkedFadId = UUID_V4.test(searchParams.get("fadId") || "")
    ? searchParams.get("fadId")
    : null;
  const focusedAuctionId = UUID_V4.test(searchParams.get("auctionId") || "")
    ? searchParams.get("auctionId")
    : null;
  const initialSearch = safeAuctionSearch(searchParams.get("q") || "");
  const [search, setSearch] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const safeLeagueId = UUID_V4.test(leagueId || "") ? leagueId : EMPTY_ID;
  const filters = useMemo(
    () => ({
      sourceKind: null,
      fadId: linkedFadId,
      q: appliedSearch,
      limit: 25,
    }),
    [appliedSearch, linkedFadId]
  );
  const auctions = useInfiniteQuery({
    ...auctionListQuery(context.session.httpClient, safeLeagueId, filters),
    enabled:
      context.session.status === "authenticated" && Boolean(context.league),
  });
  const items = useMemo(
    () => (auctions.data?.pages.flatMap((page) => page.items) || []).filter(
      (auction) =>
        auction.sourceKind !== "fad_restricted" ||
        auction.viewerTeams.some((viewerTeam) => viewerTeam.eligible)
    ),
    [auctions.data]
  );
  const startTeams = auctions.data?.pages[0]?.actions.startTeams || [];

  useEffect(() => {
    if (!focusedAuctionId || !items.some(({ auctionId }) => auctionId === focusedAuctionId)) {
      return;
    }
    globalThis.document
      .getElementById(`auction-${focusedAuctionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusedAuctionId, items]);

  return (
    <>
      <PageHeading
        eyebrow={context.league?.name}
        title="Auctions"
        id="auction-page-title"
      />
      {auctions.isPending ? (
        <Surface>
          <LoadingBlock>Loading auctions and team actions…</LoadingBlock>
        </Surface>
      ) : auctions.isError ? (
        <Surface>
          <ErrorBlock
            error={auctions.error}
            fallback="Auctions could not be loaded."
          />
        </Surface>
      ) : (
        <>
          <StartAuctionPanel
            context={context}
            leagueId={leagueId}
            startTeams={startTeams}
          />
          <AuctionFilters
            appliedSearch={appliedSearch}
            onApplySearch={setAppliedSearch}
            search={search}
            setSearch={setSearch}
          />
          {items.length === 0 ? (
            <Surface>
              <EmptyBlock title="No active auctions">
                There are no auctions that need your attention.
              </EmptyBlock>
            </Surface>
          ) : (
            <section className={styles.cardGrid} aria-label="Active auctions">
              {items.map((auction) => (
                <AuctionCard
                  auction={auction}
                  context={context}
                  focused={auction.auctionId === focusedAuctionId}
                  key={auction.auctionId}
                  leagueId={leagueId}
                  timeZone={context.league.timezone}
                />
              ))}
            </section>
          )}
          {auctions.hasNextPage && (
            <div className={styles.loadMore}>
              <button
                className="hl-button hl-button--secondary"
                disabled={auctions.isFetchingNextPage}
                onClick={() => auctions.fetchNextPage()}
              >
                {auctions.isFetchingNextPage ? "Loading…" : "Load more auctions"}
              </button>
            </div>
          )}
        </>
      )}
      <p className="hl-page-backlink">
        <Link to={routePaths.league(leagueId)}>Back to dashboard</Link>
      </p>
    </>
  );
}

export function AuctionsPage() {
  const { leagueId } = useParams();
  const context = useAuctionLeagueContext(leagueId);
  const privacy = useAuctionPrivacyGate(leagueId);
  return (
    <AuctionGate context={context} title="Auctions">
      {!privacy.ready ? (
        <Surface>
          <LoadingBlock>Reauthorizing private auction access...</LoadingBlock>
        </Surface>
      ) : (
        <AuctionsPrivateContent
          context={context}
          key={privacy.key}
          leagueId={leagueId}
        />
      )}
    </AuctionGate>
  );
}

function BidEditor({ auction, context, leagueId, viewerTeam }) {
  const queryClient = useQueryClient();
  const initial = initialAuctionOffer(auction, viewerTeam);
  const [aav, setAav] = useState(initial.aav);
  const [term, setTerm] = useState(initial.term);
  const [clientError, setClientError] = useState(null);
  const [conflictMessage, setConflictMessage] = useState(null);
  const feedbackId = useId();
  const hasBid = viewerTeam.bid !== null;
  const capability = hasBid ? viewerTeam.edit : viewerTeam.join;
  const action = hasBid ? "edit" : "join";
  const mutation = useMutation({
    gcTime: 0,
    mutationFn: ({ body, idempotencyKey, version }) =>
      putMyAuctionBid(
        context.session.httpClient,
        leagueId,
        auction.auctionId,
        body,
        { idempotencyKey, version }
      ),
    onSuccess: async () => {
      setConflictMessage(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: auctionKeys.root(leagueId) }),
        queryClient.refetchQueries({
          queryKey: auctionKeys.detail(leagueId, auction.auctionId),
          type: "active",
        }),
      ]);
    },
    onError: async (error) => {
      if (error?.status !== 412) return;
      setConflictMessage(
        "The auction changed before this edit was saved. Current server state has been refreshed; your entered amount and term were preserved. Review them before submitting again."
      );
      await queryClient.refetchQueries({
        queryKey: auctionKeys.detail(leagueId, auction.auctionId),
        type: "active",
      });
    },
  });

  if (!capability.allowed) {
    return (
      <p className={styles.denied}>
        {capabilityMessage(capability.reasonCode)}
      </p>
    );
  }

  function submit(event) {
    event.preventDefault();
    try {
      const offer = validateAuctionOffer(aav, term, {
        action,
        sourceKind: auction.sourceKind,
        fadOrigin: auction.fadOrigin,
        minimumContract: auction.minimumContract,
      });
      const body = {
        teamId: viewerTeam.teamId,
        aavCents: offer.aavCents,
        termYears: offer.termYears,
      };
      setClientError(null);
      setConflictMessage(null);
      mutation.mutate({
        body,
        version: viewerTeam.bid?.version ?? null,
        idempotencyKey: createIdempotencyKey("auction-bid"),
      });
    } catch (error) {
      setClientError(error);
    }
  }

  const success = mutation.data?.code === "AUCTION_BID_SUBMITTED"
    ? "Your opening bid was accepted and the auction was refreshed."
    : mutation.data?.code === "AUCTION_BID_EDITED"
      ? "Your bid edit was accepted and the auction was refreshed."
      : null;
  const shownError = conflictMessage
    ? new Error(conflictMessage)
    : clientError || mutation.error;

  return (
    <form className={styles.bidEditor} onSubmit={submit} noValidate>
      <fieldset disabled={mutation.isPending}>
        <legend>{hasBid ? "Edit your sealed bid" : "Join with a sealed bid"}</legend>
        <div className={styles.formGrid}>
          <label>
            AAV (dollars per year)
            <input
              aria-describedby={feedbackId}
              type="number"
              inputMode="decimal"
              min="1.00"
              step="0.25"
              required
              value={aav}
              onChange={(event) => {
                setAav(event.target.value);
                setClientError(null);
                setConflictMessage(null);
                mutation.reset();
              }}
            />
          </label>
          <label>
            Contract term
            <select
              aria-describedby={feedbackId}
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setClientError(null);
                setConflictMessage(null);
                mutation.reset();
              }}
            >
              <option value="1">1 year</option>
              <option value="2">2 years</option>
              <option value="3">3 years</option>
            </select>
          </label>
          <TotalContractPreview
            aav={aav}
            describedBy={feedbackId}
            term={term}
          />
        </div>
        <button
          className="hl-button hl-button--primary"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? "Submitting…"
            : hasBid
              ? "Update my bid"
              : "Join auction"}
        </button>
      </fieldset>
      <FormFeedback
        error={shownError}
        id={feedbackId}
        message={success}
        focusKey={shownError || mutation.data}
      />
    </form>
  );
}

function ViewerTeamCard({ auction, context, leagueId, timeZone, viewerTeam }) {
  const eligibleText = viewerTeam.eligible
    ? "Eligible"
    : viewerTeam.participantStatus === "removed"
      ? "Removed from restricted participation"
      : "Not eligible";
  return (
    <article className={styles.viewerTeam} aria-labelledby={`viewer-${viewerTeam.teamId}`}>
      <div className={styles.cardHeader}>
        <div>
          <h3 id={`viewer-${viewerTeam.teamId}`}>{teamName(viewerTeam.team)}</h3>
          <p>{eligibleText}</p>
        </div>
        <StatusBadge tone={viewerTeam.eligible ? "success" : "neutral"}>
          {eligibleText}
        </StatusBadge>
      </div>
      <OwnBidSummary viewerTeam={viewerTeam} timeZone={timeZone} />
      {auction.status === "active" && (
        <BidEditor
          auction={auction}
          context={context}
          leagueId={leagueId}
          viewerTeam={viewerTeam}
        />
      )}
    </article>
  );
}

function bidStatusLabel(status) {
  return {
    active: "Active",
    won: "Won",
    lost: "Lost",
    withdrawn: "Removed",
    invalid: "Invalid",
  }[status] || status;
}

function CommissionerAdministrationPanel({ auction, context, leagueId }) {
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState(null);
  const [aav, setAav] = useState("");
  const [term, setTerm] = useState("1");
  const [confirmed, setConfirmed] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [conflictMessage, setConflictMessage] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const feedbackId = useId();
  const sealedNoticeId = useId();
  const editorFocusRef = useRef(null);
  const returnFocusRef = useRef(null);
  const activeRef = useRef(true);
  const selectedBid = editor?.bidId
    ? auction.administrativeBids.find((bid) => bid.bidId === editor.bidId) || null
    : null;
  const signalsAdministrativeScope = (capability) =>
    capability.allowed || capability.reasonCode !== "NOT_AUTHORIZED";
  const hasServerScope =
    signalsAdministrativeScope(auction.capabilities.adminCancel) ||
    signalsAdministrativeScope(auction.capabilities.adminResolve) ||
    auction.administrativeBids.some(
      (bid) =>
        signalsAdministrativeScope(bid.capabilities.adminEditBid) ||
        signalsAdministrativeScope(bid.capabilities.adminRemoveBid)
    );
  const mutation = useMutation({
    gcTime: 0,
    mutationFn: ({ kind, bid, body, idempotencyKey, version }) => {
      if (kind === "edit") {
        return editAuctionBidAsCommissioner(
          context.session.httpClient,
          leagueId,
          auction.auctionId,
          bid.bidId,
          body,
          { idempotencyKey, version }
        );
      }
      if (kind === "remove") {
        return removeAuctionBidAsCommissioner(
          context.session.httpClient,
          leagueId,
          auction.auctionId,
          bid.bidId,
          { idempotencyKey, version }
        );
      }
      if (kind === "cancel") {
        return cancelAuctionAsCommissioner(
          context.session.httpClient,
          leagueId,
          auction.auctionId,
          { idempotencyKey, version }
        );
      }
      return requestAuctionResolutionAsCommissioner(
        context.session.httpClient,
        leagueId,
        auction.auctionId,
        { idempotencyKey, version }
      );
    },
    onSuccess: async (result, variables) => {
      if (!activeRef.current) return;
      setClientError(null);
      setConflictMessage(null);
      setConfirmed(false);
      setEditor(null);
      if (variables.kind === "edit") {
        setReceipt("The sealed bid replacement was accepted and the auction was refreshed.");
      } else if (variables.kind === "remove") {
        setReceipt("The bid removal was recorded and the auction history was refreshed.");
      } else if (variables.kind === "cancel") {
        setReceipt(
          result.auction.status === "correction_required"
            ? "The cancellation was recorded. This restricted Free Agent Draft result now requires the linked recovery workflow."
            : "The auction cancellation was recorded and its history was refreshed."
        );
      } else {
        setReceipt(
          result.status === "already_succeeded"
            ? "This auction was already resolved. The latest result is shown."
            : "The resolution request was accepted. The result will appear when processing finishes."
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: auctionKeys.root(leagueId) }),
        queryClient.invalidateQueries({
          queryKey: ["league", leagueId, "free-agent-draft"],
        }),
        queryClient.invalidateQueries({ queryKey: ["league", leagueId, "activity"] }),
      ]);
    },
    onError: async (error, variables) => {
      if (!activeRef.current) return;
      if (error?.status !== 412) return;
      if (variables.kind !== "edit") setConfirmed(false);
      setConflictMessage(
        variables.kind === "edit"
          ? "The bid changed before the replacement was saved. Current server state has been refreshed; your entered amount and term were preserved. Review them before submitting again."
          : "The auction changed before this confirmed action was applied. Current server state has been refreshed and no success is being claimed. Review the action and confirm it again."
      );
      await queryClient.refetchQueries({
        queryKey: auctionKeys.detail(leagueId, auction.auctionId),
        type: "active",
      });
    },
  });

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (editor && editorFocusRef.current) editorFocusRef.current.focus();
  }, [editor]);

  useEffect(() => {
    if (editor?.bidId && !selectedBid) setEditor(null);
  }, [editor, selectedBid]);

  if (!hasServerScope && !editor && !receipt && !mutation.error && !clientError) {
    return null;
  }

  function openEditor(kind, event, bid = null) {
    returnFocusRef.current = event.currentTarget;
    setEditor({ kind, bidId: bid?.bidId ?? null });
    setAav("");
    setTerm("1");
    setConfirmed(false);
    setClientError(null);
    setConflictMessage(null);
    setReceipt(null);
    mutation.reset();
  }

  function closeEditor() {
    const target = returnFocusRef.current;
    setEditor(null);
    setConfirmed(false);
    setClientError(null);
    setConflictMessage(null);
    mutation.reset();
    queueMicrotask(() => target?.isConnected && target.focus());
  }

  function submitEdit(event) {
    event.preventDefault();
    try {
      if (!selectedBid?.capabilities.adminEditBid.allowed) {
        throw new Error("The server does not currently allow this bid replacement.");
      }
      const offer = validateAuctionOffer(aav, term, {
        action: "edit",
        sourceKind: auction.sourceKind,
        fadOrigin: auction.fadOrigin,
        minimumContract: auction.minimumContract,
      });
      setClientError(null);
      setConflictMessage(null);
      mutation.mutate({
        kind: "edit",
        bid: selectedBid,
        body: {
          teamId: selectedBid.teamId,
          aavCents: offer.aavCents,
          termYears: offer.termYears,
        },
        version: selectedBid.version,
        idempotencyKey: createIdempotencyKey("auction-admin-edit"),
      });
    } catch (error) {
      setClientError(error);
    }
  }

  function submitConfirmed(event) {
    event.preventDefault();
    try {
      if (!confirmed) throw new Error("Confirm this commissioner action before continuing.");
      const kind = editor?.kind;
      const bidCapability = selectedBid?.capabilities.adminRemoveBid;
      const capability = kind === "remove"
        ? bidCapability
        : kind === "cancel"
          ? auction.capabilities.adminCancel
          : auction.capabilities.adminResolve;
      if (!capability?.allowed) {
        throw new Error("The server does not currently allow this commissioner action.");
      }
      setClientError(null);
      setConflictMessage(null);
      mutation.mutate({
        kind,
        bid: selectedBid,
        body: null,
        version: kind === "remove" ? selectedBid.version : auction.version,
        idempotencyKey: createIdempotencyKey(`auction-admin-${kind}`),
      });
    } catch (error) {
      setClientError(error);
    }
  }

  const shownError = conflictMessage
    ? new Error(conflictMessage)
    : clientError || mutation.error;
  const selectedTeamName = teamName(selectedBid?.team);
  const confirmationCopy = editor?.kind === "remove"
    ? `I confirm that I want to remove the active sealed bid for ${selectedTeamName}. The stored value and term remain private.`
    : editor?.kind === "cancel"
      ? "I confirm that I want to cancel this auction before a winner is assigned."
      : "I confirm that I want to request the normal server resolution operation. This does not let me select a winner.";
  const confirmationButton = editor?.kind === "remove"
    ? "Remove confirmed bid"
    : editor?.kind === "cancel"
      ? "Cancel confirmed auction"
      : "Request confirmed resolution";

  return (
    <Surface className={`${styles.panel} ${styles.adminPanel}`} aria-labelledby="commissioner-auction-actions-title">
      <div className={styles.panelHeader}>
        <div>
          <p className="hl-eyebrow">Commissioner administration</p>
          <h2 id="commissioner-auction-actions-title">Sealed auction controls</h2>
        </div>
      </div>
      <p>
        These controls identify bids by their server-provided record and team.
        Competing values and terms remain sealed, including while replacing or removing a bid.
      </p>
      <FormFeedback
        error={shownError}
        fallback="The commissioner auction action could not be completed."
        id={feedbackId}
        message={receipt}
        focusKey={shownError || receipt}
      />
      {auction.administrativeBids.length > 0 && (
        <div className={styles.adminBidGrid} aria-label="Commissioner sealed bid records">
          {auction.administrativeBids.map((bid) => {
            const canEdit = bid.capabilities.adminEditBid.allowed;
            const canRemove = bid.capabilities.adminRemoveBid.allowed;
            return (
              <article className={styles.adminBid} key={bid.bidId}>
                <div>
                  <h3>{teamName(bid.team)}</h3>
                  <p>{bidStatusLabel(bid.status)} sealed bid</p>
                </div>
                {(canEdit || canRemove) ? (
                  <div className={styles.actions}>
                    {canEdit && (
                      <button
                        className="hl-button hl-button--secondary"
                        type="button"
                        aria-label={`Replace active sealed bid for ${teamName(bid.team)}`}
                        onClick={(event) => openEditor("edit", event, bid)}
                      >
                        Replace bid
                      </button>
                    )}
                    {canRemove && (
                      <button
                        className="hl-button hl-button--danger"
                        type="button"
                        aria-label={`Remove active sealed bid for ${teamName(bid.team)}`}
                        onClick={(event) => openEditor("remove", event, bid)}
                      >
                        Remove bid
                      </button>
                    )}
                  </div>
                ) : (
                  <small>{capabilityMessage(bid.capabilities.adminEditBid.reasonCode)}</small>
                )}
              </article>
            );
          })}
        </div>
      )}
      {(auction.capabilities.adminCancel.allowed ||
        auction.capabilities.adminResolve.allowed) && (
        <div className={styles.adminAuctionActions}>
          <h3>Auction-level actions</h3>
          <div className={styles.actions}>
            {auction.capabilities.adminCancel.allowed && (
              <button
                className="hl-button hl-button--danger"
                type="button"
                onClick={(event) => openEditor("cancel", event)}
              >
                Cancel auction
              </button>
            )}
            {auction.capabilities.adminResolve.allowed && (
              <button
                className="hl-button hl-button--secondary"
                type="button"
                onClick={(event) => openEditor("resolve", event)}
              >
                Request resolution
              </button>
            )}
          </div>
        </div>
      )}
      {editor?.kind === "edit" && selectedBid && (
        <form className={styles.adminEditor} onSubmit={submitEdit} noValidate>
          <fieldset disabled={mutation.isPending}>
            <legend>Replace sealed bid for {selectedTeamName}</legend>
            <p id={sealedNoticeId}>
              Enter a complete replacement. The current bid value and term are not revealed or prefilled.
            </p>
            <div className={styles.formGrid}>
              <label>
                Replacement AAV (dollars per year)
                <input
                  ref={editorFocusRef}
                  aria-describedby={`${sealedNoticeId} ${feedbackId}`}
                  type="number"
                  inputMode="decimal"
                  min="1.00"
                  step="0.25"
                  required
                  value={aav}
                  onChange={(event) => {
                    setAav(event.target.value);
                    setClientError(null);
                    setConflictMessage(null);
                    mutation.reset();
                  }}
                />
              </label>
              <label>
                Replacement term
                <select
                  aria-describedby={`${sealedNoticeId} ${feedbackId}`}
                  value={term}
                  onChange={(event) => {
                    setTerm(event.target.value);
                    setClientError(null);
                    setConflictMessage(null);
                    mutation.reset();
                  }}
                >
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                </select>
              </label>
              <TotalContractPreview
                aav={aav}
                describedBy={`${sealedNoticeId} ${feedbackId}`}
                term={term}
              />
            </div>
            <div className={styles.actions}>
              <button className="hl-button hl-button--primary">
                {mutation.isPending ? "Replacing…" : "Replace sealed bid"}
              </button>
              <button className="hl-button hl-button--quiet" type="button" onClick={closeEditor}>
                Keep current bid
              </button>
            </div>
          </fieldset>
        </form>
      )}
      {editor && editor.kind !== "edit" && (
        <form className={styles.adminEditor} onSubmit={submitConfirmed}>
          <fieldset disabled={mutation.isPending}>
            <legend ref={editorFocusRef} tabIndex={-1}>
              Confirm {editor.kind === "remove" ? "bid removal" : editor.kind === "cancel" ? "auction cancellation" : "resolution request"}
            </legend>
            <div className={styles.confirmation}>
              <label>
                <input
                  type="checkbox"
                  aria-describedby={feedbackId}
                  checked={confirmed}
                  onChange={(event) => {
                    setConfirmed(event.target.checked);
                    setClientError(null);
                    setConflictMessage(null);
                    mutation.reset();
                  }}
                />
                <span>{confirmationCopy}</span>
              </label>
            </div>
            <div className={styles.actions}>
              <button
                className={editor.kind === "resolve" ? "hl-button hl-button--primary" : "hl-button hl-button--danger"}
                disabled={!confirmed || mutation.isPending}
              >
                {mutation.isPending ? "Submitting…" : confirmationButton}
              </button>
              <button className="hl-button hl-button--quiet" type="button" onClick={closeEditor}>
                Go back
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </Surface>
  );
}

function DrawEvidence({ auction }) {
  if (auction.sourceKind === "ordinary_weekly") return null;
  const evidence = auction.result?.drawEvidence || null;
  const reveal = evidence?.reveal || null;
  return (
    <Surface className={styles.panel} aria-labelledby="draw-evidence-title">
      <div className={styles.panelHeader}>
        <div>
          <p className="hl-eyebrow">Free Agent Draft</p>
          <h2 id="draw-evidence-title">Tie-break fairness</h2>
        </div>
        <StatusBadge tone={reveal?.selectionUsed ? "success" : "neutral"}>
          {auction.status === "active"
            ? "Committed"
            : reveal?.selectionUsed
              ? "Draw used"
              : reveal
                ? "No draw needed"
                : "Reveal pending"}
        </StatusBadge>
      </div>
      {auction.status === "active" ? (
        <p>
          A fairness commitment was recorded before bidding closes. It does not
          reveal any bid value. The reveal becomes available with the terminal result.
        </p>
      ) : reveal?.selectionUsed ? (
        <p>
          {reveal.orderedBidIds.length} bids remained exactly tied after total
          value and AAV ranking. The server used one equal-chance draw and persisted the
          selected result before assignment.
        </p>
      ) : reveal ? (
        <p>No exact-top tie required random selection for this result.</p>
      ) : (
        <p>The fairness reveal is unavailable while correction is required.</p>
      )}
    </Surface>
  );
}

function TerminalResult({ auction, timeZone }) {
  if (auction.status === "active") return null;
  const result = auction.result;
  return (
    <Surface className={styles.panel} aria-labelledby="auction-result-title">
      <div className={styles.panelHeader}>
        <div>
          <p className="hl-eyebrow">Final result</p>
          <h2 id="auction-result-title">Auction result</h2>
        </div>
        <StatusBadge tone={statusTone(auction.status)}>
          {statusLabel(auction.status)}
        </StatusBadge>
      </div>
      <TerminalSummary auction={auction} />
      <p>Recorded {leagueDateTime(result.resolvedAtMs, timeZone)}.</p>
      {auction.status === "resolved" && (
        <dl className={styles.resultGrid}>
          <div><dt>Winning team</dt><dd>{teamName(result.winningTeam)}</dd></div>
          <div><dt>Submitted total</dt><dd>{money(result.submittedTotalValueCents)}</dd></div>
          <div><dt>Submitted term</dt><dd>{result.submittedTermYears} {result.submittedTermYears === 1 ? "year" : "years"}</dd></div>
          <div><dt>Submitted AAV</dt><dd>{money(result.submittedAavCents)}</dd></div>
          <div><dt>Final contract total</dt><dd>{money(result.finalContractValueCents)}</dd></div>
          <div><dt>Final AAV</dt><dd>{money(result.finalAavCents)}</dd></div>
        </dl>
      )}
    </Surface>
  );
}

function AuctionDetailContent({ auction, context, leagueId }) {
  const timeZone = context.league.timezone;
  return (
    <>
      <PageHeading
        eyebrow={`${context.league.name} · ${sourceLabel(auction)}`}
        title={auction.player.fullName}
        description={`${auction.player.positionGroup} · ${statusLabel(auction.status)} sealed auction`}
        id="auction-page-title"
        actions={
          auction.fadId && (
            <Link
              className="hl-button hl-button--secondary"
              to={routePaths.freeAgentDraftResults(leagueId, auction.fadId)}
            >
              View Free Agent Draft
            </Link>
          )
        }
      />
      <Surface className={styles.panel} aria-labelledby="auction-overview-title">
        <div className={styles.panelHeader}>
          <div>
            <p className="hl-eyebrow">Auction overview</p>
            <h2 id="auction-overview-title">Sealed bidding status</h2>
          </div>
          <StatusBadge tone={statusTone(auction.status)}>
            {statusLabel(auction.status)}
          </StatusBadge>
        </div>
        <p>
          {auction.bidCount} {auction.bidCount === 1 ? "bid" : "bids"} placed.
          Bidder identities remain hidden; only each currently authorized
          team’s own value is shown here while active.
        </p>
        <AuctionTiming auction={auction} timeZone={timeZone} />
        {auction.sourceKind !== "ordinary_weekly" && auction.status === "active" && (
          <p className={styles.timingNotice}>
            This path stays active through its recorded rapid rollover. If an
            additional Free Agent Draft cycle is required, the server keeps the Free Agent Draft open and
            owns that extension; opening this page never advances or resolves it.
          </p>
        )}
        <MinimumNotice auction={auction} />
      </Surface>
      <Surface className={styles.panel} aria-labelledby="managed-team-actions-title">
        <div className={styles.panelHeader}>
          <div>
            <p className="hl-eyebrow">Private manager actions</p>
            <h2 id="managed-team-actions-title">Your managed teams</h2>
          </div>
        </div>
        {auction.viewerTeams.length === 0 ? (
          <p>
            The server returned no managed-team bid view for this account. No
            join or edit permission is inferred locally.
          </p>
        ) : (
          <div className={styles.viewerTeamGrid}>
            {auction.viewerTeams.map((viewerTeam) => (
              <ViewerTeamCard
                auction={auction}
                context={context}
                key={viewerTeam.teamId}
                leagueId={leagueId}
                timeZone={timeZone}
                viewerTeam={viewerTeam}
              />
            ))}
          </div>
        )}
      </Surface>
      <CommissionerAdministrationPanel
        auction={auction}
        context={context}
        leagueId={leagueId}
      />
      <TerminalResult auction={auction} timeZone={timeZone} />
      <DrawEvidence auction={auction} />
      <p className="hl-page-backlink">
        <Link to={routePaths.leagueAuctions(leagueId)}>Back to auctions</Link>
      </p>
    </>
  );
}

function AuctionDetailPrivateContent({ auctionId, context, leagueId }) {
  const safeLeagueId = UUID_V4.test(leagueId || "") ? leagueId : EMPTY_ID;
  const safeAuctionId = UUID_V4.test(auctionId || "") ? auctionId : EMPTY_ID;
  const auction = useQuery({
    ...auctionDetailQuery(
      context.session.httpClient,
      safeLeagueId,
      safeAuctionId
    ),
    enabled:
      context.session.status === "authenticated" &&
      Boolean(context.league) &&
      safeAuctionId === auctionId,
  });
  return (
    <>
      {safeAuctionId !== auctionId ? (
        <>
          <PageHeading
            eyebrow={context.league?.name}
            title="Auction detail"
            id="auction-page-title"
          />
          <p className="hl-form-message is-error" role="alert">
            This auction link is invalid.
          </p>
        </>
      ) : auction.isPending ? (
        <Surface>
          <LoadingBlock>Loading auction details…</LoadingBlock>
        </Surface>
      ) : auction.isError && auction.error?.status === 404 ? (
        <Navigate replace to={routePaths.leagueAuctions(leagueId)} />
      ) : auction.isError ? (
        <>
          <PageHeading
            eyebrow={context.league?.name}
            title="Auction detail"
            id="auction-page-title"
          />
          <Surface>
            <ErrorBlock
              error={auction.error}
              fallback="The auction could not be loaded."
            />
          </Surface>
        </>
      ) : auction.data.sourceKind === "fad_restricted" &&
        !hasCommissionerAuthority(context.league.membership) ? (
        <Navigate
          replace
          to={routePaths.leagueAuctionFocus(leagueId, auction.data.auctionId)}
        />
      ) : (
        <AuctionDetailContent
          auction={auction.data}
          context={context}
          leagueId={leagueId}
        />
      )}
    </>
  );
}

export function AuctionDetailPage() {
  const { leagueId, auctionId } = useParams();
  const context = useAuctionLeagueContext(leagueId);
  const privacy = useAuctionPrivacyGate(leagueId);
  return (
    <AuctionGate context={context} title="Auction detail">
      {!privacy.ready ? (
        <Surface>
          <LoadingBlock>Reauthorizing private auction access...</LoadingBlock>
        </Surface>
      ) : (
        <AuctionDetailPrivateContent
          auctionId={auctionId}
          context={context}
          key={privacy.key}
          leagueId={leagueId}
        />
      )}
    </AuctionGate>
  );
}
