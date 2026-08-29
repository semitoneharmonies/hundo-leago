import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import { hasCommissionerAuthority } from "../../shared/leagueAuthority.js";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { leagueTeamsQuery, visibleLeaguesQuery } from "../leagues/leagueQueries.js";
import {
  leaguePlayerDetailQuery,
  playerKeys,
  playerSearchQuery,
} from "../players/playerQueries.js";
import { teamWorkspaceQuery } from "../rosters/teamWorkspaceQueries.js";
import { useSession } from "../session/sessionContext.js";
import {
  auctionDollarsToCents,
  buildTradeAsset,
  centsToDollarInput,
  dollarsToCents,
} from "./transactionContracts.js";
import {
  acceptTrade,
  activityQuery,
  approveTrade,
  auctionsQuery,
  cancelTrade,
  createTrade,
  declineTrade,
  previewTradeAcceptance,
  previewTradeReversal,
  putOwnBid,
  recoverTrade,
  startAuction,
  tradeQuery,
  tradesQuery,
  transactionKeys,
} from "./transactionQueries.js";
import { TradeBlockPanel } from "./TradeBlockPanel.jsx";

const card = { border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 14 };
const row = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" };
const input = { padding: 8, borderRadius: 6, border: "1px solid #475569", minWidth: 170 };
const ACTIVITY_STATE_FIELDS = Object.freeze([
  "ownershipKind",
  "rosterCategory",
  "positionGroup",
  "slotNumber",
  "contractType",
  "originalTotalValueCents",
  "originalTermYears",
  "aavCents",
  "status",
]);

function key(prefix) {
  const suffix = globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

function money(cents) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function time(value) {
  return new Date(value).toLocaleString();
}

function activityWords(value) {
  const words = value.replace(/[._-]+/gu, " ").trim();
  return words.length === 0
    ? value
    : `${words[0].toUpperCase()}${words.slice(1)}`;
}

function activityStateValue(field, value) {
  if (value === null) return "None";
  if (["originalTotalValueCents", "aavCents"].includes(field)) {
    return Number.isSafeInteger(value) && value >= 0 ? money(value) : null;
  }
  if (Number.isSafeInteger(value) || typeof value === "boolean") {
    return String(value);
  }
  if (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= 200 &&
    ![...value].some((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f);
    })
  ) {
    return value;
  }
  return null;
}

function activityStateSummary(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const details = ACTIVITY_STATE_FIELDS.flatMap((field) => {
    if (!Object.hasOwn(value, field)) return [];
    const display = activityStateValue(field, value[field]);
    if (display === null) return [];
    if (field === "slotNumber") return [`Slot ${display}`];
    if (field === "originalTermYears") {
      return [`${display} ${display === "1" ? "year" : "years"}`];
    }
    if (field === "originalTotalValueCents") return [`${display} total`];
    if (field === "aavCents") return [`${display} AAV`];
    return [activityWords(display)];
  });
  return details.length > 0 ? details.join(" · ") : null;
}

function activityChangeSummary(metadata) {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const before = activityStateSummary(metadata.before);
  const after = activityStateSummary(metadata.after || metadata.authoritative);
  if (before && after) return `${before} → ${after}`;
  return after || before;
}

const ACTIVITY_FILTERS = Object.freeze([
  ["all", "All events"],
  ["trade", "Trades"],
  ["auction", "Auctions"],
  ["buyout", "Buyouts"],
  ["commissioner", "Commissioner edits"],
  ["team", "Teams and rosters"],
  ["competition", "Competition and drafts"],
  ["other", "Other events"],
]);

function activityCategory(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("trade")) return "trade";
  if (value.includes("auction")) return "auction";
  if (value.includes("buyout")) return "buyout";
  if (value.includes("commissioner") || value.includes("correction")) {
    return "commissioner";
  }
  if (value.includes("team") || value.includes("roster") || value.includes("ownership")) {
    return "team";
  }
  if (
    value.includes("matchup") ||
    value.includes("standings") ||
    value.includes("draft") ||
    value.startsWith("fad_") ||
    value.startsWith("fad.")
  ) {
    return "competition";
  }
  return "other";
}

function namedTeam(teamNames, teamId, fallback = "A team") {
  return typeof teamId === "string" ? teamNames.get(teamId) || fallback : fallback;
}

function activityTitle(item, teamNames) {
  const metadata = item.metadata || {};
  const category = activityCategory(item.type);
  const playerName =
    item.player?.name ||
    metadata.player?.name ||
    metadata.player?.fullName ||
    metadata.playerName ||
    null;
  const itemTeamName =
    item.team?.name || namedTeam(teamNames, item.teamId, null);
  if (
    category !== "commissioner" &&
    [
      "auction_player_acquired",
      "contract_created",
      "fad_allocation_player_acquired",
      "fantasy_elc_created",
      "fantasy_elc_signed",
    ].includes(item.type) &&
    playerName &&
    itemTeamName
  ) {
    return `${playerName} signed with ${itemTeamName}.`;
  }
  if (category === "buyout" && playerName && itemTeamName) {
    return `${itemTeamName} bought out ${playerName}.`;
  }
  if (category === "commissioner" && playerName) {
    if (item.type === "commissioner_player_added") {
      return `Commissioner added ${playerName} to ${itemTeamName || "a team"}.`;
    }
    if (item.type === "commissioner_player_removed") {
      return `Commissioner removed ${playerName} from ${itemTeamName || "a team"}.`;
    }
    if (item.type === "commissioner_roster_corrected") {
      return `Commissioner corrected ${playerName}’s roster assignment.`;
    }
    if (item.type === "commissioner_contract_corrected") {
      return `Commissioner corrected ${playerName}’s contract.`;
    }
  }
  if (category !== "trade") return item.summary;
  const proposing = namedTeam(teamNames, metadata.proposingTeamId, "The proposing team");
  const receiving = namedTeam(teamNames, metadata.receivingTeamId, "the receiving team");
  switch (item.type) {
    case "trade_proposal_created":
      return `${proposing} sent a trade proposal to ${receiving}.`;
    case "trade_proposal_rejected":
      return `${receiving} declined a trade proposal from ${proposing}.`;
    case "trade_proposal_cancelled":
      return `${proposing} cancelled its trade proposal to ${receiving}.`;
    case "trade_completed":
      return `${proposing} and ${receiving} made a trade.`;
    case "trade_awaiting_commissioner_approval":
      return `${proposing} and ${receiving} agreed to a trade. Commissioner approval is required.`;
    case "trade_proposal_automatically_cancelled":
      return `A conflicting trade proposal between ${proposing} and ${receiving} was cancelled.`;
    case "trade_proposal_expired":
      return `The trade proposal from ${proposing} to ${receiving} expired.`;
    default:
      return item.summary;
  }
}

