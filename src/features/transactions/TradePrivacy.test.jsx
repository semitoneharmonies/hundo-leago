import { act, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/render.jsx';
import { counterIds as ids } from '../../test/counterProposalFixture.js';
import { createTradePrivacyFixture, privateTrade } from '../../test/tradePrivacyFixture.js';
import { TradeDetailPage, ActivityPage } from './TransactionPages.jsx';
import { transactionKeys } from './transactionQueries.js';
import { validateTradeDetail } from './transactionContracts.js';

vi.mock('socket.io-client', () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const config = { appEnv: 'local', apiOrigin: 'http://localhost:4000', socketOrigin: 'http://localhost:4000', buildId: null };
function render(fixture, activity = false) {
  const leagueId = fixture.original.leagueId;
  return renderWithProviders(<Routes><Route path="/leagues/:leagueId/trades/:tradeId" element={<TradeDetailPage />} /><Route path="/leagues/:leagueId/activity" element={<ActivityPage />} /></Routes>,
    { initialEntries: [`/leagues/${leagueId}/${activity ? 'activity' : `trades/${ids.trade}`}`], enableSession: true, config, sessionOptions: { fetchImpl: fixture.fetch } });
}
describe('Trade fog of war', () => {
  for (const three of [false, true]) for (const leagueId of [ids.league, ids.otherLeague]) {
    it(`shows only teams for a hidden ${three ? 'three' : 'two'}-team trade in ${leagueId}`, async () => {
      const fixture = createTradePrivacyFixture({ three, leagueId }); render(fixture);
      await screen.findByRole('heading', { name: 'Trade details are private until execution' });
      expect(screen.getByRole('heading', { name: /Wolfy's ↔ Benning/ })).toBeVisible();
      for (const text of ['Mitch Marner', 'Drafted Prospect', 'Status history', 'Salary cap impact']) expect(screen.queryByText(text)).not.toBeInTheDocument();
      expect(screen.queryByRole('list', { name: 'Team responses' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Confirm|Counter Proposal|Decline/ })).not.toBeInTheDocument();
      expect(fixture.requests.filter(r => r.pathname.endsWith('/roster') || r.pathname.endsWith('/acceptance-preview') || r.method === 'POST')).toHaveLength(0);
    });
  }
  it('keeps an uninvolved commissioner hidden on an unaccepted offer', async () => {
    const fixture = createTradePrivacyFixture({ role: 'commissioner' }); render(fixture);
    await screen.findByRole('heading', { name: 'Trade details are private until execution' });
    expect(screen.queryByRole('button', { name: /commissioner approval/i })).not.toBeInTheDocument();
  });
  it('shows accepted future-considerations assets to the commissioner for review', async () => {
    const fixture = createTradePrivacyFixture({ role: 'commissioner', status: 'awaiting_commissioner_approval', hidden: false }); render(fixture);
    await screen.findByRole('button', { name: 'Preview commissioner approval' });
    expect(screen.getAllByText('Mitch Marner').length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { name: 'Trade details are private until execution' })).not.toBeInTheDocument();
  });
  it('reveals details after the executed trade is refetched', async () => {
    const fixture = createTradePrivacyFixture(), view = render(fixture);
    await screen.findByRole('heading', { name: 'Trade details are private until execution' });
    fixture.original.storageStatus = 'completed'; fixture.original.status = 'Accepted'; fixture.hidden = false;
    await act(async () => view.queryClient.invalidateQueries({ queryKey: transactionKeys.trade(ids.league, ids.trade) }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Trade details are private until execution' })).not.toBeInTheDocument());
    expect(screen.getAllByText('Mitch Marner').length).toBeGreaterThan(0);
  });
  it('renders the redacted activity feed with team names and no assets', async () => {
    const fixture = createTradePrivacyFixture(); render(fixture, true);
    await screen.findByText(/Trade involving .*Wolfy's/);
    expect(screen.queryByText(/Mitch Marner/)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('rejects asset, response and metadata leaks in a private response', () => {
    const fixture = createTradePrivacyFixture();
    const proposal = privateTrade(fixture.original);
    expect(validateTradeDetail({ code: 'TRADE_PROPOSAL_FOUND', proposal })).toBe(true);
    for (const bad of [{ ...proposal, assets: fixture.original.assets }, { ...proposal, history: [{ metadata: { assets: [] } }] }, { ...proposal, secretSnapshot: {} }, { ...proposal, participants: fixture.original.participants }]) {
      expect(() => validateTradeDetail({ code: 'TRADE_PROPOSAL_FOUND', proposal: bad })).toThrow();
    }
  });
});
