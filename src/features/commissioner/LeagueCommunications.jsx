import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorBlock, LoadingBlock, Surface } from "../../components/HundoUi.jsx";
import { createIdempotencyKey } from "../../shared/api/idempotency.js";
import { useSession } from "../session/sessionContext.js";
import { communicationRequest, communicationsKey, communicationsQuery } from "./leagueCommunicationApi.js";
import styles from "./LeagueCommunications.module.css";

const INITIAL = { kind: "announcement", title: "", body: "", audience: "members", pinned: false, expiresAtMs: null, notify: true };
const labels = { complete: "Complete", incomplete: "Incomplete", empty: "Empty" };
function displayTime(value) { return new Date(value).toLocaleString(); }

function Message({ message }) {
  return <article className={styles.notice}>
    <h3>{message.pinned && <span className={styles.pinned}>Pinned</span>}{message.title}</h3>
    <p className={styles.message}>{message.body}</p>
    <p className={styles.meta}>{message.authorName || "League administration"} · {displayTime(message.createdAtMs)}
      {message.expiresAtMs !== null && <> · Expires {displayTime(message.expiresAtMs)}</>}</p>
  </article>;
}

function CommunicationControls({ leagueId, client }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(INITIAL);
  const [expiry, setExpiry] = useState("");
  const [preview, setPreview] = useState(null);
  const [receipt, setReceipt] = useState("");
  const [archiveTarget, setArchiveTarget] = useState(null);
  const history = useQuery(communicationsQuery(client, leagueId, true));
  const invalidate = () => queryClient.invalidateQueries({ queryKey: communicationsKey(leagueId) });
  const review = useMutation({
    mutationFn: message => communicationRequest(client, leagueId, "/preview", { method: "POST", body: message }, "preview"),
    onSuccess: data => setPreview({ ...data, key: createIdempotencyKey("league-message") }),
  });
  const send = useMutation({
    mutationFn: saved => communicationRequest(client, leagueId, "", {
      method: "POST", body: { message: saved.message, previewHash: saved.previewHash }, idempotencyKey: saved.key,
    }, "sent"),
    onSuccess: async (data, saved) => {
      setReceipt(saved.message.kind === "announcement"
        ? `Announcement published. ${data.recipientCount} in-app notifications delivered.`
        : `Reminder delivered to ${data.recipientCount} ${data.recipientCount === 1 ? "person" : "people"}.`);
      setPreview(null); setDraft(INITIAL); setExpiry("");
      await invalidate();
    },
  });
  const archive = useMutation({
    mutationFn: message => communicationRequest(client, leagueId, `/${message.id}/archive`, {
      method: "POST", body: { version: message.version, confirmed: true },
    }, "archived"),
    onSuccess: async () => { setArchiveTarget(null); setReceipt("Announcement archived. Its history is preserved."); await invalidate(); },
  });
  const busy = review.isPending || send.isPending;
  function change(values) {
    setDraft(current => ({ ...current, ...values })); setPreview(null); setReceipt(""); review.reset(); send.reset();
  }
  function switchKind(kind) {
    change({ kind, audience: kind === "announcement" ? "members" : "managers", pinned: false, expiresAtMs: null, notify: true });
    setExpiry("");
  }
  return <div>
    <form className={styles.editor+" "+styles.compactEditor} onSubmit={event => { event.preventDefault(); setPreview(null); send.reset(); review.mutate(draft); }}>
      <h3>Announcements and reminders</h3>
      <label>Message type<select value={draft.kind} disabled={busy} onChange={event => switchKind(event.target.value)}>
        <option value="announcement">League announcement</option><option value="reminder">Targeted reminder</option>
      </select></label>
      {draft.kind === "reminder" && <label>Recipients<select value={draft.audience} disabled={busy} onChange={event => change({ audience: event.target.value })}>
        <option value="managers">All team managers</option><option value="unfinished_cards">Managers with unfinished Candidate Cards</option>
        <option value="pending_invitations">People with pending league invitations</option><option value="members">All active league members</option>
      </select></label>}
      <label>Title<input required maxLength={120} value={draft.title} disabled={busy} onChange={event => change({ title: event.target.value })} /></label>
      <label className={styles.wide}>Message<textarea required maxLength={3000} value={draft.body} disabled={busy} onChange={event => change({ body: event.target.value })} /></label>
      {draft.kind === "announcement" && <>
        <label className={styles.check}><input type="checkbox" checked={draft.pinned} disabled={busy} onChange={event => change({ pinned: event.target.checked })} />Pin to the league dashboard</label>
        <label className={styles.check}><input type="checkbox" checked={draft.notify} disabled={busy} onChange={event => change({ notify: event.target.checked })} />Also notify league members</label>
        <label>Optional expiry ({Intl.DateTimeFormat().resolvedOptions().timeZone})<input type="datetime-local" value={expiry} disabled={busy}
          onChange={event => { setExpiry(event.target.value); change({ expiresAtMs: event.target.value ? new Date(event.target.value).getTime() : null }); }} /></label>
      </>}
      <p className={styles.wide}>Delivery: in-app notifications.</p>
      <div className={styles.actions}><button className="hl-button hl-button--secondary" type="submit" disabled={busy || !draft.title.trim() || !draft.body.trim()}>
        {review.isPending ? "Preparing preview…" : "Preview message"}</button></div>
      {review.error && <ErrorBlock error={review.error} fallback="The preview could not be prepared." />}
    </form>
    {preview && <section className={styles.preview} aria-label="Message preview">
      <h3>{preview.message.title}</h3><p className={styles.message}>{preview.message.body}</p>
      <p>{preview.message.kind === "announcement" ? "Visible to league members." : "Private reminder."} {preview.recipientCount} in-app notifications.</p>
      {preview.message.pinned && <p>Pinned to the league dashboard.</p>}
      {preview.message.expiresAtMs !== null && <p>Expires {displayTime(preview.message.expiresAtMs)}.</p>}
      <ul className={styles.recipients} aria-label="Notification recipients">{preview.recipients.map(person => <li key={person.userId}>{person.displayName}</li>)}</ul>
      <div className={styles.actions}><button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={() => send.mutate(preview)}>
        {send.isPending ? "Sending…" : preview.message.kind === "announcement" ? "Confirm announcement" : "Confirm reminder"}</button>
        <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setPreview(null); send.reset(); }}>Cancel preview</button></div>
      {send.error && <ErrorBlock error={send.error} fallback="The send could not be confirmed. Retry this send, or prepare a new preview if recipients changed." />}
    </section>}
    {receipt && <p role="status">{receipt}</p>}
    <details className={styles.history}><summary>Recent message history</summary>
      {history.isPending && <LoadingBlock>Loading message history…</LoadingBlock>}
      {history.error && <ErrorBlock error={history.error} fallback="Message history is unavailable." />}
      {history.data?.messages.length === 0 && <p>No messages have been published.</p>}
      {history.data?.messages.map(message => <div key={message.id}><Message message={message} />
        <p>{message.kind === "reminder" ? "Private reminder" : "Announcement"} · {message.recipientCount} notifications
          {message.archivedAtMs !== null && " · Archived"}</p>
        {message.kind === "announcement" && message.archivedAtMs === null && <button type="button" className="hl-button hl-button--quiet"
          disabled={archive.isPending} onClick={() => { archive.reset(); setArchiveTarget(message); }}>Archive announcement</button>}
      </div>)}
    </details>
    {archiveTarget && <section className={styles.preview} aria-label="Archive confirmation"><p>Archive “{archiveTarget.title}”? It will leave the dashboard; its history will remain.</p>
      <div className={styles.actions}><button type="button" className="hl-button hl-button--secondary" disabled={archive.isPending} onClick={() => archive.mutate(archiveTarget)}>Confirm archive</button>
        <button type="button" className="hl-button hl-button--quiet" disabled={archive.isPending} onClick={() => setArchiveTarget(null)}>Keep announcement</button></div>
      {archive.error && <ErrorBlock error={archive.error} fallback="The archive could not be confirmed." />}</section>}
  </div>;
}

