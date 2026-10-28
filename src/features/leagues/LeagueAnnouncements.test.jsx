import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { LeagueAnnouncements } from "./LeagueAnnouncements.jsx";
import { announcementKey } from "./announcementQueries.js";
import { LeagueCommunications } from "../commissioner/LeagueCommunications.jsx";
import { communicationsKey } from "../commissioner/leagueCommunicationApi.js";
import { SessionContext } from "../session/sessionContext.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const messageId = "22222222-2222-4222-8222-222222222222";
const otherLeagueId = "33333333-3333-4333-8333-333333333333";
const otherMessageId = "44444444-4444-4444-8444-444444444444";

function setup({ authority = "commissioner", mainView = false, onArchive } = {}) {
  const notice = { id: messageId, leagueId, kind: "announcement", title: "Practice reminder",
    body: "Set your lineup before Monday.", authorName: "Commissioner", createdAtMs: Date.now() - 1000,
    version: 2, pinned: false, expiresAtMs: null, archivedAtMs: null, audience: "members", recipientCount: 1 };
  const state = { archived: false, notice };
  const client = { request: vi.fn(async (path, options = {}) => {
    let data;
    if (path.endsWith(`/${messageId}/archive`)) {
      if (onArchive) data = await onArchive(state, options);
      else { state.archived = true; data = { leagueId, id: messageId, archived: true }; }
    } else if (path.includes("/announcements?")) {
      data = { code: "LEAGUE_ANNOUNCEMENTS_FOUND", announcements: state.archived ? [] : [{ ...state.notice }], page: { limit: 10, nextCursor: null } };
    } else if (path.endsWith("/communications")) {
      data = { leagueId, messages: state.archived ? [] : [{ ...state.notice }] };
    } else throw new Error(`Unexpected request: ${path}`);
    options.validateData?.(data);
    return { data };
  }) };
  const league = { id: leagueId, membership: { permissionCategory: authority === "platform_administrator" ? "member" : authority, effectiveAuthority: authority, status: "active" } };
  const session = { status: "authenticated", user: { id: "test-user" }, httpClient: client };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(announcementKey(otherLeagueId), { pages: [{ announcements: [{ id: otherMessageId, body: "Other league notice" }] }], pageParams: [null] });
  queryClient.setQueryData([...communicationsKey(otherLeagueId), "visible"], { messages: [{ id: otherMessageId }] });
  const user = userEvent.setup();
  const view = render(<QueryClientProvider client={queryClient}><SessionContext.Provider value={session}>
    <LeagueAnnouncements league={league} session={session} />
    {mainView && <LeagueCommunications leagueId={leagueId} canManage={authority !== "manager"} />}
  </SessionContext.Provider></QueryClientProvider>);
  const sidebar = view.container.querySelector(".hl-sidebar-announcements");
  const writes = () => client.request.mock.calls.filter(([, options]) => options.method === "POST");
  return { ...view, client, queryClient, user, sidebar, state, writes };
}

