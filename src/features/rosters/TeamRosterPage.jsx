import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  CircleDollarSign,
  GripVertical,
  HeartPulse,
  List,
  Megaphone,
  Rows3,
} from "lucide-react";
import { Link } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import { teamColourClass, teamColourStyle } from "../../shared/teamIdentity.js";
import {
  buyOutRosterContract,
  moveRosterPlayer,
  saveRosterDisplayOrder,
  setTradeBlock,
  teamWorkspaceKeys,
} from "./teamWorkspaceQueries.js";

const CATEGORY_DETAILS = Object.freeze([
  { key: "Active", title: "Active roster", limit: 18 },
  { key: "Bench", title: "Bench", limit: 4 },
  { key: "Injured Reserve", title: "Injured reserve", limit: 4 },
  { key: "Prospect", title: "Prospects", limit: null },
]);

function money(cents) {
  if (cents === null) return "No contract";
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function fantasyPointsPerGame(statistics) {
  if (!statistics) return null;
  if (statistics.gamesPlayed === 0) return 0;
  return statistics.fantasyPointsHundredths / 100 / statistics.gamesPlayed;
}

function orderedPlayers(players, respectDisplayOrder = false) {
  return [...players].sort(
    (left, right) =>
      (left.normalizedPosition === "F" ? 0 : 1) -
        (right.normalizedPosition === "F" ? 0 : 1) ||
      (respectDisplayOrder &&
      Number.isInteger(left.displayOrder) &&
      Number.isInteger(right.displayOrder)
        ? left.displayOrder - right.displayOrder
        : respectDisplayOrder && Number.isInteger(left.displayOrder)
          ? -1
          : respectDisplayOrder && Number.isInteger(right.displayOrder)
            ? 1
            : (right.contract?.aavCents ?? -1) -
              (left.contract?.aavCents ?? -1)) ||
      left.name.localeCompare(right.name)
  );
}

function statisticValue(player, key) {
  if (!player.statistics) return -1;
  switch (key) {
    case "gamesPlayed":
      return player.statistics.gamesPlayed;
    case "goals":
      return player.statistics.goals;
    case "assists":
      return player.statistics.assists;
    case "nhlPoints":
      return player.statistics.nhlPoints;
    case "fantasyPoints":
      return player.statistics.fantasyPointsHundredths;
    case "fantasyPointsPerGame":
      return fantasyPointsPerGame(player.statistics);
    default:
      return -1;
  }
}

function sortedByStatistic(players, sort) {
  if (sort.key === "lineup") return players;
  return [...players].sort(
    (left, right) =>
      (left.normalizedPosition === "F" ? 0 : 1) -
        (right.normalizedPosition === "F" ? 0 : 1) ||
      (sort.direction === "asc" ? 1 : -1) *
        (statisticValue(left, sort.key) - statisticValue(right, sort.key)) ||
      left.name.localeCompare(right.name)
  );
}

function pointerDropTargetId(event) {
  const document = event.currentTarget?.ownerDocument;
  if (!document || typeof document.elementFromPoint !== "function") {
    return null;
  }
  return (
    document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest?.("[data-roster-order-id]")
      ?.getAttribute("data-roster-order-id") || null
  );
}

function pointerDropTargetCategory(event) {
  const document = event.currentTarget?.ownerDocument;
  if (!document || typeof document.elementFromPoint !== "function") {
    return null;
  }
  return (
    document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest?.("[data-roster-category]")
      ?.getAttribute("data-roster-category") || null
  );
}

function beginPointerDrag(event, ownershipId, onDragStart) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  onDragStart(ownershipId);
}

function endPointerCapture(event) {
  if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
}

