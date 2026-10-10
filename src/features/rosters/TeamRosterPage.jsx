import { RosterActions } from "./RosterActions.jsx";
import { useRosterActions } from "./useRosterActions.js";
import { rosterLegalityMessages } from './rosterLegalityMessages.js';
import { injuryNameProps } from '../../shared/playerInjury.js';
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  CircleDollarSign,
  GripVertical,
  List,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { SCORING_CATEGORIES, scoringDescription } from "../../shared/scoringCategories.js";
import { ScoringStatGuide } from "../../components/ScoringStatGuide.jsx";
import { routePaths } from "../../app/routePaths.js";
import { usePromotedHeader } from "../../components/navigationMotion.js";
import {
  ErrorBlock,
  PositionTag,
  StatusBadge,
  TableScroll,
  TeamMark,
} from "../../components/HundoUi.jsx";
import { teamColourClass, teamColourStyle } from "../../shared/teamIdentity.js";
import { CapOutlook } from "./CapOutlook.jsx";
import { PlayerName } from '../players/PlayerName.jsx';
import { leagueDateTime } from "../../shared/hundoFormat.js";
import {
  saveRosterDisplayOrder,
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
  if (!player.statistics) return Number.NEGATIVE_INFINITY;
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
      return player.statistics.scoringStats?.[key] ?? Number.NEGATIVE_INFINITY;
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
  rosterLockNotice = null,
  sort,
  httpClient,
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
        <div className="hl-roster-category-title"><h2 id={headingId}>{category.title}</h2>{rosterLockNotice}</div>
        <span>{capacity}</span>
      </div>
      {players.length === 0 ? (
        <p className="hl-roster-category__empty">
          No players occupy this category.
        </p>
      ) : (
        <>
        <ScoringStatGuide weights={players.find(p=>p.statistics?.scoringWeights)?.statistics.scoringWeights} />
        <TableScroll label={`${category.title} table`}>
          <table className="hl-data-table hl-player-row-table hl-roster-table hl-expanded-player-table">
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
                  ...SCORING_CATEGORIES.map(({ abbreviation, key }) => [abbreviation, key]),
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
                    title={scoringDescription(sortKey, players.find(p=>p.statistics?.scoringWeights)?.statistics.scoringWeights)}
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
                    player.onTradeBlock ? "is-on-trade-block" : "",
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
                    <PlayerName {...injuryNameProps(player)} playerId={player.playerId} leagueId={leagueId} httpClient={httpClient} className={`hl-roster-player-name ${injuryNameProps(player).className || ""}`}>{player.name}</PlayerName>
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
                    {SCORING_CATEGORIES.map(({ key, label }) => (
                      <td className="hl-player-col-stat hl-roster-stat" key={key} title={label}>{player.statistics?.scoringStats?.[key] ?? "—"}</td>
                    ))}
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
        </>
      )}
    </section>
  );
}

function lineSlots(players, position) {
  const peers = players.filter(({ normalizedPosition }) => normalizedPosition === position);
  const slots = Array(Math.max(position === "F" ? 12 : 6, peers.length)).fill(null);
  for (const player of peers) {
    const index = Number.isInteger(player.displayOrder) ? player.displayOrder - 1 : -1;
    if (index >= 0 && index < slots.length && !slots[index]) slots[index] = player;
  }
  for (const player of peers) {
    if (!slots.includes(player)) {
      const empty = slots.indexOf(null);
      if (empty !== -1) slots[empty] = player;
    }
  }
  return slots;
}

