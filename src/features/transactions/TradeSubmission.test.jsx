import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { createCounterFixture, counterIds as ids } from "../../test/counterProposalFixture.js";
import { TradesPage } from "./TransactionPages.jsx";

vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
async function setup(respond) {
  const fixture = createCounterFixture();
  const requests = [];
  const fetchImpl = (url, options = {}) => {
    if (new URL(url).pathname === `/api/v1/leagues/${ids.league}/trades` && options.method === "POST") {
      requests.push(options);
      return respond(options);
    }
    return fixture.fetch(url, options);
  };
  const view = renderWithProviders(<Routes><Route path="/leagues/:leagueId/trades" element={<TradesPage />} /><Route path="/leagues/:leagueId/trades/:tradeId" element={<h1>Saved trade</h1>} /></Routes>, {
    initialEntries: [`/leagues/${ids.league}/trades?assetDirection=requested&assetType=contract&assetId=${ids.contract}&sourceTeamId=${ids.sendingTeam}`],
    enableSession: true, config, sessionOptions: { fetchImpl },
  });
  await view.user.selectOptions(await screen.findByLabelText("Proposing team sends asset 1 type"), "draft_pick");
  await view.user.selectOptions(await screen.findByLabelText("Proposing team sends asset 1"), ids.pick);
  await view.user.click(screen.getByRole("button", { name: "Preview trade" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit trade" })).toBeEnabled());
  expect(requests).toHaveLength(0);
  return { ...view, requests };
}
const success = () => new Response(JSON.stringify({ data: { code: "TRADE_PROPOSAL_CREATED", proposal: { id: ids.counter } }, meta: { requestId: "trade-send-fixture" } }), { status: 201, headers: { "content-type": "application/json" } });

describe("trade send feedback", () => {
  it("blocks rapid repeat submits and opens the saved offer after review", async () => {
    let finish;
    const view = await setup(() => new Promise(resolve => { finish = resolve; }));
    const submit = screen.getByRole("button", { name: "Submit trade" });
    act(() => { fireEvent.click(submit); fireEvent.click(submit); });
    await waitFor(() => expect(view.requests).toHaveLength(1));
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    await act(async () => finish(success()));
    expect(await screen.findByRole("heading", { name: "Saved trade" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Submit trade" })).not.toBeInTheDocument();
    expect(view.requests).toHaveLength(1);
  });

  it("preserves the draft and submission key when a failed request is retried", async () => {
    let attempt = 0;
    const view = await setup(() => ++attempt === 1
      ? new Response(JSON.stringify({ error: { code: "TRADE_REQUEST_FAILED", message: "Please retry the proposal.", requestId: "trade-send-fixture" } }), { status: 500, headers: { "content-type": "application/json" } })
      : success());
    await view.user.click(screen.getByRole("button", { name: "Submit trade" }));
    await screen.findByText("Please retry the proposal.");
    await view.user.click(screen.getByRole("button", { name: "Edit trade" }));
    expect(screen.getByLabelText("Proposing team sends asset 1")).toHaveValue(ids.pick);
    await view.user.click(screen.getByRole("button", { name: "Preview trade" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit trade" })).toBeEnabled());
    await view.user.click(screen.getByRole("button", { name: "Submit trade" }));
    expect(await screen.findByRole("heading", { name: "Saved trade" })).toBeVisible();
    expect(view.requests).toHaveLength(2);
    expect(view.requests[0].headers.get("Idempotency-Key")).toBe(view.requests[1].headers.get("Idempotency-Key"));
  });
});

