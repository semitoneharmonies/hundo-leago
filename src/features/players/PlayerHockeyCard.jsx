import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, HeartPulse, X } from 'lucide-react';
import { PlayerName } from './PlayerName.jsx';
import { playerCardQuery } from './playerCardQuery.js';
import { nhlTeamColours } from './nhlTeamColours.js';
import { teamColourStyle } from '../../shared/teamIdentity.js';
import styles from './PlayerHockeyCard.module.css';

const money = cents => Number.isFinite(cents) ? `$${(cents / 100).toFixed(2)}` : '—';
const number = n => Number.isFinite(n) ? n.toFixed(2) : '—';
const date = ms => new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }).format(ms);

function TradeAsset({ asset, leagueId, httpClient }) {
  const s = asset.snapshot;
  const player = asset.detail?.player || s.player;
  let name = player?.name || player?.fullName;
  let detail;
  switch (asset.type) {
    case 'contract': detail = `${money(s.contract?.aavCents)} AAV · ${s.contract?.originalTermYears ?? '—'}-year original term`; break;
    case 'prospect_right': detail = s.fantasyElc ? `${money(s.fantasyElc.aavCents)} fantasy ELC` : 'Unsigned prospect rights'; break;
    case 'draft_pick': name = `${s.targetSeasonLabel || 'Future'} · Round ${s.roundNumber ?? '—'}`; detail = `Pick ${s.positionNumber ?? 'not set'}${asset.detail?.originalTeamName || s.originalTeam?.name ? ` · ${asset.detail?.originalTeamName || s.originalTeam.name}` : ''}`; break;
    case 'requested_retention': name = name || 'Salary retained'; detail = `${money(s.retainedAavCents)} retained per season`; break;
    case 'retention_obligation': detail = `${money(s.retainedAavCents)} retained salary · ${s.years?.length ?? '—'} year(s)`; break;
    case 'buyout_obligation': detail = `${money(s.annualPenaltyBasisCents)} buyout basis · ${s.remainingYears ?? s.years?.length ?? '—'} year(s)`; break;
    case 'future_consideration':
    case 'future_consideration_instruction': name = 'Future Considerations'; detail = s.description; break;
    default: name = name || 'Trade asset'; detail = 'Saved transaction';
  }
  return <li><strong>{player?.id
    ? <PlayerName leagueId={leagueId} playerId={player.id} httpClient={httpClient}>{name}</PlayerName>
    : name || 'Player'}</strong><span>{detail}</span>
    {asset.detail?.years.length > 0 && <span>{asset.detail.years.map(year => `${year.season}: ${money(year.amountCents)}`).join(' · ')}</span>}
  </li>;
}

function TradeDetails({ trade, leagueId, httpClient }) {
  const teams = new Map(trade.teams.map(team => [team.id, team.name]));
  const routes = [...new Set(trade.assets.map(a => `${a.sourceTeamId}:${a.destinationTeamId}`))];
  return <div className={styles.deal}>
    {routes.map(route => {
      const [source, destination] = route.split(':');
      return <section key={route}>
        <h4>{teams.get(source) || 'Former team'} <span aria-label="to">→</span> {teams.get(destination) || 'Former team'}</h4>
        <ul>{trade.assets.filter(a => a.sourceTeamId === source && a.destinationTeamId === destination).map(asset =>
          <TradeAsset key={asset.id} asset={asset} leagueId={leagueId} httpClient={httpClient} />)}</ul>
      </section>;
    })}
  </div>;
}

function History({ card, httpClient }) {
  const entries = [...card.history.signings.map(item => ({ ...item, kind: 'signing' })),
    ...(card.history.buyouts ?? []).map(item => ({ ...item, kind: 'buyout' })),
    ...card.history.trades.map(item => ({ ...item, kind: 'trade' }))].sort((a, b) => b.atMs - a.atMs || a.id.localeCompare(b.id));
  return <section className={styles.history} aria-labelledby="player-card-history">
    <h3 id="player-card-history">Hundo history</h3>
    {!entries.length ? <p>No player history has been recorded in this league.</p> :
      <ol>{entries.map(entry => <li key={`${entry.kind}:${entry.id}`}>
        <time dateTime={new Date(entry.atMs).toISOString()}>{date(entry.atMs)}</time>
        {entry.kind === 'trade' ? <details>
          <summary><ArrowLeftRight size={15} aria-hidden="true" /><span>Trade{entry.status === 'reversed' ? ' · reversed' : entry.status === 'correction_required' ? ' · under review' : ''}<small>{entry.teams.map(t => t.name).join(' ↔ ')}</small></span><span className={styles.expand}>Full deal</span></summary>
          <TradeDetails trade={entry} leagueId={card.leagueId} httpClient={httpClient} />
        </details> : <div className={styles.signing}>
          <strong>{entry.kind === 'buyout' ? 'Bought out' : entry.method}{entry.status === 'cancelled' ? ' · cancelled' : ''}</strong>
          <span>{entry.team?.name || 'Signing team not recorded'}</span>
          {entry.kind === 'signing' && entry.aavCents !== null && <small>{money(entry.aavCents)} AAV · {entry.termYears ?? '—'} year(s)</small>}
        </div>}
      </li>)}</ol>}
  </section>;
}

