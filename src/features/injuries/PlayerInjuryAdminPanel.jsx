import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Surface } from '../../components/HundoUi.jsx';

const labels = { injured: 'Injured', healthy: 'Healthy', unknown: 'Not confirmed' };

export function PlayerInjuryAdminPanel({ httpClient }) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('injured');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const saving = useRef(false);
  const query = useQuery({
    queryKey: ['admin-injuries', search],
    queryFn: async ({ signal }) => (await httpClient.request(`/api/v1/admin/injuries?search=${encodeURIComponent(search)}`, {
      authenticated: true, dataKind: 'object', signal,
    })).data,
    meta: { private: true }, staleTime: 10_000,
  });
  const mutation = useMutation({
    mutationFn: input => httpClient.request('/api/v1/admin/injuries/decide', {
      method: 'POST', authenticated: true, dataKind: 'object', body: input,
    }),
    onSuccess: async () => {
      setMessage(`${selected.name} marked ${labels[status].toLowerCase()} across all leagues.`);
      setSelected(null); setReason('');
      await queryClient.invalidateQueries();
    },
    onError: async () => { await query.refetch(); },
  });
  async function save(event) {
    event.preventDefault();
    if (saving.current || !selected || reason.trim().length < 3) return;
    saving.current = true; setMessage('');
    try { await mutation.mutateAsync({ playerId: selected.id, status, reason: reason.trim(), expectedVersion: selected.version }); }
    catch { /* The form retains the attempted decision; the error explains recovery. */ }
    finally { saving.current = false; }
  }
  function choose(player) {
    setSelected(player); setStatus(player.status === 'injured' ? 'healthy' : 'injured');
    setReason(''); setMessage(''); mutation.reset();
  }
  return <Surface className="hl-admin-league-panel hl-injury-admin" aria-labelledby="player-injuries-title">
    <p className="hl-eyebrow">Platform administration</p>
    <h2 id="player-injuries-title">Player injuries</h2>
    <p>Update a player once for every league. Confirmed healthy players must be removed from injured reserve.</p>
    <p className="hl-injury-source-note">Automatic imports are off while a free source is being verified.</p>
    <form className="hl-injury-search" onSubmit={event => { event.preventDefault(); setSearch(searchInput.trim()); setSelected(null); mutation.reset(); }}>
      <label htmlFor="injury-search">Find a player</label>
      <div className="hl-button-row">
        <input id="injury-search" value={searchInput} maxLength={100} placeholder="Player name" onChange={event => setSearchInput(event.target.value)} disabled={mutation.isPending} />
        <button className="hl-button" disabled={mutation.isPending}>Search</button>
        <button type="button" className="hl-button" disabled={mutation.isPending} onClick={() => { setSearch(''); setSearchInput(''); setSelected(null); mutation.reset(); }}>Review statuses</button>
      </div>
    </form>
    {query.isPending && <p role="status">Loading injury statuses…</p>}
    {query.isError && <p role="alert">Injury statuses could not be loaded. <button type="button" className="hl-button" onClick={() => query.refetch()}>Try again</button></p>}
    {query.data && <>
      <ul className="hl-injury-player-list">
        {query.data.players.map(player => <li key={player.id}>
          <div><strong className={player.status === 'injured' ? 'hl-injured-player-name' : ''}>{player.name}</strong>
            <small>{labels[player.status]}{player.team ? ` · ${player.team}` : ''}{player.birthDate ? ` · Born ${player.birthDate}` : ''}{player.reviewReason ? ' · Needs review' : ''}{player.stale ? ' · Outdated report' : ''}</small>
          </div>
          <button type="button" className="hl-button" disabled={mutation.isPending} onClick={() => choose(player)} aria-label={`Review ${player.name}`}>Review</button>
        </li>)}
      </ul>
      {!query.data.players.length && <p>{search ? 'No players found. Try another name.' : 'No reviewed statuses yet. Search for a player to get started.'}</p>}
      {query.data.players.length === 100 && <p>Showing the first 100 matches. Search a more specific name to narrow the list.</p>}
    </>}
    {selected && <form className="hl-injury-decision" onSubmit={save}>
      <h3>Review {selected.name}</h3>
      <label htmlFor="injury-status">Status across all leagues</label>
      <select id="injury-status" value={status} disabled={mutation.isPending} onChange={event => setStatus(event.target.value)}>
        <option value="injured">Injured</option><option value="healthy">Healthy — confirmed available</option><option value="unknown">Not confirmed</option>
      </select>
      <label htmlFor="injury-reason">Reason or source</label>
      <textarea id="injury-reason" value={reason} minLength={3} maxLength={500} required disabled={mutation.isPending} onChange={event => setReason(event.target.value)} placeholder="For example, team announcement confirming return to play" />
      {status === 'healthy' && <p>Any roster keeping this player on IR will be marked illegal. The player stays in their current roster slot.</p>}
      {status === 'unknown' && <p>Removes the injury confirmation without declaring the player healthy.</p>}
      <div className="hl-button-row"><button className="hl-button is-primary" disabled={mutation.isPending || reason.trim().length < 3 || mutation.isError}>{mutation.isPending ? 'Saving…' : 'Save for all leagues'}</button>
        <button type="button" className="hl-button" disabled={mutation.isPending} onClick={() => { setSelected(null); mutation.reset(); }}>Cancel</button></div>
    </form>}
    {mutation.isError && <p role="alert">{mutation.error?.code === 'INJURY_VERSION_CONFLICT' ? 'This status changed while you were reviewing it.' : 'The save could not be confirmed.'} Review the refreshed player entry before saving again.</p>}
    <p role="status" aria-live="polite">{message}</p>
    {query.data?.history.length > 0 && <details><summary>Recent injury decisions</summary><ul className="hl-injury-history">
      {query.data.history.map(event => <li key={event.id}><strong>{event.name || 'Injury settings'}</strong>{labels[event.status] ? ` · ${labels[event.status]}` : ''} · {event.actor || 'Feed'} · {new Date(event.createdAtMs).toLocaleString()}<p>{event.reason}</p></li>)}
    </ul></details>}
  </Surface>;
}