export function LeagueCommunications({ leagueId, canManage = false, initiallyExpanded = false }) {
  const session = useSession();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const announcements = useQuery({ ...communicationsQuery(session.httpClient, leagueId), enabled: session.status === "authenticated" });
  if (!canManage && announcements.isSuccess && !announcements.data.messages.length) return null;
  return <Surface className={styles.section} as="section" aria-label="League announcements">
    <h2>League announcements</h2>
    {announcements.data?.messages.map(message => <Message key={message.id} message={message} />)}
    {announcements.isPending && <LoadingBlock>Loading announcements…</LoadingBlock>}
    {announcements.error && <ErrorBlock error={announcements.error} fallback="League announcements are unavailable." />}
    {canManage && announcements.data?.messages.length === 0 && <p>No current announcements.</p>}
    {canManage && <details open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}><summary>Manage announcements and reminders</summary>
      {expanded && <CommunicationControls key={leagueId} leagueId={leagueId} client={session.httpClient} />}
    </details>}
  </Surface>;
}

export function CandidateCardProgress({leagueId}) {
 const session=useSession(),client=useQueryClient(),attempt=useRef(null),busyRef=useRef(false);
 const [receipt,setReceipt]=useState('');
 const progress=useQuery({queryKey:[...communicationsKey(leagueId),'cards'],queryFn:({signal})=>communicationRequest(session.httpClient,leagueId,'/card-progress',{signal},'cards'),enabled:session.status==='authenticated',meta:{private:true,leagueId},refetchInterval:30000,retry:false});
 const send=useMutation({mutationFn:async()=>{
   if(busyRef.current)return null;busyRef.current=true;
   try {
    if(!attempt.current){const message={kind:'reminder',title:'Complete your Candidate Card',body:'Please finish and save your Candidate Card before the draft target deadline. Open Free Agent Draft to review your card.',audience:'unfinished_cards',pinned:false,expiresAtMs:null,notify:true};
      const preview=await communicationRequest(session.httpClient,leagueId,'/preview',{method:'POST',body:message},'preview');
      attempt.current={key:createIdempotencyKey('card-reminder'),body:{message:preview.message,previewHash:preview.previewHash}};
    }
    return await communicationRequest(session.httpClient,leagueId,'',{method:'POST',body:attempt.current.body,idempotencyKey:attempt.current.key},'sent');
   } finally {busyRef.current=false;}
 },onSuccess:async data=>{if(!data)return;setReceipt('Reminder delivered to '+data.recipientCount+' '+(data.recipientCount===1?'manager.':'managers.'));attempt.current=null;await client.invalidateQueries({queryKey:communicationsKey(leagueId)});},onError:error=>{if(error.code==='COMMUNICATION_PREVIEW_CHANGED'||error.code==='COMMUNICATION_NO_RECIPIENTS')attempt.current=null;}});
 const data=progress.isError?null:progress.data,unfinished=data?.cards.filter(c=>c.status!=='complete')||[],recipients=new Set(unfinished.filter(c=>c.userId).map(c=>c.userId)).size;
 return <Surface as="section" className={styles.section} aria-label="Candidate Card progress"><h2>Candidate Card progress</h2><p>Status only; selections and offers stay private.</p>
 {progress.isPending&&<LoadingBlock>Checking Candidate Cards…</LoadingBlock>}{progress.error&&<ErrorBlock error={progress.error}/>}
 {data&&<>{data.total===0?<p>No open Candidate Cards for this season.</p>:<><p><strong>{data.complete} of {data.total} complete</strong> · {unfinished.length} unfinished</p><ul className={styles.cards}>{data.cards.map(c=><li key={c.teamId}><span><strong>{c.teamName}</strong> · {c.displayName||'Manager unassigned'}</span><span>{labels[c.status]}</span></li>)}</ul>
 <button type="button" className="hl-button hl-button--secondary" disabled={send.isPending||(!recipients&&!attempt.current)} onClick={()=>{setReceipt('');send.mutate();}}>{send.isPending?'Sending…':attempt.current?'Retry reminder':'Remind managers with unfinished cards'}</button>
 {!recipients&&<p>{unfinished.length?'Unfinished cards have no assigned manager to notify.':'All cards are complete. No reminder needed.'}</p>}</> }</>}
 {send.error&&<ErrorBlock error={send.error} fallback="The reminder was not confirmed. Retry to check the same send; managers will not receive duplicate notifications."/>}{receipt&&<p role="status">{receipt}</p>}
 </Surface>;
}
