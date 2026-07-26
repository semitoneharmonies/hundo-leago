import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
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
} from "./transactionContracts.js";
import {
  acceptTrade,
  activityQuery,
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

const card = { border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 14 };
const row = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" };
const input = { padding: 8, borderRadius: 6, border: "1px solid #475569", minWidth: 170 };
const activityDetails = { display: "grid", gap: 5, margin: 0 };
const activityDetailRow = {
  display: "grid",
  gridTemplateColumns: "minmax(7rem, auto) minmax(0, 1fr)",
  gap: 8,
};
const activityDetailTerm = { fontWeight: 700 };
const activityDetailValue = { margin: 0, overflowWrap: "anywhere" };
const ACTIVITY_STATE_FIELDS = Object.freeze([
  ["ownershipKind", "Ownership"],
  ["rosterCategory", "Roster category"],
  ["positionGroup", "Position"],
  ["slotNumber", "Slot"],
  ["contractType", "Contract type"],
  ["originalTotalValueCents", "Total value"],
  ["originalTermYears", "Term"],
  ["aavCents", "AAV"],
  ["status", "Status"],
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
  const details = ACTIVITY_STATE_FIELDS.flatMap(([field, label]) => {
    if (!Object.hasOwn(value, field)) return [];
    const display = activityStateValue(field, value[field]);
    return display === null ? [] : [`${label}: ${display}`];
  });
  return details.length > 0 ? details.join(" · ") : null;
}

function activityMetadataRows(metadata) {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }
  const rows = [];
  if (typeof metadata.correctionId === "string") {
    rows.push(["Correction ID", metadata.correctionId]);
  }
  const before = activityStateSummary(metadata.before);
  if (before) rows.push(["Before", before]);
  const result = activityStateSummary(metadata.after || metadata.authoritative);
  if (result) rows.push(["Result", result]);
  if (Array.isArray(metadata.warnings) && metadata.warnings.length > 0) {
    const warnings = metadata.warnings
      .map((warning) => warning?.code)
      .filter((code) => typeof code === "string")
      .map(activityWords);
    if (warnings.length > 0) rows.push(["Warnings", warnings.join(", ")]);
  }
  return rows;
}

function ActivityEntry({ item, teamName }) {
  const rows = [
    ...(teamName ? [["Team", teamName]] : []),
    ...activityMetadataRows(item.metadata).filter(
      ([label]) => label !== "Correction ID"
    ),
    ...(item.reason ? [["Reason", item.reason]] : []),
  ];
  return (
    <li>
      <span aria-hidden="true" />
      <div>
        <strong>{item.summary}</strong>
        <time
          className="hl-activity-time"
          dateTime={new Date(item.occurredAtMs).toISOString()}
        >
          {time(item.occurredAtMs)}
        </time>
        {rows.length > 0 && <dl style={activityDetails}>
          {rows.map(([label, value]) => (
            <div key={label} style={activityDetailRow}>
              <dt style={activityDetailTerm}>{label}</dt>
              <dd style={activityDetailValue}>{value}</dd>
            </div>
          ))}
        </dl>}
        <details className="hl-technical-details">
          <summary>Technical record</summary>
          <dl style={activityDetails}>
            <div style={activityDetailRow}>
              <dt style={activityDetailTerm}>Action</dt>
              <dd style={activityDetailValue}>{activityWords(item.type)}</dd>
            </div>
            <div style={activityDetailRow}>
              <dt style={activityDetailTerm}>Authority</dt>
              <dd style={activityDetailValue}>
                {activityWords(item.actor.authority)}
              </dd>
            </div>
            <div style={activityDetailRow}>
              <dt style={activityDetailTerm}>Activity ID</dt>
              <dd style={activityDetailValue}>{item.id}</dd>
            </div>
          </dl>
        </details>
      </div>
    </li>
  );
}

function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <div role="alert">
      <p>{error.message || "The request could not be completed."}</p>
      {error.requestId && <p>Request ID: {error.requestId}</p>}
    </div>
  );
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
  return { session, leagues, league, teams, managedTeams };
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
        description={
          title === "Auctions"
            ? "Sealed free-agent bidding with server-enforced eligibility and timing."
            : title === "Trades"
              ? "Propose and review typed-asset trades."
              : title === "League Activity"
                ? "Authoritative transaction and roster history."
                : "Review the proposal, its assets, and authoritative status history."
        }
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
      <div style={row}>
        {context.managedTeams.length > 1 ? (
          <label>Team<br /><select style={input} value={effectiveTeamId} onChange={(e) => setTeamId(e.target.value)}>
            {context.managedTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select></label>
        ) : (
          <p className="hl-form-context">
            Starting for <strong>{context.managedTeams[0].name}</strong>
          </p>
        )}
        <label htmlFor="auction-player-search">Player<br />
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
                <span role="alert">{players.error.message}</span>
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
        <label>Total value (dollars)<br /><input style={input} type="number" inputMode="decimal" min={termYears === "1" ? "1.00" : termYears} step={termYears === "1" ? "0.01" : "1"} required value={totalValueDollars} onChange={(e) => setTotalValueDollars(e.target.value)} /></label>
        <label>Term<br /><select style={input} value={termYears} onChange={(e) => setTermYears(e.target.value)}>
          <option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option>
        </select></label>
        <button className="hl-button hl-button--primary" disabled={mutation.isPending || !selectedPlayer}>Start auction</button>
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
      <div style={row}>
        {availableTeams.length > 1 ? (
          <label>Your team<br /><select style={input} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            {availableTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select></label>
        ) : (
          <p className="hl-form-context">
            Bidding for <strong>{availableTeams[0].name}</strong>
          </p>
        )}
        <label>Total value (dollars)<br /><input style={input} type="number" inputMode="decimal" min={auction.ownBid ? (term === "1" ? "1.00" : term) : ({ 1: "1.50", 2: "3", 3: "5" }[term])} step={term === "1" ? "0.01" : "1"} required value={total} onChange={(e) => setTotal(e.target.value)} /></label>
        <label>Term<br /><select style={input} value={term} onChange={(e) => setTerm(e.target.value)}>
          <option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option>
        </select></label>
        <button className="hl-button hl-button--primary" disabled={mutation.isPending}>{auction.ownBid ? "Update my bid" : "Join auction"}</button>
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
              <p>Your sealed bid: {money(auction.ownBid.totalValueCents)} over {auction.ownBid.termYears} year(s), AAV {money(auction.ownBid.aavCents)}. Manager edits remaining: {auction.ownBid.remainingManagerEdits ?? "refetch required"}. Cooldown ends {auction.ownBid.cooldownEndsAtMs === undefined ? "after the server-enforced interval" : time(auction.ownBid.cooldownEndsAtMs)}.</p>
            ) : <p>You have no bid in this auction.</p>}
            <OwnBidForm auction={auction} managedTeams={context.managedTeams} client={context.session.httpClient} leagueId={leagueId} />
          </article>
        ))}</div>}
      <p className="hl-page-backlink"><Link to={routePaths.league(leagueId)}>Back to dashboard</Link></p>
    </LeaguePageState>
  );
}

