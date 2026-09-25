import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { createCounterFixture, counterIds as ids } from "../../test/counterProposalFixture.js";
import { TradeDetailPage, TradesPage } from "./TransactionPages.jsx";
import { counterProposalDraft } from "./counterProposal.js";

vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
function renderCounter(fixture, initialPath = `/leagues/${ids.league}/trades/${ids.trade}`) {
  return renderWithProviders(<Routes>
    <Route path="/leagues/:leagueId/trades" element={<TradesPage />} />
    <Route path="/leagues/:leagueId/trades/:tradeId" element={<TradeDetailPage />} />
  </Routes>, { initialEntries: [initialPath], enableSession: true, config, sessionOptions: { fetchImpl: fixture.fetch } });
}
const writes = fixture => fixture.requests.filter(request => request.method === "POST");

describe("Counter Proposal", () => {
  it("shows Counter Proposal beside Confirm and Decline even when the acceptance preview reports roster problems", async () => {
    const fixture = createCounterFixture();
    const originalFetch = fixture.fetch;
    fixture.fetch = async (url, options) => {
      const response = await originalFetch(url, options);
      if (!new URL(url).pathname.endsWith("/acceptance-preview")) return response;
      const body = await response.json();
      body.data.generallyIllegal = true;
      body.data.teams[0].generallyIllegal = true;
      body.data.teams[0].issues = [{ code: "SALARY_CAP_EXCEEDED", usageCents: 10125, limitCents: 10000 }];
      return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    };
    renderCounter(fixture);
    await screen.findByText("Salary cap exceeded: $101.25 used against a $100.00 cap.");
    const counter = await screen.findByRole("button", { name: "Counter Proposal" });
    expect(counter.parentElement).toContainElement(screen.getByRole("button", { name: "Confirm" }));
    expect(counter.parentElement).toContainElement(screen.getByRole("button", { name: "Decline" }));
    expect(counter).toBeEnabled();
    expect(writes(fixture)).toHaveLength(0);
  });
  it("reverses every supported asset and keeps retention on the original retaining team", () => {
    const fixture = createCounterFixture();
    const draft = counterProposalDraft(fixture.original, { leagueId: ids.league, tradeId: ids.trade, managedTeamIds: [ids.receivingTeam] });
    expect(draft.proposingTeamId).toBe(ids.receivingTeam);
    expect(draft.receivingTeamId).toBe(ids.sendingTeam);
    expect(draft.proposingAssets).toEqual([
      { type: "draft_pick", reference: ids.pick }, { type: "buyout_obligation", reference: ids.buyout },
      { type: "future_considerations", mode: "new", reference: "Conditional third-round pick" },
    ]);
    expect(draft.receivingAssets).toEqual([
      { type: "player", reference: `contract:${ids.contract}`, retainedAavDollars: "1.25" },
      { type: "player", reference: `prospect_right:${ids.prospect}` },
      { type: "future_considerations", mode: "existing", reference: ids.future },
    ]);
  });
  it("opens without writing, keeps edits after failure, then sends one atomic counter command", async () => {
    const fixture = createCounterFixture();
    const view = renderCounter(fixture);
    await view.user.click(await screen.findByRole("button", { name: "Counter Proposal" }));
    await screen.findByRole("heading", { name: "New trade proposal" });
    expect(screen.getByLabelText("Proposing team")).toHaveValue(ids.receivingTeam);
    expect(screen.getByLabelText("Receiving team")).toHaveValue(ids.sendingTeam);
    expect(screen.getByLabelText("Receiving team sends asset 1 retained AAV dollars")).toHaveValue(1.25);
    expect(screen.getByLabelText("Receiving team sends asset 3")).toHaveValue(ids.future);
    expect(writes(fixture)).toHaveLength(0);
    const notes = screen.getByLabelText("Proposing team sends asset 3 notes");
    await view.user.clear(notes);
    await view.user.type(notes, "Conditional second-round pick");
    fixture.failNext = true;
    await view.user.click(screen.getByRole("button", { name: "Send counter proposal" }));
    await screen.findByText("The trade request could not be completed.");
    expect(fixture.original.storageStatus).toBe("proposed");
    expect(notes).toHaveValue("Conditional second-round pick");
    await view.user.click(screen.getByRole("button", { name: "Send counter proposal" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "New trade proposal" })).not.toBeInTheDocument());
    const requests = writes(fixture);
    expect(requests).toHaveLength(2);
    expect(requests.every(request => request.pathname === `/api/v1/leagues/${ids.league}/trades/${ids.trade}/counter`)).toBe(true);
    expect(requests[0].headers.get("Idempotency-Key")).toBe(requests[1].headers.get("Idempotency-Key"));
    expect(requests[1].body).toMatchObject({ proposingTeamId: ids.receivingTeam, receivingTeamId: ids.sendingTeam,
      proposingAssets: [{ type: "draft_pick", draftPickId: ids.pick }, { type: "buyout_obligation", buyoutObligationId: ids.buyout },
        { type: "future_consideration_instruction", description: "Conditional second-round pick" }],
      receivingAssets: [{ type: "contract", contractId: ids.contract }, { type: "requested_retention", contractId: ids.contract, retainedAavCents: 125 },
        { type: "prospect_right", playerId: ids.prospect }, { type: "future_consideration", futureConsiderationId: ids.future }] });
    expect(fixture.original.storageStatus).toBe("declined");
  });
  it("returning to the original offer leaves it pending", async () => {
    const fixture = createCounterFixture();
    const view = renderCounter(fixture);
    await view.user.click(await screen.findByRole("button", { name: "Counter Proposal" }));
    await view.user.click(await screen.findByRole("link", { name: "Back to original offer" }));
    expect(await screen.findByRole("button", { name: "Counter Proposal" })).toBeInTheDocument();
    expect(writes(fixture)).toHaveLength(0);
    expect(fixture.original.storageStatus).toBe("proposed");
  });
  for (const role of ["sender", "commissioner"]) it(`does not allow ${role} to counter`, async () => {
    const fixture = createCounterFixture({ role });
    renderCounter(fixture);
    await screen.findByRole("heading", { name: /Wolfy's ↔ Benning/ });
    expect(screen.queryByRole("button", { name: "Counter Proposal" })).not.toBeInTheDocument();
  });
  it("rejects a forged counter link for another team's manager", async () => {
    renderCounter(createCounterFixture({ role: "sender" }), `/leagues/${ids.league}/trades?counterTradeId=${ids.trade}`);
    expect(await screen.findByRole("alert")).toHaveTextContent("Only the receiving team's manager");
    expect(screen.queryByRole("button", { name: "Send counter proposal" })).not.toBeInTheDocument();
  });
  it("does not preload a different league or a closed original", () => {
    const options = { leagueId: ids.league, tradeId: ids.trade, managedTeamIds: [ids.receivingTeam] };
    expect(() => counterProposalDraft(createCounterFixture({ leagueId: ids.otherLeague }).original, options)).toThrow();
    expect(() => counterProposalDraft(createCounterFixture({ status: "declined" }).original, options)).toThrow();
  });
  it("requires unavailable items to be replaced or removed before sending", async () => {
    const fixture = createCounterFixture({ unavailable: true });
    const view = renderCounter(fixture, `/leagues/${ids.league}/trades?counterTradeId=${ids.trade}`);
    await screen.findByRole("option", { name: /Previously offered item is unavailable/ });
    await view.user.click(screen.getByRole("button", { name: "Send counter proposal" }));
    expect(writes(fixture)).toHaveLength(0);
  });
  it("uses the selected league in a second league context", async () => {
    const fixture = createCounterFixture({ leagueId: ids.otherLeague });
    const view = renderCounter(fixture, `/leagues/${ids.otherLeague}/trades/${ids.trade}`);
    await view.user.click(await screen.findByRole("button", { name: "Counter Proposal" }));
    await view.user.click(await screen.findByRole("button", { name: "Send counter proposal" }));
    await waitFor(() => expect(writes(fixture)).toHaveLength(1));
    expect(writes(fixture)[0].pathname).toContain(`/leagues/${ids.otherLeague}/`);
  });
});
