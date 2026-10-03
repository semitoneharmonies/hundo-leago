import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { createIntentKey } from "../accounts/accountApi.js";
import { hasCommissionerAuthority, effectiveLeagueAuthority } from "../../shared/leagueAuthority.js";
import { quoteReviewQuery, reviewQuote, submitQuote } from "./quoteQueries.js";
import "./QuotePanel.css";

export function QuoteMenuFooter({ league, onOpen }) {
  return <div className="hl-quote-menu-footer">
    {league && <>
    <button type="button" onClick={() => onOpen("submit")}>Submit a quote</button>
    {hasCommissionerAuthority(league.membership) && <button type="button" onClick={() => onOpen("review")}>Review quotes</button>}
    </>}
    <a className="hl-menu-contact" href="mailto:grae@hundoleago.com">grae@hundoleago.com</a>
  </div>;
}

function QuoteSubmission({ league, session }) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const intent = useRef(null);
  const queryClient = useQueryClient();
  const submit = useMutation({ mutationFn: () => {
    const body = { text: text.trim(), author: author.trim() };
    const signature = JSON.stringify(body);
    if (intent.current?.signature !== signature) intent.current = { signature, key: createIntentKey("quote-submit") };
    return submitQuote(session.httpClient, league.id, body, intent.current.key);
  }, onSuccess: () => {
    setText(""); setAuthor(""); intent.current = null;
    queryClient.invalidateQueries({ predicate: ({ queryKey }) => queryKey.includes("quote-review") });
  } });
  return <>
    <p>Share a quote for Hundo Leago!</p>
    {submit.isSuccess && <p role="status">Quote submitted for review. It will appear in the ticker once approved.</p>}
    <form onSubmit={(event) => { event.preventDefault(); if (text.trim() && !submit.isPending) submit.mutate(); }}>
      <label>Quote<textarea required maxLength={500} rows={4} value={text} disabled={submit.isPending} onChange={(event) => { setText(event.target.value); submit.reset(); }} /></label>
      <small>{text.length}/500</small>
      <label>Attributed to (optional)<input maxLength={80} value={author} disabled={submit.isPending} onChange={(event) => setAuthor(event.target.value)} placeholder="Person who said it" /></label>
      {submit.isError && <p role="alert">Your quote could not be submitted. Your draft is still here. Try again.</p>}
      <button className="hl-quote-action" type="submit" disabled={submit.isPending || !text.trim()}>{submit.isPending ? "Submitting…" : "Submit for approval"}</button>
    </form>
  </>;
}

function QuoteReview({ league, session }) {
  const global = effectiveLeagueAuthority(league.membership) === "platform_administrator";
  const queryClient = useQueryClient();
  const query = useInfiniteQuery(quoteReviewQuery(session.httpClient, league.id, global));
  const intent = useRef(null);
  const [result, setResult] = useState("");
  const review = useMutation({ mutationFn: ({ item, decision }) => {
    const signature = `${item.id}:${item.version}:${decision}`;
    if (intent.current?.signature !== signature) intent.current = { signature, key: createIntentKey("quote-review") };
    return reviewQuote(session.httpClient, league.id, global, item, decision, intent.current.key);
  }, onSuccess: async (_data, { decision }) => {
    intent.current = null;
    setResult(decision === "approve" ? `Quote approved for ${global ? "all leagues" : league.name}.` : `Quote declined for ${global ? "the global rotation" : league.name}.`);
    await queryClient.invalidateQueries({ predicate: ({ queryKey }) => queryKey.includes("quote-review") || queryKey.includes("quotes") });
  } });
  const items = query.data?.pages.flatMap((page) => page.quotes) || [];
  return <>
    <p>{global ? "Approve submissions from any league for the rotation across all leagues. Declining here does not remove a commissioner's league approval." : `Approved quotes join the rotation in ${league.name} only.`}</p>
    {result && <p role="status">{result}</p>}
    {review.isError && <p role="alert">The review could not be saved. <button type="button" onClick={() => { review.reset(); query.refetch(); }}>Refresh the list</button> or try again.</p>}
    {query.isPending ? <p role="status">Loading submissions…</p> : query.isError ? <p role="alert">Quotes could not be loaded. <button type="button" onClick={() => query.refetch()}>Retry</button></p> : items.length === 0 ? <p>No quotes awaiting your review.</p> : <ul className="hl-quote-review-list">
      {items.map((item) => <li key={item.id}>
        <blockquote><p>{item.text}</p><footer>— {item.author}</footer></blockquote>
        <small>Submitted by {item.submittedBy || "a league member"}{global && ` · ${item.leagueName || "League"}`}</small>
        <div className="hl-quote-review-actions">
          <button type="button" className="hl-quote-action" disabled={review.isPending} onClick={() => review.mutate({ item, decision: "approve" })}>Approve for {global ? "all leagues" : "this league"}</button>
          <button type="button" disabled={review.isPending} onClick={() => review.mutate({ item, decision: "reject" })}>Decline</button>
        </div>
      </li>)}
    </ul>}
    {query.hasNextPage && <button type="button" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>More submissions</button>}
  </>;
}

export function QuotePanel({ mode, league, session, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    element.showModal();
    return () => { element.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  const review = mode === "review" && hasCommissionerAuthority(league.membership);
  return createPortal(<dialog ref={dialog} className="hl-quote-dialog" aria-labelledby="quote-panel-title" onCancel={onClose}>
    <header><h2 id="quote-panel-title">{review ? "Review quotes" : "Submit a quote"}</h2><button type="button" aria-label="Close quotes" onClick={onClose}><X aria-hidden="true" /></button></header>
    <div className="hl-quote-dialog__body" tabIndex={0}>{review ? <QuoteReview league={league} session={session} /> : <QuoteSubmission league={league} session={session} />}</div>
  </dialog>, document.body);
}