function orderPayload(players, position) {
  const slots = lineSlots(players, position);
  while (slots.at(-1) === null) slots.pop();
  return slots.map((player) => player ? { id: player.ownershipId, version: player.ownershipVersion } : null);
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
  onTeamChange,
  httpClient,
  rosterLockNotice = null,
}) {
  const queryClient = useQueryClient();
  const { cap, league, team } = workspace;
  const promotedHeader = usePromotedHeader(`team:${league.id}:${team.id}`);
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
        forwardOwnerships: orderPayload(nextPlayers, "F"),
        defenceOwnerships: orderPayload(nextPlayers, "D"),
      }),
    onSuccess: async () => {
      setSaveMessage("Roster order saved.");
      await queryClient.invalidateQueries({
        queryKey: teamWorkspaceKeys.detail(league.id, team.id),
      });
    },
    onError: () => {
      setSaveMessage("The roster order could not be saved.");
    },
  });

  const { actionMutation, runRosterAction } = useRosterActions({ httpClient, leagueId: league.id, teamId: team.id, setSaveMessage });

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
    const emptySlot = /^slot:([FD]):(\d+)$/.exec(targetId || "");
    if (!source || (!target && !emptySlot) || source.normalizedPosition !== (target?.normalizedPosition || emptySlot?.[1])) {
      setSaveMessage("Players can be reordered only within the same position group.");
      setDraggingId(null);
      setDragTargetId(null);
      return;
    }
    const positionPlayers = lineSlots(basisPlayers, source.normalizedPosition);
    const from = positionPlayers.findIndex(
      (player) => player?.ownershipId === sourceId
    );
    const to = emptySlot ? Number(emptySlot[2]) : positionPlayers.findIndex((player) => player?.ownershipId === targetId);
    if (from < 0 || to < 0 || to >= positionPlayers.length) return;
    const reorderedPosition = [...positionPlayers];
    [reorderedPosition[from], reorderedPosition[to]] =
      [reorderedPosition[to], reorderedPosition[from]];
    const next = ["F", "D"].flatMap((position) =>
      position === source.normalizedPosition
        ? reorderedPosition.map((player, index) => player ? { ...player, displayOrder: index + 1 } : null).filter(Boolean)
        : basisPlayers.filter(
            ({ normalizedPosition }) => normalizedPosition === position
          )
    );
    setActivePlayers(next);
    setRosterSort({ key: "lineup", direction: "asc" });
    setDraggingId(null);
    setDragTargetId(null);
    setSaveMessage("Saving roster order…");
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
        ref={promotedHeader}
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
            <label className="hl-team-switcher">
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
          </div>
        </div>
      </header>

      <div className="hl-navigation-details">
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
      </section>

      {!legality.legal && (
        <div className="hl-roster-illegal" role="alert">
          <strong>Illegal roster</strong>
          <ul className="hl-roster-issues">
            {rosterLegalityMessages(workspace).map(message => <li key={message}>{message}</li>)}
          </ul>
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
          className={view === "cap" ? "is-active" : ""}
          aria-pressed={view === "cap"}
          onClick={() => setView("cap")}
        >
          <CircleDollarSign aria-hidden="true" /> Cap outlook
        </button>
      </div>
      {(mutation.isError || actionMutation.isError) && (
        <ErrorBlock
          error={mutation.error || actionMutation.error}
          fallback={saveMessage}
          impact="The roster remains unchanged."
          recovery={actionMutation.variables?.type === "buyout" && actionMutation.error?.code === "BUYOUT_LOCK_ACTIVE"
            ? Number.isSafeInteger(actionMutation.error.details?.buyoutLockExpiresAtMs)
              ? `You can buy out this player after ${leagueDateTime(actionMutation.error.details.buyoutLockExpiresAtMs, "America/Vancouver")}.`
              : "Players become eligible for buyout once 14 days have passed since signing."
            : "Refresh the roster, review the player’s current status, and try again."}
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

      {view === "cap" ? (
        <CapOutlook workspace={workspace} httpClient={httpClient} pending={actionMutation.isPending || mutation.isPending} onAction={runRosterAction} />
      ) : (
        <div className="hl-roster-categories">
          {CATEGORY_DETAILS.map((category) => (
            <CategoryTable
              key={category.key}
              category={category}
              httpClient={httpClient}
              rosterLockNotice={category.key === "Active" ? rosterLockNotice : null}
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
    </div>
  );
}