function RosterActions({ leagueId, player, pending, onAction }) {
  const assetType = player.contract ? "contract" : "prospect_right";
  const assetId = player.contract?.id || player.playerId;
  const irDisabled =
    player.rosterCategory !== "Active" || !player.injuredReserveEligible;
  const rosterMove =
    player.rosterCategory === "Active"
      ? { type: "bench", label: "Move to bench", Icon: ArrowDown }
      : player.rosterCategory === "Bench"
        ? { type: "active", label: "Move to active", Icon: ArrowUp }
        : null;

  return (
    <div className="hl-roster-actions">
      <button
        type="button"
        className="hl-roster-action"
        disabled={pending || !player.contract}
        onClick={() => onAction("buyout", player)}
        aria-label={`Buy out ${player.name}`}
        title={
          player.contract
            ? `Buy out ${player.name}`
            : "This player does not have an active contract."
        }
      >
        <CircleDollarSign aria-hidden="true" />
        <span>Buyout</span>
      </button>
      <button
        type="button"
        className="hl-roster-action"
        disabled={pending || irDisabled}
        onClick={() => onAction("ir", player)}
        aria-label={`Move ${player.name} to injured reserve`}
        title={
          irDisabled
            ? `${player.name} is not currently eligible for injured reserve`
            : `Move ${player.name} to injured reserve`
        }
      >
        <HeartPulse aria-hidden="true" />
        <span>Move to IR</span>
      </button>
      {rosterMove && (
        <button
          type="button"
          className="hl-roster-action"
          disabled={pending}
          onClick={() => onAction(rosterMove.type, player)}
          aria-label={`${rosterMove.label} ${player.name}`}
          title={`${rosterMove.label} ${player.name}`}
        >
          <rosterMove.Icon aria-hidden="true" />
          <span>{rosterMove.label}</span>
        </button>
      )}
      <Link
        className="hl-roster-action"
        to={routePaths.leagueTradeForAsset(leagueId, assetType, assetId)}
        aria-label={`Add ${player.name} to a trade`}
        title={`Add ${player.name} to a trade`}
      >
        <ArrowLeftRight aria-hidden="true" />
        <span>Trade</span>
      </Link>
      <button
        type="button"
        className={`hl-roster-action${
          player.onTradeBlock ? " is-active" : ""
        }`}
        disabled={pending}
        aria-pressed={player.onTradeBlock}
        onClick={() => onAction("trade-block", player)}
        aria-label={`${player.onTradeBlock ? "Remove" : "Add"} ${
          player.name
        } ${player.onTradeBlock ? "from" : "to"} the trade block`}
        title={`${player.onTradeBlock ? "Remove from" : "Add to"} trade block`}
      >
        <Megaphone aria-hidden="true" />
        <span>
          {player.onTradeBlock
            ? "Remove from trade block"
            : "Add to trade block"}
        </span>
      </button>
    </div>
  );
}

function RosterSortHeading({ label, sortKey, sort, onSort }) {
  return (
    <button
      type="button"
      className="hl-sort-button"
      onClick={() => onSort(sortKey)}
      aria-label={`Sort roster by ${label}`}
    >
      {label}
      {sort.key === sortKey
        ? sort.direction === "asc"
          ? " ↑"
          : " ↓"
        : ""}
    </button>
  );
}