const ASSET_TYPES = [
  ["contract", "Contract"],
  ["prospect_right", "Prospect"],
  ["draft_pick", "Draft pick"],
  ["buyout_obligation", "Buyout obligation"],
  ["retention", "Retention"],
  ["future_considerations", "Future Considerations"],
];

function assetChoices(asset, workspace) {
  if (!workspace) return [];
  switch (asset.type) {
    case "contract":
      return workspace.tradeAssets.contracts;
    case "prospect_right":
      return workspace.tradeAssets.prospects;
    case "draft_pick":
      return workspace.tradeAssets.draftPicks;
    case "buyout_obligation":
      return workspace.tradeAssets.buyouts;
    case "retention":
      return asset.mode === "requested"
        ? workspace.tradeAssets.contracts
        : workspace.tradeAssets.retentions;
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
                mode:
                  event.target.value === "retention"
                    ? "existing"
                    : event.target.value === "future_considerations"
                      ? "new"
                      : null,
                retainedAavDollars: "",
              })
            }
          >
            {ASSET_TYPES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
          {asset.type === "retention" && (
            <select
              aria-label={`${label} asset ${index + 1} retention kind`}
              style={input}
              value={asset.mode || "existing"}
              onChange={(event) =>
                update(index, {
                  mode: event.target.value,
                  reference: "",
                  retainedAavDollars: "",
                })
              }
            >
              <option value="existing">Existing retention obligation</option>
              <option value="requested">Retain salary on a contract</option>
            </select>
          )}
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
          {asset.type === "contract" && asset.reference && (
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
          {asset.type === "retention" && asset.mode === "requested" && (
            <>
              <input
                aria-label={`${label} asset ${index + 1} retained AAV dollars`}
                style={input}
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Retained AAV ($)"
                value={asset.retainedAavDollars || ""}
                onChange={(event) =>
                  update(index, {
                    retainedAavDollars: event.target.value,
                  })
                }
              />
              <small>The matching contract is included automatically.</small>
            </>
          )}
          {assets.length > 1 && <button className="hl-button hl-button--quiet" type="button" onClick={() => setAssets(assets.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>}
        </div>
      ))}
      <button className="hl-button hl-button--quiet" type="button" onClick={() => setAssets([...assets, { type: "contract", reference: "" }])}>Add asset</button>
    </fieldset>
  );
}

