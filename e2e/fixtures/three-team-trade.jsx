import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "../../src/app/AppProviders.jsx";
import { TradeDetailPage, TradesPage } from "../../src/features/transactions/TransactionPages.jsx";
import { createThreeTeamFixture, threeTeamIds as ids } from "../../src/test/threeTeamTradeFixture.js";
import "../../src/styles/theme-a.css";

const options = new URLSearchParams(window.location.search);
const fixture = createThreeTeamFixture({ status: options.get("status") || "proposed", secondAccepted: options.has("accepted"), sharedManager: options.has("shared"), role: options.get("role") || "receiver" });
window.threeTeamFixture = fixture;
window.history.replaceState(null, "", `/leagues/${ids.league}/trades/${ids.trade}`);
createRoot(document.getElementById("root")).render(
  <AppProviders Router={BrowserRouter} enableSession
    config={{ appEnv: "local", apiOrigin: "http://127.0.0.1:4199", socketOrigin: "http://127.0.0.1:4199", buildId: null }} sessionOptions={{ fetchImpl: fixture.fetch }}>
    <Routes><Route path="/leagues/:leagueId/trades" element={<TradesPage />} /><Route path="/leagues/:leagueId/trades/:tradeId" element={<TradeDetailPage />} /></Routes>
  </AppProviders>
);