function CategoryTable({
  category,
  players,
  canManage = false,
  draggingId = null,
  dragTargetId = null,
  onDragStart,
  onDragTarget,
  onDragEnd,
  onCategoryDrop,
  onMove,
  onAction,
  actionPending = false,
  leagueId,
  sort,
  onSort,
}) {
  const forwards = players.filter(
    ({ normalizedPosition }) => normalizedPosition === "F"
  ).length;
  const defence = players.length - forwards;
  const displayedPlayers = sortedByStatistic(players, sort);
  const draggable =
    ["Active", "Bench"].includes(category.key) && canManage;
  const capacity =
    category.key === "Active"
      ? `${players.length}/18 used · F ${forwards}/12 · D ${defence}/6`
      : category.limit === null
        ? `${players.length} held · unlimited eligible slots`
        : `${players.length}/${category.limit} used · ${Math.max(
            0,
            category.limit - players.length
          )} available`;
  const headingId = `roster-${category.key.replaceAll(" ", "-")}`;

  return (
    <section
      className="hl-surface hl-roster-category"
      aria-labelledby={headingId}
      data-roster-category={category.key}
      onDragOver={(event) => {
        if (!draggable) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        if (!draggable || event.defaultPrevented) return;
        event.preventDefault();
        const sourceId =
          (typeof event.dataTransfer.getData === "function"
            ? event.dataTransfer.getData("text/plain")
            : "") || draggingId;
        onCategoryDrop(sourceId, category.key, null, displayedPlayers);
      }}
    >
      <div className="hl-roster-category__heading">
        <h2 id={headingId}>{category.title}</h2>
        <span>{capacity}</span>
      </div>
      {players.length === 0 ? (
        <p className="hl-roster-category__empty">
          No players occupy this category.
        </p>
      ) : (
        <div className="hl-table-scroll">
          <table className="hl-data-table hl-roster-table">
            <thead>
              <tr>
                {draggable && <th scope="col">Order</th>}
                <th scope="col">Pos</th>
                <th scope="col">Player</th>
                <th scope="col">AAV</th>
                <th scope="col">Years</th>
                <th scope="col">Age</th>
                {[
                  ["GP", "gamesPlayed"],
                  ["G", "goals"],
                  ["A", "assists"],
                  ["P", "nhlPoints"],
                  ["FP", "fantasyPoints"],
                  ["FPG", "fantasyPointsPerGame"],
                ].map(([label, sortKey]) => (
                  <th className="hl-roster-stat" key={sortKey} scope="col">
                    <RosterSortHeading
                      label={label}
                      sortKey={sortKey}
                      sort={sort}
                      onSort={onSort}
                    />
                  </th>
                ))}
                {canManage && <th scope="col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {displayedPlayers.map((player) => (
                <tr
                  key={player.ownershipId}
                  className={[
                    draggingId === player.ownershipId ? "is-dragging" : "",
                    dragTargetId === player.ownershipId
                      ? "is-drop-target"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-roster-order-id={
                    draggable ? player.ownershipId : undefined
                  }
                  data-roster-category={category.key}
                  onDragOver={(event) => {
                    if (!draggable) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    if (!draggable) return;
                    event.preventDefault();
                    event.stopPropagation();
                    const sourceId =
                      (typeof event.dataTransfer.getData === "function"
                        ? event.dataTransfer.getData("text/plain")
                        : "") || draggingId;
                    onCategoryDrop(
                      sourceId,
                      category.key,
                      player.ownershipId,
                      displayedPlayers
                    );
                  }}
                >
                  {draggable && (
                    <td>
                      <div className="hl-roster-order-controls">
                        <button
                          type="button"
                          className="hl-roster-drag-handle"
                          aria-label={`Drag ${player.name} to reorder`}
                          title={`Drag ${player.name} to reorder`}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData(
                              "text/plain",
                              player.ownershipId
                            );
                            onDragStart(player.ownershipId);
                          }}
                          onDragEnd={onDragEnd}
                          onPointerDown={(event) =>
                            beginPointerDrag(
                              event,
                              player.ownershipId,
                              onDragStart
                            )
                          }
                          onPointerMove={(event) => {
                            if (draggingId !== player.ownershipId) return;
                            onDragTarget(pointerDropTargetId(event));
                          }}
                          onPointerUp={(event) => {
                            const targetId =
                              pointerDropTargetId(event) || dragTargetId;
                            const targetCategory =
                              pointerDropTargetCategory(event) || category.key;
                            endPointerCapture(event);
                            onCategoryDrop(
                              player.ownershipId,
                              targetCategory,
                              targetId,
                              displayedPlayers
                            );
                          }}
                          onPointerCancel={(event) => {
                            endPointerCapture(event);
                            onDragEnd();
                          }}
                          onKeyDown={(event) => {
                            if (
                              category.key === "Active" &&
                              event.key === "ArrowUp"
                            ) {
                              event.preventDefault();
                              onMove(
                                player.ownershipId,
                                -1,
                                displayedPlayers
                              );
                            } else if (
                              category.key === "Active" &&
                              event.key === "ArrowDown"
                            ) {
                              event.preventDefault();
                              onMove(
                                player.ownershipId,
                                1,
                                displayedPlayers
                              );
                            }
                          }}
                        >
                          <GripVertical aria-hidden="true" />
                          <span className="hl-visually-hidden">
                            Use the up and down arrow keys to change order.
                          </span>
                        </button>
                      </div>
                    </td>
                  )}
                  <td>
                    <span className="hl-position-tag">
                      {player.normalizedPosition}
                    </span>
                  </td>
                  <th scope="row">{player.name}</th>
                  <td className="is-mono">
                    {money(player.contract?.aavCents ?? null)}
                  </td>
                  <td>{player.contract?.remainingYears ?? "—"}</td>
                  <td>{player.age ?? "Unknown"}</td>
                  <td className="hl-roster-stat">{player.statistics?.gamesPlayed ?? "—"}</td>
                  <td className="hl-roster-stat">{player.statistics?.goals ?? "—"}</td>
                  <td className="hl-roster-stat">{player.statistics?.assists ?? "—"}</td>
                  <td className="hl-roster-stat">{player.statistics?.nhlPoints ?? "—"}</td>
                  <td className="hl-roster-stat">
                    {player.statistics
                      ? (
                          player.statistics.fantasyPointsHundredths / 100
                        ).toFixed(2)
                      : "—"}
                  </td>
                  <td className="hl-roster-stat">
                    {player.statistics
                      ? fantasyPointsPerGame(player.statistics).toFixed(2)
                      : "—"}
                  </td>
                  {canManage && (
                    <td className="hl-roster-actions-cell">
                      <RosterActions
                        leagueId={leagueId}
                        player={player}
                        pending={actionPending}
                        onAction={onAction}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function chunk(values, size, count) {
  return Array.from({ length: count }, (_, index) =>
    values.slice(index * size, index * size + size)
  );
}

function LinePlayer({
  player,
  canManage,
  draggingId,
  dragTargetId,
  onDragStart,
  onDragTarget,
  onDragEnd,
  onCategoryDrop,
  onMove,
}) {
  if (!player) {
    return <div className="hl-line-player is-empty">Open slot</div>;
  }
  return (
    <div
      className={[
        "hl-line-player",
        draggingId === player.ownershipId ? "is-dragging" : "",
        dragTargetId === player.ownershipId ? "is-drop-target" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-roster-order-id={canManage ? player.ownershipId : undefined}
      data-roster-category="Active"
      onDragOver={(event) => {
        if (canManage) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const sourceId =
          (typeof event.dataTransfer.getData === "function"
            ? event.dataTransfer.getData("text/plain")
            : "") || draggingId;
        onCategoryDrop(sourceId, "Active", player.ownershipId);
      }}
    >
      {canManage && (
        <button
          type="button"
          className="hl-line-player__drag-handle"
          aria-label={`Drag ${player.name} to reorder`}
          title={`Drag ${player.name} to reorder`}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", player.ownershipId);
            onDragStart(player.ownershipId);
          }}
          onDragEnd={onDragEnd}
          onPointerDown={(event) =>
            beginPointerDrag(event, player.ownershipId, onDragStart)
          }
          onPointerMove={(event) => {
            if (draggingId !== player.ownershipId) return;
            onDragTarget(pointerDropTargetId(event));
          }}
          onPointerUp={(event) => {
            const targetId = pointerDropTargetId(event) || dragTargetId;
            const targetCategory =
              pointerDropTargetCategory(event) || "Active";
            endPointerCapture(event);
            onCategoryDrop(
              player.ownershipId,
              targetCategory,
              targetId
            );
          }}
          onPointerCancel={(event) => {
            endPointerCapture(event);
            onDragEnd();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              onMove(player.ownershipId, -1);
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              onMove(player.ownershipId, 1);
            }
          }}
        >
          <GripVertical aria-hidden="true" />
          <span className="hl-visually-hidden">
            Use the up and down arrow keys to change order.
          </span>
        </button>
      )}
      <span>
        <strong>{player.name}</strong>
        <small>
          {money(player.contract?.aavCents ?? null)} ·{" "}
          {player.statistics
            ? `${(player.statistics.fantasyPointsHundredths / 100).toFixed(2)} FP`
            : "No stats"}
        </small>
      </span>
    </div>
  );
}

function HockeyLines({
  activePlayers,
  canManage,
  draggingId,
  dragTargetId,
  onDragStart,
  onDragTarget,
  onDragEnd,
  onCategoryDrop,
  onMove,
}) {
  const forwards = activePlayers.filter(
    ({ normalizedPosition }) => normalizedPosition === "F"
  );
  const defence = activePlayers.filter(
    ({ normalizedPosition }) => normalizedPosition === "D"
  );
  return (
    <section
      className="hl-hockey-lines"
      aria-labelledby="hockey-lines-title"
      data-roster-category="Active"
      onDragOver={(event) => {
        if (!canManage) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        if (!canManage || event.defaultPrevented) return;
        event.preventDefault();
        const sourceId =
          (typeof event.dataTransfer.getData === "function"
            ? event.dataTransfer.getData("text/plain")
            : "") || draggingId;
        onCategoryDrop(sourceId, "Active", null);
      }}
    >
      <div className="hl-roster-category__heading">
        <div>
          <p className="hl-eyebrow">Line arrangement</p>
          <h2 id="hockey-lines-title">Hockey lines</h2>
        </div>
        <span>
          {canManage
            ? "Drag players to set the lines. A focused handle also accepts Up and Down arrow keys."
            : "Viewing the manager’s saved order."}
        </span>
      </div>
      <div className="hl-lines-section">
        <h3>Forwards</h3>
        {chunk(forwards, 3, 4).map((line, lineIndex) => (
          <div className="hl-hockey-line" key={`forward-${lineIndex}`}>
            <strong>Line {lineIndex + 1}</strong>
            <div>
              {Array.from({ length: 3 }, (_, slotIndex) => {
                const player = line[slotIndex] || null;
                const absoluteIndex = lineIndex * 3 + slotIndex;
                return (
                  <LinePlayer
                    key={player?.ownershipId || `f-open-${absoluteIndex}`}
                    player={player}
                    canManage={canManage}
                    draggingId={draggingId}
                    dragTargetId={dragTargetId}
                    onDragStart={onDragStart}
                    onDragTarget={onDragTarget}
                    onDragEnd={onDragEnd}
                    onCategoryDrop={onCategoryDrop}
                    onMove={onMove}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="hl-lines-section">
        <h3>Defence</h3>
        {chunk(defence, 2, 3).map((pair, pairIndex) => (
          <div className="hl-hockey-line" key={`defence-${pairIndex}`}>
            <strong>Pair {pairIndex + 1}</strong>
            <div>
              {Array.from({ length: 2 }, (_, slotIndex) => {
                const player = pair[slotIndex] || null;
                const absoluteIndex = pairIndex * 2 + slotIndex;
                return (
                  <LinePlayer
                    key={player?.ownershipId || `d-open-${absoluteIndex}`}
                    player={player}
                    canManage={canManage}
                    draggingId={draggingId}
                    dragTargetId={dragTargetId}
                    onDragStart={onDragStart}
                    onDragTarget={onDragTarget}
                    onDragEnd={onDragEnd}
                    onCategoryDrop={onCategoryDrop}
                    onMove={onMove}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DraftPicks({ picks }) {
  const bySeason = picks.reduce((groups, pick) => {
    const key = pick.targetSeason.id;
    if (!groups.has(key)) {
      groups.set(key, { label: pick.targetSeason.label, picks: [] });
    }
    groups.get(key).picks.push(pick);
    return groups;
  }, new Map());
  const seasons = [...bySeason.values()]
    .map((season) => ({
      ...season,
      picks: [...season.picks].sort(
        (left, right) =>
          left.round - right.round ||
          left.position - right.position ||
          left.id.localeCompare(right.id)
      ),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
  return (
    <section className="hl-surface hl-draft-picks" aria-labelledby="draft-picks-title">
      <div className="hl-roster-category__heading">
        <div>
          <p className="hl-eyebrow">Four-year inventory</p>
          <h2 id="draft-picks-title">Owned draft picks</h2>
        </div>
        <span>{picks.length} picks</span>
      </div>
      {picks.length === 0 ? (
        <p>No unused draft picks are currently owned by this team.</p>
      ) : (
        <div className="hl-draft-pick-grid">
          {seasons.map((season) => (
            <article key={season.label}>
              <h3>{season.label}</h3>
              <ul>
                {season.picks.map((pick) => (
                  <li key={pick.id}>
                    <strong>Round {pick.round}</strong>
                    <span>
                      Pick {pick.position} · originally{" "}
                      {pick.originalTeam.name}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function TeamRosterPage({
  workspace,
  teams,
  managerName,
  onTeamChange,
  httpClient,
}) {
  const queryClient = useQueryClient();
  const { cap, league, season, team } = workspace;
  const legality = workspace.legality ?? { legal: true, reasons: [] };
  const [view, setView] = useState("table");
  const [activePlayers, setActivePlayers] = useState(() =>
    orderedPlayers(
      workspace.players.filter(
        ({ rosterCategory }) => rosterCategory === "Active"
      ),
      workspace.orderVersion > 0
    )
  );
  const [draggingId, setDraggingId] = useState(null);
  const [dragTargetId, setDragTargetId] = useState(null);
  const [rosterSort, setRosterSort] = useState({
    key: "lineup",
    direction: "asc",
  });
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    // This local order is the optimistic drag state and must be replaced when
    // the authoritative team workspace or saved order changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActivePlayers(
      orderedPlayers(
        workspace.players.filter(
          ({ rosterCategory }) => rosterCategory === "Active"
        ),
        workspace.orderVersion > 0
      )
    );
  }, [workspace.orderVersion, workspace.players]);

  const mutation = useMutation({
    mutationFn: (nextPlayers) =>
      saveRosterDisplayOrder(httpClient, league.id, team.id, {
        expectedVersion: workspace.orderVersion,
        forwardOwnerships: nextPlayers
          .filter(({ normalizedPosition }) => normalizedPosition === "F")
          .map(({ ownershipId: id, ownershipVersion: version }) => ({
            id,
            version,
          })),
        defenceOwnerships: nextPlayers
          .filter(({ normalizedPosition }) => normalizedPosition === "D")
          .map(({ ownershipId: id, ownershipVersion: version }) => ({
            id,
            version,
          })),
      }),
    onSuccess: async () => {
      setSaveMessage("Line order saved.");
      await queryClient.invalidateQueries({
        queryKey: teamWorkspaceKeys.detail(league.id, team.id),
      });
    },
    onError: (error) => {
      setSaveMessage(
        error.message || "The line order could not be saved. Refresh and retry."
      );
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ type, player }) => {
      if (type === "buyout") {
        return buyOutRosterContract(
          httpClient,
          league.id,
          team.id,
          player
        );
      }
      const destinationCategory = {
        active: "Active",
        bench: "Bench",
        ir: "Injured Reserve",
      }[type];
      if (destinationCategory) {
        const input = {
          confirmedIllegal: false,
          destinationCategory,
          expectedVersion: player.ownershipVersion,
        };
        try {
          return await moveRosterPlayer(
            httpClient,
            league.id,
            team.id,
            player.ownershipId,
            input
          );
        } catch (error) {
          if (
            error?.code !== "ROSTER_ILLEGAL_CONFIRMATION_REQUIRED" ||
            !globalThis.confirm(
              `Moving ${player.name} to ${destinationCategory} will create an illegal roster. Continue and fix the highlighted roster issues afterward?`
            )
          ) {
            throw error;
          }
          return moveRosterPlayer(
            httpClient,
            league.id,
            team.id,
            player.ownershipId,
            { ...input, confirmedIllegal: true }
          );
        }
      }
      return setTradeBlock(
        httpClient,
        league.id,
        team.id,
        player.ownershipId,
        {
          blocked: !player.onTradeBlock,
          expectedVersion: player.ownershipVersion,
        }
      );
    },
    onSuccess: async (_result, { type, player }) => {
      setSaveMessage(
        type === "buyout"
          ? `${player.name} was bought out.`
          : type === "ir"
            ? `${player.name} was moved to injured reserve.`
            : type === "bench"
              ? `${player.name} was moved to the bench.`
              : type === "active"
                ? `${player.name} was moved to the active roster.`
            : `${player.name} was ${
                player.onTradeBlock ? "removed from" : "added to"
              } the trade block.`
      );
      await queryClient.invalidateQueries({
        queryKey: teamWorkspaceKeys.detail(league.id, team.id),
      });
    },
    onError: (error) => {
      setSaveMessage(
        error.message || "The roster action could not be completed."
      );
    },
  });

  function runRosterAction(type, player) {
    if (
      type === "buyout" &&
      !globalThis.confirm(
        `Buy out ${player.name}'s contract? This creates an authoritative buyout penalty and cannot be undone here.`
      )
    ) {
      return;
    }
    setSaveMessage("");
    actionMutation.mutate({ type, player });
  }

  function reorder(sourceId, targetId, basisPlayers = activePlayers) {
    if (
      !workspace.canManage ||
      mutation.isPending ||
      !sourceId ||
      sourceId === targetId
    ) {
      setDraggingId(null);
      setDragTargetId(null);
      return;
    }
    const source = basisPlayers.find(
      ({ ownershipId }) => ownershipId === sourceId
    );
    const target = basisPlayers.find(
      ({ ownershipId }) => ownershipId === targetId
    );
    if (!source || !target || source.normalizedPosition !== target.normalizedPosition) {
      setSaveMessage("Players can be reordered only within the same position group.");
      setDraggingId(null);
      setDragTargetId(null);
      return;
    }
    const positionPlayers = basisPlayers.filter(
      ({ normalizedPosition }) => normalizedPosition === source.normalizedPosition
    );
    const from = positionPlayers.findIndex(
      ({ ownershipId }) => ownershipId === sourceId
    );
    const to = positionPlayers.findIndex(
      ({ ownershipId }) => ownershipId === targetId
    );
    const reorderedPosition = [...positionPlayers];
    const [moved] = reorderedPosition.splice(from, 1);
    reorderedPosition.splice(to, 0, moved);
    const next = ["F", "D"].flatMap((position) =>
      position === source.normalizedPosition
        ? reorderedPosition
        : basisPlayers.filter(
            ({ normalizedPosition }) => normalizedPosition === position
          )
    );
    setActivePlayers(next);
    setRosterSort({ key: "lineup", direction: "asc" });
    setDraggingId(null);
    setDragTargetId(null);
    setSaveMessage("Saving line order…");
    mutation.mutate(next);
  }

  function handleRosterDrop(
    sourceId,
    destinationCategory,
    targetId,
    basisPlayers = activePlayers
  ) {
    const source = workspace.players.find(
      ({ ownershipId }) => ownershipId === sourceId
    );
    if (
      !source ||
      !["Active", "Bench"].includes(destinationCategory) ||
      actionMutation.isPending
    ) {
      endDrag();
      return;
    }
    if (source.rosterCategory === destinationCategory) {
      if (destinationCategory === "Active" && targetId) {
        reorder(sourceId, targetId, basisPlayers);
      } else {
        endDrag();
      }
      return;
    }
    if (
      ![
        "Active:Bench",
        "Bench:Active",
      ].includes(`${source.rosterCategory}:${destinationCategory}`)
    ) {
      setSaveMessage("Players can move directly only between Active and Bench.");
      endDrag();
      return;
    }
    setSaveMessage("");
    endDrag();
    actionMutation.mutate({
      type: destinationCategory === "Active" ? "active" : "bench",
      player: source,
    });
  }

  function endDrag() {
    setDraggingId(null);
    setDragTargetId(null);
  }

  function move(sourceId, direction, basisPlayers = activePlayers) {
    const source = basisPlayers.find(
      ({ ownershipId }) => ownershipId === sourceId
    );
    if (!source) return;
    const peers = basisPlayers.filter(
      ({ normalizedPosition }) => normalizedPosition === source.normalizedPosition
    );
    const index = peers.findIndex(({ ownershipId }) => ownershipId === sourceId);
    const target = peers[index + direction];
    if (target) reorder(sourceId, target.ownershipId, basisPlayers);
  }

  function changeRosterSort(key) {
    setRosterSort((current) =>
      current.key === key
        ? {
            key,
            direction: current.direction === "asc" ? "desc" : "asc",
          }
        : { key, direction: "desc" }
    );
  }

  const overCap = cap.spaceCents < 0;
  const statCards = useMemo(
    () => [
      ["Usage", money(cap.usageCents), "All current cap charges"],
      ["Space", money(cap.spaceCents), overCap ? "Over cap" : "Available"],
      ["Active salary", money(cap.activePlayerCents), "Net active AAV"],
      [
        "Retained salary",
        money(cap.retainedSalaryCents),
        `${cap.retentionSlotsUsed}/${cap.retentionSlotLimit} slots used`,
      ],
      ["Buyout penalties", money(cap.buyoutPenaltyCents), "Current season"],
    ],
    [cap, overCap]
  );

  return (
    <div className="hl-team-roster">
      <header
        className={teamColourClass(
          "hl-surface hl-roster-hero hl-roster-hero--striped",
          team
        )}
        style={teamColourStyle(team)}
      >
        <div className="hl-roster-identity">
          <div className="hl-team-logo">
            {team.logoReference ? (
              <img src={team.logoReference} alt={`${team.name} logo`} />
            ) : (
              <span aria-hidden="true">
                {team.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="hl-eyebrow">
              {league.name} · {season.label}
            </p>
            <label className="hl-team-switcher">
              <span>Viewing team</span>
              <select
                value={team.id}
                onChange={(event) => onTeamChange(event.target.value)}
                aria-label="Choose a team roster"
              >
                {teams.map((option) => (
                  <option value={option.id} key={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <h1 id="team-title">{team.name}</h1>
            <p>
              {managerName
                ? `Manager: ${managerName}`
                : "No manager is currently assigned."}
            </p>
          </div>
        </div>
      </header>

      <section className="hl-roster-cap" aria-labelledby="cap-summary-title">
        <div className="hl-section-title">
          <p className="hl-eyebrow">Team finances</p>
          <h2 id="cap-summary-title">Salary cap</h2>
        </div>
        <div className="hl-stat-grid hl-stat-grid--readable">
          {statCards.map(([label, value, detail]) => (
            <div className="hl-surface hl-stat-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{detail}</small>
            </div>
          ))}
        </div>
        <p className={`hl-cap-note${overCap ? " is-warning" : ""}`}>
          Cap status: <strong>{overCap ? "Over cap" : "Within cap"}</strong>.
          Usage is active-player AAV plus retained salary and buyout penalties.
        </p>
      </section>

      {!legality.legal && (
        <div className="hl-roster-illegal" role="alert">
          <strong>Illegal roster</strong>
          <span>
            {legality.reasons.length} authoritative issue
            {legality.reasons.length === 1 ? "" : "s"} must be fixed
            before this roster is legal.
          </span>
        </div>
      )}

      <div className="hl-view-toggle" role="group" aria-label="Roster view">
        <button
          type="button"
          className={view === "table" ? "is-active" : ""}
          aria-pressed={view === "table"}
          onClick={() => setView("table")}
        >
          <List aria-hidden="true" /> Table
        </button>
        <button
          type="button"
          className={view === "lines" ? "is-active" : ""}
          aria-pressed={view === "lines"}
          onClick={() => setView("lines")}
        >
          <Rows3 aria-hidden="true" /> Hockey lines
        </button>
      </div>
      {saveMessage && (
        <p
          className={`hl-form-message${
            mutation.isError || actionMutation.isError ? " is-error" : ""
          }`}
          role="status"
        >
          {saveMessage}
        </p>
      )}

      {view === "lines" ? (
        <>
          <HockeyLines
            activePlayers={activePlayers}
            canManage={workspace.canManage && !mutation.isPending}
            draggingId={draggingId}
            dragTargetId={dragTargetId}
            onDragStart={setDraggingId}
            onDragTarget={setDragTargetId}
            onDragEnd={endDrag}
            onCategoryDrop={handleRosterDrop}
            onMove={move}
          />
          <div className="hl-roster-categories">
            {CATEGORY_DETAILS.filter(({ key }) => key !== "Active").map(
              (category) => (
                <CategoryTable
                  key={category.key}
                  category={category}
                  players={workspace.players.filter(
                    ({ rosterCategory }) => rosterCategory === category.key
                  )}
                  sort={rosterSort}
                  onSort={changeRosterSort}
                  canManage={workspace.canManage}
                  draggingId={draggingId}
                  dragTargetId={dragTargetId}
                  onDragStart={setDraggingId}
                  onDragTarget={setDragTargetId}
                  onDragEnd={endDrag}
                  onCategoryDrop={handleRosterDrop}
                  onMove={move}
                  leagueId={league.id}
                  onAction={runRosterAction}
                  actionPending={actionMutation.isPending}
                />
              )
            )}
          </div>
        </>
      ) : (
        <div className="hl-roster-categories">
          {CATEGORY_DETAILS.map((category) => (
            <CategoryTable
              key={category.key}
              category={category}
              players={
                category.key === "Active"
                  ? activePlayers
                  : workspace.players.filter(
                      ({ rosterCategory }) =>
                        rosterCategory === category.key
                    )
              }
              canManage={
                workspace.canManage &&
                !(category.key === "Active" && mutation.isPending)
              }
              draggingId={draggingId}
              dragTargetId={dragTargetId}
              onDragStart={setDraggingId}
              onDragTarget={setDragTargetId}
              onDragEnd={endDrag}
              onCategoryDrop={handleRosterDrop}
              onMove={move}
              sort={rosterSort}
              onSort={changeRosterSort}
              leagueId={league.id}
              onAction={runRosterAction}
              actionPending={actionMutation.isPending}
            />
          ))}
        </div>
      )}

      <DraftPicks picks={workspace.draftPicks} />
    </div>
  );
}
