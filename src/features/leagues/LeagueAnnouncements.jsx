import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hasCommissionerAuthority } from "../../shared/leagueAuthority.js";
import { relativeTime } from "../../shared/hundoFormat.js";
import { createIntentKey } from "../accounts/accountApi.js";
import { announcementKey, announcementsQuery, postAnnouncement } from "./announcementQueries.js";

export function LeagueAnnouncements({ league, session }) {
  const queryClient = useQueryClient();
  const announcements = useInfiniteQuery(announcementsQuery(session.httpClient, league.id));
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState("");
  const [posted, setPosted] = useState(false);
  const intent = useRef(null);
  const composer = useRef(null);
  useEffect(() => { if (composing) composer.current?.focus(); }, [composing]);
  const post = useMutation({
    mutationFn: () => {
      const text = body.trim();
      if (intent.current?.body !== text) intent.current = { body: text, key: createIntentKey("league-announcement") };
      return postAnnouncement(session.httpClient, league.id, text, intent.current.key);
    },
    onSuccess: async () => {
      setBody("");
      intent.current = null;
      setComposing(false);
      setPosted(true);
      await queryClient.invalidateQueries({ queryKey: announcementKey(league.id) });
    },
  });
  const items = announcements.data?.pages.flatMap((page) => page.announcements) || [];
  return <section className="hl-sidebar-announcements" aria-labelledby="sidebar-announcements-title" tabIndex={0}>
    <header><h2 id="sidebar-announcements-title">League announcements</h2>
      {hasCommissionerAuthority(league.membership) && <button type="button" disabled={post.isPending} aria-expanded={composing} onClick={() => { setComposing(!composing); setPosted(false); post.reset(); }}>
        {composing ? "Cancel" : "Write"}
      </button>}
    </header>
    {composing && hasCommissionerAuthority(league.membership) && <form onSubmit={(event) => { event.preventDefault(); if (body.trim() && !post.isPending) post.mutate(); }}>
      <label>Announcement<textarea ref={composer} maxLength={2000} required value={body} disabled={post.isPending} onChange={(event) => setBody(event.target.value)} /></label>
      <small>{body.length}/2000</small>
      <button type="submit" disabled={post.isPending || !body.trim()}>{post.isPending ? "Posting…" : "Post announcement"}</button>
      {post.isError && <p role="alert">The announcement could not be posted. Your draft is still here. Try again.</p>}
    </form>}
    {posted && <p role="status">Announcement posted.</p>}
    {announcements.isPending ? <p role="status">Loading announcements…</p> : announcements.isError ? <p role="alert">Announcements could not be loaded. <button type="button" onClick={() => announcements.refetch()}>Retry</button></p> : items.length === 0 ? <p>No announcements yet.</p> : <ol>
      {items.map((item) => <li key={item.id}><p>{item.body}</p><small>{item.authorName} · </small><time dateTime={new Date(item.createdAtMs).toISOString()}>{relativeTime(item.createdAtMs)}</time></li>)}
    </ol>}
    {announcements.hasNextPage && <button type="button" disabled={announcements.isFetchingNextPage} onClick={() => announcements.fetchNextPage()}>{announcements.isFetchingNextPage ? "Loading…" : "Older announcements"}</button>}
  </section>;
}