function activitySource(item) {
  const type = String(item.type || "").toLowerCase();
  if (type.includes("free_agent_draft") || type.startsWith("fad_")) {
    return "Via Free Agent Draft";
  }
  if (item.actor?.displayName) return `By ${item.actor.displayName}`;
  if (item.actor?.authority === "system") return "League automation";
  return "League update";
}

function activityTradeReceipts(item, teamNames) {
  if (activityCategory(item.type) !== "trade" || !Array.isArray(item.metadata?.assets)) {
    return [];
  }
  const receipts = new Map();
  for (const asset of item.metadata.assets) {
    if (!asset || typeof asset !== "object") continue;
    const snapshot = asset.executionSnapshot || asset.snapshot || asset.proposalSnapshot || {};
    const type = asset.assetType || asset.type || "asset";
    const playerName = snapshot.player?.name || snapshot.player?.fullName || null;
    const title = playerName ||
      (type === "draft_pick"
        ? `${snapshot.targetSeasonLabel || "Future"} Round ${snapshot.roundNumber || "?"} pick`
        : type.includes("future_consideration")
          ? "Future Considerations"
          : activityWords(type));
    const destination = namedTeam(
      teamNames,
      asset.destinationTeamId,
      "Receiving team"
    );
    if (!receipts.has(destination)) receipts.set(destination, []);
    receipts.get(destination).push(title);
  }
  return [...receipts.entries()].map(([teamName, assets]) => ({
    teamName,
    assets,
  }));
}

