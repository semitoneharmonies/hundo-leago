import { createElement, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  CircleDollarSign,
  FileSignature,
  GripVertical,
  HeartPulse,
  List,
  Megaphone,
  Rows3,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  ErrorBlock,
  PositionTag,
  StatusBadge,
  TableScroll,
  TeamMark,
} from "../../components/HundoUi.jsx";
import { teamColourClass, teamColourStyle } from "../../shared/teamIdentity.js";
import {
  buyOutRosterContract,
  declineProspectFantasyElc,
  moveRosterPlayer,
  releaseUnsignedProspectRights,
  saveRosterDisplayOrder,
  setTradeBlock,
  signProspectFantasyElc,
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

function nhlTeamAbbreviation(player) {
  return (
    player.nhlTeamAbbreviation ||
    player.provider?.nhlTeamAbbreviation ||
    "—"
  );
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

function RosterActions({
  leagueId,
  teamId,
  player,
  pending,
  onAction,
  prospectDecisionAllowed = false,
}) {
  const assetType =
    player.rosterCategory === "Prospect"
      ? "prospect_right"
      : "contract";
  const assetId =
    assetType === "prospect_right"
      ? player.playerId
      : player.contract?.id;
  const unsignedProspect =
    player.rosterCategory === "Prospect" &&
    player.ownershipKind === "Prospect Right" &&
    !player.contract;
  const signedProspect =
    player.rosterCategory === "Prospect" &&
    player.ownershipKind === "Prospect Right" &&
    player.contract?.type === "fantasy_elc";
  const irDisabled =
    player.rosterCategory !== "Active" || !player.injuredReserveEligible;
  const rosterMove =
    player.rosterCategory === "Active"
      ? { type: "bench", label: "Move to bench", Icon: ArrowDown }
      : player.rosterCategory === "Bench"
        ? { type: "active", label: "Move to active", Icon: ArrowUp }
        : player.rosterCategory === "Injured Reserve"
          ? {
              type: "active",
              label: "Move to active",
              Icon: ArrowUp,
              title: `Move ${player.name} to active before moving them to the bench`,
            }
        : null;

  return (
    <div className="hl-roster-actions">
      {unsignedProspect && prospectDecisionAllowed && (
        <>
          {[
            [
              "prospect-sign-prospect",
              "Sign ELC and keep in prospects",
              FileSignature,
            ],
            ["prospect-sign-active", "Sign ELC and move to active", ArrowUp],
            ["prospect-sign-bench", "Sign ELC and move to bench", ArrowDown],
            [
              "prospect-sign-ir",
              "Sign ELC and move to injured reserve",
              HeartPulse,
            ],
          ].map(([type, label, Icon]) => (
            <button
              key={type}
              type="button"
              className="hl-roster-action"
              disabled={
                pending ||
                (type === "prospect-sign-ir" &&
                  !player.injuredReserveEligible)
              }
              onClick={() => onAction(type, player)}
              aria-label={`${label} ${player.name}`}
              title={
                type === "prospect-sign-ir" &&
                !player.injuredReserveEligible
                  ? `${player.name} is not currently eligible for injured reserve`
                  : `${label} ${player.name}`
              }
            >
              {createElement(Icon, { "aria-hidden": true })}
              <span>{label}</span>
            </button>
          ))}
          <button
            type="button"
            className="hl-roster-action"
            disabled={pending}
            onClick={() => onAction("prospect-decline", player)}
            aria-label={`Decline ELC for ${player.name}`}
            title={`Decline ELC for ${player.name} and release their rights`}
          >
            <XCircle aria-hidden="true" />
            <span>Decline ELC</span>
          </button>
          <button
            type="button"
            className="hl-roster-action"
            disabled={pending}
            onClick={() => onAction("prospect-release", player)}
            aria-label={`Release unsigned prospect rights for ${player.name}`}
            title={`Release unsigned prospect rights for ${player.name}`}
          >
            <Trash2 aria-hidden="true" />
            <span>Release rights</span>
          </button>
        </>
      )}
      {signedProspect && (
        <>
          {[
            ["active", "Move to active", ArrowUp],
            ["bench", "Move to bench", ArrowDown],
            ["ir", "Move to injured reserve", HeartPulse],
          ].map(([type, label, Icon]) => (
            <button
              key={type}
              type="button"
              className="hl-roster-action"
              disabled={
                pending ||
                (type === "ir" && !player.injuredReserveEligible)
              }
              onClick={() => onAction(type, player)}
              aria-label={`${label} ${player.name}`}
              title={
                type === "ir" && !player.injuredReserveEligible
                  ? `${player.name} is not currently eligible for injured reserve`
                  : `${label} ${player.name}`
              }
            >
              {createElement(Icon, { "aria-hidden": true })}
              <span>{label}</span>
            </button>
          ))}
          <button
            type="button"
            className="hl-roster-action"
            disabled={pending}
            onClick={() => onAction("buyout", player)}
            aria-label={`Buy out ${player.name}`}
            title={`Buy out ${player.name}`}
          >
            <CircleDollarSign aria-hidden="true" />
            <span>Buyout</span>
          </button>
        </>
      )}
      {player.rosterCategory !== "Prospect" && (
        <>
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
              title={rosterMove.title || `${rosterMove.label} ${player.name}`}
            >
              <rosterMove.Icon aria-hidden="true" />
              <span>{rosterMove.label}</span>
            </button>
          )}
        </>
      )}
      <Link
        className="hl-roster-action"
        to={routePaths.leagueTradeForOfferedAsset(
          leagueId,
          teamId,
          assetType,
          assetId
        )}
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

function TradeRequestAction({
  leagueId,
  proposingTeamId,
  sourceTeamId,
  player,
}) {
  const assetType =
    player.rosterCategory === "Prospect"
      ? "prospect_right"
      : "contract";
  const assetId =
    assetType === "prospect_right"
      ? player.playerId
      : player.contract?.id;
  return (
    <Link
      className="hl-roster-action is-request"
      to={routePaths.leagueTradeForRequestedAsset(
        leagueId,
        proposingTeamId,
        sourceTeamId,
        assetType,
        assetId
      )}
      aria-label={`Request ${player.name} in a trade`}
      title={`Request ${player.name} in a trade`}
    >
      <ArrowLeftRight aria-hidden="true" />
      <span>Request trade</span>
    </Link>
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
  canRequestTrade = false,
  prospectDecisionAllowed = false,
  leagueId,
  requestingTeamId = null,
  viewedTeamId,
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
      {category.key === "Prospect" && prospectDecisionAllowed && (
        <p className="hl-form-note" role="note">
          Before signing, confirm the player has signed their real-life NHL
          entry-level contract. A fantasy ELC is $3 over three seasons and
          cannot be undone here.
        </p>
      )}
      {players.length === 0 ? (
        <p className="hl-roster-category__empty">
          No players occupy this category.
        </p>
      ) : (
        <TableScroll label={`${category.title} table`}>
          <table className="hl-data-table hl-player-row-table hl-roster-table">
            <thead>
              <tr>
                <th className="hl-player-col-order" scope="col">
                  Order
                </th>
                <th className="hl-player-col-position" scope="col">
                  Pos
                </th>
                <th className="hl-player-col-name" scope="col">
                  Player
                </th>
                <th className="hl-player-col-aav" scope="col">AAV / FA</th>
                <th className="hl-player-col-years" scope="col">Years</th>
                <th className="hl-player-col-age" scope="col">Age</th>
                <th className="hl-player-col-nhl" scope="col">NHL</th>
                {[
                  ["GP", "gamesPlayed"],
                  ["G", "goals"],
                  ["A", "assists"],
                  ["P", "nhlPoints"],
                  ["FP", "fantasyPoints"],
                  ["FPG", "fantasyPointsPerGame"],
                ].map(([label, sortKey]) => (
                  <th
                    aria-sort={
                      sort.key === sortKey
                        ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className="hl-player-col-stat hl-roster-stat"
                    key={sortKey}
                    scope="col"
                  >
                    <RosterSortHeading
                      label={label}
                      sortKey={sortKey}
                      sort={sort}
                      onSort={onSort}
                    />
                  </th>
                ))}
                <th className="hl-player-col-actions" scope="col">Actions</th>
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
                  <td className="hl-player-col-order">
                    {draggable ? (
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
                    ) : (
                      <span className="hl-player-row-placeholder" aria-hidden="true">
                        —
                      </span>
                    )}
                  </td>
                  <td className="hl-player-col-position">
                    <PositionTag
                      position={player.normalizedPosition}
                      category={player.rosterCategory}
                    />
                  </td>
                  <th className="hl-player-col-name" scope="row">
                    {player.name}
                  </th>
                  <td className="hl-player-col-aav is-mono">
                    {money(player.contract?.aavCents ?? null)}
                  </td>
                  <td className="hl-player-col-years">
                    {player.contract?.remainingYears ?? "—"}
                  </td>
                  <td className="hl-player-col-age">{player.age ?? "—"}</td>
                  <td className="hl-player-col-nhl">
                    {nhlTeamAbbreviation(player)}
                  </td>
                  <td className="hl-player-col-stat hl-roster-stat">{player.statistics?.gamesPlayed ?? "—"}</td>
                  <td className="hl-player-col-stat hl-roster-stat">{player.statistics?.goals ?? "—"}</td>
                  <td className="hl-player-col-stat hl-roster-stat">{player.statistics?.assists ?? "—"}</td>
                  <td className="hl-player-col-stat hl-roster-stat">{player.statistics?.nhlPoints ?? "—"}</td>
                  <td className="hl-player-col-stat hl-roster-stat">
                    {player.statistics
                      ? (
                          player.statistics.fantasyPointsHundredths / 100
                        ).toFixed(2)
                      : "—"}
                  </td>
                  <td className="hl-player-col-stat hl-roster-stat">
                    {player.statistics
                      ? fantasyPointsPerGame(player.statistics).toFixed(2)
                      : "—"}
                  </td>
                  <td className="hl-player-col-actions hl-roster-actions-cell">
                    {canManage || canRequestTrade ? (
                      <div className="hl-roster-actions-group">
                        {canManage && (
                          <RosterActions
                            leagueId={leagueId}
                            teamId={viewedTeamId}
                            player={player}
                            pending={actionPending}
                            onAction={onAction}
                            prospectDecisionAllowed={prospectDecisionAllowed}
                          />
                        )}
                        {canRequestTrade && (
                          <TradeRequestAction
                            leagueId={leagueId}
                            proposingTeamId={requestingTeamId}
                            sourceTeamId={viewedTeamId}
                            player={player}
                          />
                        )}
                      </div>
                    ) : (
                      <span className="hl-player-row-placeholder" aria-hidden="true">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
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
  category = "Active",
  muted = false,
  actions = null,
  team,
  tradeRequestPath,
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
      className={teamColourClass(
        [
          "hl-line-player hl-line-player--team",
          muted ? "hl-line-player--bench" : "",
          draggingId === player.ownershipId ? "is-dragging" : "",
          dragTargetId === player.ownershipId ? "is-drop-target" : "",
        ]
          .filter(Boolean)
          .join(" "),
        team
      )}
      style={teamColourStyle(team)}
      data-roster-order-id={canManage ? player.ownershipId : undefined}
      data-roster-category={category}
      onDragOver={(event) => {
        if (canManage) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={(event) => {
        if (!canManage) return;
        event.preventDefault();
        event.stopPropagation();
        const sourceId =
          (typeof event.dataTransfer.getData === "function"
            ? event.dataTransfer.getData("text/plain")
            : "") || draggingId;
        onCategoryDrop(sourceId, category, player.ownershipId);
      }}
    >
      {canManage && (
        <button
          type="button"
          className="hl-line-player__drag-handle"
          aria-label={
            category === "Active"
              ? `Drag ${player.name} to reorder`
              : `Drag ${player.name} between Bench and Active`
          }
          title={
            category === "Active"
              ? `Drag ${player.name} to reorder`
              : `Drag ${player.name} between Bench and Active`
          }
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
              pointerDropTargetCategory(event) || category;
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
            if (category !== "Active") return;
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
            {category === "Active"
              ? "Use the up and down arrow keys to change order."
              : "Drag this player onto the active lineup to move them."}
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
      {tradeRequestPath && (
        <Link
          className="hl-line-player__trade-request"
          to={tradeRequestPath}
          aria-label={`Request ${player.name} in a trade`}
          title={`Request ${player.name} in a trade`}
        >
          <ArrowLeftRight aria-hidden="true" />
        </Link>
      )}
      {actions && (
        <div className="hl-line-player__actions">{actions}</div>
      )}
    </div>
  );
}

function HockeyLines({
  activePlayers,
  canManage,
  leagueId,
  requestingTeamId,
  team,
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
                    team={team}
                    tradeRequestPath={
                      player && requestingTeamId
                        ? routePaths.leagueTradeForRequestedAsset(
                            leagueId,
                            requestingTeamId,
                            team.id,
                            player.contract ? "contract" : "prospect_right",
                            player.contract?.id || player.playerId
                          )
                        : null
                    }
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
                    team={team}
                    tradeRequestPath={
                      player && requestingTeamId
                        ? routePaths.leagueTradeForRequestedAsset(
                            leagueId,
                            requestingTeamId,
                            team.id,
                            player.contract ? "contract" : "prospect_right",
                            player.contract?.id || player.playerId
                          )
                        : null
                    }
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

function BenchStrip({
  players,
  canManage,
  actionPending,
  orderPending,
  canRequestTrade,
  leagueId,
  requestingTeamId,
  team,
  draggingId,
  dragTargetId,
  onDragStart,
  onDragTarget,
  onDragEnd,
  onCategoryDrop,
  onMove,
  onAction,
}) {
  const displayedPlayers = orderedPlayers(players);
  const dragEnabled = canManage && !actionPending && !orderPending;
  return (
    <section
      className="hl-surface hl-bench-strip"
      aria-labelledby="roster-bench-cards"
      data-roster-category="Bench"
      onDragOver={(event) => {
        if (!dragEnabled) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        if (!dragEnabled || event.defaultPrevented) return;
        event.preventDefault();
        const sourceId =
          (typeof event.dataTransfer.getData === "function"
            ? event.dataTransfer.getData("text/plain")
            : "") || draggingId;
        onCategoryDrop(sourceId, "Bench", null, displayedPlayers);
      }}
    >
      <div className="hl-roster-category__heading">
        <h2 id="roster-bench-cards">Bench</h2>
        <span>
          {players.length}/4 used · {Math.max(0, 4 - players.length)} available
        </span>
      </div>
      {players.length === 0 ? (
        <p className="hl-roster-category__empty">
          No players occupy this category.
        </p>
      ) : (
        <div className="hl-bench-strip__cards">
          {displayedPlayers.map((player) => (
            <LinePlayer
              key={player.ownershipId}
              player={player}
              canManage={dragEnabled}
              category="Bench"
              muted
              team={team}
              tradeRequestPath={
                canRequestTrade
                  ? routePaths.leagueTradeForRequestedAsset(
                      leagueId,
                      requestingTeamId,
                      team.id,
                      player.contract ? "contract" : "prospect_right",
                      player.contract?.id || player.playerId
                    )
                  : null
              }
              draggingId={draggingId}
              dragTargetId={dragTargetId}
              onDragStart={onDragStart}
              onDragTarget={onDragTarget}
              onDragEnd={onDragEnd}
              onCategoryDrop={onCategoryDrop}
              onMove={onMove}
              actions={
                canManage ? (
                  <RosterActions
                    leagueId={leagueId}
                    teamId={team.id}
                    player={player}
                    pending={actionPending}
                    onAction={onAction}
                  />
                ) : null
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DraftPicks({
  canOffer,
  httpClient,
  leagueId,
  picks,
  requestingTeamId,
  team,
  teams,
}) {
  const bySeason = picks.reduce((groups, pick) => {
    const key = pick.targetSeason.id;
    if (!groups.has(key)) {
      groups.set(key, {
        id: pick.targetSeason.id,
        label: pick.targetSeason.label,
        picks: [],
      });
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
  const roundCount = Math.max(4, ...picks.map(({ round }) => round));
  const rounds = Array.from({ length: roundCount }, (_, index) => index + 1);
  const teamById = new Map(teams.map((candidate) => [candidate.id, candidate]));

  function tradePath(pick) {
    if (requestingTeamId) {
      return routePaths.leagueTradeForRequestedAsset(
        leagueId,
        requestingTeamId,
        team.id,
        "draft_pick",
        pick.id
      );
    }
    if (canOffer) {
      return routePaths.leagueTradeForOfferedAsset(
        leagueId,
        team.id,
        "draft_pick",
        pick.id
      );
    }
    return null;
  }

  function pickMark(pick) {
    const originalTeam =
      teamById.get(pick.originalTeam.id) || pick.originalTeam;
    const path = tradePath(pick);
    const label = `${pick.targetSeason.label} round ${pick.round}, pick ${
      pick.position
    }, originally ${pick.originalTeam.name}${
      path ? " — add to a trade proposal" : ""
    }`;
    const mark = (
      <span
        className={teamColourClass("hl-draft-pick-team-mark", originalTeam)}
        style={teamColourStyle(originalTeam)}
      >
        {originalTeam.logoReference ? (
          <img
            src={httpClient.resourceUrl(originalTeam.logoReference)}
            crossOrigin="use-credentials"
            alt=""
          />
        ) : null}
        <small aria-hidden="true">{pick.position}</small>
      </span>
    );
    return path ? (
      <Link
        className="hl-draft-pick-link"
        key={pick.id}
        to={path}
        aria-label={label}
        title={label}
      >
        {mark}
      </Link>
    ) : (
      <span
        className="hl-draft-pick-link is-read-only"
        key={pick.id}
        aria-label={label}
        title={label}
      >
        {mark}
      </span>
    );
  }

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
        <div className="hl-draft-pick-matrix-wrap">
          <table className="hl-draft-pick-matrix">
            <thead>
              <tr>
                <th scope="col">Round</th>
                {seasons.map((season) => (
                  <th scope="col" key={season.id}>
                    {season.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rounds.map((round) => (
                <tr key={round}>
                  <th scope="row">R{round}</th>
                  {seasons.map((season) => {
                    const roundPicks = season.picks.filter(
                      (pick) => pick.round === round
                    );
                    return (
                      <td key={season.id}>
                        <span className="hl-draft-pick-cell">
                          {roundPicks.length > 0
                            ? roundPicks.map(pickMark)
                            : <span aria-label="No owned pick">—</span>}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function TeamRosterPage({
  workspace,
  teams,
  currentUserId = null,
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
  const requestingTeam =
    teams.find(
      (candidate) =>
        candidate.id !== team.id &&
        candidate.currentManager?.userId === currentUserId
    ) || null;
  const canRequestTrade = Boolean(requestingTeam);
  const viewedTeam = teams.find((candidate) => candidate.id === team.id);
  const managesViewedTeam =
    Boolean(currentUserId) &&
    viewedTeam?.currentManager?.userId === currentUserId;
  const commissionerActionMode =
    Boolean(currentUserId) && workspace.canManage && !managesViewedTeam;

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
    onError: () => {
      setSaveMessage("The line order could not be saved.");
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
      const prospectDestination = {
        "prospect-sign-prospect": "Prospect",
        "prospect-sign-active": "Active",
        "prospect-sign-bench": "Bench",
        "prospect-sign-ir": "Injured Reserve",
      }[type];
      if (prospectDestination) {
        return signProspectFantasyElc(
          httpClient,
          league.id,
          team.id,
          player.playerId,
          {
            destinationCategory: prospectDestination,
            expectedVersion: player.ownershipVersion,
          }
        );
      }
      if (type === "prospect-decline") {
        return declineProspectFantasyElc(
          httpClient,
          league.id,
          team.id,
          player.playerId,
          player.ownershipVersion
        );
      }
      if (type === "prospect-release") {
        return releaseUnsignedProspectRights(
          httpClient,
          league.id,
          team.id,
          player.playerId,
          player.ownershipVersion
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
    onSuccess: async (result, { type, player }) => {
      const actionMessage =
        type === "buyout"
          ? `${player.name} was bought out.`
          : type.startsWith("prospect-sign-")
            ? `${player.name} signed a fantasy ELC.`
            : type === "prospect-decline"
              ? `${player.name}'s fantasy ELC was declined and their rights were released.`
              : type === "prospect-release"
                ? `${player.name}'s unsigned prospect rights were released.`
          : type === "ir"
            ? `${player.name} was moved to injured reserve.`
            : type === "bench"
              ? `${player.name} was moved to the bench.`
              : type === "active"
                ? `${player.name} was moved to the active roster.`
            : `${player.name} was ${
                player.onTradeBlock ? "removed from" : "added to"
              } the trade block.`;
      const cancelledTradeCount = Array.isArray(
        result?.automaticallyCancelledTradeIds
      )
        ? result.automaticallyCancelledTradeIds.length
        : 0;
      setSaveMessage(
        cancelledTradeCount > 0
          ? `${actionMessage} ${cancelledTradeCount} pending trade ${
              cancelledTradeCount === 1 ? "proposal was" : "proposals were"
            } automatically cancelled.`
          : actionMessage
      );
      await queryClient.invalidateQueries({
        queryKey: teamWorkspaceKeys.detail(league.id, team.id),
      });
    },
    onError: () => {
      setSaveMessage("The roster action could not be completed.");
    },
  });

  function runRosterAction(type, player) {
    if (
      type === "buyout" &&
      !globalThis.confirm(
        `Buy out ${player.name}'s contract? This creates a buyout penalty and cannot be undone here.`
      )
    ) {
      return;
    }
    if (
      type.startsWith("prospect-sign-") &&
      !globalThis.confirm(
        `Sign ${player.name} to a $3, three-season fantasy ELC? Confirm their real-life NHL entry-level contract first. Any pending trade proposals containing these unsigned rights will be automatically cancelled.`
      )
    ) {
      return;
    }
    if (
      type === "prospect-decline" &&
      !globalThis.confirm(
        `Decline ${player.name}'s fantasy ELC and release their prospect rights? This cannot be undone here, and any pending trade proposals containing the rights will be automatically cancelled.`
      )
    ) {
      return;
    }
    if (
      type === "prospect-release" &&
      !globalThis.confirm(
        `Release the unsigned prospect rights for ${player.name}? This cannot be undone here, and any pending trade proposals containing the rights will be automatically cancelled.`
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
          <TeamMark
            team={team}
            logoUrl={
              team.logoReference
                ? httpClient.resourceUrl(team.logoReference)
                : null
            }
            className="hl-team-logo"
          />
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
            {legality.reasons.length} roster issue
            {legality.reasons.length === 1 ? "" : "s"} must be fixed
            before this roster is legal.
          </span>
        </div>
      )}

      {commissionerActionMode && (
        <div
          className="hl-authority-notice"
          role="note"
          aria-label="Commissioner action mode"
        >
          <ShieldCheck aria-hidden="true" />
          <div>
            <StatusBadge tone="warning">Commissioner action mode</StatusBadge>
            <p>
              Roster changes on this team are recorded under commissioner
              authority, not as actions by this team&apos;s manager.
            </p>
          </div>
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
      {(mutation.isError || actionMutation.isError) && (
        <ErrorBlock
          error={mutation.error || actionMutation.error}
          fallback={saveMessage}
          impact="The roster remains unchanged."
          recovery="Refresh the roster, review the player’s current status, and try again."
        />
      )}
      {saveMessage && !mutation.isError && !actionMutation.isError && (
        <p
          className="hl-form-message"
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
            leagueId={league.id}
            requestingTeamId={requestingTeam?.id || null}
            team={team}
            draggingId={draggingId}
            dragTargetId={dragTargetId}
            onDragStart={setDraggingId}
            onDragTarget={setDragTargetId}
            onDragEnd={endDrag}
            onCategoryDrop={handleRosterDrop}
            onMove={move}
          />
          <BenchStrip
            players={workspace.players.filter(
              ({ rosterCategory }) => rosterCategory === "Bench"
            )}
            canManage={workspace.canManage}
            actionPending={actionMutation.isPending}
            orderPending={mutation.isPending}
            canRequestTrade={canRequestTrade}
            leagueId={league.id}
            requestingTeamId={requestingTeam?.id || null}
            team={team}
            draggingId={draggingId}
            dragTargetId={dragTargetId}
            onDragStart={setDraggingId}
            onDragTarget={setDragTargetId}
            onDragEnd={endDrag}
            onCategoryDrop={handleRosterDrop}
            onMove={move}
            onAction={runRosterAction}
          />
          <div className="hl-roster-categories">
            {CATEGORY_DETAILS.filter(
              ({ key }) => !["Active", "Bench"].includes(key)
            ).map(
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
                  canRequestTrade={canRequestTrade}
                  prospectDecisionAllowed={managesViewedTeam}
                  requestingTeamId={requestingTeam?.id || null}
                  viewedTeamId={team.id}
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
              canRequestTrade={canRequestTrade}
              prospectDecisionAllowed={managesViewedTeam}
              requestingTeamId={requestingTeam?.id || null}
              viewedTeamId={team.id}
            />
          ))}
        </div>
      )}

      <DraftPicks
        canOffer={workspace.canManage}
        httpClient={httpClient}
        leagueId={league.id}
        picks={workspace.draftPicks}
        requestingTeamId={requestingTeam?.id || null}
        team={team}
        teams={teams}
      />
    </div>
  );
}
