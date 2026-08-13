import { useDeferredValue, useId, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import styles from "./FreeAgentDraftPage.module.css";

export function EligiblePlayerSearch({
  buildQueryOptions,
  selectedPlayerId,
  onSelect,
}) {
  const inputId = useId();
  const listboxId = useId();
  const [searchInput, setSearchInput] = useState("");
  const [open, setOpen] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const deferredQuery = useDeferredValue(searchInput.trim());
  const players = useInfiniteQuery(
    buildQueryOptions({ q: deferredQuery, limit: 12 })
  );
  const items = players.data?.pages.flatMap((page) => page.items) || [];
  const currentActiveIndex = activeIndex < items.length ? activeIndex : -1;

  function choose(item) {
    setSearchInput(item.player.fullName);
    setOpen(false);
    setActiveIndex(-1);
    onSelect(item);
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
      if (items.length === 0) return;
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        if (current < 0) return direction > 0 ? 0 : items.length - 1;
        return (current + direction + items.length) % items.length;
      });
      return;
    }
    if (event.key === "Enter" && open) {
      const index = currentActiveIndex >= 0
        ? currentActiveIndex
        : items.length === 1
          ? 0
          : -1;
      if (index >= 0) {
        event.preventDefault();
        choose(items[index]);
      }
    }
  }

  return (
    <div className={styles.eligibleCombobox}>
      <label htmlFor={inputId}>Player</label>
      <input
        id={inputId}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-activedescendant={
          open && currentActiveIndex >= 0
            ? `${listboxId}-option-${currentActiveIndex}`
            : undefined
        }
        autoComplete="off"
        maxLength={200}
        placeholder="Start typing a player name"
        value={searchInput}
        onChange={(event) => {
          setSearchInput(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
          if (selectedPlayerId) onSelect(null);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && (
        <div
          id={listboxId}
          className={styles.eligibleSuggestions}
          role="listbox"
          aria-label="Eligible players"
        >
          {players.isPending ? (
            <span role="status">Searching eligible players…</span>
          ) : players.isError ? (
            <span className={styles.error} role="alert">
              {players.error.message || "Eligible players could not be loaded."}
            </span>
          ) : items.length === 0 ? (
            <span>No eligible players match that name.</span>
          ) : (
            items.map((item, index) => (
              <div
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={item.player.playerId === selectedPlayerId}
                className={
                  index === currentActiveIndex
                    ? styles.activeEligibleSuggestion
                    : undefined
                }
                key={item.player.playerId}
              >
                <button
                  type="button"
                  aria-label={`Select ${item.player.fullName}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item)}
                >
                  <strong>{item.player.fullName}</strong>
                  <span>
                    {item.effectivePositionGroup === "F" ? "Forward" : "Defence"}
                  </span>
                </button>
              </div>
            ))
          )}
          {!players.isPending && !players.isError && players.hasNextPage && (
            <button
              type="button"
              disabled={players.isFetchingNextPage}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => players.fetchNextPage()}
            >
              {players.isFetchingNextPage ? "Loading more…" : "Load more matches"}
            </button>
          )}
        </div>
      )}
      <small>
        Suggestions include only players the server allows in this exact slot.
      </small>
    </div>
  );
}
