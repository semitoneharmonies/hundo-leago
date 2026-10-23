import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { createCounterFixture, counterIds as ids } from "../../test/counterProposalFixture.js";
import { TradeDetailPage, TradesPage } from "./TransactionPages.jsx";

vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
const writes = fixture => fixture.requests.filter(request => request.method === "POST" && !request.pathname.endsWith("/trades/preview"));
function CurrentPage() { return <output aria-label="Current page">{useLocation().pathname}</output>; }
async function compose(fixture, leagueId = ids.league) {
  const view = renderWithProviders(<><CurrentPage /><Routes>
    <Route path="/leagues/:leagueId/trades" element={<TradesPage />} />
    <Route path="/leagues/:leagueId/trades/:tradeId" element={<TradeDetailPage />} />
  </Routes></>, { initialEntries: [`/leagues/${leagueId}/trades`], enableSession: true, config, sessionOptions: { fetchImpl: fixture.fetch } });
  await view.user.selectOptions(await screen.findByLabelText("Receiving team"), ids.receivingTeam);
  await view.user.selectOptions(await screen.findByLabelText("Proposing team sends asset 1"), `contract:${ids.contract}`);
  await view.user.selectOptions(screen.getByLabelText("Receiving team sends asset 1 type"), "draft_pick");
  await view.user.selectOptions(screen.getByLabelText("Receiving team sends asset 1"), ids.pick);
  await view.user.click(screen.getByRole("button", { name: "Preview trade" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit trade" })).toBeEnabled());
  expect(writes(fixture)).toHaveLength(0);
  return view;
}

describe("Two-team proposal send feedback", () => {
  for (const leagueId of [ids.league, ids.otherLeague]) it(`opens the created offer immediately in league ${leagueId}`, async () => {
    const fixture = createCounterFixture({ role: "sender", leagueId });
    const view = await compose(fixture, leagueId);
    await view.user.click(screen.getByRole("button", { name: "Submit trade" }));
    await waitFor(() => expect(screen.getByLabelText("Current page")).toHaveTextContent(`/leagues/${leagueId}/trades/${ids.counter}`));
    expect(await screen.findByRole("heading", { name: "Trade proposal", exact: true })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "New trade proposal" })).not.toBeInTheDocument();
    expect(writes(fixture)).toHaveLength(1);
    expect(writes(fixture)[0].pathname).toBe(`/api/v1/leagues/${leagueId}/trades`);
    expect(fixture.original.storageStatus).toBe("proposed");
  });

  it("shows sending feedback and ignores repeated submissions while the request is pending", async () => {
    const fixture = createCounterFixture({ role: "sender" });
    let release;
    fixture.beforeSend = () => new Promise(resolve => { release = resolve; });
    await compose(fixture);
    const submit = screen.getByRole("button", { name: "Submit trade" });
    act(() => { fireEvent.click(submit); fireEvent.click(submit); });
    await waitFor(() => expect(writes(fixture)).toHaveLength(1));
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    expect(screen.getByLabelText("Current page").textContent).toBe(`/leagues/${ids.league}/trades`);
    await act(async () => { release(); });
    await waitFor(() => expect(screen.getByLabelText("Current page")).toHaveTextContent(`/trades/${ids.counter}`));
    expect(writes(fixture)).toHaveLength(1);
  });

  it("keeps the draft and retry key after failure, then navigates only after success", async () => {
    const fixture = createCounterFixture({ role: "sender" });
    fixture.failNext = true;
    const view = await compose(fixture);
    await view.user.click(screen.getByRole("button", { name: "Submit trade" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The trade request could not be completed.");
    expect(screen.getByLabelText("Current page").textContent).toBe(`/leagues/${ids.league}/trades`);
    await view.user.click(screen.getByRole("button", { name: "Edit trade" }));
    expect(screen.getByLabelText("Proposing team sends asset 1")).toHaveValue(`contract:${ids.contract}`);
    expect(screen.getByLabelText("Receiving team sends asset 1")).toHaveValue(ids.pick);
    await view.user.click(screen.getByRole("button", { name: "Preview trade" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit trade" })).toBeEnabled());
    await view.user.click(screen.getByRole("button", { name: "Submit trade" }));
    await waitFor(() => expect(screen.getByLabelText("Current page")).toHaveTextContent(`/trades/${ids.counter}`));
    expect(writes(fixture)).toHaveLength(2);
    expect(writes(fixture)[0].headers.get("Idempotency-Key")).toBe(writes(fixture)[1].headers.get("Idempotency-Key"));
    expect(writes(fixture)[0].body).toEqual(writes(fixture)[1].body);
  });
});
