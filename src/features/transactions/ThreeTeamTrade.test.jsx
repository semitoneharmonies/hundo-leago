import { act, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { createThreeTeamFixture, threeTeamIds as ids } from "../../test/threeTeamTradeFixture.js";
import { TradeDetailPage, TradesPage } from "./TransactionPages.jsx";
import { counterProposalDraft } from "./counterProposal.js";
import { buildThreeTeamProposal } from "./threeTeamProposal.js";
import { validateTradeDetail } from "./transactionContracts.js";
import { teamWorkspaceKeys } from "../rosters/teamWorkspaceQueries.js";
import { observeRecoveryEpoch } from "../../shared/api/recoveryIntent.js";
import { applyRealtimeInvalidation, parseRealtimeEnvelope, REALTIME_RELATED_ID_KEYS } from "../../shared/realtime/realtimeInvalidation.js";

vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
function renderTrade(fixture, path = `/leagues/${ids.league}/trades/${ids.trade}`) {
  return renderWithProviders(<Routes><Route path="/leagues/:leagueId/trades" element={<TradesPage />} /><Route path="/leagues/:leagueId/trades/:tradeId" element={<TradeDetailPage />} /></Routes>,
    { initialEntries: [path], enableSession: true, config, sessionOptions: { fetchImpl: fixture.fetch } });
}
const writes = fixture => fixture.requests.filter(r => r.method === "POST" && !r.pathname.endsWith("/trades/preview"));
async function reviewTrade(view, counter = true) {
  const preview = await screen.findByRole("button", { name: "Preview trade" });
  await waitFor(() => expect(preview).toBeEnabled());
  await view.user.click(preview);
  const submit = screen.getByRole("button", { name: counter ? "Submit counter proposal" : "Submit trade" });
  await waitFor(() => expect(submit).toBeEnabled());
  return submit;
}
describe("Three-team trades", () => {
  it("shows all three teams' outgoing and incoming assets with the correct counterparties and grouped retention", async () => {
    const fixture = createThreeTeamFixture(); renderTrade(fixture);
    const comparison = await screen.findByRole("group", { name: "Three-team trade breakdown" });
    expect(within(comparison).getAllByRole("region")).toHaveLength(6);
    expect(within(comparison).getAllByRole("article")).toHaveLength(12);
    const incoming = within(comparison).getByRole("region", { name: "Benning Did Nothing Wrong receives" });
    const contract = within(incoming).getByText("Mitch Marner").closest("article");
    expect(contract).toHaveTextContent("From Wolfy's");
    expect(contract).toHaveTextContent("with $1.25 retained salary");
    expect(within(incoming).queryByText("Drafted Prospect")).not.toBeInTheDocument();
    const thirdIncoming = within(comparison).getByRole("region", { name: "Charlie receives" });
    expect(thirdIncoming).toHaveTextContent("Drafted Prospect");
    expect(thirdIncoming).toHaveTextContent("From Wolfy's");
    const proposerIncoming = within(comparison).getByRole("region", { name: "Wolfy's receives" });
    expect(proposerIncoming).toHaveTextContent("From Charlie");
    expect(proposerIncoming).toHaveTextContent("Bought Out Player buyout penalty");
    expect(within(comparison).getAllByText("Contract + retention")).toHaveLength(2);
    expect(writes(fixture)).toHaveLength(0);
  });
  it("makes an empty receiving package explicit", async () => {
    const fixture = createThreeTeamFixture();
    fixture.original.assets.find(asset => asset.type === "prospect_right").destinationTeamId = ids.receivingTeam;
    renderTrade(fixture);
    expect(await screen.findByRole("region", { name: "Charlie receives" })).toHaveTextContent("No assets received by this team.");
  });
  it("binds three-team send keys to the recovery boundary and preserves them on retry", async () => {
    const recoveryId = "22222222-2222-4222-8222-222222222222";
    observeRecoveryEpoch(recoveryId);
    try {
      const fixture = createThreeTeamFixture(), view = renderTrade(fixture, `/leagues/${ids.league}/trades?counterTradeId=${ids.trade}`);
      const send = await reviewTrade(view);
      await waitFor(() => expect(send).toBeEnabled());
      fixture.failNext = true;
      await view.user.click(send); await screen.findByRole("alert");
      const firstKey = writes(fixture)[0].headers.get("Idempotency-Key");
      expect(firstKey).toMatch(new RegExp(`^recovery:${recoveryId}:three-team-`));
      await view.user.click(send);
      await waitFor(() => expect(fixture.counter).not.toBeNull());
      expect(writes(fixture)[1].headers.get("Idempotency-Key")).toBe(firstKey);
    } finally { observeRecoveryEpoch("initial"); }
  });
  it("requires separate consent when the same manager controls both invited teams", async () => {
    const fixture = createThreeTeamFixture({ sharedManager: true }), view = renderTrade(fixture);
    const selector = await screen.findByRole("combobox", { name: "Respond as" });
    expect(selector).toHaveValue(ids.receivingTeam);
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm", exact: true })).toBeEnabled());
    await view.user.click(screen.getByRole("button", { name: "Confirm", exact: true }));
    await screen.findByText(/You accepted. Waiting for the remaining team/);
    expect(fixture.original.participants.map(p => p.decision)).toEqual(["accepted", "accepted", "pending"]);
    expect(fixture.original.storageStatus).toBe("proposed");
    await view.user.selectOptions(selector, ids.thirdTeam);
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm", exact: true })).toBeEnabled());
    await view.user.click(screen.getByRole("button", { name: "Confirm", exact: true }));
    await waitFor(() => expect(fixture.original.storageStatus).toBe("completed"));
    expect(writes(fixture).map(r => r.body)).toEqual([{ respondingTeamId: ids.receivingTeam }, { respondingTeamId: ids.thirdTeam }]);
    expect(writes(fixture)[0].headers.get("Idempotency-Key")).not.toBe(writes(fixture)[1].headers.get("Idempotency-Key"));
  });
  it("counters as the selected team when one manager controls multiple participants", async () => {
    const fixture = createThreeTeamFixture({ sharedManager: true }), view = renderTrade(fixture);
    await view.user.selectOptions(await screen.findByRole("combobox", { name: "Respond as" }), ids.thirdTeam);
    await view.user.click(screen.getByRole("button", { name: "Counter Proposal" }));
    expect(await screen.findByLabelText("Proposing team")).toHaveValue(ids.thirdTeam);
    expect(writes(fixture)).toHaveLength(0);
  });
  it("refreshes draft impact after edits and blocks sending while the preview is unavailable", async () => {
    const fixture = createThreeTeamFixture(), baseFetch = fixture.fetch;
    let failPreview = false;
    fixture.fetch = async (url, options) => failPreview && new URL(url).pathname.endsWith("/trades/preview")
      ? new Response(JSON.stringify({ error: { code: "TRADE_REQUEST_FAILED", message: "Preview unavailable.", requestId: "fixture" } }), { status: 500, headers: { "content-type": "application/json" } })
      : baseFetch(url, options);
    const view = renderTrade(fixture, `/leagues/${ids.league}/trades?counterTradeId=${ids.trade}`);
    const preview = await screen.findByRole("region", { name: "Draft impact preview" });
    expect(within(preview).getAllByText("Current cap")).toHaveLength(3);
    expect(within(preview).getAllByText("Projected cap")).toHaveLength(3);
    expect(within(preview).getAllByText(/After trade:/)).toHaveLength(3);
    failPreview = true;
    const retained = screen.getByLabelText("Wolfy's sends asset 1 retained AAV dollars");
    await view.user.clear(retained); await view.user.type(retained, "2.50");
    expect(screen.queryByRole("region", { name: "Draft impact preview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit counter proposal" })).not.toBeInTheDocument();
    await screen.findByText(/Impact preview could not be loaded/);
    expect(writes(fixture)).toHaveLength(0);
    failPreview = false;
    await view.user.click(screen.getByRole("button", { name: "Retry preview" }));
    await screen.findByRole("region", { name: "Draft impact preview" });
    const lastPreview = fixture.requests.filter(r => r.pathname.endsWith("/trades/preview")).at(-1);
    expect(lastPreview.body.participants.flatMap(p => p.assets).find(a => a.type === "requested_retention").retainedAavCents).toBe(250);
    expect(writes(fixture)).toHaveLength(0);
  });
  it("refreshes the third team's workspace after final acceptance without a socket notification", async () => {
    const fixture = createThreeTeamFixture({ secondAccepted: true }), originalFetch = fixture.fetch;
    fixture.fetch = async (url, options) => {
      const response = await originalFetch(url, options);
      if (!new URL(url).pathname.endsWith(`/teams/${ids.thirdTeam}/roster`)) return response;
      const body = await response.json();
      body.data.team.version = fixture.original.storageStatus === "completed" ? 2 : 1;
      return new Response(JSON.stringify(body), { status: response.status, headers: response.headers });
    };
    const view = renderTrade(fixture), workspaceKey = teamWorkspaceKeys.detail(ids.league, ids.thirdTeam);
    const confirm = await screen.findByRole("button", { name: "Confirm", exact: true });
    await waitFor(() => expect(view.queryClient.getQueryData(workspaceKey)?.team.version).toBe(1));
    await waitFor(() => expect(confirm).toBeEnabled());
    await view.user.click(confirm);
    await waitFor(() => expect(fixture.original.storageStatus).toBe("completed"));
    await waitFor(() => expect(view.queryClient.getQueryData(workspaceKey)?.team.version).toBe(2));
  });
  it("refreshes team C's open page when team B accepts or declines", async () => {
    const fixture = createThreeTeamFixture(), view = renderTrade(fixture);
    await screen.findByRole("list", { name: "Team responses" });
    const notify = async () => {
      const event = { eventId: ids.pick, type: "trade.changed", leagueId: ids.league, resourceId: ids.trade, version: fixture.original.version,
        reasonCode: "trade_changed", occurredAt: 2, related: Object.fromEntries(REALTIME_RELATED_ID_KEYS.map(key => [key, null])) };
      await act(() => applyRealtimeInvalidation(view.queryClient, parseRealtimeEnvelope(event.type, event)));
    };
    fixture.original.participants[1].decision = "accepted"; fixture.original.participants[1].respondedAtMs = 2; fixture.original.version++;
    await notify();
    await waitFor(() => expect(within(screen.getByRole("list", { name: "Team responses" })).getByText(/Benning/).closest("li")).toHaveTextContent("Accepted"));
    fixture.original.participants[1].decision = "declined"; fixture.original.storageStatus = "declined"; fixture.original.status = "Rejected"; fixture.original.version++;
    await notify();
    await screen.findByRole("button", { name: "OK", exact: true });
    expect(screen.queryByRole("button", { name: "Confirm", exact: true })).not.toBeInTheDocument();
  });
  it("shows team B's acceptance to team C while C can still respond", async () => {
    const fixture = createThreeTeamFixture({ secondAccepted: true }); renderTrade(fixture);
    const responses = await screen.findByRole("list", { name: "Team responses" });
    expect(within(responses).getByText(/Benning/).closest("li")).toHaveTextContent("Accepted");
    expect(within(responses).getByText("Charlie").closest("li")).toHaveTextContent("Awaiting response");
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm", exact: true })).toBeEnabled());
    expect(screen.getByText("To Charlie")).toBeInTheDocument(); expect(writes(fixture)).toHaveLength(0);
  });
  it("first acceptance stays pending and shows waiting for the remaining team", async () => {
    const fixture = createThreeTeamFixture(), view = renderTrade(fixture);
    const confirm = await screen.findByRole("button", { name: "Confirm", exact: true });
    await waitFor(() => expect(confirm).toBeEnabled()); await view.user.click(confirm);
    expect(await screen.findByText(/You accepted. Waiting for the remaining team/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm", exact: true })).not.toBeInTheDocument();
    expect(fixture.original.storageStatus).toBe("proposed");
  });
  it("retries acceptance with the same request key after a failed response", async () => {
    const fixture = createThreeTeamFixture(), view = renderTrade(fixture);
    const confirm = await screen.findByRole("button", { name: "Confirm", exact: true });
    await waitFor(() => expect(confirm).toBeEnabled()); fixture.failNext = true;
    await view.user.click(confirm); await screen.findByRole("alert");
    await view.user.click(confirm); await screen.findByText(/You accepted. Waiting for the remaining team/);
    expect(writes(fixture)).toHaveLength(2);
    expect(writes(fixture)[0].headers.get("Idempotency-Key")).toBe(writes(fixture)[1].headers.get("Idempotency-Key"));
  });
  it("rejected offers disable acceptance and OK removes only the viewer's pending item", async () => {
    const fixture = createThreeTeamFixture({ status: "declined" }), view = renderTrade(fixture);
    await screen.findByRole("button", { name: "OK", exact: true });
    expect(screen.queryByRole("button", { name: "Confirm", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decline", exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Counter Proposal" })).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "OK", exact: true }));
    await screen.findByRole("heading", { name: "Trades", exact: true });
    expect(screen.queryByRole("link", { name: /Wolfy's ↔ Benning/ })).not.toBeInTheDocument();
    expect(fixture.original.participants[0].acknowledgedAtMs).toBeNull();
    expect(writes(fixture).map(r => r.pathname)).toEqual([`/api/v1/leagues/${ids.league}/trades/${ids.trade}/acknowledge`]);
    await view.user.selectOptions(screen.getByLabelText("Status"), "all");
    expect(screen.getByRole("link", { name: /Wolfy's ↔ Benning/ })).toBeInTheDocument();
  });
  it("countering a rejected offer preloads all three teams, assets, destinations and retention", async () => {
    const fixture = createThreeTeamFixture({ status: "declined" }), view = renderTrade(fixture);
    await view.user.click(await screen.findByRole("button", { name: "Counter Proposal" }));
    await screen.findByRole("heading", { name: "Three-team counter proposal" });
    expect(screen.getByLabelText("Proposing team")).toHaveValue(ids.thirdTeam);
    expect(screen.getByLabelText("Wolfy's sends asset 1 retained AAV dollars")).toHaveValue(1.25);
    expect(screen.getByLabelText("Wolfy's sends asset 2 destination")).toHaveValue(ids.thirdTeam);
    expect(writes(fixture)).toHaveLength(0);
    await view.user.selectOptions(screen.getByLabelText("Wolfy's sends asset 2 destination"), ids.receivingTeam);
    fixture.failNext = true;
    await view.user.click(await reviewTrade(view));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be completed");
    expect(screen.getByRole("region", { name: "Benning Did Nothing Wrong receives" })).toHaveTextContent("Drafted Prospect");
    await view.user.click(screen.getByRole("button", { name: "Submit counter proposal" }));
    await waitFor(() => expect(fixture.counter).not.toBeNull());
    expect(writes(fixture)).toHaveLength(2);
    expect(writes(fixture)[0].headers.get("Idempotency-Key")).toBe(writes(fixture)[1].headers.get("Idempotency-Key"));
    expect(fixture.counter.participants.map(p => p.decision)).toEqual(["accepted", "pending", "pending"]);
  });
  it("creates a three-team offer from the trade screen", async () => {
    const fixture = createThreeTeamFixture(), view = renderTrade(fixture, `/leagues/${ids.league}/trades`);
    await view.user.selectOptions(await screen.findByLabelText("Trade format"), "three");
    await view.user.selectOptions(screen.getByLabelText("Invited team 1"), ids.sendingTeam);
    await view.user.selectOptions(screen.getByLabelText("Invited team 2"), ids.receivingTeam);
    for (const [name, destination] of [["Charlie", ids.sendingTeam], ["Wolfy's", ids.receivingTeam], ["Benning Did Nothing Wrong", ids.thirdTeam]]) {
      await view.user.selectOptions(screen.getByLabelText(`${name} sends asset 1 destination`), destination);
      await view.user.selectOptions(screen.getByLabelText(`${name} sends asset 1 type`), "future_considerations");
      await view.user.type(screen.getByLabelText(`${name} sends asset 1 notes`), "A conditional pick");
    }
    await screen.findByRole("region", { name: "Draft impact preview" });
    expect(screen.getAllByText("Projected cap")).toHaveLength(3);
    expect(writes(fixture)).toHaveLength(0);
    await view.user.click(await reviewTrade(view, false));
    await waitFor(() => expect(writes(fixture)).toHaveLength(1));
    expect(writes(fixture)[0].body.participants).toHaveLength(3);
  });
  it("validates participant identity and preserves all routes when building a counter", () => {
    const fixture = createThreeTeamFixture({ status: "declined" });
    expect(validateTradeDetail({ code: "TRADE_PROPOSAL_FOUND", proposal: fixture.original })).toBe(true);
    const draft = counterProposalDraft(fixture.original, { leagueId: ids.league, tradeId: ids.trade, managedTeamIds: [ids.thirdTeam] });
    const body = buildThreeTeamProposal(draft.proposingTeamId, draft.participants);
    expect(body.participants.flatMap(p => p.assets)).toHaveLength(fixture.original.assets.length);
    expect(body.participants.find(p => p.teamId === ids.sendingTeam).assets).toContainEqual({ type: "requested_retention", contractId: ids.contract, retainedAavCents: 125, destinationTeamId: ids.receivingTeam });
    expect(() => counterProposalDraft(fixture.original, { leagueId: ids.otherLeague, tradeId: ids.trade, managedTeamIds: [ids.thirdTeam] })).toThrow();
    fixture.original.participants[2].teamId = ids.receivingTeam;
    expect(() => validateTradeDetail({ code: "TRADE_PROPOSAL_FOUND", proposal: fixture.original })).toThrow();
  });
});
