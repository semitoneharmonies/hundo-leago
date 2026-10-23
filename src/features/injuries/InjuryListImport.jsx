import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const changeLabels = { add: 'Make eligible', update: 'Update details', clear: 'Return to regular status' };
export function InjuryListImport({ httpClient }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [resolutions, setResolutions] = useState({});
  const [preview, setPreview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const inFlight = useRef(false);
  function edit(value) {
    setText(value); setResolutions({}); setPreview(null); setConfirmed(false); setError(''); setMessage('');
  }
  async function request(action) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(action); setError(''); setMessage('');
    const review = preview;
    setPreview(null); setConfirmed(false);
    try {
      const response = await httpClient.request(`/api/v1/admin/injuries/${action}-list`, {
        method: 'POST', authenticated: true, dataKind: 'object',
        body: { text, resolutions, ...(action === 'apply' ? { expectedRevision: review.revision, confirmReplacement: true } : {}) },
      });
      if (action === 'preview') setPreview(response.data);
      else {
        const result = response.data;
        setMessage(`Updated across all leagues: ${result.eligible} players eligible, ${result.counts.add} added, ${result.counts.update} details updated, ${result.counts.clear} returned to regular status.${result.skipped.length ? ` Not imported: ${result.skipped.join(', ')}.` : ''}`);
        await queryClient.invalidateQueries();
      }
    } catch (failure) {
      setError(failure?.code === 'INJURY_VERSION_CONFLICT'
        ? 'Injury data or rosters changed. Preview the list again before applying.'
        : failure?.code === 'INJURY_LIST_INVALID' ? failure.message
          : 'The update could not be confirmed. Your pasted list is preserved. Preview again to check the current statuses.');
    } finally { setBusy(''); inFlight.current = false; }
  }
  function resolve(key, value) {
    setResolutions(current => {
      const next = { ...current };
      if (value) next[key] = value; else delete next[key];
      return next;
    });
    setConfirmed(false);
  }
  return <section className="hl-injury-import" aria-labelledby="injury-import-title">
    <h3 id="injury-import-title">Update IR list</h3>
    <p>Paste the complete list copied from PuckPedia, including player names, timeline, status, and reason. Every listed player becomes IR-eligible. Previously injured players absent from the list return to regular status.</p>
    <form onSubmit={event => { event.preventDefault(); request('preview'); }}>
      <label htmlFor="injury-list-text">Complete injury list</label>
      <textarea id="injury-list-text" rows={8} maxLength={100000} value={text} disabled={Boolean(busy)}
        onChange={event => edit(event.target.value)} placeholder={'Player\tTimeline\tStatus\tReason\nStaal, Jordan\tDay to Day\tOUT\tLower Body'} required />
      <p className="hl-muted">Both table rows and wrapped clipboard text are supported. This does not move players between roster slots. Commissioner player-by-player controls remain separate.</p>
      <button className="hl-button" disabled={Boolean(busy) || !text.trim()}>{busy === 'preview' ? 'Reading list…' : 'Preview changes'}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {preview && <div className="hl-injury-import-review">
      <h4>Review before updating all leagues</h4>
      <p>{preview.total} names · {preview.matched} matched · {preview.skipped.length} explicitly skipped</p>
      <dl className="hl-injury-import-counts">
        {Object.entries({ add: 'Newly eligible', update: 'Details updated', clear: 'Return to regular', unchanged: 'Unchanged' }).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{preview.counts[key]}</dd></div>)}
      </dl>
      {preview.unresolved.length > 0 && <div className="hl-injury-unresolved">
        <h4>Resolve names</h4><p>Choose the correct player, or edit the pasted name, then preview again. A player missing from the catalogue can be explicitly skipped.</p>
        {preview.unresolved.map(row => <div key={row.key}>
          <label htmlFor={`injury-match-${row.key}`}>{row.name}</label>
          <select id={`injury-match-${row.key}`} value={resolutions[row.key] || ''} onChange={event => resolve(row.key, event.target.value)}>
            <option value="">Choose…</option>
            {row.candidates.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name}{candidate.birthDate ? ` · Born ${candidate.birthDate}` : ''}</option>)}
            {!row.candidates.length && <option value="skip">Not in HL — skip this player</option>}
          </select>
        </div>)}
      </div>}
      {preview.skipped.length > 0 && <p>Will not be imported: {preview.skipped.map(row => row.name).join(', ')}.</p>}
      {preview.warnings.length > 0 && <div className="hl-injury-import-warning">
        <h4>Players losing eligibility while in IR</h4>
        <ul>{preview.warnings.map((row, index) => <li key={`${row.playerId}-${index}`}>{row.name} — {row.team} ({row.league})</li>)}</ul>
        <p>These players stay in their slots. Their managers need to move them out of IR.</p>
      </div>}
      <details open><summary>{preview.changes.length} changes</summary>
        <div className="hl-injury-import-table"><table><thead><tr><th>Player</th><th>Change</th><th>Timeline</th><th>Status</th><th>Reason</th></tr></thead>
          <tbody>{preview.changes.map(row => <tr key={row.playerId}><th scope="row">{row.name}</th><td>{changeLabels[row.kind]}</td><td>{row.timeline || '—'}</td><td>{row.designation || '—'}</td><td>{row.reason || '—'}</td></tr>)}</tbody>
        </table></div>
      </details>
      {preview.unchanged.length > 0 && <details><summary>{preview.unchanged.length} unchanged players</summary><p>{preview.unchanged.map(row => row.name).join(', ')}</p></details>}
      <label className="hl-injury-import-confirm"><input type="checkbox" checked={confirmed} disabled={!preview.canApply || !preview.changes.length} onChange={event => setConfirmed(event.target.checked)} />
        I reviewed the complete list and removals. Replace global IR statuses for all leagues.</label>
      <button type="button" className="hl-button is-primary" disabled={Boolean(busy) || !preview.canApply || !preview.changes.length || !confirmed} onClick={() => request('apply')}>Apply to all leagues</button>
      {preview.canApply && !preview.changes.length && <p>The list already matches. No update is needed.</p>}
    </div>}
    {busy === 'apply' && <p role="status">Updating IR statuses…</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