function CardContent({ card, httpClient }) {
  const stats = card.statistics;
  const health = card.injury?.status === 'injured' ? 'Injured' : card.injury?.status === 'healthy' ? 'Healthy' : 'Unconfirmed';
  const contract = card.contract;
  const exempt = card.ownership && card.ownership.category !== 'Active';
  const team = card.ownership?.team;
  return <>
    {card.appearance && <div className={styles.jersey} style={nhlTeamColours(card.appearance.nhlTeam)}
      role="img" aria-label={`${card.appearance.nhlTeam} jersey number ${card.appearance.jerseyNumber}`}>
      <span className={styles.jerseyTeam} aria-hidden="true">{card.appearance.nhlTeam}</span>
      <span className={styles.jerseyNumber} aria-hidden="true">{card.appearance.jerseyNumber}</span>
      <span className={styles.jerseyCaption} aria-hidden="true">Player collection</span>
    </div>}
    <div className={styles.identity}>
      <div><p>{card.nhlTeam || 'Player collection'}{card.position ? ` / ${card.position}` : ''}</p><h2 id="player-card-name">{card.name}</h2></div>
    </div>
    <div className={styles.owner} data-team={Boolean(team?.primaryColour)} style={team ? teamColourStyle(team) : undefined}>
      <strong>{team?.name || 'Free agent'}</strong><span>{card.ownership?.category || 'Unsigned'}</span>
    </div>
    <div className={styles.stats} aria-label="Key player statistics">
      <div><span>Goals</span><strong>{stats?.goals ?? '—'}</strong></div>
      <div><span>Assists</span><strong>{stats?.assists ?? '—'}</strong></div>
      <div className={styles.fantasy}><span>Fantasy points</span><strong>{stats ? number(stats.fantasyPointsHundredths / 100) : '—'}</strong></div>
      <div><span>GP</span><strong>{stats?.gamesPlayed ?? '—'}</strong></div>
    </div>
    {!stats && <p className={styles.unavailable}>Season statistics unavailable</p>}
    <div className={styles.health} data-status={card.injury?.status}><HeartPulse size={18} aria-hidden="true" /><span>Status</span><strong>{health}</strong>{card.injury?.needsReview && <small>Review pending</small>}</div>
    <div className={styles.panels}>
      <section><h3>Hundo contract</h3><strong>{contract ? money(contract.netAavCents) : 'Unsigned'}<small>{contract ? 'net AAV' : 'No cap commitment'}</small></strong>
        {contract && <p>{contract.remainingYears} season{contract.remainingYears === 1 ? '' : 's'} remaining{contract.type === 'fantasy_elc' ? ' · ELC' : ''}</p>}
        {contract?.retainedAavCents > 0 && <p>{money(contract.aavCents)} AAV · {money(contract.retainedAavCents)} retained</p>}
        {exempt && <p>Currently cap-exempt</p>}
      </section>
      <section><h3>Player value</h3><strong>{number(card.value.perCapDollar)}<small>FP/G per $1 cap</small></strong><p>{number(card.value.fantasyPointsPerGame)} fantasy points per game</p></section>
    </div>
    <History card={card} httpClient={httpClient} />
  </>;
}

export function PlayerHockeyCard({ selected, httpClient, onClose }) {
  const dialog = useRef(null);
  const returnFocus = useRef(selected.returnFocus || selected.anchor);
  const query = useQuery(playerCardQuery(httpClient, selected.leagueId, selected.playerId, selected.privacyEpoch));
  useLayoutEffect(() => {
    const node = dialog.current;
    function place() {
      const rect = node.getBoundingClientRect();
      const width = window.innerWidth, height = window.innerHeight;
      const x = width <= 600 ? (width - rect.width) / 2
        : selected.x + 18 + rect.width <= width - 12 ? selected.x + 18 : selected.x - rect.width - 18;
      const y = width <= 600 ? (height - rect.height) / 2 : selected.y - 32;
      node.style.left = `${Math.max(12, Math.min(x, width - rect.width - 12))}px`;
      node.style.top = `${Math.max(12, Math.min(y, height - rect.height - 12))}px`;
    }
    place();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null;
    observer?.observe(node);
    window.addEventListener('resize', place);
    return () => { observer?.disconnect(); window.removeEventListener('resize', place); };
  }, [selected]);
  useEffect(() => {
    const node = dialog.current;
    if (!node.open) node.showModal();
    const anchor = returnFocus.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      node.close(); document.body.style.overflow = previous;
      if (anchor?.isConnected) anchor.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(<dialog ref={dialog} className={styles.dialog} aria-modal="true" aria-labelledby="player-card-name"
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const focusable = [...event.currentTarget.querySelectorAll('a[href], button:not(:disabled), summary, [tabindex="0"]')]
        .filter(node => node.getClientRects().length > 0 && (node.checkVisibility ? node.checkVisibility() : !node.closest('details:not([open])') || node.tagName === 'SUMMARY'));
      const first = focusable[0], last = focusable.at(-1);
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault(); (event.shiftKey ? last : first)?.focus();
      }
    }}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
    }}>
    <article className={styles.card}>
      <header className={styles.brand}>
        <div className="hl-brand" aria-label="Hundo Leago"><span className="hl-brand__mark" aria-hidden="true">HL</span><span className="hl-brand__name">Hundo<span>·</span>Leago</span></div>
        <button type="button" autoFocus onClick={onClose} aria-label="Close player card"><X size={19} /></button>
      </header>
      {query.isPending ? <div className={styles.message}><h2 id="player-card-name">{selected.name}</h2><p role="status">Loading player card…</p></div>
        : query.isError ? <div className={styles.message}><h2 id="player-card-name">{selected.name}</h2><p role="alert">Player details could not be loaded.</p><button type="button" onClick={() => query.refetch()}>Try again</button></div>
          : <CardContent card={query.data} httpClient={httpClient} />}
    </article>
  </dialog>, document.body);
}
