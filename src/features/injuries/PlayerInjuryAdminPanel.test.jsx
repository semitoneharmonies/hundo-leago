import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/render.jsx';
import { PlayerInjuryAdminPanel } from './PlayerInjuryAdminPanel.jsx';

const player = { id: '11111111-1111-4111-8111-000000000001', name: 'Test Player', status: 'injured', version: 2 };
const data = { players: [player], history: [] };
describe('global injury administration', () => {
  it('reads without writes and requires a reason before a global status change', async () => {
    const request = vi.fn(async () => ({ data }));
    renderWithProviders(<PlayerInjuryAdminPanel httpClient={{ request }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Test Player' }));
    expect(request).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Save for all leagues' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Reason or source'), { target: { value: 'Team confirms return' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save for all leagues' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('marked healthy across all leagues'));
    const writes = request.mock.calls.filter(([, options]) => options.method === 'POST');
    expect(writes).toHaveLength(1);
    expect(writes[0][1].body).toEqual({ playerId: player.id, status: 'healthy', reason: 'Team confirms return', expectedVersion: 2 });
  });
  it('retains the attempted decision and requires another review after a conflict', async () => {
    const request = vi.fn(async (_url, options) => {
      if (options.method === 'POST') throw Object.assign(new Error('private detail'), { code: 'INJURY_VERSION_CONFLICT' });
      return { data };
    });
    renderWithProviders(<PlayerInjuryAdminPanel httpClient={{ request }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Test Player' }));
    fireEvent.change(screen.getByLabelText('Reason or source'), { target: { value: 'Team confirms return' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save for all leagues' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This status changed');
    expect(screen.getByLabelText('Reason or source')).toHaveValue('Team confirms return');
    expect(screen.getByRole('button', { name: 'Save for all leagues' })).toBeDisabled();
    expect(screen.queryByText('private detail')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Review Test Player' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
