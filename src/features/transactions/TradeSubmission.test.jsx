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
  const view = renderWithProviders(<Routes><Route path="/leagues/:leagueId/trades" element={<TradesPage />} /></Routes>, {
    initialEntries: [`/leagues/${ids.league}/trades?assetDirection=requested&assetType=contract&assetId=${ids.contract}&sourceTeamId=${ids.sendingTeam}`],
    enableSession: true, config, sessionOptions: { fetchImpl },
  });
  await view.user.selectOptions(await screen.findByLabelText("Proposing team sends asset 1 type"), "draft_pick");
  await view.user.selectOptions(await screen.findByLabelText("Proposing team sends asset 1"), ids.pick);
  await waitFor(() => expect(screen.getByRole("button", { name: "Send proposal" })).toBeEnabled());
  return { ...view, requests };
}
const success = () => new Response(JSON.stringify({ data: { code: "TRADE_PROPOSAL_CREATED", proposal: { id: ids.counter } }, meta: { requestId: "trade-send-fixture" } }), { status: 201, headers: { "content-type": "application/json" } });

describe("trade send feedback", () => {
  it("blocks rapid repeat submits and replaces the completed form with named confirmation and proposal link", async () => {
    let finish;
    const view = await setup(() => new Promise(resolve => { finish = resolve; }));
    const form = screen.getByRole("button", { name: "Send proposal" }).closest("form");
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    await waitFor(() => expect(view.requests).toHaveLength(1));
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    await act(async () => finish(success()));
    expect(await screen.findByRole("status")).toHaveTextContent("Trade proposal to Wolfy's sent.");
    expect(screen.getByRole("link", { name: "View proposal" })).toHaveAttribute("href", `/leagues/${ids.league}/trades/${ids.counter}`);
    expect(screen.queryByRole("button", { name: "Send proposal" })).not.toBeInTheDocument();
    expect(view.requests).toHaveLength(1);
    await view.user.click(screen.getByRole("button", { name: "Start another proposal" }));
    expect(screen.getByLabelText("Proposing team sends asset 1")).toHaveValue("");
    expect(screen.getByLabelText("Receiving team sends asset 1")).toHaveValue("");
    expect(view.requests).toHaveLength(1);
  });

  it("preserves the draft and submission key when a failed request is retried", async () => {
    let attempt = 0;
    const view = await setup(() => ++attempt === 1
      ? new Response(JSON.stringify({ error: { code: "TRADE_REQUEST_FAILED", message: "Please retry the proposal.", requestId: "trade-send-fixture" } }), { status: 500, headers: { "content-type": "application/json" } })
      : success());
    await view.user.click(screen.getByRole("button", { name: "Send proposal" }));
    await screen.findByText("Please retry the proposal.");
    expect(screen.getByLabelText("Proposing team sends asset 1")).toHaveValue(ids.pick);
    await view.user.click(screen.getByRole("button", { name: "Send proposal" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Trade proposal to Wolfy's sent.");
    expect(view.requests).toHaveLength(2);
    expect(view.requests[0].headers.get("Idempotency-Key")).toBe(view.requests[1].headers.get("Idempotency-Key"));
  });
});

