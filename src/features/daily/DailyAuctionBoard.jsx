import { useEffect, useReducer, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { canonicalNhlTeam } from "../../shared/nhlTeams.js";
import { nhlTeamColours } from "../players/nhlTeamColours.js";
import { dailyNow, formatTime } from "./dailyApi.js";
import { DailyPlayerName } from "./DailyPlayerName.jsx";
import { DailyUserStripes } from "./DailyUserStripes.jsx";
import { DailyCapJersey } from "./DailyCapJersey.jsx";
import { MINUTE_FLOOR_VERSION, nominationMinimum, playerMinimum } from "./dailyBidMinimum.js";
import "./DailyAuctionBoard.css";

const positionGroup = (player) => player.position === "D" ? "D" : "F";
const searchName = (name) => name.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();
const slotNames = ["F1", "F2", "F3", "D1", "D2", "Flex 1", "Flex 2"];

function BidEntry({ player, cap, minBid, rising, pending, error, disabled, prefix, returnFocusRef, onBid, onCancel }) {
  const [amount, setAmount] = useState("");
  const [, tick] = useReducer(value => value + 1, 0);
  const dialogRef = useRef(null);
  const expired = player.endsAt && Date.parse(player.endsAt) <= dailyNow();
  const numericAmount = Number(amount);
  const valid = amount.trim() !== "" && Number.isInteger(numericAmount) && numericAmount >= minBid && numericAmount <= cap;
  useEffect(() => {
    const dialog = dialogRef.current;
    const returnFocus = returnFocusRef.current;
    const viewport = window.visualViewport;
    function fitViewport() {
      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      dialog.style.setProperty("--bid-viewport-height", height + "px");
      dialog.style.setProperty("--bid-viewport-top", top + "px");
      dialog.style.setProperty("--bid-viewport-bottom", Math.max(0, window.innerHeight - top - height) + "px");
    }
    fitViewport();
    viewport?.addEventListener("resize", fitViewport);
    viewport?.addEventListener("scroll", fitViewport);
    dialog.showModal();
    dialog.querySelector("input")?.focus({ preventScroll: true });
    const timer = setInterval(tick, 500);
    return () => {
      clearInterval(timer);
      viewport?.removeEventListener("resize", fitViewport);
      viewport?.removeEventListener("scroll", fitViewport);
      dialog.close();
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, [returnFocusRef]);
  return <dialog ref={dialogRef} className="hda-bid-dialog" aria-labelledby={prefix + "-bid-title"}
    onCancel={event => { event.preventDefault(); if (!pending) onCancel(); }}>
    <form className="hda-bid-form" onSubmit={event => {
      event.preventDefault();
      if (valid && !pending && !disabled && !expired) onBid(player.id, numericAmount);
    }}>
      <h2 id={prefix + "-bid-title"}>Bid on <DailyPlayerName player={player}/></h2>
      <p>{player.team} · {positionGroup(player)} vs {player.opponent}</p>
      <label>Sealed bid
        <span className="hda-amount"><span aria-hidden="true">$</span><input type="number" inputMode="numeric" required autoFocus
          value={amount} min={minBid} max={cap} step="1" aria-label={"Sealed bid for " + player.name} aria-describedby={prefix + "-bid-help"}
          onChange={event => setAmount(event.target.value)} /></span>
      </label>
      <p id={prefix + "-bid-help"}>{cap >= minBid
        ? `Enter a whole-dollar amount from $${minBid} to $${cap}.`
        : `The minimum is $${minBid}; your available bid limit is $${cap}.`}{" "}Your one bid per skater is binding.</p>
      {rising && <p className="hda-bid-minimum-note">{player.endsAt
        ? `This player’s $${minBid} minimum is fixed until their auction ends.`
        : "The minimum for a new player can rise before your bid reaches the server. Your entered amount will not change."}</p>}
      {expired && <p role="status">This auction has ended.</p>}
      {disabled && !expired && <p role="status">This bid no longer fits the current minimum, cap or roster limits. Close this bid to review your options.</p>}
      {error && <p className="hda-bid-error" role="alert">{error.message}</p>}
      <div><button className="hda-submit" disabled={!valid || disabled || expired || pending}>{pending ? "Placing bid…" : "Place bid"}</button>
        <button type="button" disabled={pending} onClick={onCancel}>Cancel</button></div>
    </form>
  </dialog>;
}

function PlayerPool({ room, prefix, bidButton, minBid }) {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("all");
  const [team, setTeam] = useState("all");
  const term = searchName(search.trim());
  const slatePlayers = [...room.availablePlayers, ...room.auctions, ...room.members.flatMap((member) => member.roster)];
  const teams = [...new Set(slatePlayers.map((player) => canonicalNhlTeam(player.team)))].sort();
  const filtered = room.availablePlayers.filter((player) =>
    (position === "all" || position === positionGroup(player)) &&
    (team === "all" || team === canonicalNhlTeam(player.team)) &&
    (!term || searchName(player.name).includes(term))
  );
  return <section className="hda-panel hda-pool" id={prefix + "-pool"} tabIndex="-1" aria-labelledby={prefix + "-pool-title"}>
    <header className="hda-panel-head"><h2 id={prefix + "-pool-title"}>Player pool</h2>
      <small className="hda-minimum" aria-label={"New player minimum $" + minBid}>Min ${minBid}</small></header>
    <div className="hda-filters">
      <label className="hda-search"><Search size={17} aria-hidden="true" /><input type="search"
        aria-label="Search the player pool" placeholder="Search players" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <div className="hda-filter-line">
        <div className="hda-position-filter" role="group" aria-label="Position">
          {[["all", "All", "All positions"], ["F", "F", "Forwards"], ["D", "D", "Defence"]].map(([value, short, label]) =>
            <button type="button" key={value} aria-label={label} aria-pressed={position === value} onClick={() => setPosition(value)}>{short}</button>
          )}
        </div>
        <select aria-label="NHL team" value={team} onChange={(event) => setTeam(event.target.value)}>
          <option value="all">All teams</option>
          {teams.map((abbr) => <option key={abbr} value={abbr}>{abbr}</option>)}
        </select>
      </div>
    </div>
    <ul className="hda-pool-list" aria-label="Available players">{filtered.map((player) => <li key={player.id}>
      <div className="hda-pool-row">
        <span className="hda-position-swatch" style={nhlTeamColours(player.team)}><b>{positionGroup(player)}</b></span>
        <strong className="hda-pool-name"><DailyPlayerName player={player}/></strong>
        <small>{player.team} vs {player.opponent}</small>{bidButton(player)}
      </div></li>)}</ul>
    {filtered.length === 0 && <p className="hda-empty">{room.availablePlayers.length ? "No players match these filters." : "No available players."}</p>}
    {filtered.some((player) => player.lineupStatus === "projected") &&
      <p className="hda-explanation" title="Projected skaters can be scratched before puck drop.">
        <span className="hda-pool-warning-full">Projected skaters can be scratched before puck drop.</span>
        <span className="hda-pool-warning-short">Lineups may change.</span>
      </p>}
  </section>;
}

function Auctions({ room, prefix, bidButton }) {
  const [, tick] = useReducer((value) => value + 1, 0);
  const now = dailyNow();
  const active = room.auctions.length > 0;
  const auctionCutoff = "the room’s auction closes";
  const auctionRule = "Bids stay sealed. Each auction lasts two minutes or until " + auctionCutoff + ", whichever comes first.";
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [active]);
  return <section className="hda-panel hda-live" id={prefix + "-auctions"} tabIndex="-1" aria-labelledby={prefix + "-auctions-title"}>
    <header className="hda-panel-head"><h2 id={prefix + "-auctions-title"}>Live auctions</h2>
      <strong className="hda-live-count">{room.auctions.length}</strong></header>
    {!active && <p className="hda-empty">No active player auctions.</p>}
    <ul className="hda-lots" aria-label="Live player auctions">{room.auctions.map((player) => {
      const seconds = Math.max(0, Math.ceil((Date.parse(player.endsAt) - now) / 1000));
      const clock = seconds ? [Math.floor(seconds / 60), seconds % 60].map((v) => String(v).padStart(2, "0")).join(":") : "Closing";
      return <li className="hda-lot" key={player.id} style={nhlTeamColours(player.team)}>
        <div className="hda-lot-face">
          <span className="hda-team-stripe" aria-hidden="true" />
          <time className="hda-lot-clock" dateTime={player.endsAt} title={"Ends at " + formatTime(player.endsAt)}>{clock}</time>
          <strong className="hda-lot-name"><DailyPlayerName player={player}/></strong>
          <span className="hda-lot-matchup">{player.team} · {positionGroup(player)} vs {player.opponent}</span>
        </div>
        <div className="hda-lot-footer"><strong>{player.bidCount} {player.bidCount === 1 ? "bid" : "bids"}</strong>
          <small className="hda-lot-minimum" title="Minimum fixed when this player’s auction opened">Min ${playerMinimum(room, player)}</small>
          {player.ownBid == null && bidButton(player, seconds === 0)}</div>
        {player.ownBid != null && <strong className="hda-own-bid">Your bid ${player.ownBid}</strong>}
      </li>;
    })}</ul>
    <p className="hda-explanation" title={auctionRule}>
      <span className="hda-rule-full">{auctionRule}</span>
      <span className="hda-rule-compact">Sealed bids · 2 min or roster lock.</span>
    </p>
  </section>;
}

function assignRosterSlots(roster) {
  const slots = Array(7).fill(null);
  // Signed players arrive in auction order; use their natural slots before either flex slot.
  for (const player of roster) {
    const group = positionGroup(player);
    const index = slots.findIndex((occupant, i) => !occupant && (i >= 5 || slotNames[i][0] === group));
    if (index >= 0) slots[index] = player;
  }
  return slots;
}

export function Roster({ room, viewer, selectedId, onSelect }) {
  const [localSelection, setLocalSelection] = useState(viewer);
  const member = room.members.find((item) => item.id === (selectedId ?? localSelection)) || room.members[0];
  if (!member) return null;
  const prefix = "hd-" + room.id + "-roster";
  const scoring = ["locked", "finished", "void"].includes(room.phase);
  return <section className={"hda-panel hda-roster" + (scoring ? " hda-score-roster" : "")} id={prefix} tabIndex="-1" aria-labelledby={prefix + "-title"}>
    <div className="hda-roster-banner hd-user-stripe-cell">
    <DailyUserStripes appearance={member.dailyAppearance}/>
    <header className="hda-panel-head"><h2 id={prefix + "-title"}>Roster</h2>
      {!scoring && <DailyCapJersey amount={member.remainingCap}/>}
    </header>
    <div className="hda-roster-controls">
      <div className="hda-manager-switch" title={member.name + (member.id === viewer ? " (you)" : "")}>
      <ChevronDown className="hda-manager-chevron" size={17} aria-hidden="true"/>
      <select aria-label="Manager" value={member.id} onChange={(event) => {
        setLocalSelection(event.target.value);
        onSelect?.(event.target.value);
      }}>{room.members.map(({ id, name }) => <option key={id} value={id}>{name}{id === viewer ? " (you)" : ""}</option>)}</select>
      </div>
    </div>
    {!scoring && member.id === viewer && member.reserved > 0 && <p className="hda-reserved">
      Active bids <strong>${member.reserved}</strong> · Uncommitted <strong>${member.availableCap}</strong></p>}
    </div>
    <div className="hda-roster-list"><table className="hda-slots"><caption className="hda-sr-only">Roster slots for {member.name}</caption>
      <thead className={scoring ? undefined : "hda-sr-only"}><tr><th scope="col">Slot</th><th scope="col">Player</th>
        <th scope="col">{scoring ? "FP" : "Price"}</th></tr></thead>
      <tbody>{assignRosterSlots(member.roster).map((player, index) => <tr key={slotNames[index]}>
        <th scope="row">{slotNames[index]}</th>
        <td>{player && <DailyPlayerName player={player}/>}</td>
        <td>{player && (scoring ? (player.points ?? 0).toFixed(2) : "$" + player.price)}</td>
      </tr>)}</tbody>
    </table></div>
    {scoring && <div className="hda-roster-total"><span>Team total</span><strong>{(member.points ?? 0).toFixed(2)} FP</strong></div>}
  </section>;
}

export function AuctionBoard({ room, session, command }) {
  const [selection, setSelection] = useState(null);
  const [activePanel, setActivePanel] = useState(0);
  const boardRef = useRef(null);
  const bidTriggerRef = useRef(null);
  const [, tick] = useReducer(value => value + 1, 0);
  const now = dailyNow();
  const endsAt = Date.parse(room.auctionEndsAt);
  const roomOpen = !Number.isFinite(endsAt) || now < endsAt;
  const live = room.phase === "auction" && room.joined && roomOpen;
  const minBid = nominationMinimum(room, now);
  useEffect(() => {
    if (room.phase !== "auction") return;
    let shownMinimum = minBid;
    let wasOpen = roomOpen;
    const timer = setInterval(() => {
      const currentTime = dailyNow();
      const nextMinimum = nominationMinimum(room, currentTime);
      const open = !Number.isFinite(endsAt) || currentTime < endsAt;
      // Avoid refiltering hundreds of pool rows on every countdown tick.
      if (nextMinimum !== shownMinimum || open !== wasOpen) {
        shownMinimum = nextMinimum;
        wasOpen = open;
        tick();
      }
    }, 500);
    return () => clearInterval(timer);
  }, [room, minBid, roomOpen, endsAt]);
  const prefix = "hd-" + room.id;
  const selectedPlayer = [...room.availablePlayers, ...room.auctions].find(player => player.id === selection && player.ownBid == null);
  function limitFor(player) {
    return room.bidLimits?.[positionGroup(player)] || { maxAmount: 0, reason: "Bid limits are unavailable." };
  }
  function bidButton(player, expired = false) {
    if (!room.joined) return null;
    const limit = limitFor(player);
    const minimum = playerMinimum(room, player, now);
    const belowMinimum = limit.maxAmount < minimum;
    const limitId = prefix + "-limit-" + positionGroup(player);
    return <button type="button" className="hda-bid" aria-label={"Bid on " + player.name}
      aria-describedby={live && limit.reason && room.bidLimits ? limitId : undefined}
      title={!live ? "Bidding is not open." : limit.reason || (belowMinimum
        ? `Minimum $${minimum} exceeds your available bid limit of $${limit.maxAmount}.`
        : `Minimum $${minimum} · Maximum bid $${limit.maxAmount}`)}
      disabled={!live || expired || command.isPending || belowMinimum}
      onClick={event => { bidTriggerRef.current = event.currentTarget; command.reset(); setSelection(player.id); }}>Bid</button>;
  }
  return <div className="hda-auction">
    {live && Object.entries(room.bidLimits || {}).map(([group, limit]) => limit.reason &&
      <span className="hda-sr-only" key={group} id={prefix + "-limit-" + group}>{limit.reason}</span>)}
    <nav className="hda-panel-nav" aria-label="Auction panels">
      {[["pool", "Player pool"], ["auctions", "Auctions"], ["roster", "Roster"]].map(([id, label], index) =>
        <a key={id} href={"#" + prefix + "-" + id} aria-current={activePanel === index ? "true" : undefined}
          onClick={event => {
            event.preventDefault();
            boardRef.current?.children[index]?.scrollIntoView({ block: "nearest", inline: "start", behavior: "instant" });
          }}>{label}</a>)}
    </nav>
    <div ref={boardRef} className="hda-board" onScroll={event => {
      const board = event.currentTarget;
      const panelWidth = board.children[1].offsetLeft - board.children[0].offsetLeft;
      setActivePanel(Math.round(board.scrollLeft / panelWidth));
    }}>
      <PlayerPool room={room} prefix={prefix} bidButton={bidButton} minBid={minBid} />
      <Auctions room={room} prefix={prefix} bidButton={bidButton} />
      <Roster room={room} viewer={session.user.id} />
    </div>
    {live && selectedPlayer && <BidEntry key={selectedPlayer.id} player={selectedPlayer} prefix={prefix}
      rising={room.biddingVersion === MINUTE_FLOOR_VERSION}
      returnFocusRef={bidTriggerRef}
      cap={limitFor(selectedPlayer).maxAmount} minBid={playerMinimum(room, selectedPlayer, now)} pending={command.isPending} error={command.error}
      disabled={limitFor(selectedPlayer).maxAmount < playerMinimum(room, selectedPlayer, now)}
      onCancel={() => { setSelection(null); command.reset(); }}
      onBid={(playerId, amount) => command.mutate({ action: "bids", body: { playerId, amount } },
        { onSuccess: () => setSelection(null) })} />}
  </div>;
}
