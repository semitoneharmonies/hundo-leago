import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "../../src/app/AppProviders.jsx";
import { TradeDetailPage, TradesPage } from "../../src/features/transactions/TransactionPages.jsx";
import { createCounterFixture, counterIds as ids } from "../../src/test/counterProposalFixture.js";
import "../../src/styles/theme-a.css";

const fixture = createCounterFixture();
const ordinaryProposal = new URLSearchParams(window.location.search).has("ordinary");
if (ordinaryProposal) {
  const fetchOriginal = fixture.fetch;
  fixture.fetch = async (url, options = {}) => {
    if (new URL(url).pathname === `/api/v1/leagues/${ids.league}/trades` && options.method === "POST") {
      fixture.requests.push({ method: "POST", pathname: new URL(url).pathname });
      await new Promise(resolve => { window.finishTradeSend = resolve; });
      return new Response(JSON.stringify({ data: { code: "TRADE_PROPOSAL_CREATED", proposal: { id: ids.trade } }, meta: { requestId: "mobile-send-fixture" } }), { status: 201, headers: { "content-type": "application/json" } });
    }
    return fetchOriginal(url, options);
  };
}
window.counterFixture = fixture;
window.history.replaceState(null, "", ordinaryProposal
  ? `/leagues/${ids.league}/trades?assetDirection=requested&assetType=contract&assetId=${ids.contract}&sourceTeamId=${ids.sendingTeam}`
  : `/leagues/${ids.league}/trades/${ids.trade}`);
createRoot(document.getElementById("root")).render(
  <AppProviders Router={BrowserRouter} enableSession
    config={{ appEnv: "local", apiOrigin: "http://127.0.0.1:4199", socketOrigin: "http://127.0.0.1:4199", buildId: null }}
    sessionOptions={{ fetchImpl: fixture.fetch }}>
    <Routes>
      <Route path="/leagues/:leagueId/trades" element={<TradesPage />} />
      <Route path="/leagues/:leagueId/trades/:tradeId" element={<TradeDetailPage />} />
    </Routes>
  </AppProviders>
);
