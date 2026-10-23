import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { SessionContext } from '../../src/features/session/sessionContext.js';
import { MatchupCard } from '../../src/features/competition/CompetitionPages.jsx';
import { sampleCompletedMatchup } from '../../src/features/competition/sampleCompletedMatchup.js';
import '../../src/styles/theme-a.css';
import '../../src/components/DesktopSidebar.css';

const matchup = structuredClone(sampleCompletedMatchup);
matchup.scoring.home.players[1].fullName = 'Jean-Christophe Verylongsurname';
matchup.scoring.away.players[1].fullName = 'Alexander Verylongsurname';
matchup.scoring.away.players[1].scoreHundredths = 12345;
const httpClient = { request() { throw new Error('Synthetic preview cannot make API requests'); } };
createRoot(document.getElementById('root')).render(
  <MemoryRouter><SessionContext.Provider value={{ status: 'authenticated', httpClient }}>
    <div className="hl-app-shell"><div className="hl-app-shell__content">
      <header className="hl-app-header" style={{ height: 72, padding: 20 }}>Local matchup preview</header>
      <aside className="hl-desktop-sidebar" style={{ padding: 20 }}>Synthetic teams and statistics</aside>
      <main className="hl-page" style={{ paddingBottom: 800 }}>
        <h1>Matchups</h1>
        <MatchupCard matchup={matchup} />
      </main>
    </div></div>
  </SessionContext.Provider></MemoryRouter>,
);
