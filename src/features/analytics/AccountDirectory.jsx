import { useEffect, useId, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, UsersRound } from "lucide-react";
import { EmptyBlock, ErrorBlock, LoadingBlock, Surface } from "../../components/HundoUi.jsx";
import { useSession } from "../session/sessionContext.js";
import { ACCOUNT_DIRECTORY_LIMIT, ACCOUNT_SORTS, ACCOUNT_STATUSES, accountDirectoryKey, accountDirectoryQuery } from "./accountDirectoryQueries.js";
import styles from "./AccountDirectory.module.css";

const integer = new Intl.NumberFormat("en-CA");
const createdDate = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short", day: "numeric", timeZone: "Etc/GMT+8" });
function sortLabel(sort, direction) { return ACCOUNT_SORTS[sort] + " · " + (sort === "createdAt" ? direction === "desc" ? "Newest first" : "Oldest first" : direction === "asc" ? "A–Z" : "Z–A"); }
function DirectoryPage({ session }) {
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState("username");
  const [direction, setDirection] = useState("asc");
  const sortId = useId();
  const client = useQueryClient();
  const userId = session.user.id;
  const query = useQuery(accountDirectoryQuery(session.httpClient, userId, offset, sort, direction));
  const denied = [401, 403].includes(query.error?.status) || query.error?.code === "PLATFORM_ADMINISTRATOR_REQUIRED";
  useEffect(() => {
    if (denied) client.removeQueries({ queryKey: accountDirectoryKey(userId, offset, sort, direction), exact: true });
  }, [denied, client, userId, offset, sort, direction]);
  function changeSort(nextSort, nextDirection) {
    setOffset(0);
    setSort(nextSort);
    setDirection(nextDirection ?? (nextSort === sort ? direction === "asc" ? "desc" : "asc" : nextSort === "createdAt" ? "desc" : "asc"));
  }
  if (denied) return <EmptyBlock title="Administrator access required">Account details are no longer available for this session.</EmptyBlock>;
  if (query.isPending) return <LoadingBlock>Loading account directory…</LoadingBlock>;
  if (query.isError) return <div className={styles.failure}><ErrorBlock error={query.error} fallback="The account directory could not be loaded." impact="Activity totals remain available." recovery="Try loading the directory again." />
    <button type="button" onClick={() => query.refetch()} disabled={query.isFetching}>{query.isFetching ? "Loading…" : "Retry account directory"}</button></div>;
  const { accounts, pagination } = query.data;
  const range = accounts.length ? `${integer.format(offset + 1)}–${integer.format(offset + accounts.length)} of ${integer.format(pagination.total)} accounts` : pagination.total ? `No accounts on this page · ${integer.format(pagination.total)} total` : "0 accounts";
  return <>
    <div className={styles.pageMeta}><span aria-live="polite">{range}</span><span>{sortLabel(sort, direction)} · All account statuses</span></div>
    <div className={styles.mobileSort}><label htmlFor={sortId}>Sort accounts</label><select id={sortId} value={sort + ":" + direction} onChange={event => { const [key, order] = event.target.value.split(":"); changeSort(key, order); }}>
      {Object.keys(ACCOUNT_SORTS).flatMap(key => (key === "createdAt" ? ["desc", "asc"] : ["asc", "desc"]).map(order => <option key={key + order} value={key + ":" + order}>{sortLabel(key, order)}</option>))}
    </select></div>
    {!accounts.length ? <EmptyBlock title={pagination.total ? "This page is now empty" : "No registered accounts"}>{pagination.total ? "Go to the previous page to see current accounts." : "Accounts will appear here after they are created."}</EmptyBlock> :
      <table className={styles.table} aria-label="Registered account directory" role="table">
        <thead role="rowgroup"><tr role="row">{Object.entries(ACCOUNT_SORTS).map(([key, label]) => {
          const Icon = key !== sort ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
          return <th scope="col" role="columnheader" key={key} aria-label={label} aria-sort={key !== sort ? "none" : direction === "asc" ? "ascending" : "descending"}>
            <button type="button" onClick={() => changeSort(key)} aria-label={"Sort by " + label}>{label}<Icon aria-hidden="true" size={14}/></button>
          </th>;
        })}</tr></thead>
        <tbody role="rowgroup">{accounts.map(account => <tr key={account.id} role="row">
          <th scope="row" role="rowheader"><span className={styles.username}>{account.username}</span></th>
          <td className={styles.email} role="cell"><span className={styles.mobileLabel} aria-hidden="true">Email</span>{account.email}</td>
          <td className={styles.created} role="cell"><span className={styles.mobileLabel} aria-hidden="true">Created · UTC−8</span><time dateTime={new Date(account.createdAtMs).toISOString()} title={new Date(account.createdAtMs).toISOString()}>{createdDate.format(account.createdAtMs)}</time></td>
          <td role="cell"><span className={styles.mobileLabel} aria-hidden="true">Current leagues</span>{account.leagues.length ? <ul className={styles.leagues}>{account.leagues.map(league => <li key={league.id}>{league.name}</li>)}</ul> : <span className={styles.noLeague}>No current leagues</span>}</td>
          <td className={styles.statusCell} role="cell"><span className={styles.status} data-status={account.status}>{ACCOUNT_STATUSES[account.status]}</span></td>
        </tr>)}</tbody>
      </table>}
    <div className={styles.pagination}><span>50 accounts per page</span><div>
      <button type="button" onClick={() => setOffset(Math.max(0, offset - ACCOUNT_DIRECTORY_LIMIT))} disabled={offset === 0 || query.isFetching}><ChevronLeft aria-hidden="true" size={16}/>Previous</button>
      <button type="button" onClick={() => setOffset(offset + ACCOUNT_DIRECTORY_LIMIT)} disabled={!pagination.hasMore || query.isFetching}>Next<ChevronRight aria-hidden="true" size={16}/></button>
    </div></div>
    <p className={styles.footnote}>Created dates use UTC−8. Current leagues include active memberships only; league sorting uses the first alphabetical league, with no-league accounts last. Account details are separate from aggregate activity; no individual activity is shown.</p>
  </>;
}
function DirectorySection({ session }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId(), titleId = useId();
  return <Surface className={styles.directory} aria-labelledby={titleId}>
    <div className={styles.heading}>
      <span className={styles.icon}><UsersRound aria-hidden="true" size={23}/></span>
      <div><p className={styles.eyebrow}>ACCOUNT ADMINISTRATION</p>
        <h2 id={titleId}><button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(value => !value)}>Account directory<ChevronDown aria-hidden="true" className={expanded ? styles.rotated : ""} size={20}/></button></h2>
        <p className={styles.description}>Usernames, email addresses, creation dates, and current leagues for all accounts. Independent of the analytics date range.</p>
      </div>
    </div>
    <div id={panelId} hidden={!expanded}>{expanded && <div className={styles.content}><DirectoryPage session={session}/></div>}</div>
  </Surface>;
}
export function AccountDirectory() {
  const session = useSession();
  if (session.status !== "authenticated" || !session.user?.id) return null;
  return <DirectorySection key={session.user.id} session={session}/>;
}
