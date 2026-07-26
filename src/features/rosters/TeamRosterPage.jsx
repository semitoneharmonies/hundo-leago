import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GripVertical, List, Rows3 } from "lucide-react";

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

function orderedPlayers(players) {
  return [...players].sort(
    (left, right) =>
      (left.normalizedPosition === "F" ? 0 : 1) -
        (right.normalizedPosition === "F" ? 0 : 1) ||
      (Number.isInteger(left.displayOrder) &&
      Number.isInteger(right.displayOrder)
        ? left.displayOrder - right.displayOrder
        : Number.isInteger(left.displayOrder)
          ? -1
          : Number.isInteger(right.displayOrder)
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
  onDrop,
  onPointerDrop,
  onMove,
  sort,
  onSort,
}) {
  const forwards = players.filter(
    ({ normalizedPosition }) => normalizedPosition === "F"
  ).length;
  const defence = players.length - forwards;
  const displayedPlayers = sortedByStatistic(players, sort);
  const draggable = category.key === "Active" && canManage;
  const capacity =
    category.key === "Active"
      ? `${players.length}/18 used · F ${forwards}/12 · D ${defence}/6`
      : category.limit === null
        ? `${players.length} held · unlimited eligible slots`
        : `${players.length}/${category.limit} used · ${category.limit - players.length} available`;
  const headingId = `roster-${category.key.replaceAll(" ", "-")}`;

  return (
    <section
      className="hl-surface hl-roster-category"
      aria-labelledby={headingId}
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
                  <th key={sortKey} scope="col">
                    <RosterSortHeading
                      label={label}
                      sortKey={sortKey}
                      sort={sort}
                      onSort={onSort}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedPlayers.map((player) => {
                const peers = displayedPlayers.filter(
                  ({ normalizedPosition }) =>
                    normalizedPosition === player.normalizedPosition
                );
                const peerIndex = peers.findIndex(
                  ({ ownershipId }) => ownershipId === player.ownershipId
                );
                return (
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
                  onDragOver={(event) => {
                    if (!draggable) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    if (!draggable) return;
                    event.preventDefault();
                    const sourceId =
                      (typeof event.dataTransfer.getData === "function"
                        ? event.dataTransfer.getData("text/plain")
                        : "") || draggingId;
                    onDrop(sourceId, player.ownershipId, displayedPlayers);
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
                            endPointerCapture(event);
                            onPointerDrop(
                              player.ownershipId,
                              targetId,
                              displayedPlayers
                            );
                          }}
                          onPointerCancel={(event) => {
                            endPointerCapture(event);
                            onDragEnd();
                          }}
                        >
                          <GripVertical aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onMove(
                              player.ownershipId,
                              -1,
                              displayedPlayers
                            )
                          }
                          disabled={peerIndex === 0}
                          aria-label={`Move ${player.name} earlier`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onMove(player.ownershipId, 1, displayedPlayers)
                          }
                          disabled={peerIndex === peers.length - 1}
                          aria-label={`Move ${player.name} later`}
                        >
                          ↓
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
                  <td>{player.statistics?.gamesPlayed ?? "—"}</td>
                  <td>{player.statistics?.goals ?? "—"}</td>
                  <td>{player.statistics?.assists ?? "—"}</td>
                  <td>{player.statistics?.nhlPoints ?? "—"}</td>
                  <td>
                    {player.statistics
                      ? (
                          player.statistics.fantasyPointsHundredths / 100
                        ).toFixed(2)
                      : "—"}
                  </td>
                  <td>
                    {player.statistics
                      ? fantasyPointsPerGame(player.statistics).toFixed(2)
                      : "—"}
                  </td>
                </tr>
              )})}
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
  onDrop,
  onPointerDrop,
  onMove,
  index,
  total,
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
      onDragOver={(event) => {
        if (canManage) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const sourceId =
          (typeof event.dataTransfer.getData === "function"
            ? event.dataTransfer.getData("text/plain")
            : "") || draggingId;
        onDrop(sourceId, player.ownershipId);
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
            endPointerCapture(event);
            onPointerDrop(player.ownershipId, targetId);
          }}
          onPointerCancel={(event) => {
            endPointerCapture(event);
            onDragEnd();
          }}
        >
          <GripVertical aria-hidden="true" />
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
      {canManage && (
        <span className="hl-line-player__keyboard">
          <button
            type="button"
            onClick={() => onMove(player.ownershipId, -1)}
            disabled={index === 0}
            aria-label={`Move ${player.name} earlier`}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(player.ownershipId, 1)}
            disabled={index === total - 1}
            aria-label={`Move ${player.name} later`}
          >
            ↓
          </button>
        </span>
      )}
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
  onDrop,
  onPointerDrop,
  onMove,
}) {
  const forwards = activePlayers.filter(
    ({ normalizedPosition }) => normalizedPosition === "F"
  );
  const defence = activePlayers.filter(
    ({ normalizedPosition }) => normalizedPosition === "D"
  );
  return (
    <section className="hl-hockey-lines" aria-labelledby="hockey-lines-title">
      <div className="hl-roster-category__heading">
        <div>
          <p className="hl-eyebrow">Line arrangement</p>
          <h2 id="hockey-lines-title">Hockey lines</h2>
        </div>
        <span>
          {canManage
            ? "Drag players or use the arrow controls. Order is saved."
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
                    onDrop={onDrop}
                    onPointerDrop={onPointerDrop}
                    onMove={onMove}
                    index={absoluteIndex}
                    total={forwards.length}
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
                    onDrop={onDrop}
                    onPointerDrop={onPointerDrop}
                    onMove={onMove}
                    index={absoluteIndex}
                    total={defence.length}
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
  const [view, setView] = useState("table");
  const [activePlayers, setActivePlayers] = useState(() =>
    orderedPlayers(
      workspace.players.filter(
        ({ rosterCategory }) => rosterCategory === "Active"
      )
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
        )
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
        className="hl-surface hl-roster-hero hl-roster-hero--striped"
        style={{
          "--team-primary": team.primaryColour || "#16324f",
          "--team-secondary": team.secondaryColour || "#f7f7f7",
        }}
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
          className={`hl-form-message${mutation.isError ? " is-error" : ""}`}
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
            onDrop={reorder}
            onPointerDrop={reorder}
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
                category.key === "Active" &&
                workspace.canManage &&
                !mutation.isPending
              }
              draggingId={draggingId}
              dragTargetId={dragTargetId}
              onDragStart={setDraggingId}
              onDragTarget={setDragTargetId}
              onDragEnd={endDrag}
              onDrop={reorder}
              onPointerDrop={reorder}
              onMove={move}
              sort={rosterSort}
              onSort={changeRosterSort}
            />
          ))}
        </div>
      )}

      <DraftPicks picks={workspace.draftPicks} />
    </div>
  );
}
