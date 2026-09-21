import { useId, useState } from "react";

export function AccountSearch({ accounts, value, onChange, disabled }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const selected = accounts.find((account) => account.id === value);
  const text = selected?.displayName || query;
  const matching = accounts.filter((account) =>
    [account.displayName, account.email].some((part) => part?.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  );
  const expanded = open && !disabled;
  const currentIndex = activeIndex < matching.length ? activeIndex : -1;
  function choose(account) {
    if (account.disabled) return;
    onChange(account.id);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
  }
  return <div className="hl-field hl-account-search">
    <label htmlFor={id}>User</label>
    <input id={id} role="combobox" type="search" autoComplete="off"
      aria-autocomplete="list" aria-expanded={expanded}
      aria-controls={expanded ? id + "-options" : undefined}
      aria-activedescendant={expanded && currentIndex >= 0 ? id + "-option-" + currentIndex : undefined}
      placeholder="Search accounts by name or email" value={text} disabled={disabled}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      onChange={(event) => { onChange(""); setQuery(event.target.value); setOpen(true); setActiveIndex(-1); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { setOpen(false); setActiveIndex(-1); }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault(); setOpen(true);
          const direction = event.key === "ArrowDown" ? 1 : -1;
          if (matching.length) setActiveIndex((index) => index < 0 ? (direction > 0 ? 0 : matching.length - 1) : (index + direction + matching.length) % matching.length);
        }
        if (event.key === "Enter" && expanded) {
          event.preventDefault();
          const account = matching[currentIndex >= 0 ? currentIndex : matching.length === 1 ? 0 : -1];
          if (account) choose(account);
        }
      }} />
    {expanded && <div id={id + "-options"} className="hl-account-search__options" role="listbox" aria-label="User suggestions">
      {matching.length === 0 ? <p role="status">No accounts match your search.</p> : matching.map((account, index) =>
        <button key={account.id} id={id + "-option-" + index} type="button" role="option"
          aria-selected={account.id === value} aria-disabled={account.disabled || undefined}
          className={index === currentIndex ? "is-active" : undefined}
          onMouseDown={(event) => event.preventDefault()} onClick={() => choose(account)}>
          <strong>{account.displayName}</strong><span>{account.email}</span><small>{account.detail}</small>
        </button>)}
    </div>}
  </div>;
}
