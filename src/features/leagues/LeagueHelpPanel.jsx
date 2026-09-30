import {useRef,useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {ErrorBlock,LoadingBlock,Surface} from '../../components/HundoUi.jsx';
import {routePaths} from '../../app/routePaths.js';
import {createIdempotencyKey} from '../../shared/api/idempotency.js';
import {ResponseContractError} from '../../shared/api/responseContracts.js';
import {useSession} from '../session/sessionContext.js';
import styles from '../commissioner/LeagueCommunications.module.css';
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value);
const validRequest=r=>r&&uuid(r.id)&&uuid(r.teamId)&&typeof r.teamName==='string'&&typeof r.subject==='string'&&typeof r.message==='string'&&
 ['general','auction','roster','trade'].includes(r.kind)&&['open','resolved','withdrawn'].includes(r.status)&&Number.isInteger(r.version)&&r.version>0&&
 typeof r.targetLabel==='string'&&(r.kind==='general'?r.targetId===null:uuid(r.targetId))&&typeof r.requesterName==='string';
function recordPath(leagueId,r){if(r.kind==='auction')return routePaths.auctionDetail(leagueId,r.targetId);if(r.kind==='trade')return routePaths.trade(leagueId,r.targetId);if(r.kind==='roster')return routePaths.teamRoster(leagueId,r.teamId);return null;}
export function LeagueHelpPanel({leagueId}){
 const session=useSession(),client=useQueryClient(),retry=useRef(null);
 const [opened,setOpened]=useState(()=>globalThis.location?.hash==='#league-help'),[filter,setFilter]=useState('open'),[cursor,setCursor]=useState(null),[selected,setSelected]=useState(null);
 const [teamId,setTeam]=useState(''),[kind,setKind]=useState('general'),[targetId,setTarget]=useState(''),[subject,setSubject]=useState(''),[message,setMessage]=useState('');
 const [action,setAction]=useState('reply'),[reply,setReply]=useState(''),[receipt,setReceipt]=useState('');
 const base='/api/v1/leagues/'+encodeURIComponent(leagueId)+'/help',prefix=['league',leagueId,'help'];
 function validate(data,operation){
  let valid=data?.leagueId===leagueId;
  if(operation==='list')valid&&=typeof data.canManage==='boolean'&&Array.isArray(data.teams)&&data.teams.every(t=>uuid(t.id)&&typeof t.name==='string')&&
   Array.isArray(data.requests)&&data.requests.every(validRequest)&&Array.isArray(data.cardHelp)&&data.cardHelp.every(h=>uuid(h.id)&&uuid(h.fadId)&&uuid(h.teamId)&&typeof h.teamName==='string'&&typeof h.available==='boolean')&&(data.nextCursor===null||typeof data.nextCursor==='string');
  if(operation==='targets')valid&&=data.teamId===teamId&&data.kind===kind&&Array.isArray(data.targets)&&data.targets.every(t=>uuid(t.id)&&typeof t.label==='string');
  if(operation==='detail')valid&&=typeof data.canManage==='boolean'&&typeof data.isRequester==='boolean'&&validRequest(data.request)&&data.request.id===selected&&Array.isArray(data.events)&&data.events.every(e=>uuid(e.id)&&typeof e.message==='string'&&typeof e.actorName==='string'&&['reply','resolve','withdraw','reopen'].includes(e.action));
  if(operation==='write')valid&&=data.accepted===true&&uuid(data.id)&&typeof data.replayed==='boolean';
  if(!valid)throw new ResponseContractError('The private help response could not be verified.');return true;
 }
 async function request(suffix,operation,options={}){const response=await session.httpClient.request(base+suffix,{...options,authenticated:true,dataKind:'object',validateData:data=>validate(data,operation)});validate(response.data,operation);return response.data;}
 const queue=useQuery({queryKey:[...prefix,filter,cursor],queryFn:({signal})=>request('?'+new URLSearchParams({status:filter,...(cursor?{cursor}:{})}),'list',{signal}),enabled:opened&&session.status==='authenticated',retry:false,meta:{private:true,leagueId}});
 const targets=useQuery({queryKey:[...prefix,'targets',teamId,kind],queryFn:({signal})=>request('/targets?'+new URLSearchParams({teamId,kind}),'targets',{signal}),enabled:opened&&Boolean(teamId)&&kind!=='general',retry:false,meta:{private:true,leagueId}});
 const detail=useQuery({queryKey:[...prefix,'detail',selected],queryFn:({signal})=>request('/'+selected,'detail',{signal}),enabled:opened&&Boolean(selected),retry:false,meta:{private:true,leagueId}});
 const save=useMutation({mutationFn:({suffix,body})=>{
  const signature=JSON.stringify({suffix,body});if(retry.current?.signature!==signature)retry.current={signature,key:createIdempotencyKey('league-help')};
  return request(suffix,'write',{method:'POST',body,idempotencyKey:retry.current.key});
 },onSuccess:async(data,command)=>{retry.current=null;setReceipt(command.suffix?'Help request updated.':'Help request sent privately to the commissioner.');
  if(!command.suffix){setSubject('');setMessage('');setSelected(data.id);}else setReply('');setAction('reply');await client.invalidateQueries({queryKey:prefix});}});
 function choose(id){setSelected(id);setReply('');setAction('reply');setReceipt('');save.reset();}
 const current=detail.data&&!detail.isError?detail.data:null,busy=save.isPending;
 return <Surface as="section" id="league-help" className={styles.section} aria-label="Private league help"><details open={opened} onToggle={e=>setOpened(e.currentTarget.open)}><summary>Private league help</summary>
  {opened&&<>
   <p>Ask for help with your team or a specific record. Requests and replies are visible to you and current league commissioners or administrators. Other managers cannot read them.</p>
   <p>Linking a record does not reveal private bids or grant access to Candidate Cards. Avoid copying hidden offers into your message. For Candidate Card help, use the explicit help button on your card.</p>
   <div className={styles.actions}><label>Show requests <select value={filter} disabled={busy} onChange={e=>{setFilter(e.target.value);setCursor(null);choose(null);}}><option value="open">Open</option><option value="closed">Closed</option><option value="all">All</option></select></label>
    <button type="button" className="hl-button hl-button--quiet" disabled={busy||queue.isFetching} onClick={()=>{queue.refetch();if(selected)detail.refetch();}}>Refresh help queue</button></div>
   {queue.isPending&&<LoadingBlock>Loading private help…</LoadingBlock>}{queue.error&&<ErrorBlock error={queue.error} fallback="Help requests could not be loaded."/>}
   {queue.data&&!queue.isError&&<>
    <p>{queue.data.canManage?'All league help requests':'Your help requests'}</p>
    {!queue.data.requests.length&&<p>No {filter==='all'?'':filter+' '}requests on this page.</p>}
    <ul className={styles.cards}>{queue.data.requests.map(r=><li key={r.id}><span>{r.teamName} · {r.status}</span><button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={()=>choose(r.id)}>{r.subject}</button></li>)}</ul>
    <div className={styles.actions}>{cursor&&<button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={()=>setCursor(null)}>First page</button>}{queue.data.nextCursor&&<button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={()=>setCursor(queue.data.nextCursor)}>Older requests</button>}</div>
    {queue.data.cardHelp.length>0&&<section aria-label="Candidate Card help requests"><h3>Candidate Card help</h3><p>These managers used the existing card help grant. Opening a card explicitly reveals it only when your current permission allows it.</p><ul>{queue.data.cardHelp.map(h=><li key={h.id}>{h.teamName}: {h.message||'Help requested'} · {h.available?<Link to={routePaths.freeAgentDraftCard(leagueId,h.fadId,h.teamId)}>Open requested card</Link>:'Help window closed'}</li>)}</ul></section>}
    {queue.data.teams.length>0&&<details><summary>Ask the commissioner for help</summary><form className={styles.editor} onSubmit={e=>{e.preventDefault();save.mutate({suffix:'',body:{teamId,kind,targetId:kind==='general'?null:targetId,subject,message}});}}>
     <label>Your team<select required disabled={busy} value={teamId} onChange={e=>{setTeam(e.target.value);setTarget('');}}><option value="">Choose your team</option>{queue.data.teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
     <label>Help category<select disabled={busy} value={kind} onChange={e=>{setKind(e.target.value);setTarget('');}}><option value="general">General league help</option><option value="auction">Auction</option><option value="roster">Roster player</option><option value="trade">Trade</option></select></label>
     {kind!=='general'&&<>{targets.error&&<ErrorBlock error={targets.error} fallback="Your records could not be loaded."/>}<label>Affected record<select required disabled={busy||targets.isFetching} value={targetId} onChange={e=>setTarget(e.target.value)}><option value="">Choose a record</option>{!targets.isError&&targets.data?.targets.map(t=><option key={t.id} value={t.id}>{t.label} · {t.status}</option>)}</select></label><small>Shows your current roster or up to 200 recent auctions and trades involving your team. Use general help for an older issue.</small></>}
     <label>Subject<input required minLength={3} maxLength={120} disabled={busy} value={subject} onChange={e=>setSubject(e.target.value)}/></label>
     <label>What needs attention?<textarea required minLength={3} maxLength={2000} disabled={busy} value={message} onChange={e=>setMessage(e.target.value)}/></label>
     <button type="submit" className="hl-button hl-button--primary" disabled={busy||!teamId||kind!=='general'&&(!targetId||targets.isError)||subject.trim().length<3||message.trim().length<3}>Send private help request</button>
    </form></details>}
   </>}
   {selected&&detail.isPending&&<LoadingBlock>Loading request…</LoadingBlock>}{selected&&detail.error&&<ErrorBlock error={detail.error} fallback="This request is no longer available."/>}
   {selected&&current&&<section className={styles.preview} aria-label="Selected help request"><h3>{current.request.subject}</h3><p>{current.request.requesterName} · {current.request.teamName} · {current.request.status}</p><p className={styles.message}>{current.request.message}</p>
    {recordPath(leagueId,current.request)&&<p><Link to={recordPath(leagueId,current.request)}>Open {current.request.targetLabel}</Link> · Uses your existing access; private auction details still require an explicit reveal.</p>}
    {current.events.map(event=><div key={event.id} className={styles.notice}><small>{event.actorName} · {event.action}</small><p className={styles.message}>{event.message}</p></div>)}
    <form className={styles.editor} onSubmit={e=>{e.preventDefault();save.mutate({suffix:'/'+selected+'/events',body:{action:current.request.status==='open'?action:'reopen',message:reply,expectedVersion:current.request.version}});}}>
     {current.request.status==='open'?<label>Request action<select disabled={busy} value={action} onChange={e=>setAction(e.target.value)}><option value="reply">Reply</option>{current.canManage&&<option value="resolve">Resolve request</option>}{current.isRequester&&<option value="withdraw">Withdraw request</option>}</select></label>:<p>Add a message to reopen this request.</p>}
     <label>Reply or resolution note<textarea required minLength={3} maxLength={2000} disabled={busy} value={reply} onChange={e=>setReply(e.target.value)}/></label>
     <button type="submit" className="hl-button hl-button--primary" disabled={busy||reply.trim().length<3}>{current.request.status==='open'?'Save reply or action':'Reopen request'}</button>
    </form>
   </section>}
   {save.error&&<ErrorBlock error={save.error} fallback="Your help request could not be saved. Refresh if the request changed."/>}{receipt&&<p role="status">{receipt}</p>}
  </>}
 </details></Surface>;
}
