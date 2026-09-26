import { screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { createThreeTeamFixture, threeTeamIds as ids } from "../../test/threeTeamTradeFixture.js";
import { createCounterFixture } from "../../test/counterProposalFixture.js";
import { TradeDetailPage, TradesPage } from "./TransactionPages.jsx";
import { proposalDraftInput } from "./tradeReview.js";

vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
function renderTrade(fixture, path) {
  return renderWithProviders(<Routes><Route path="/leagues/:leagueId/trades" element={<TradesPage />} /><Route path="/leagues/:leagueId/trades/:tradeId" element={<TradeDetailPage />} /></Routes>,
    { initialEntries: [path], enableSession: true, config, sessionOptions: { fetchImpl: fixture.fetch } });
}
const writes = fixture => fixture.requests.filter(r => r.method === "POST" && !r.pathname.endsWith("/trades/preview"));

describe("Trade review before submission", () => {
  it.each(["league", "teams"])("blocks submission when the server preview belongs to different %s", async mismatch => {
    const fixture = createCounterFixture(), originalFetch = fixture.fetch;
    fixture.fetch = async (url, options) => {
      const response = await originalFetch(url, options);
      if (!new URL(url).pathname.endsWith("/trades/preview")) return response;
      const envelope = await response.json();
      if (mismatch === "league") envelope.data.leagueId = ids.otherLeague;
      else envelope.data.teams[1].teamId = ids.thirdTeam;
      return new Response(JSON.stringify(envelope), { headers: { "content-type": "application/json" } });
    };
    const view = renderTrade(fixture, `/leagues/${ids.league}/trades?counterTradeId=${ids.trade}`);
    const preview = await screen.findByRole("button", { name: "Preview trade" });
    await waitFor(() => expect(preview).toBeEnabled()); await view.user.click(preview);
    await screen.findByRole("button", { name: "Retry preview" });
    expect(screen.getByRole("button", { name: "Submit counter proposal" })).toBeDisabled();
    expect(screen.queryByRole("region", { name: "Salary cap impact" })).not.toBeInTheDocument();
    expect(writes(fixture)).toHaveLength(0);
    expect(fixture.original.storageStatus).toBe("proposed");
  });

  it("preserves each saved asset reference, destination and retained amount in the read-only preview request", () => {
    const fixture = createThreeTeamFixture();
    const input = proposalDraftInput(fixture.original);
    expect(input.proposingTeamId).toBe(ids.sendingTeam);
    expect(input.participants.flatMap(p => p.assets)).toHaveLength(fixture.original.assets.length);
    expect(input.participants.find(p => p.teamId === ids.sendingTeam).assets).toEqual([
      { type: "contract", contractId: ids.contract, destinationTeamId: ids.receivingTeam },
      { type: "requested_retention", contractId: ids.contract, retainedAavCents: 125, destinationTeamId: ids.receivingTeam },
      { type: "prospect_right", playerId: ids.prospect, destinationTeamId: ids.thirdTeam },
      { type: "future_consideration", futureConsiderationId: ids.future, destinationTeamId: ids.receivingTeam },
    ]);
    expect(input.participants.find(p => p.teamId === ids.thirdTeam).assets).toEqual([
      { type: "buyout_obligation", buyoutObligationId: ids.buyout, destinationTeamId: ids.sendingTeam },
    ]);
    expect(() => proposalDraftInput({ ...fixture.original, detailsVisible: false })).toThrow();
  });

  it.each([false, true])("blocks submission after a failed %s three-team review and retries without changing the offer", async three => {
    const fixture = three ? createThreeTeamFixture() : createCounterFixture();
    const originalFetch = fixture.fetch;
    let failing = true;
    fixture.fetch = (url, options) => failing && new URL(url).pathname.endsWith("/trades/preview")
      ? Promise.resolve(new Response(JSON.stringify({ error: { code: "TRADE_REQUEST_FAILED", message: "Preview failed. Try again.", requestId: "review-fixture" } }), { status: 500, headers: { "content-type": "application/json" } }))
      : originalFetch(url, options);
    const view = renderTrade(fixture, `/leagues/${ids.league}/trades?counterTradeId=${ids.trade}`);
    const preview = await screen.findByRole("button", { name: "Preview trade" });
    await waitFor(() => expect(preview).toBeEnabled()); await view.user.click(preview);
    const submit = screen.getByRole("button", { name: "Submit counter proposal" });
    await screen.findByRole("button", { name: "Retry preview" });
    expect(submit).toBeDisabled(); expect(writes(fixture)).toHaveLength(0);
    expect(fixture.original.storageStatus).toBe("proposed");
    failing = false;
    await view.user.click(screen.getByRole("button", { name: "Retry preview" }));
    await waitFor(() => expect(submit).toBeEnabled());
    expect(screen.getByRole("group", { name: "Trade breakdown" })).toHaveTextContent("Mitch Marner");
    expect(writes(fixture)).toHaveLength(0);
  });

  it("keeps impact visible to an invited team that has already accepted", async () => {
    const fixture = createThreeTeamFixture({ sharedManager: true, secondAccepted: true });
    renderTrade(fixture, `/leagues/${ids.league}/trades/${ids.trade}`);
    const impact = await screen.findByRole("region", { name: "Salary cap impact" });
    await waitFor(() => expect(within(impact).queryAllByText("Unavailable")).toHaveLength(0));
    expect(screen.queryByRole("button", { name: "Confirm", exact: true })).not.toBeInTheDocument();
    expect(writes(fixture)).toHaveLength(0);
  });
  it.each([ids.league, ids.otherLeague])("shows authoritative saved-offer impact to the proposer in league %s without sending another trade", async leagueId => {
    const fixture = createThreeTeamFixture({ role: "sender", leagueId });
    renderTrade(fixture, `/leagues/${leagueId}/trades/${ids.trade}`);
    const impact = await screen.findByRole("region", { name: "Salary cap impact" });
    await waitFor(() => expect(within(impact).queryAllByText("Unavailable")).toHaveLength(0));
    expect(within(impact).getAllByText("$6.25")).toHaveLength(3);
    expect(within(impact).getAllByText("+$1.25")).toHaveLength(3);
    expect(writes(fixture)).toHaveLength(0);
    expect(fixture.requests.some(r => r.pathname.endsWith("/acceptance-preview"))).toBe(false);
  });

  it.each([false, true])("reviews and edits a %s three-team counter without closing the original until submission", async three => {
    const fixture = three ? createThreeTeamFixture() : createCounterFixture();
    const view = renderTrade(fixture, `/leagues/${ids.league}/trades?counterTradeId=${ids.trade}`);
    const preview = await screen.findByRole("button", { name: "Preview trade", exact: true });
    await waitFor(() => expect(preview).toBeEnabled());
    await view.user.click(preview);
    expect(await screen.findByRole("heading", { name: "Review trade", exact: true })).toBeInTheDocument();
    const breakdown = screen.getByRole("group", { name: "Trade breakdown" });
    expect(within(breakdown).getAllByRole("region")).toHaveLength(three ? 6 : 4);
    expect(breakdown).toHaveTextContent("Mitch Marner");
    expect(breakdown).toHaveTextContent("$1.25 retained salary");
    const submit = screen.getByRole("button", { name: "Submit counter proposal" });
    await waitFor(() => expect(submit).toBeEnabled());
    expect(writes(fixture)).toHaveLength(0);
    expect(fixture.original.storageStatus).toBe("proposed");
    await view.user.click(screen.getByRole("button", { name: "Edit trade" }));
    expect(screen.queryByRole("heading", { name: "Review trade", exact: true })).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("1.25")).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Preview trade", exact: true }));
    const finalSubmit = screen.getByRole("button", { name: "Submit counter proposal" });
    await waitFor(() => expect(finalSubmit).toBeEnabled());
    await view.user.dblClick(finalSubmit);
    await waitFor(() => expect(fixture.counter).not.toBeNull());
    expect(writes(fixture)).toHaveLength(1);
    expect(fixture.original.storageStatus).toBe("declined");
  });
});