function ActivityEntry({ item, teamNames }) {
  const category = activityCategory(item.type);
  const receipts = activityTradeReceipts(item, teamNames);
  const teamName = item.team?.name || namedTeam(teamNames, item.teamId, null);
  const playerName = item.player?.name || null;
  const change = activityChangeSummary(item.metadata);
  const subject = [playerName, teamName].filter(Boolean).join(" · ");
  return (
    <li className={`hl-activity-entry hl-activity-entry--${category}`}>
      <span aria-hidden="true" />
      <div>
        <strong>{activityTitle(item, teamNames)}</strong>
        <span className="hl-activity-context">
          {activitySource(item)} <span aria-hidden="true">·</span>{" "}
          <time
            className="hl-activity-time"
            dateTime={new Date(item.occurredAtMs).toISOString()}
          >
            {time(item.occurredAtMs)}
          </time>
        </span>
        {subject && category !== "trade" && (
          <span className="hl-activity-subject">{subject}</span>
        )}
        {change && <p className="hl-activity-change">{change}</p>}
        {item.reason && <p className="hl-activity-reason">{item.reason}</p>}
        {receipts.length > 0 && (
          <div className="hl-activity-assets">
            {receipts.map(({ teamName: recipient, assets }) => (
              <p key={recipient}>
                <strong>{recipient} receives:</strong> {assets.join(", ")}
              </p>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function ErrorMessage({ error }) {
  if (!error) return null;
  return <ErrorBlock error={error} />;
}

function useLeagueContext(leagueId) {
  const session = useSession();
  const leagues = useQuery({
    ...visibleLeaguesQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  const league = leagues.data?.find(({ id }) => id === leagueId) || null;
  const teams = useQuery({
    ...leagueTeamsQuery(session.httpClient, leagueId),
    enabled: session.status === "authenticated" && Boolean(league),
  });
  const managedTeams = useMemo(() => {
    if (!teams.data || !session.user) return [];
    if (league?.membership.permissionCategory === "commissioner") return teams.data;
    return teams.data.filter((team) => team.currentManager?.userId === session.user.id);
  }, [league, session.user, teams.data]);
  const managerControlledTeams = useMemo(() => {
    if (!teams.data || !session.user) return [];
    return teams.data.filter(
      (team) => team.currentManager?.userId === session.user.id
    );
  }, [session.user, teams.data]);
  return {
    session,
    leagues,
    league,
    teams,
    managedTeams,
    managerControlledTeams,
  };
}

function LeaguePageState({ context, title, children }) {
  if (context.session.status === "unauthenticated") {
    return <Navigate to={routePaths.home} replace state={{ reason: "sign-in" }} />;
  }
  if (context.session.status === "unknown" || context.leagues.isPending) {
    return <main className="hl-page"><Surface><LoadingBlock>Checking secure league access…</LoadingBlock></Surface></main>;
  }
  if (context.leagues.isError) return <main className="hl-page"><Surface className="hl-state-surface"><ErrorMessage error={context.leagues.error} /></Surface></main>;
  if (!context.league) {
    return <main className="hl-page"><PageHeading eyebrow="Transactions" title={title} /><p className="hl-form-message is-error" role="alert">This league is not in your active memberships.</p></main>;
  }
  return (
    <main className="hl-page hl-page--wide hl-transaction-page">
      <PageHeading
        eyebrow={context.league.name}
        title={title}
      />
      {children}
    </main>
  );
}

function StartAuctionForm({ context, leagueId }) {
  const [searchParams] = useSearchParams();
  const client = context.session.httpClient;
  const queryClient = useQueryClient();
  const [teamId, setTeamId] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [totalValueDollars, setTotalValueDollars] = useState("1.50");
  const [termYears, setTermYears] = useState("1");
  const [clientError, setClientError] = useState(null);
  const [prefillConsumed, setPrefillConsumed] = useState(false);
  const prefilledPlayerId = searchParams.get("playerId");
  const prefilledPlayer = useQuery({
    ...leaguePlayerDetailQuery(
      client,
      leagueId,
      prefilledPlayerId || "invalid"
    ),
    enabled:
      context.session.status === "authenticated" &&
      Boolean(context.league) &&
      /^[a-f0-9-]{36}$/.test(prefilledPlayerId || ""),
  });
  const players = useQuery({
    ...playerSearchQuery(client, {
      query: playerSearch,
      status: "active",
      limit: 12,
      leagueId,
      auctionEligible: true,
    }),
    enabled:
      context.session.status === "authenticated" &&
      Boolean(context.league) &&
      playerSearch.trim().length > 0,
  });
  const mutation = useMutation({
    mutationFn: (body) => startAuction(client, leagueId, body, key("auction-start")),
    onSuccess: async () => {
      setPlayerSearch("");
      setSelectedPlayer(null);
      setSuggestionsOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.auctions(leagueId) }),
        queryClient.invalidateQueries({ queryKey: playerKeys.searches }),
      ]);
    },
  });
  useEffect(() => {
    if (!prefilledPlayer.data || selectedPlayer || prefillConsumed) return;
    setPrefillConsumed(true);
    if (prefilledPlayer.data.league.ownership) {
      setClientError(
        new Error("That player is already assigned in this league.")
      );
      return;
    }
    setSelectedPlayer(prefilledPlayer.data);
    setPlayerSearch(prefilledPlayer.data.fullName);
    setSuggestionsOpen(false);
  }, [prefillConsumed, prefilledPlayer.data, selectedPlayer]);
  if (context.teams.isPending) return <p>Loading authorized teams…</p>;
  if (context.managedTeams.length === 0) return <p>You do not currently control a team that can start an auction.</p>;
  const effectiveTeamId = teamId || context.managedTeams[0].id;
  const suggestions = players.data?.players || [];

  function choosePlayer(player) {
    setSelectedPlayer(player);
    setPlayerSearch(player.fullName);
    setSuggestionsOpen(false);
    setClientError(null);
  }

  function submit(event) {
    event.preventDefault();
    try {
      if (!selectedPlayer || selectedPlayer.fullName !== playerSearch) {
        throw new Error("Select an available player from the suggestions.");
      }
      const canonicalTerm = Number(termYears);
      const totalValueCents = auctionDollarsToCents(
        totalValueDollars,
        { termYears: canonicalTerm }
      );
      setClientError(null);
      mutation.mutate({
        teamId: effectiveTeamId,
        playerId: selectedPlayer.id,
        totalValueCents,
        termYears: canonicalTerm,
      });
    } catch (error) {
      setClientError(error);
    }
  }

  return (
    <form className="hl-surface hl-feature-form" style={card} onSubmit={submit}>
      <h2>Start an auction</h2>
      <div className="hl-auction-form-grid" style={row}>
        {context.managedTeams.length > 1 ? (
          <label className="hl-auction-field hl-auction-field--team">
            Team<br />
            <select
              style={input}
              value={effectiveTeamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              {context.managedTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label
          className="hl-auction-field hl-auction-field--player"
          htmlFor="auction-player-search"
        >
          Player<br />
          <input
            id="auction-player-search"
            style={input}
            role="combobox"
            aria-autocomplete="list"
            aria-controls="auction-player-suggestions"
            aria-expanded={suggestionsOpen && playerSearch.trim().length > 0}
            autoComplete="off"
            required
            value={playerSearch}
            onChange={(event) => {
              setPlayerSearch(event.target.value);
              setSelectedPlayer(null);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setSuggestionsOpen(false);
              if (
                event.key === "Enter" &&
                suggestionsOpen &&
                suggestions.length === 1
              ) {
                event.preventDefault();
                choosePlayer(suggestions[0]);
              }
            }}
          />
          {suggestionsOpen && playerSearch.trim().length > 0 && (
            <span
              id="auction-player-suggestions"
              role="listbox"
              aria-label="Available players"
              style={{ display: "grid", gap: 4, marginTop: 4 }}
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
                <span>No available players match that name.</span>
              ) : suggestions.map((player) => (
                <button
                  className="hl-player-suggestion"
                  key={player.id}
                  type="button"
                  role="option"
                  aria-selected={selectedPlayer?.id === player.id}
                  onClick={() => choosePlayer(player)}
                  style={{ textAlign: "left" }}
                >
                  {player.fullName}
                  {player.provider?.normalizedPosition
                    ? ` (${player.provider.normalizedPosition})`
                    : ""}
                  {player.provider?.nhlTeamAbbreviation
                    ? ` — ${player.provider.nhlTeamAbbreviation}`
                    : ""}
                </button>
              ))}
            </span>
          )}
        </label>
        <label className="hl-auction-field">
          Total value (dollars)<br />
          <input
            style={input}
            type="number"
            inputMode="decimal"
            min={termYears === "1" ? "1.00" : termYears}
            step={termYears === "1" ? "0.01" : "1"}
            required
            value={totalValueDollars}
            onChange={(e) => setTotalValueDollars(e.target.value)}
          />
        </label>
        <label className="hl-auction-field">
          Term<br />
          <select
            style={input}
            value={termYears}
            onChange={(e) => setTermYears(e.target.value)}
          >
            <option value="1">1 year</option>
            <option value="2">2 years</option>
            <option value="3">3 years</option>
          </select>
        </label>
        <button
          className="hl-button hl-button--primary hl-auction-submit"
          disabled={mutation.isPending || !selectedPlayer}
        >
          Start auction
        </button>
      </div>
      <ErrorMessage
        error={clientError || prefilledPlayer.error || mutation.error}
      />
    </form>
  );
}

function OwnBidForm({ auction, managedTeams, client, leagueId }) {
  const queryClient = useQueryClient();
  const availableTeams = managedTeams.filter((team) =>
    !auction.participants.some((participant) => participant.teamId === team.id) ||
    auction.ownBid?.teamId === team.id
  );
  const [teamId, setTeamId] = useState(auction.ownBid?.teamId || availableTeams[0]?.id || "");
  const [total, setTotal] = useState(centsToDollarInput(auction.ownBid?.totalValueCents || 150));
  const [term, setTerm] = useState(String(auction.ownBid?.termYears || 1));
  const [clientError, setClientError] = useState(null);
  const mutation = useMutation({
    mutationFn: () => putOwnBid(client, leagueId, auction.id, {
      teamId,
      totalValueCents: auctionDollarsToCents(total, {
        termYears: Number(term),
        joining: !auction.ownBid,
      }),
      termYears: Number(term),
    }, { version: auction.ownBid?.version, idempotencyKey: key("auction-bid") }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.auctions(leagueId) }),
  });
  if (availableTeams.length === 0) return null;

  function submit(event) {
    event.preventDefault();
    try {
      auctionDollarsToCents(total, {
        termYears: Number(term),
        joining: !auction.ownBid,
      });
      setClientError(null);
      mutation.mutate();
    } catch (error) {
      setClientError(error);
    }
  }

  return (
    <form className="hl-inline-form" onSubmit={submit}>
      <div className="hl-auction-form-grid" style={row}>
        {availableTeams.length > 1 ? (
          <label className="hl-auction-field hl-auction-field--team">
            Your team<br />
            <select
              style={input}
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="hl-auction-field">
          Total value (dollars)<br />
          <input
            style={input}
            type="number"
            inputMode="decimal"
            min={
              auction.ownBid
                ? term === "1"
                  ? "1.00"
                  : term
                : { 1: "1.50", 2: "3", 3: "5" }[term]
            }
            step={term === "1" ? "0.01" : "1"}
            required
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </label>
        <label className="hl-auction-field">
          Term<br />
          <select
            style={input}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          >
            <option value="1">1 year</option>
            <option value="2">2 years</option>
            <option value="3">3 years</option>
          </select>
        </label>
        <button
          className="hl-button hl-button--primary hl-auction-submit"
          disabled={mutation.isPending}
        >
          {auction.ownBid ? "Update my bid" : "Join auction"}
        </button>
      </div>
      <ErrorMessage error={clientError || mutation.error} />
    </form>
  );
}

export function AuctionsPage() {
  const { leagueId } = useParams();
  const context = useLeagueContext(leagueId);
  const auctions = useQuery({
    ...auctionsQuery(context.session.httpClient, leagueId),
    enabled: context.session.status === "authenticated" && Boolean(context.league),
  });
  return (
    <LeaguePageState context={context} title="Auctions">
      <p className="hl-inline-copy">Active bids are sealed. Only your own bid value and term are shown.</p>
      <StartAuctionForm context={context} leagueId={leagueId} />
      {auctions.isPending ? <Surface><LoadingBlock>Loading active auctions…</LoadingBlock></Surface> :
        auctions.isError ? <ErrorMessage error={auctions.error} /> :
        auctions.data.length === 0 ? <Surface><EmptyBlock title="No active auctions" /></Surface> : <div className="hl-card-grid">{auctions.data.map((auction) => (
          <article className="hl-surface hl-transaction-card" key={auction.id} style={card}>
            <h2>{auction.player.fullName} <small>({auction.player.positionGroup})</small></h2>
            <p>Closes {time(auction.bidClosesAtMs)} · {auction.participantCount} participating team(s)</p>
            <p>Participants: {auction.participants.map(({ teamName }) => teamName).join(", ")}</p>
            {auction.ownBid ? (
              <p>Your sealed bid: {money(auction.ownBid.totalValueCents)} over {auction.ownBid.termYears} year(s), AAV {money(auction.ownBid.aavCents)}. Manager edits remaining: {auction.ownBid.remainingManagerEdits ?? "refresh to update"}. Cooldown ends {auction.ownBid.cooldownEndsAtMs === undefined ? "after the required waiting period" : time(auction.ownBid.cooldownEndsAtMs)}.</p>
            ) : <p>You have no bid in this auction.</p>}
            <OwnBidForm auction={auction} managedTeams={context.managedTeams} client={context.session.httpClient} leagueId={leagueId} />
          </article>
        ))}</div>}
      <p className="hl-page-backlink"><Link to={routePaths.league(leagueId)}>Back to dashboard</Link></p>
    </LeaguePageState>
  );
}

const ASSET_TYPES = [
  ["player", "Player"],
  ["draft_pick", "Draft pick"],
  ["buyout_obligation", "Buyout obligation"],
  ["future_considerations", "Future considerations"],
];

function playerAssetReference(type, reference) {
  return `${type}:${reference}`;
}

function selectedPlayerAsset(reference) {
  const separator = String(reference || "").indexOf(":");
  if (separator < 1) return null;
  const type = reference.slice(0, separator);
  const id = reference.slice(separator + 1);
  return ["contract", "prospect_right"].includes(type) && id
    ? { type, id }
    : null;
}

function assetChoices(asset, workspace) {
  if (!workspace) return [];
  switch (asset.type) {
    case "player":
      return [
        ...workspace.tradeAssets.contracts.map((choice) => ({
          ...choice,
          id: playerAssetReference("contract", choice.id),
        })),
        ...workspace.tradeAssets.prospects.map((choice) => ({
          ...choice,
          id: playerAssetReference("prospect_right", choice.id),
        })),
      ];
    case "draft_pick":
      return workspace.tradeAssets.draftPicks;
    case "buyout_obligation":
      return workspace.tradeAssets.buyouts;
    case "future_considerations":
      return [];
    default:
      return [];
  }
}

function AssetEditor({
  label,
  assets,
  setAssets,
  workspace,
  pending,
}) {
  function update(index, change) {
    setAssets(assets.map((asset, itemIndex) => itemIndex === index ? { ...asset, ...change } : asset));
  }
  return (
    <fieldset className="hl-asset-editor" style={{ ...card, flex: "1 1 360px" }}>
      <legend>{label}</legend>
      {pending && <p role="status">Loading this team’s tradeable assets…</p>}
      {assets.map((asset, index) => (
        <div key={index} style={{ ...row, marginBottom: 10 }}>
          <select
            aria-label={`${label} asset ${index + 1} type`}
            style={input}
            value={asset.type}
            onChange={(event) =>
              update(index, {
                type: event.target.value,
                reference: "",
                mode: event.target.value === "future_considerations"
                      ? "new"
                      : null,
                retainedAavDollars: "",
              })
            }
          >
            {ASSET_TYPES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
          {asset.type === "future_considerations" ? (
            <input
              aria-label={`${label} asset ${index + 1} notes`}
              style={input}
              required
              maxLength={500}
              placeholder="Future Considerations notes"
              value={asset.reference}
              onChange={(event) =>
                update(index, { reference: event.target.value })
              }
            />
          ) : (
            <select
              aria-label={`${label} asset ${index + 1}`}
              style={input}
              required
              value={asset.reference}
              onChange={(event) =>
                update(index, { reference: event.target.value })
              }
            >
              <option value="">Choose an item</option>
              {assetChoices(asset, workspace).map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.label}
                </option>
              ))}
              </select>
          )}
          {asset.type === "buyout_obligation" && asset.reference && (() => {
            const buyout = workspace?.tradeAssets.buyouts.find(
              ({ id }) => id === asset.reference
            );
            return buyout ? (
              <p className="hl-inline-copy">
                <strong>{buyout.playerName}</strong> buyout ·{" "}
                {money(buyout.annualPenaltyCents)} AAV ·{" "}
                {buyout.remainingYears} season
                {buyout.remainingYears === 1 ? "" : "s"} remaining. The entire
                remaining obligation transfers.
              </p>
            ) : null;
          })()}
          {asset.type === "player" &&
            selectedPlayerAsset(asset.reference)?.type === "contract" && (
            <>
              <input
                aria-label={`${label} asset ${index + 1} retained AAV dollars`}
                style={input}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Retained AAV ($) — optional"
                value={asset.retainedAavDollars || ""}
                onChange={(event) =>
                  update(index, {
                    retainedAavDollars: event.target.value,
                  })
                }
              />
              <small>Leave blank to trade the contract without retention.</small>
            </>
          )}
          {assets.length > 1 && <button className="hl-button hl-button--quiet" type="button" onClick={() => setAssets(assets.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>}
        </div>
      ))}
      <button className="hl-button hl-button--quiet" type="button" onClick={() => setAssets([...assets, { type: "player", reference: "" }])}>Add asset</button>
    </fieldset>
  );
}

function NewTradeForm({ context, leagueId }) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const requestedAssetDirection = searchParams.get("assetDirection");
  const requestedAssetType = searchParams.get("assetType");
  const requestedAssetId = searchParams.get("assetId") || "";
  const requestedSourceTeamId = searchParams.get("sourceTeamId") || "";
  const requestedProposingTeamId =
    searchParams.get("proposingTeamId") || "";
  const requestedPlayerType = ["contract", "prospect_right"].includes(
    requestedAssetType
  )
    ? requestedAssetType
    : null;
  const initialAssetType = requestedPlayerType
    ? "player"
    : ASSET_TYPES.some(([value]) => value === requestedAssetType)
      ? requestedAssetType
      : "player";
  const initialAssetReference = requestedPlayerType
    ? playerAssetReference(requestedPlayerType, requestedAssetId)
    : requestedAssetId;
  const prefillRequestedAsset =
    requestedAssetDirection === "requested" && Boolean(requestedAssetId);
  const [proposingTeamId, setProposingTeamId] = useState(
    requestedProposingTeamId
  );
  const [receivingTeamId, setReceivingTeamId] = useState(
    prefillRequestedAsset ? requestedSourceTeamId : ""
  );
  const [proposingAssets, setProposingAssets] = useState([
    prefillRequestedAsset
      ? { type: "player", reference: "" }
      : {
          type: initialAssetType,
          reference: initialAssetReference,
        },
  ]);
  const [receivingAssets, setReceivingAssets] = useState([
    prefillRequestedAsset
      ? {
          type: initialAssetType,
          reference: initialAssetReference,
        }
      : { type: "player", reference: "" },
  ]);
  const [clientError, setClientError] = useState(null);
  const proposer =
    context.managerControlledTeams.some(({ id }) => id === proposingTeamId)
      ? proposingTeamId
      : context.managerControlledTeams[0]?.id || "";
  const receiving =
    context.teams.data?.some(
      ({ id }) => id === receivingTeamId && id !== proposer
    )
      ? receivingTeamId
      : context.teams.data?.find(({ id }) => id !== proposer)?.id || "";
  const proposerWorkspace = useQuery({
    ...teamWorkspaceQuery(
      context.session.httpClient,
      leagueId,
      proposer || "invalid"
    ),
    enabled:
      context.session.status === "authenticated" &&
      Boolean(context.league) &&
      Boolean(proposer),
  });
  const receivingWorkspace = useQuery({
    ...teamWorkspaceQuery(
      context.session.httpClient,
      leagueId,
      receiving || "invalid"
    ),
    enabled:
      context.session.status === "authenticated" &&
      Boolean(context.league) &&
      Boolean(receiving),
  });
  const mutation = useMutation({
    mutationFn: (body) => createTrade(context.session.httpClient, leagueId, body, key("trade-proposal")),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.trades(leagueId) }),
  });
  if (context.teams.isPending) return <p>Loading trade teams…</p>;
  if (context.managerControlledTeams.length === 0) return <p>You do not currently control a team that can propose a trade.</p>;
  function buildSide(items) {
    const built = items.flatMap((item) => {
      const asset = buildTradeAsset(item);
      if (
        asset.type !== "contract" ||
        !String(item.retainedAavDollars || "").trim()
      ) {
        return [asset];
      }
      return [
        asset,
        buildTradeAsset({
          type: "requested_retention",
          reference: asset.contractId,
          retainedAavCents: dollarsToCents(item.retainedAavDollars),
          retainedAavDollars: item.retainedAavDollars,
        }),
      ];
    });
    const contractIds = new Set(
      built
        .filter((asset) => asset.type === "contract")
        .map(({ contractId }) => contractId)
    );
    return built.flatMap((asset) => {
      if (
        asset.type !== "requested_retention" ||
        contractIds.has(asset.contractId)
      ) {
        return [asset];
      }
      contractIds.add(asset.contractId);
      return [
        { type: "contract", contractId: asset.contractId },
        asset,
      ];
    });
  }
  function submit(event) {
    event.preventDefault();
    try {
      const body = {
        proposingTeamId: proposer,
        receivingTeamId: receiving,
        proposingAssets: buildSide(proposingAssets),
        receivingAssets: buildSide(receivingAssets),
      };
      setClientError(null);
      mutation.mutate(body);
    } catch (error) {
      setClientError(error);
    }
  }
  return (
    <form className="hl-surface hl-feature-form" style={card} onSubmit={submit}>
      <h2>New trade proposal</h2>
      <div style={row}>
        <label>Proposing team<br /><select style={input} value={proposer} onChange={(e) => {
          setProposingTeamId(e.target.value);
          setReceivingTeamId("");
          setProposingAssets([{ type: "player", reference: "" }]);
          setReceivingAssets([{ type: "player", reference: "" }]);
        }}>
          {context.managerControlledTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select></label>
        <label>Receiving team<br /><select style={input} value={receiving} onChange={(e) => {
          setReceivingTeamId(e.target.value);
          setReceivingAssets([{ type: "player", reference: "" }]);
        }}>
          {context.teams.data.filter(({ id }) => id !== proposer).map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select></label>
      </div>
      <div style={row}>
        <AssetEditor
          label="Proposing team sends"
          assets={proposingAssets}
          setAssets={setProposingAssets}
          workspace={proposerWorkspace.data}
          pending={proposerWorkspace.isPending}
        />
        <AssetEditor
          label="Receiving team sends"
          assets={receivingAssets}
          setAssets={setReceivingAssets}
          workspace={receivingWorkspace.data}
          pending={receivingWorkspace.isPending}
        />
      </div>
      <button className="hl-button hl-button--primary" disabled={mutation.isPending || proposerWorkspace.isPending || receivingWorkspace.isPending || !receiving}>Send proposal</button>
      <ErrorMessage error={clientError || proposerWorkspace.error || receivingWorkspace.error || mutation.error} />
    </form>
  );
}

export function TradesPage() {
  const { leagueId } = useParams();
  const context = useLeagueContext(leagueId);
  const [status, setStatus] = useState("pending");
  const trades = useQuery({
    ...tradesQuery(context.session.httpClient, leagueId),
    enabled: context.session.status === "authenticated" && Boolean(context.league),
  });
  const visible = (trades.data || []).filter((trade) =>
    trade.storageStatus !== "expired" &&
    (status === "all" ||
      ["proposed", "awaiting_commissioner_approval"].includes(
        trade.storageStatus
      ))
  );
  const managedTeamIds = new Set(
    (context.teams.data || [])
      .filter(
        ({ currentManager }) =>
          currentManager?.userId === context.session.user?.id
      )
      .map(({ id }) => id)
  );
  return (
    <LeaguePageState context={context} title="Trades">
      <NewTradeForm context={context} leagueId={leagueId} />
      <TradeBlockPanel
        enabled={context.session.status === "authenticated" && Boolean(context.league?.currentSeason) && !context.teams.isPending}
        httpClient={context.session.httpClient}
        leagueId={leagueId}
        teams={context.teams.data || []}
      />
      <label className="hl-field hl-compact-filter">Status <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending">Pending</option><option value="all">All non-expired</option></select></label>
      {trades.isPending ? <Surface><LoadingBlock>Loading trades…</LoadingBlock></Surface> : trades.isError ? <ErrorMessage error={trades.error} /> : visible.length === 0 ? <Surface><EmptyBlock title="No proposals in this view." /></Surface> : (
        <Surface><ul className="hl-trade-list">{visible.map((trade) => {
          const awaitingManagedTeam =
            trade.storageStatus === "proposed" &&
            managedTeamIds.has(trade.receivingTeam.id);
          const awaitingCommissioner =
            trade.storageStatus === "awaiting_commissioner_approval";
          return (
            <li
              key={trade.id}
              className={awaitingManagedTeam || awaitingCommissioner ? "is-awaiting-you" : undefined}
            >
              <Link to={routePaths.trade(leagueId, trade.id)}>
                <span>
                  <strong>{trade.proposingTeam.name} → {trade.receivingTeam.name}</strong>
                  <small>
                    {awaitingManagedTeam
                      ? "Awaiting your response"
                      : awaitingCommissioner
                        ? "Awaiting commissioner approval"
                      : "Open proposal details"}
                  </small>
                </span>
                <StatusBadge tone={awaitingManagedTeam || awaitingCommissioner ? "live" : "neutral"}>
                  {trade.status}
                </StatusBadge>
              </Link>
            </li>
          );
        })}</ul></Surface>
      )}
      <p>Expired proposals are preserved in <Link to={routePaths.leagueActivity(leagueId)}>League Activity</Link>.</p>
      <p className="hl-page-backlink"><Link to={routePaths.league(leagueId)}>Back to dashboard</Link></p>
    </LeaguePageState>
  );
}

function AssetSummary({ asset, requestedRetention = null }) {
  const snapshot = asset.snapshot;
  let title = activityWords(asset.type);
  let description = "";
  switch (asset.type) {
    case "contract":
      title = snapshot.player?.name || "Player contract";
      description = `${money(snapshot.contract?.aavCents || 0)} AAV · ${
        snapshot.contract?.originalTermYears || 0
      }-year original term · ${activityWords(
        snapshot.ownership?.rosterCategory || "Rostered"
      )}${
        requestedRetention
          ? ` · with ${money(
              requestedRetention.snapshot.retainedAavCents || 0
            )} retained salary`
          : ""
      }`;
      break;
    case "prospect_right":
      title = snapshot.player?.name || "Prospect";
      description = snapshot.fantasyElc
        ? `Signed prospect · ${money(snapshot.fantasyElc.aavCents)} fantasy ELC`
        : "Unsigned prospect rights";
      break;
    case "draft_pick":
      title = `${snapshot.targetSeasonLabel || "Future"} Round ${snapshot.roundNumber}`;
      description = `Pick ${snapshot.positionNumber}`;
      break;
    case "retention_obligation":
      title = `${snapshot.player?.name || "Player"} retained salary`;
      description = `${money(snapshot.retainedAavCents || 0)} per season · ${snapshot.years?.length || 0} remaining year(s)`;
      break;
    case "requested_retention":
      title = "Requested salary retention";
      description = `${money(snapshot.retainedAavCents || 0)} retained on the included player contract`;
      break;
    case "buyout_obligation":
      title = `${snapshot.player?.name || "Player"} buyout penalty`;
      description = `${money(snapshot.annualPenaltyBasisCents || 0)} annual basis · ${snapshot.years?.length || 0} remaining year(s)`;
      break;
    case "future_consideration":
    case "future_consideration_instruction":
      title = "Future Considerations";
      description = snapshot.description || "Future obligation";
      break;
    default:
      description = "Tradeable league asset";
  }
  return (
    <article className="hl-trade-asset-card">
      <span className="hl-position-tag">
        {requestedRetention
          ? "Contract + retention"
          : activityWords(asset.type)}
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
    </article>
  );
}

function groupRequestedRetention(assets) {
  const requestedByContractId = new Map();
  for (const asset of assets) {
    const contractId =
      asset.type === "requested_retention"
        ? asset.snapshot?.contractId
        : null;
    if (contractId && !requestedByContractId.has(contractId)) {
      requestedByContractId.set(contractId, asset);
    }
  }

  const retentionByContractAssetId = new Map();
  const groupedRetentionIds = new Set();
  for (const asset of assets) {
    const contractId =
      asset.type === "contract" ? asset.snapshot?.contract?.id : null;
    const requestedRetention = contractId
      ? requestedByContractId.get(contractId)
      : null;
    if (requestedRetention) {
      retentionByContractAssetId.set(asset.id, requestedRetention);
      groupedRetentionIds.add(requestedRetention.id);
    }
  }

  return assets
    .filter((asset) => !groupedRetentionIds.has(asset.id))
    .map((asset) => ({
      asset,
      requestedRetention: retentionByContractAssetId.get(asset.id) || null,
    }));
}

function TradeTeamPanel({ team, assets }) {
  const groupedAssets = groupRequestedRetention(assets);
  return (
    <section className="hl-trade-team-panel">
      <h3>{team.name} sends</h3>
      {assets.length === 0 ? (
        <p>No assets from this team.</p>
      ) : (
        <div className="hl-trade-asset-list">
          {groupedAssets.map(({ asset, requestedRetention }) => (
            <AssetSummary
              key={asset.id}
              asset={asset}
              requestedRetention={requestedRetention}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AcceptancePreview({ preview }) {
  return (
    <div className="hl-acceptance-preview">
      <p>
        {preview.generallyIllegal
          ? "This trade would leave at least one roster generally illegal."
          : "No roster warning was found during the preview."}
      </p>
      <div className="hl-trade-team-preview">
        {preview.teams.map((team) => (
          <article key={team.teamId}>
            <strong>
              {team.generallyIllegal ? "Roster issue found" : "No roster issue"}
            </strong>
            {team.issues.length > 0 && (
              <ul>
                {team.issues.map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>
                    {activityWords(issue.code)}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function tradeHistorySummary(event, proposal) {
  switch (event.type) {
    case "proposal_created":
      return `${proposal.proposingTeam.name} sent the proposal to ${proposal.receivingTeam.name}.`;
    case "proposal_accepted":
      return event.metadata?.action === "approve"
        ? "The commissioner approved and completed the trade."
        : `${proposal.receivingTeam.name} accepted the proposal.`;
    case "proposal_accepted_awaiting_commissioner_approval":
      return `${proposal.receivingTeam.name} accepted the proposal. Commissioner approval is still required.`;
    case "proposal_rejected":
      return `${proposal.receivingTeam.name} declined the proposal.`;
    case "proposal_cancelled":
      return `${proposal.proposingTeam.name} cancelled the proposal.`;
    case "proposal_expired":
      return "The proposal expired without being accepted.";
    case "proposal_completed":
    case "trade_completed":
      return "The trade completed and its assets moved.";
    default:
      return activityWords(event.type);
  }
}

export function TradeDetailPage() {
  const { leagueId, tradeId } = useParams();
  const [searchParams] = useSearchParams();
  const context = useLeagueContext(leagueId);
  const queryClient = useQueryClient();
  const trade = useQuery({
    ...tradeQuery(context.session.httpClient, leagueId, tradeId),
    enabled: context.session.status === "authenticated" && Boolean(context.league),
  });
  const [acceptancePreview, setAcceptancePreview] = useState(null);
  const [reversalPreview, setReversalPreview] = useState(null);
  const refresh = async () => {
    setAcceptancePreview(null);
    setReversalPreview(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionKeys.trades(leagueId) }),
      queryClient.invalidateQueries({ queryKey: transactionKeys.trade(leagueId, tradeId) }),
      queryClient.invalidateQueries({ queryKey: ["league", leagueId, "activity"] }),
    ]);
  };
  const previewAcceptance = useMutation({ mutationFn: () => previewTradeAcceptance(context.session.httpClient, leagueId, tradeId), onSuccess: setAcceptancePreview });
  const command = useMutation({ mutationFn: ({ action }) => ({ accept: acceptTrade, approve: approveTrade, decline: declineTrade, cancel: cancelTrade }[action])(context.session.httpClient, leagueId, tradeId, key(`trade-${action}`)), onSuccess: refresh });
  const previewReversal = useMutation({ mutationFn: () => previewTradeReversal(context.session.httpClient, leagueId, tradeId), onSuccess: (data) => setReversalPreview(data.preview) });
  const recovery = useMutation({ mutationFn: (action) => recoverTrade(context.session.httpClient, leagueId, tradeId, action, key(`trade-${action}`)), onSuccess: refresh });
  const proposal = trade.data;
  const commissioner = hasCommissionerAuthority(context.league?.membership);
  const managedIds = new Set(
    context.managerControlledTeams.map(({ id }) => id)
  );
  const pending = proposal?.storageStatus === "proposed";
  const awaitingCommissionerApproval =
    proposal?.storageStatus === "awaiting_commissioner_approval";
  const canRespond = pending && managedIds.has(proposal.receivingTeam.id);
  const canApprove = awaitingCommissionerApproval && commissioner;
  const canCancel =
    (pending || awaitingCommissionerApproval) &&
    managedIds.has(proposal.proposingTeam.id);
  const openAcceptancePreview = searchParams.get("preview") === "acceptance";
  const requestAcceptancePreview = previewAcceptance.mutate;
  useEffect(() => {
    if (
      !openAcceptancePreview ||
      !canRespond ||
      acceptancePreview ||
      previewAcceptance.isPending ||
      previewAcceptance.isSuccess ||
      previewAcceptance.isError
    ) {
      return;
    }
    requestAcceptancePreview();
  }, [
    acceptancePreview,
    canRespond,
    openAcceptancePreview,
    previewAcceptance.isError,
    previewAcceptance.isPending,
    previewAcceptance.isSuccess,
    requestAcceptancePreview,
  ]);
  return (
    <LeaguePageState context={context} title="Trade proposal">
      {trade.isPending ? <Surface><LoadingBlock>Loading trade…</LoadingBlock></Surface> : trade.isError ? <ErrorMessage error={trade.error} /> : <Surface className="hl-trade-detail">
        <h2>{proposal.proposingTeam.name} ↔ {proposal.receivingTeam.name}</h2>
        <p><StatusBadge>{proposal.status}</StatusBadge> Created {time(proposal.createdAtMs)}.</p>
        {awaitingCommissionerApproval && (
          <p className="hl-form-message is-warning" role="status">
            The receiving team accepted this proposal. No assets move until a
            commissioner reviews and approves it.
          </p>
        )}
        <div className="hl-trade-team-grid">
          <TradeTeamPanel
            team={proposal.proposingTeam}
            assets={proposal.assets.filter(
              ({ sourceTeamId }) =>
                sourceTeamId === proposal.proposingTeam.id
            )}
          />
          <TradeTeamPanel
            team={proposal.receivingTeam}
            assets={proposal.assets.filter(
              ({ sourceTeamId }) =>
                sourceTeamId === proposal.receivingTeam.id
            )}
          />
        </div>
        {canRespond && <div className="hl-trade-action">
          <div className="hl-button-row">
          <button className="hl-button hl-button--primary" disabled={previewAcceptance.isPending} onClick={() => previewAcceptance.mutate()}>Preview acceptance</button>
          <button className="hl-button hl-button--quiet" disabled={command.isPending} onClick={() => command.mutate({ action: "decline" })}>Decline</button>
          </div>
          {acceptancePreview && <div><AcceptancePreview preview={acceptancePreview} /><button className="hl-button hl-button--primary" disabled={command.isPending} onClick={() => command.mutate({ action: "accept" })}>Confirm and accept trade</button></div>}
          <ErrorMessage error={previewAcceptance.error || command.error} />
        </div>}
        {canApprove && <div className="hl-trade-action">
          <h3>Commissioner approval</h3>
          <p>Review the current roster and cap impact before completing this trade.</p>
          <button className="hl-button hl-button--primary" disabled={previewAcceptance.isPending} onClick={() => previewAcceptance.mutate()}>Preview commissioner approval</button>
          {acceptancePreview && <div><AcceptancePreview preview={acceptancePreview} /><button className="hl-button hl-button--primary" disabled={command.isPending} onClick={() => command.mutate({ action: "approve" })}>Approve and complete trade</button></div>}
          <ErrorMessage error={previewAcceptance.error || command.error} />
        </div>}
        {canCancel && <button className="hl-button hl-button--quiet" disabled={command.isPending} onClick={() => command.mutate({ action: "cancel" })}>Cancel proposal</button>}
        {commissioner && proposal.storageStatus === "completed" && <div className="hl-trade-action">
          <h3>Commissioner recovery</h3>
          <button className="hl-button hl-button--quiet" disabled={previewReversal.isPending} onClick={() => previewReversal.mutate()}>Preview exact reversal</button>
          {reversalPreview && <div><p>{reversalPreview.recoverable ? "Every affected asset can be safely restored." : `${reversalPreview.mismatches.length} asset change${reversalPreview.mismatches.length === 1 ? "" : "s"} prevent an automatic reversal. Mark this trade for commissioner correction instead.`}</p>{reversalPreview.recoverable ? <button className="hl-button hl-button--primary" disabled={recovery.isPending} onClick={() => recovery.mutate("reverse")}>Confirm exact reversal</button> : <button className="hl-button hl-button--primary" disabled={recovery.isPending} onClick={() => recovery.mutate("correction-required")}>Confirm correction required</button>}</div>}
          <ErrorMessage error={previewReversal.error || recovery.error} />
        </div>}
        <h3>Status history</h3>
        <ol className="hl-status-history">{proposal.history.map((event) => (
          <li key={event.id}>
            <strong>{tradeHistorySummary(event, proposal)}</strong>
            <time dateTime={new Date(event.occurredAtMs).toISOString()}>{time(event.occurredAtMs)}</time>
          </li>
        ))}</ol>
      </Surface>}
      <p className="hl-page-backlink"><Link to={routePaths.leagueTrades(leagueId)}>Back to trades</Link></p>
    </LeaguePageState>
  );
}

export function ActivityPage() {
  const { leagueId } = useParams();
  const context = useLeagueContext(leagueId);
  const [cursor, setCursor] = useState(null);
  const [eventFilter, setEventFilter] = useState("all");
  const activity = useQuery({
    ...activityQuery(
      context.session.httpClient,
      leagueId,
      cursor,
      eventFilter
    ),
    enabled: context.session.status === "authenticated" && Boolean(context.league),
  });
  const teamNames = new Map(
    (context.teams.data || []).map((team) => [team.id, team.name])
  );
  return (
    <LeaguePageState context={context} title="League Activity">
      <Surface className="hl-activity-filter" aria-labelledby="activity-filter-title">
        <h2 id="activity-filter-title">Filter league events</h2>
        <label className="hl-field">
          Event type
          <select
            value={eventFilter}
            onChange={(event) => {
              setEventFilter(event.target.value);
              setCursor(null);
            }}
          >
            {ACTIVITY_FILTERS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </Surface>
      {activity.isPending ? <Surface><LoadingBlock>Loading activity...</LoadingBlock></Surface> : activity.isError ? <ErrorMessage error={activity.error} /> : <>
        {activity.data.activity.length === 0 ? <Surface><EmptyBlock title={eventFilter === "all" ? "No activity on this page" : "No events match this filter"} /></Surface> : <Surface><ol className="hl-activity-timeline">{activity.data.activity.map((item) => <ActivityEntry key={item.id} item={item} teamNames={teamNames} />)}</ol></Surface>}
        <div className="hl-pagination">
        {activity.data.page.nextCursor && <button className="hl-button hl-button--quiet" onClick={() => setCursor(activity.data.page.nextCursor)}>Next page</button>}
        {cursor && <button className="hl-button hl-button--quiet" onClick={() => setCursor(null)}>First page</button>}
        </div>
      </>}
      <p className="hl-page-backlink"><Link to={routePaths.league(leagueId)}>Back to dashboard</Link></p>
    </LeaguePageState>
  );
}
