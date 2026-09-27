import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '../../shared/query/queryClient.js';
import { RealtimeContext } from '../../shared/realtime/realtimeContext.js';
import { PlayerCardProvider } from './PlayerCardProvider.jsx';
import { renderWithProviders } from '../../test/render.jsx';
import { createCapOutlookFixture, capOutlookId } from '../../test/capOutlookFixture.js';
import { createPlayerCardFixture } from '../../test/playerCardFixture.js';
import { PlayerName } from './PlayerName.jsx';
import { validatePlayerCard } from './playerCardQuery.js';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});

function setup(client) {
  const fixture = createCapOutlookFixture();
  const data = createPlayerCardFixture(fixture);
  const httpClient = client || { request: vi.fn(async () => ({ data })) };
  const rendered = renderWithProviders(<PlayerName playerId={data.playerId} leagueId={data.leagueId} httpClient={httpClient}>{data.name}</PlayerName>);
  return { ...rendered, data, fixture, httpClient };
}

describe('player hockey card', () => {
  it('closes immediately at an authorization boundary and requires a fresh read on reopening', async () => {
    const fixture = createCapOutlookFixture(), data = createPlayerCardFixture(fixture);
    const request = vi.fn(async () => ({ data })), client = createQueryClient(), user = userEvent.setup();
    const ui = (privacyEpoch, status) => <MemoryRouter><QueryClientProvider client={client}>
      <RealtimeContext.Provider value={{ privacyEpoch, status }}><PlayerCardProvider httpClient={{ request }}>
        <PlayerName leagueId={data.leagueId} playerId={data.playerId}>{data.name}</PlayerName>
      </PlayerCardProvider></RealtimeContext.Provider>
    </QueryClientProvider></MemoryRouter>;
    const view = render(ui(0, 'connected'));
    await user.click(screen.getByRole('link', { name: data.name }));
    await screen.findByText('Candidate Card');
    view.rerender(ui(1, 'reauthorizing'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    view.rerender(ui(1, 'connected'));
    request.mockRejectedValue(new Error('Access removed'));
    await user.click(screen.getByRole('link', { name: data.name }));
    await screen.findByRole('alert');
    expect(screen.queryByText('Candidate Card')).not.toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('opens on a name without navigating; shows key information and every trade leg', async () => {
    const { user, data, httpClient } = setup();
    const name = screen.getByRole('link', { name: data.name });
    await user.click(name);
    const card = await screen.findByRole('dialog');
    expect(await within(card).findByRole('heading', { name: 'Hundo history' })).toBeVisible();
    expect(within(card).getByText('0.15')).toBeVisible();
    expect(within(card).getByText('Candidate Card')).toBeVisible();
    expect(within(card).getByRole('img', { name: 'EDM jersey number 97' })).toBeVisible();
    expect(within(card).getByLabelText('Hundo Leago')).toHaveClass('hl-brand');
    expect(within(card).queryByText(/game within the game/i)).not.toBeInTheDocument();
    expect(within(card).queryByText(/blocked shots|hits|power play/i)).not.toBeInTheDocument();
    await user.click(within(card).getByText('Full deal'));
    expect(within(card).getByText('2027–28 · Round 1')).toBeVisible();
    expect(within(card).getByText('A 2028 second-round pick if the team reaches the final.')).toBeVisible();
    expect(within(card).getByText('Ivan Demidov')).toBeVisible();
    expect(httpClient.request).toHaveBeenCalledWith(expect.stringContaining(`/players/${data.playerId}/card`), expect.objectContaining({ authenticated: true, signal: expect.any(AbortSignal) }));
    fireEvent(card, new Event('cancel', { bubbles: false, cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(name).toHaveFocus();
  });

  it('shows a recoverable error instead of stale or guessed history', async () => {
    const request = vi.fn().mockRejectedValue(new Error('Unavailable'));
    const { user, data } = setup({ request });
    await user.click(screen.getByRole('link', { name: data.name }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Player details could not be loaded.');
    request.mockResolvedValue({ data });
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Hundo history' })).toBeVisible();
  });

  it('leaves unknown health and missing stats/contract unconfirmed', async () => {
    const fixture = createCapOutlookFixture();
    const data = createPlayerCardFixture(fixture, fixture.players.at(-1));
    const { user } = setup({ request: async () => ({ data: { ...data, playerId: fixture.players[0].playerId, name: fixture.players[0].name } }) });
    await user.click(screen.getByRole('link', { name: 'Connor McDavid' }));
    expect(await screen.findByText('No signing or trade history has been recorded in this league.')).toBeVisible();
    expect(screen.getByText('Unconfirmed')).toBeVisible();
    expect(screen.getByText('Season statistics unavailable')).toBeVisible();
    expect(screen.queryByText('Healthy')).not.toBeInTheDocument();
    expect(screen.queryByText(/Infinity|NaN/)).not.toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).queryByRole('img')).not.toBeInTheDocument();
  });

  it('keys reads by both league and player and rejects mismatched responses', async () => {
    const fixture = createCapOutlookFixture(), a = createPlayerCardFixture(fixture);
    const b = { ...a, leagueId: capOutlookId(999), name: a.name, history: { signings: [], trades: [] } };
    const client = { request: vi.fn(async path => ({ data: path.includes(b.leagueId) ? b : a })) };
    const { user } = renderWithProviders(<><PlayerName playerId={a.playerId} leagueId={a.leagueId} httpClient={client}>League A player</PlayerName><PlayerName playerId={b.playerId} leagueId={b.leagueId} httpClient={client}>League B player</PlayerName></>);
    await user.click(screen.getByRole('link', { name: 'League A player' }));
    await screen.findByText('Candidate Card');
    await user.click(screen.getByRole('button', { name: 'Close player card' }));
    await user.click(screen.getByRole('link', { name: 'League B player' }));
    await screen.findByText('No signing or trade history has been recorded in this league.');
    expect(screen.queryByText('Candidate Card')).not.toBeInTheDocument();
    expect(() => validatePlayerCard(a, b.leagueId, a.playerId)).toThrow(/another league/);
    expect(() => validatePlayerCard({ ...a, appearance: { jerseyNumber: 97, nhlTeam: 'TOR' } }, a.leagueId, a.playerId)).toThrow(/jersey/);
    await waitFor(() => expect(client.request).toHaveBeenCalledTimes(2));
  });
});
