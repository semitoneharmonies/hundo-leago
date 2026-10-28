import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { SessionContext } from "../session/sessionContext.js";
import { LeagueCommunications, CandidateCardProgress } from "./LeagueCommunications.jsx";
import { communicationRequest } from "./leagueCommunicationApi.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const messageId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const teamId = "44444444-4444-4444-8444-444444444444";
const notice = { id: messageId, leagueId, kind: "announcement", title: "New schedule",
  body: "Check the updated dates.", pinned: true, expiresAtMs: null, createdAtMs: 1_800_000_000_000,
  authorName: "Commissioner", archivedAtMs: null, version: 1, audience: "members", recipientCount: 1 };

function setup({ canManage = true, messages = [], failFirstSend = false, pushAvailable = false } = {}) {
  let attempts = 0;
  let archived = false;
  const client = { request: vi.fn(async (url, options = {}) => {
    if (url === "/api/v1/push/settings") return { data: { available: pushAvailable } };
    if (url.endsWith("/history")) return { data: { leagueId, messages: messages.map(m => ({ ...m, archivedAtMs: archived ? 1_800_000_001_000 : null })) } };
    if (url.endsWith("/card-progress")) return { data: { leagueId, total: 1, complete: 0, empty: 1,
      cards: [{ teamId, teamName: "Team North", userId, displayName: "Manager North", status: "empty" }] } };
    if (url.endsWith("/preview")) return { data: { leagueId, message: options.body, previewHash: "a".repeat(64), recipientCount: 1,
      recipients: [{ userId, displayName: "Manager North" }] } };
    if (url.endsWith("/archive")) { archived = true; return { data: { leagueId, id: messageId, archived: true } }; }
    if (options.method === "POST") {
      attempts += 1;
      if (failFirstSend && attempts === 1) throw new Error("Connection lost after sending");
      return { data: { leagueId, id: messageId, recipientCount: 1, replayed: attempts > 1 } };
    }
    return { data: { leagueId, messages: archived ? [] : messages } };
  }) };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const user = userEvent.setup();
  const view = render(<QueryClientProvider client={queryClient}><SessionContext.Provider value={{ status: "authenticated", httpClient: client }}>
    <LeagueCommunications leagueId={leagueId} canManage={canManage} />{canManage&&<CandidateCardProgress leagueId={leagueId}/>}
  </SessionContext.Provider></QueryClientProvider>);
  return { client, user, ...view };
}

async function openEditor(user) {
  await user.click(await screen.findByText("Manage announcements and reminders"));
  await screen.findByRole("textbox", { name: "Title" });
}
async function fillAndPreview(user) {
  await user.type(screen.getByRole("textbox", { name: "Title" }), "Draft reminder");
  await user.type(screen.getByRole("textbox", { name: "Message", exact: true }), "Please finish your card.");
  await user.click(screen.getByRole("button", { name: "Preview message" }));
  await screen.findByRole("region", { name: "Message preview" });
}

