import { useDeferredValue, useId, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import styles from "./FreeAgentDraftPage.module.css";

export function EligiblePlayerSearch({
  buildQueryOptions,
  value,
  selectedPlayerId,
  inputLabel,
  disabled = false,
  describedBy,
  invalid = false,
  onInputChange,
  onSelect,
}) {
  const inputId = useId();
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const deferredQuery = useDeferredValue(value.trim());
  const canSearch = !disabled && open && deferredQuery.length > 0;
  const popupOpen = open && canSearch;
  const players = useInfiniteQuery({
    ...buildQueryOptions({ q: deferredQuery, limit: 12 }),
    enabled: canSearch,
  });
  const items = players.data?.pages.flatMap((page) => page.items) || [];
  const currentActiveIndex = activeIndex < items.length ? activeIndex : -1;

  function choose(item) {
    onSelect(item);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleInput(event) {
    const nextValue = event.target.value;
    onInputChange(nextValue);
    setOpen(true);
    setActiveIndex(-1);
  }

  function handleKeyDown(event) {
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
      const index =
        currentActiveIndex >= 0
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
      <label className={styles.visuallyHidden} htmlFor={inputId}>
        {inputLabel}
      </label>
      <input
        id={inputId}
        type="search"
        role="combobox"
        aria-label={inputLabel}
        aria-autocomplete="list"
        aria-controls={popupOpen ? listboxId : undefined}
        aria-describedby={describedBy}
        aria-expanded={popupOpen}
        aria-invalid={invalid || undefined}
        aria-activedescendant={
          popupOpen && currentActiveIndex >= 0
            ? `${listboxId}-option-${currentActiveIndex}`
            : undefined
        }
        autoComplete="off"
        disabled={disabled}
        maxLength={200}
        placeholder="Player name"
        value={value}
        onBlur={() => setOpen(false)}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {popupOpen && (
        <div className={styles.eligibleSuggestions}>
          <div
            id={listboxId}
            className={styles.eligibleOptions}
            role="listbox"
            aria-label={`${inputLabel} suggestions`}
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
                <button
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-label={`Select ${item.player.fullName}`}
                  aria-selected={item.player.playerId === selectedPlayerId}
                  className={
                    index === currentActiveIndex
                      ? styles.activeEligibleSuggestion
                      : undefined
                  }
                  key={item.player.playerId}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item)}
                >
                  <strong>{item.player.fullName}</strong>
                  <span>
                    {item.effectivePositionGroup === "F"
                      ? "Forward"
                      : "Defence"}
                  </span>
                </button>
              ))
            )}
          </div>
          {!players.isPending && !players.isError && players.hasNextPage && (
            <button
              type="button"
              disabled={players.isFetchingNextPage}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => players.fetchNextPage()}
            >
              {players.isFetchingNextPage
                ? "Loading more…"
                : "Load more matches"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