describe("Sidebar announcement removal", () => {
  it.each(["manager", "commissioner", "platform_administrator"])("shows the X only to commissioner authority: %s", async authority => {
    const { sidebar, writes } = setup({ authority });
    await within(sidebar).findByText("Set your lineup before Monday.");
    const button = within(sidebar).queryByRole("button", { name: "Remove announcement: Practice reminder" });
    if (authority === "manager") expect(button).not.toBeInTheDocument();
    else expect(button).toBeEnabled();
    expect(writes()).toHaveLength(0);
  });

  it("removes from both visible views after confirmation while preserving the draft and other league caches", async () => {
    let finish;
    const { sidebar, user, writes, queryClient, state } = setup({ mainView: true,
      onArchive: () => new Promise(resolve => { finish = () => { state.archived = true; resolve({ leagueId, id: messageId, archived: true }); }; }),
    });
    await waitFor(() => expect(screen.getAllByText("Set your lineup before Monday.")).toHaveLength(2));
    await user.click(within(sidebar).getByRole("button", { name: "Write" }));
    const draft = within(sidebar).getByRole("textbox", { name: "Announcement" });
    await user.type(draft, "Keep this unfinished draft.");
    const remove = within(sidebar).getByRole("button", { name: "Remove announcement: Practice reminder" });
    fireEvent.click(remove);
    await waitFor(() => expect(remove).toBeDisabled());
    fireEvent.click(remove);
    expect(writes()).toHaveLength(1);
    expect(writes()[0]).toEqual([`/api/v1/leagues/${leagueId}/communications/${messageId}/archive`, expect.objectContaining({
      method: "POST", authenticated: true, body: { version: 2, confirmed: true },
    })]);
    expect(screen.getAllByText("Set your lineup before Monday.")).toHaveLength(2);
    finish();
    await waitFor(() => expect(screen.queryByText("Set your lineup before Monday.")).not.toBeInTheDocument());
    expect(draft).toHaveValue("Keep this unfinished draft.");
    expect(queryClient.getQueryState(announcementKey(otherLeagueId)).isInvalidated).toBe(false);
    expect(queryClient.getQueryState([...communicationsKey(otherLeagueId), "visible"]).isInvalidated).toBe(false);
    expect(queryClient.getQueryData(announcementKey(otherLeagueId)).pages[0].announcements[0].body).toBe("Other league notice");
  });

  it("retains a failed removal and retries with the same current version", async () => {
    let attempts = 0;
    const { sidebar, user, writes } = setup({ onArchive: async state => {
      attempts += 1;
      if (attempts === 1) throw new Error("Offline");
      state.archived = true;
      return { leagueId, id: messageId, archived: true };
    } });
    const remove = await within(sidebar).findByRole("button", { name: "Remove announcement: Practice reminder" });
    await user.click(remove);
    expect(await within(sidebar).findByRole("alert")).toHaveTextContent("Could not remove");
    expect(within(sidebar).getByText("Set your lineup before Monday.")).toBeInTheDocument();
    await user.click(remove);
    await waitFor(() => expect(within(sidebar).queryByText("Set your lineup before Monday.")).not.toBeInTheDocument());
    expect(writes()).toHaveLength(2);
    expect(writes().map(([, options]) => options.body.version)).toEqual([2, 2]);
  });

  it("refreshes a stale version before retrying removal", async () => {
    let attempts = 0;
    const { sidebar, user, writes, client } = setup({ onArchive: async state => {
      attempts += 1;
      if (attempts === 1) {
        state.notice.version = 3;
        state.notice.body = "The commissioner updated this reminder.";
        throw Object.assign(new Error("Changed"), { code: "COMMUNICATION_PREVIEW_CHANGED" });
      }
      state.archived = true;
      return { leagueId, id: messageId, archived: true };
    } });
    const remove = await within(sidebar).findByRole("button", { name: "Remove announcement: Practice reminder" });
    await user.click(remove);
    await within(sidebar).findByText("The commissioner updated this reminder.");
    expect(client.request.mock.calls.filter(([path]) => path.includes("/announcements?")).length).toBeGreaterThan(1);
    await user.click(remove);
    await waitFor(() => expect(within(sidebar).queryByText("The commissioner updated this reminder.")).not.toBeInTheDocument());
    expect(writes().map(([, options]) => options.body.version)).toEqual([2, 3]);
  });

  it("rejects a success receipt for a different announcement", async () => {
    const { sidebar, user, client } = setup({ onArchive: async () => ({ leagueId, id: otherMessageId, archived: true }) });
    await user.click(await within(sidebar).findByRole("button", { name: "Remove announcement: Practice reminder" }));
    expect(await within(sidebar).findByRole("alert")).toHaveTextContent("Could not remove");
    expect(within(sidebar).getByText("Set your lineup before Monday.")).toBeInTheDocument();
    expect(client.request.mock.calls.filter(([path]) => path.includes("/announcements?"))).toHaveLength(1);
  });
});