describe("League communication controls", () => {
  it('sends a standard unfinished-card reminder directly and safely retries an uncertain send',async()=>{
    const {user,client}=setup({failFirstSend:true});
    await user.click(await screen.findByRole('button',{name:'Remind managers with unfinished cards'}));
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button',{name:'Retry reminder'}));
    await screen.findByText('Reminder delivered to 1 manager.');
    const writes=client.request.mock.calls.filter(([url,o])=>o.method==='POST'&&!url.endsWith('/preview'));
    expect(writes).toHaveLength(2);expect(writes[0][1].idempotencyKey).toBe(writes[1][1].idempotencyKey);
    expect(writes[0][1].body).toEqual(writes[1][1].body);
    expect(writes[0][1].body.message.audience).toBe('unfinished_cards');
    expect(client.request.mock.calls.every(([url])=>!url.includes('candidate-cards')&&!url.includes('/bids'))).toBe(true);
  });
  it("shows announcements to a manager without loading commissioner data or writes", async () => {
    const { client } = setup({ canManage: false, messages: [{ ...notice, body: "<script>private()</script>" }] });
    expect(await screen.findByText("New schedule")).toBeInTheDocument();
    expect(screen.getByText("<script>private()</script>")).toBeInTheDocument();
    expect(screen.queryByText("Manage announcements and reminders")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Remove announcement:/ })).not.toBeInTheDocument();
    expect(client.request.mock.calls.every(([url, options]) => !url.includes("history") && !url.includes("card-progress") && !options.method)).toBe(true);
  });

  it("shows private-safe card status and recipient preview without sending", async () => {
    const { client, user } = setup();
    await openEditor(user);
    expect(await screen.findByText("0 of 1 complete")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Message type"), "reminder");
    await user.selectOptions(screen.getByLabelText("Recipients"), "unfinished_cards");
    await fillAndPreview(user);
    const preview = screen.getByRole("region", { name: "Message preview" });
    expect(within(preview).getByText("Manager North")).toBeInTheDocument();
    expect(client.request.mock.calls.filter(([url, options]) => options.method === "POST" && !url.endsWith("preview"))).toHaveLength(0);
    expect(client.request.mock.calls.every(([url]) => !url.includes("candidate-cards") && !url.includes("bids"))).toBe(true);
  });

  it("requires a fresh preview after editing the message", async () => {
    const { user } = setup(); await openEditor(user); await fillAndPreview(user);
    expect(screen.getByRole("button", { name: "Confirm announcement" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Title" }), " changed");
    expect(screen.queryByRole("button", { name: "Confirm announcement" })).not.toBeInTheDocument();
  });

  it("explains the seven-day cap when the selected expiry is later", async () => {
    const { user, client } = setup();
    await openEditor(user);
    const laterExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    fireEvent.change(screen.getByLabelText(/^Optional expiry/), { target: { value: laterExpiry } });
    await fillAndPreview(user);
    const preview = screen.getByRole("region", { name: "Message preview" });
    expect(within(preview).getByText(/^Automatically disappears 7 days after publishing, or on .+ if sooner\.$/)).toBeInTheDocument();
    expect(within(preview).queryByText(/^Expires /)).not.toBeInTheDocument();
    const request = client.request.mock.calls.find(([url]) => url.endsWith("/preview"));
    expect(request[1].body.expiresAtMs).toBeGreaterThan(Date.now() + 7 * 24 * 60 * 60 * 1000);
    expect(client.request.mock.calls.filter(([url, options]) => options.method === "POST" && !url.endsWith("/preview"))).toHaveLength(0);
  });

  it("preserves standard announcement requests when the server has no push support", async () => {
    const { user, client } = setup(); await openEditor(user); await fillAndPreview(user);
    expect(screen.queryByRole("checkbox", { name: "Important: send a short phone alert" })).not.toBeInTheDocument();
    const preview = client.request.mock.calls.find(([url]) => url.endsWith("/preview"));
    expect(Object.keys(preview[1].body).sort()).toEqual(["audience", "body", "expiresAtMs", "kind", "notify", "pinned", "title"]);
  });

  it("includes the requested phone alert only when the server supports it", async () => {
    const { user, client } = setup({ pushAvailable: true }); await openEditor(user);
    await user.click(await screen.findByRole("checkbox", { name: "Important: send a short phone alert" }));
    await fillAndPreview(user);
    const preview = client.request.mock.calls.find(([url]) => url.endsWith("/preview"));
    expect(preview[1].body.pushNotify).toBe(true);
    expect(screen.getByText(/Phone alert: Commissioner announcement/)).toBeInTheDocument();
  });

  it("retries an uncertain send using the same idempotency key", async () => {
    const { user, client } = setup({ failFirstSend: true }); await openEditor(user); await fillAndPreview(user);
    await user.click(screen.getByRole("button", { name: "Confirm announcement" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm announcement" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Confirm announcement" }));
    expect(await screen.findByText("Announcement published. 1 in-app notifications delivered.")).toBeInTheDocument();
    const sends = client.request.mock.calls.filter(([url, options]) => options.method === "POST" && !url.endsWith("preview"));
    expect(sends).toHaveLength(2);
    expect(sends[0][1].idempotencyKey).toBe(sends[1][1].idempotencyKey);
    expect(sends[0][1].body).toEqual(sends[1][1].body);
  });

  it("requires confirmation to archive and keeps a visible history receipt", async () => {
    const { user, client } = setup({ messages: [notice] }); await openEditor(user);
    await user.click(screen.getByText("Recent message history"));
    await user.click(await screen.findByRole("button", { name: "Archive announcement" }));
    expect(client.request.mock.calls.some(([url]) => url.endsWith("archive"))).toBe(false);
    await user.click(screen.getByRole("button", { name: "Confirm archive" }));
    expect(await screen.findByText("Announcement archived. Its history is preserved.")).toBeInTheDocument();
  });

  it("removes a visible announcement with its X and preserves it in message history", async () => {
    const { user, client } = setup({ messages: [notice] });
    await user.click(await screen.findByRole("button", { name: "Remove announcement: New schedule" }));
    await screen.findByText("No current announcements.");
    expect(client.request.mock.calls.filter(([url]) => url.endsWith("/archive"))).toEqual([
      [`/api/v1/leagues/${leagueId}/communications/${messageId}/archive`, expect.objectContaining({
        method: "POST", body: { version: 1, confirmed: true }, authenticated: true,
      })],
    ]);
    await openEditor(user);
    await user.click(screen.getByText("Recent message history"));
    expect(await screen.findByText("New schedule")).toBeInTheDocument();
    expect(screen.getByText(/Announcement · 1 notifications · Archived/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Remove announcement:/ })).not.toBeInTheDocument();
  });

  it("rejects a response belonging to another league", async () => {
    const client = { request: vi.fn(async () => ({ data: { leagueId: messageId, messages: [] } })) };
    await expect(communicationRequest(client, leagueId)).rejects.toThrow("could not be verified");
  });
});