function NewTradeForm({ context, leagueId }) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const requestedAssetType = searchParams.get("assetType");
  const requestedAssetId = searchParams.get("assetId") || "";
  const initialAssetType = ASSET_TYPES.some(
    ([value]) => value === requestedAssetType
  )
    ? requestedAssetType
    : "contract";
  const [proposingTeamId, setProposingTeamId] = useState("");
  const [receivingTeamId, setReceivingTeamId] = useState("");
  const [proposingAssets, setProposingAssets] = useState([
    {
      type: initialAssetType,
      reference: requestedAssetId,
    },
  ]);
  const [receivingAssets, setReceivingAssets] = useState([{ type: "contract", reference: "" }]);
  const [clientError, setClientError] = useState(null);
  const proposer =
    proposingTeamId || context.managedTeams[0]?.id || "";
  const receiving =
    receivingTeamId ||
    context.teams.data?.find(({ id }) => id !== proposer)?.id ||
    "";
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
  if (context.managedTeams.length === 0) return <p>You do not currently control a team that can propose a trade.</p>;
  function buildSide(items) {
    const built = items.flatMap((item) => {
      const asset = buildTradeAsset(item);
      if (
        item.type !== "contract" ||
        !String(item.retainedAavDollars || "").trim()
      ) {
        return [asset];
      }
      return [
        asset,
        buildTradeAsset({
          type: "retention",
          mode: "requested",
          reference: item.reference,
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
        <label>Proposing team<br /><select style={input} value={proposer} onChange={(e) => { setProposingTeamId(e.target.value); setReceivingTeamId(""); }}>
          {context.managedTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select></label>
        <label>Receiving team<br /><select style={input} value={receiving} onChange={(e) => setReceivingTeamId(e.target.value)}>
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
    trade.storageStatus !== "expired" && (status === "all" || trade.storageStatus === "proposed")
  );
  return (
    <LeaguePageState context={context} title="Trades">
      <NewTradeForm context={context} leagueId={leagueId} />
      <label className="hl-field hl-compact-filter">Status <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending">Pending</option><option value="all">All non-expired</option></select></label>
      {trades.isPending ? <Surface><LoadingBlock>Loading trades…</LoadingBlock></Surface> : trades.isError ? <ErrorMessage error={trades.error} /> : visible.length === 0 ? <Surface><EmptyBlock title="No proposals in this view." /></Surface> : (
        <Surface><ul className="hl-trade-list">{visible.map((trade) => <li key={trade.id}><Link to={routePaths.trade(leagueId, trade.id)}><span><strong>{trade.proposingTeam.name} → {trade.receivingTeam.name}</strong><small>Open proposal details</small></span><StatusBadge>{trade.status}</StatusBadge></Link></li>)}</ul></Surface>
      )}
      <p>Expired proposals are preserved in <Link to={routePaths.leagueActivity(leagueId)}>League Activity</Link>.</p>
      <p className="hl-page-backlink"><Link to={routePaths.league(leagueId)}>Back to dashboard</Link></p>
    </LeaguePageState>
  );
}

function Snapshot({ value }) {
  return (
    <details className="hl-technical-details">
      <summary>Technical details</summary>
      <pre className="hl-snapshot">{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}

function AssetSummary({ asset }) {
  const snapshot = asset.snapshot;
  let title = activityWords(asset.type);
  let description = "";
  switch (asset.type) {
    case "contract":
      title = snapshot.player?.name || "Player contract";
      description = `${money(snapshot.contract?.aavCents || 0)} AAV · ${snapshot.contract?.originalTermYears || 0}-year original term · ${activityWords(snapshot.ownership?.rosterCategory || "Rostered")}`;
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
      <span className="hl-position-tag">{activityWords(asset.type)}</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </article>
  );
}

function TradeTeamPanel({ team, assets }) {
  return (
    <section className="hl-trade-team-panel">
      <h3>{team.name} sends</h3>
      {assets.length === 0 ? (
        <p>No assets from this team.</p>
      ) : (
        <div className="hl-trade-asset-list">
          {assets.map((asset) => (
            <AssetSummary key={asset.id} asset={asset} />
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
          : "The authoritative preflight found no general-illegality warning."}
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

export function TradeDetailPage() {
  const { leagueId, tradeId } = useParams();
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
  const command = useMutation({ mutationFn: ({ action }) => ({ accept: acceptTrade, decline: declineTrade, cancel: cancelTrade }[action])(context.session.httpClient, leagueId, tradeId, key(`trade-${action}`)), onSuccess: refresh });
  const previewReversal = useMutation({ mutationFn: () => previewTradeReversal(context.session.httpClient, leagueId, tradeId), onSuccess: (data) => setReversalPreview(data.preview) });
  const recovery = useMutation({ mutationFn: (action) => recoverTrade(context.session.httpClient, leagueId, tradeId, action, key(`trade-${action}`)), onSuccess: refresh });
  const proposal = trade.data;
  const commissioner = context.league?.membership.permissionCategory === "commissioner";
  const managedIds = new Set(context.managedTeams.map(({ id }) => id));
  const pending = proposal?.storageStatus === "proposed";
  const canRespond = pending && (commissioner || managedIds.has(proposal.receivingTeam.id));
  const canCancel = pending && (commissioner || managedIds.has(proposal.proposingTeam.id));
  return (
    <LeaguePageState context={context} title="Trade proposal">
      {trade.isPending ? <Surface><LoadingBlock>Loading trade…</LoadingBlock></Surface> : trade.isError ? <ErrorMessage error={trade.error} /> : <Surface className="hl-trade-detail">
        <h2>{proposal.proposingTeam.name} ↔ {proposal.receivingTeam.name}</h2>
        <p><StatusBadge>{proposal.status}</StatusBadge> Created {time(proposal.createdAtMs)}.</p>
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
        {canCancel && <button className="hl-button hl-button--quiet" disabled={command.isPending} onClick={() => command.mutate({ action: "cancel" })}>Cancel proposal</button>}
        {commissioner && proposal.storageStatus === "completed" && <div className="hl-trade-action">
          <h3>Commissioner recovery</h3>
          <button className="hl-button hl-button--quiet" disabled={previewReversal.isPending} onClick={() => previewReversal.mutate()}>Preview exact reversal</button>
          {reversalPreview && <div><p>{reversalPreview.recoverable ? "Every affected asset remains exactly recoverable." : "Direct reversal is unsafe; no asset has moved."}</p><Snapshot value={reversalPreview.mismatches} />{reversalPreview.recoverable ? <button className="hl-button hl-button--primary" disabled={recovery.isPending} onClick={() => recovery.mutate("reverse")}>Confirm exact reversal</button> : <button className="hl-button hl-button--primary" disabled={recovery.isPending} onClick={() => recovery.mutate("correction-required")}>Confirm correction required</button>}</div>}
          <ErrorMessage error={previewReversal.error || recovery.error} />
        </div>}
        <h3>Status history</h3>
        <ol className="hl-status-history">{proposal.history.map((event) => <li key={event.id}>{event.type.replaceAll("_", " ")} · {time(event.occurredAtMs)}</li>)}</ol>
      </Surface>}
      <p className="hl-page-backlink"><Link to={routePaths.leagueTrades(leagueId)}>Back to trades</Link></p>
    </LeaguePageState>
  );
}

export function ActivityPage() {
  const { leagueId } = useParams();
  const context = useLeagueContext(leagueId);
  const [cursor, setCursor] = useState(null);
  const activity = useQuery({
    ...activityQuery(context.session.httpClient, leagueId, cursor),
    enabled: context.session.status === "authenticated" && Boolean(context.league),
  });
  const teamNames = new Map(
    (context.teams.data || []).map((team) => [team.id, team.name])
  );
  return (
    <LeaguePageState context={context} title="League Activity">
      {activity.isPending ? <Surface><LoadingBlock>Loading activity…</LoadingBlock></Surface> : activity.isError ? <ErrorMessage error={activity.error} /> : <>
        {activity.data.activity.length === 0 ? <Surface><EmptyBlock title="No activity on this page" /></Surface> : <Surface><ol className="hl-activity-timeline">{activity.data.activity.map((item) => <ActivityEntry key={item.id} item={item} teamName={teamNames.get(item.teamId) || null} />)}</ol></Surface>}
        <div className="hl-pagination">
        {activity.data.page.nextCursor && <button className="hl-button hl-button--quiet" onClick={() => setCursor(activity.data.page.nextCursor)}>Next page</button>}
        {cursor && <button className="hl-button hl-button--quiet" onClick={() => setCursor(null)}>First page</button>}
        </div>
      </>}
      <p className="hl-page-backlink"><Link to={routePaths.league(leagueId)}>Back to dashboard</Link></p>
    </LeaguePageState>
  );
}
