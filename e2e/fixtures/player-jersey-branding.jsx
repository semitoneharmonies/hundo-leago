import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../src/app/AppProviders.jsx';
import { PlayerJersey } from '../../src/features/players/PlayerJersey.jsx';
import { PlayerName } from '../../src/features/players/PlayerName.jsx';
import { NHL_CARD_TEAMS, nhlTeamColours } from '../../src/features/players/nhlTeamColours.js';
import widths from '../../src/features/players/nhlNumberWidths.json';
import { createCapOutlookFixture, capOutlookId } from '../../src/test/capOutlookFixture.js';
import { createPlayerCardFixture } from '../../src/test/playerCardFixture.js';
import '../../src/index.css';

const fixture = createCapOutlookFixture();
export function Preview() {
  const [number, setNumber] = useState(97);
  return <main style={{ padding: 20, maxWidth: 1440, margin: 'auto' }}>
    <h1 style={{ color: 'white' }}>Player-card team branding</h1>
    <p>Local preview · synthetic card data · Utah uses the approved Boston numeral style</p>
    <label>Jersey number <input type="number" min="1" max="99" value={number} onChange={event => setNumber(Number(event.target.value))} /></label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 16 }}>
      {NHL_CARD_TEAMS.map((team, teamIndex) => {
        const glyphTeam = team === 'UTA' ? 'BOS' : team;
        const playerId = capOutlookId(1000 + teamIndex * 100 + number);
        const client = { request: async () => ({ data: { ...createPlayerCardFixture(fixture), playerId, name: 'Sample Player', nhlTeam: team, appearance: { nhlTeam: team, jerseyNumber: number } } }) };
        return <section key={team} data-team-preview={team} style={{ background: '#101d32', border: '1px solid #334155', borderRadius: 10, padding: '10px 0' }}>
          <div style={{ padding: '0 12px' }}><PlayerName leagueId={fixture.league.id} playerId={playerId} httpClient={client}>{team} · open sample card</PlayerName></div>
          <PlayerJersey team={team} number={number} />
          <div aria-label={`${team} all numeral shapes`} style={{ ...nhlTeamColours(team), display: 'flex', justifyContent: 'center', gap: 5, padding: '10px 0 0', color: 'var(--team-accent)', background: 'var(--team-primary)', margin: '8px 10px 0', borderRadius: 6 }}>
            {widths[glyphTeam].map((width, digit) => <svg key={digit} viewBox={`0 0 ${width} 100`} width={width * .32} height="32" aria-hidden="true" style={{ fill: 'currentColor', marginBottom: 10 }}><use href={`/nhl-numbers/${glyphTeam}.svg#n${digit}`} width={width} height="100" /></svg>)}
          </div>
        </section>;
      })}
    </div>
  </main>;
}
createRoot(document.getElementById('root')).render(<AppProviders Router={MemoryRouter} enableSession={false} config={{ appEnv: 'local', apiOrigin: 'http://127.0.0.1:4199', socketOrigin: 'http://127.0.0.1:4199', buildId: null }}><Preview /></AppProviders>);
