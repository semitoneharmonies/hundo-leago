import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/render.jsx';
import { InjuryListImport } from './InjuryListImport.jsx';
const config = { appEnv: 'local', apiOrigin: 'http://127.0.0.1:4199', socketOrigin: 'http://127.0.0.1:4199', buildId: null };
const text = 'Staal, Jordan\nDay to Day\nOUT\tLower Body';
const preview = { revision: 'a'.repeat(64), canApply: true, total: 1, matched: 1,
  counts: { add: 1, update: 0, clear: 1, unchanged: 0 },
  changes: [{ playerId: 'one', name: 'Jordan Staal', kind: 'add', timeline: 'Day to Day', designation: 'OUT', reason: 'Lower Body' },
    { playerId: 'two', name: 'Dylan Larkin', kind: 'clear' }],
  unchanged: [], unresolved: [], skipped: [], warnings: [{ playerId: 'two', name: 'Dylan Larkin', team: 'Test Team', league: 'Test League' }] };
function start(request) {
  renderWithProviders(<InjuryListImport httpClient={{ request }} />, { config });
  fireEvent.change(screen.getByLabelText('Complete injury list'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
}
describe('admin injury list', () => {
  it('requires preview and explicit replacement confirmation, then applies once', async () => {
    const request = vi.fn(async url => ({ data: url.includes('preview') ? preview : { eligible: 1, counts: preview.counts, skipped: [] } }));
    start(request);
    expect(await screen.findByText('Players losing eligibility while in IR')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Apply to all leagues' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Apply to all leagues' }));
    await waitFor(() => expect(screen.getByText(/Updated across all leagues:/)).toBeVisible());
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][1].body).toEqual({ text, resolutions: {}, expectedRevision: preview.revision, confirmReplacement: true });
    expect(screen.queryByRole('button', { name: 'Apply to all leagues' })).not.toBeInTheDocument();
  });
  it('invalidates the preview when the pasted list is edited', async () => {
    const request = vi.fn(async () => ({ data: preview })); start(request);
    await screen.findByRole('checkbox'); fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByLabelText('Complete injury list'), { target: { value: text + '\n' } });
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('unmatched names block applying until explicitly skipped and previewed again', async () => {
    const request = vi.fn(async (_url, options) => ({ data: options.body.resolutions.missingplayer ? { ...preview, skipped: [{ name: 'Missing Player' }] } : { ...preview, canApply: false, unresolved: [{ key: 'missingplayer', name: 'Missing Player', candidates: [] }] } }));
    start(request); await screen.findByLabelText('Missing Player');
    expect(screen.getByRole('checkbox')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Missing Player'), { target: { value: 'skip' } });
    expect(screen.getByRole('button', { name: 'Apply to all leagues' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
    expect(await screen.findByText('Will not be imported: Missing Player.')).toBeVisible();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
  it('retains input and discards a stale preview after an apply conflict', async () => {
    const request = vi.fn(async url => { if (url.includes('apply')) throw { code: 'INJURY_VERSION_CONFLICT' }; return { data: preview }; });
    start(request); await screen.findByRole('checkbox'); fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Apply to all leagues' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Preview the list again'));
    expect(screen.getByLabelText('Complete injury list')).toHaveValue(text);
    expect(screen.queryByRole('button', { name: 'Apply to all leagues' })).not.toBeInTheDocument();
  });
});
