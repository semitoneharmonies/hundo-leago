import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { LoadingBlock, StatusBadge } from "../../components/HundoUi.jsx";
import styles from "./FreeAgentDraftPage.module.css";

export function EligiblePlayerSearch({
  buildQueryOptions,
  selectedPlayerId,
  onSelect,
}) {
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const players = useInfiniteQuery(
    buildQueryOptions({ q: query, limit: 25 })
  );

  function submit(event) {
    event.preventDefault();
    setQuery(searchInput.trim());
  }

  const items = players.data?.pages.flatMap((page) => page.items) || [];

  return (
    <section aria-labelledby="eligible-player-search-title">
      <h3 id="eligible-player-search-title">Eligible players</h3>
      <p className={styles.muted}>
        This list contains only players the server has confirmed are eligible
        for this exact card and slot.
      </p>
      <form className={styles.searchForm} onSubmit={submit}>
        <label>
          Search by player name
          <input
            type="search"
            value={searchInput}
            maxLength={200}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <button className="hl-button hl-button--secondary" type="submit">
          Search
        </button>
      </form>

      {players.isPending ? (
        <LoadingBlock>Loading eligible players…</LoadingBlock>
      ) : players.isError ? (
        <p className={styles.error} role="alert">
          {players.error.message || "Eligible players could not be loaded."}
        </p>
      ) : items.length === 0 ? (
        <p>No eligible players match this search.</p>
      ) : (
        <ul className={styles.searchResults}>
          {items.map((item) => (
            <li
              className={styles.searchResult}
              aria-current={item.player.playerId === selectedPlayerId}
              key={item.player.playerId}
            >
              <div>
                <strong>{item.player.fullName}</strong>
                <span>
                  {item.effectivePositionGroup === "F"
                    ? "Forward"
                    : "Defence"}
                </span>
                <StatusBadge tone="success">Server eligible</StatusBadge>
              </div>
              <button
                type="button"
                className="hl-button hl-button--secondary"
                aria-pressed={item.player.playerId === selectedPlayerId}
                onClick={() => onSelect(item)}
              >
                {item.player.playerId === selectedPlayerId
                  ? "Selected"
                  : `Select ${item.player.fullName}`}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!players.isPending && !players.isError && (
        <nav className={styles.editorActions} aria-label="Eligible player pages">
          <button
            type="button"
            className="hl-button hl-button--quiet"
            disabled={!players.hasNextPage || players.isFetchingNextPage}
            onClick={() => players.fetchNextPage()}
          >
            {players.isFetchingNextPage
              ? "Loading more…"
              : players.hasNextPage
                ? "Load more"
                : "All matching players loaded"}
          </button>
        </nav>
      )}
    </section>
  );
}
