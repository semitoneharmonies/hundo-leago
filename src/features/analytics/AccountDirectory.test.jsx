import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../../shared/query/queryClient.js";
import { SessionContext } from "../session/sessionContext.js";
import { accountDirectoryFixture } from "../../test/accountDirectoryFixture.js";
import { adminAnalyticsFixture, withPageDetail } from "../../test/adminAnalyticsFixture.js";
import { AccountDirectory } from "./AccountDirectory.jsx";
import { AdminAnalyticsPage } from "./AdminAnalyticsPage.jsx";
import { accountDirectoryKey, accountDirectoryQuery, validateAccountDirectory } from "./accountDirectoryQueries.js";

function mount({ total = 54, fetch = null, fullPage = false } = {}) {
  const request = vi.fn(async (path, options) => {
    const url = new URL(path, "https://example.test");
    if (url.pathname === "/api/v1/admin/analytics") {
      const data = withPageDetail(adminAnalyticsFixture({ days: Number(url.searchParams.get("days")) }));
      options.validateData(data);
      return { data };
    }
    const data = fetch ? await fetch(path, options) : accountDirectoryFixture({ offset: Number(url.searchParams.get("offset")), total, sort: url.searchParams.get("sort") || "username", direction: url.searchParams.get("direction") || "asc" });
    options.validateData(data);
    return { data };
  });
  const queryClient = createQueryClient();
  const session = { status: "authenticated", user: { id: "first-admin" }, httpClient: { request } };
  const node = value => <MemoryRouter><QueryClientProvider client={queryClient}><SessionContext.Provider value={value}>{fullPage ? <AdminAnalyticsPage/> : <AccountDirectory/>}</SessionContext.Provider></QueryClientProvider></MemoryRouter>;
  const view = render(node(session));
  return { ...view, request, queryClient, user: userEvent.setup(), updateSession: change => view.rerender(node({ ...session, ...change })) };
}
async function expand(view) { await view.user.click(screen.getByRole("button", { name: "Account directory" })); }

describe("Admin account directory", () => {
  it("is collapsed by default and requests personal details only on expansion", async () => {
    const view = mount();
    expect(screen.getByRole("button", { name: "Account directory" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("alex.morgan@example.test")).not.toBeInTheDocument();
    expect(view.request).not.toHaveBeenCalled();
    await expand(view);
    expect(await screen.findByRole("table", { name: "Registered account directory" })).toBeInTheDocument();
    expect(view.request).toHaveBeenCalledExactlyOnceWith("/api/v1/admin/account-directory?limit=50&offset=0&sort=username&direction=asc", expect.objectContaining({ authenticated: true, signal: expect.any(AbortSignal) }));
    expect(view.request.mock.calls[0][1].method).toBeUndefined();
    const query = view.queryClient.getQueryCache().find({ queryKey: accountDirectoryKey("first-admin") });
    expect(query.meta.private).toBe(true);
    expect(query.options.gcTime).toBe(0);
    expect(query.options.refetchOnWindowFocus).toBe(false);
    expect(query.options.refetchOnReconnect).toBe(false);
    expect(query.options.refetchInterval).toBe(false);
  });

  it("shows usernames, emails, current leagues and all statuses without activity columns", async () => {
    const view = mount();
    await expand(view);
    const table = await screen.findByRole("table");
    const account = within(screen.getByRole("row", { name: /Alex Morgan/ }));
    expect(account.getByText("alex.morgan@example.test")).toBeInTheDocument();
    expect(account.getByText("Amigo Leago")).toBeInTheDocument();
    expect(account.getByText("North Shore Hockey Club")).toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /Bailey Robertson/ })).getByText("No current leagues")).toBeInTheDocument();
    for (const status of ["Awaiting verification", "Awaiting password setup", "Deactivated", "Disabled"]) expect(within(table).getByText(status)).toBeInTheDocument();
    expect(within(table).getAllByRole("columnheader").map(cell => cell.textContent)).toEqual(["Username", "Email", "Created", "Current leagues", "Status"]);
    expect(screen.queryByText(/00000000-0000/)).not.toBeInTheDocument();
  });

  it("loads server pages and discards old rows instead of filtering only the current page", async () => {
    const view = mount();
    await expand(view);
    await screen.findByText("1–50 of 54 accounts");
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("51–54 of 54 accounts");
    expect(screen.queryByText("alex.morgan@example.test")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(view.request).toHaveBeenLastCalledWith("/api/v1/admin/account-directory?limit=50&offset=50&sort=username&direction=asc", expect.any(Object));
    await view.user.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByText("1–50 of 54 accounts");
    expect(view.request).toHaveBeenCalledTimes(3);
  });

  it("unmounts account rows and removes the private cache on collapse, then fetches fresh on reopen", async () => {
    const view = mount();
    await expand(view);
    await screen.findByText("alex.morgan@example.test");
    await expand(view);
    expect(screen.queryByText("alex.morgan@example.test")).not.toBeInTheDocument();
    await waitFor(() => expect(view.queryClient.getQueryCache().find({ queryKey: accountDirectoryKey("first-admin") })).toBeUndefined());
    await expand(view);
    await screen.findByText("alex.morgan@example.test");
    expect(view.request).toHaveBeenCalledTimes(2);
  });

  it("cancels an in-flight request when collapsed", async () => {
    let signal;
    const view = mount({ fetch: (_path, options) => {
      signal = options.signal;
      return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))));
    } });
    await expand(view);
    expect(screen.getByRole("status")).toHaveTextContent("Loading account directory");
    await expand(view);
    expect(signal.aborted).toBe(true);
    await waitFor(() => expect(view.queryClient.getQueryCache().find({ queryKey: accountDirectoryKey("first-admin") })).toBeUndefined());
  });

  it("closes and clears the previous user's data when the current account changes", async () => {
    const view = mount();
    await expand(view);
    await screen.findByText("alex.morgan@example.test");
    view.updateSession({ user: { id: "second-admin" } });
    expect(screen.getByRole("button", { name: "Account directory" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("alex.morgan@example.test")).not.toBeInTheDocument();
    await waitFor(() => expect(view.queryClient.getQueryCache().find({ queryKey: accountDirectoryKey("first-admin") })).toBeUndefined());
    await expand(view);
    await screen.findByText("alex.morgan@example.test");
    expect(view.queryClient.getQueryCache().find({ queryKey: accountDirectoryKey("second-admin") })).toBeDefined();
    view.updateSession({ status: "unauthenticated", user: null });
    expect(screen.queryByText("alex.morgan@example.test")).not.toBeInTheDocument();
    await waitFor(() => expect(view.queryClient.getQueryCache().find({ queryKey: accountDirectoryKey("second-admin") })).toBeUndefined());
  });

  it.each([401, 403])("hides and removes previously loaded details after a %i refetch response", async status => {
    let denied = false;
    const view = mount({ fetch: () => {
      if (denied) throw { status, code: "PLATFORM_ADMINISTRATOR_REQUIRED" };
      return accountDirectoryFixture();
    } });
    await expand(view);
    await screen.findByText("alex.morgan@example.test");
    denied = true;
    await act(() => view.queryClient.invalidateQueries({ queryKey: accountDirectoryKey("first-admin") }));
    expect(await screen.findByRole("heading", { name: "Administrator access required" })).toBeInTheDocument();
    expect(screen.queryByText("alex.morgan@example.test")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await waitFor(() => expect(view.queryClient.getQueryCache().find({ queryKey: accountDirectoryKey("first-admin") })).toBeUndefined());
  });

  it("isolates directory errors from aggregate totals and retries only the directory", async () => {
    let failed = true;
    const view = mount({ fullPage: true, fetch: () => {
      if (failed) throw { status: 503, code: "ACCOUNT_DIRECTORY_UNAVAILABLE" };
      return accountDirectoryFixture();
    } });
    await screen.findByText("Registered accounts");
    expect(screen.getByText("Aggregate activity")).toBeInTheDocument();
    expect(view.request).toHaveBeenCalledTimes(1);
    await expand(view);
    expect(await screen.findByRole("alert")).toHaveTextContent("Activity totals remain available");
    expect(screen.getByText("Registered accounts")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Leago & Daily" })).toBeInTheDocument();
    failed = false;
    await view.user.click(screen.getByRole("button", { name: "Retry account directory" }));
    await screen.findByText("alex.morgan@example.test");
    expect(view.request.mock.calls.filter(([path]) => path.startsWith("/api/v1/admin/analytics?"))).toHaveLength(1);
  });

  it("shows an empty account directory without implying a loading failure", async () => {
    const view = mount({ total: 0 });
    await expand(view);
    expect(await screen.findByRole("heading", { name: "No registered accounts" })).toBeInTheDocument();
    expect(screen.getByText("0 accounts")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders account names as plain text", async () => {
    const view = mount({ fetch: () => {
      const data = accountDirectoryFixture({ total: 1 });
      data.accounts[0].username = "<img src=x onerror=alert(1)>";
      return data;
    } });
    await expand(view);
    expect(await screen.findByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(view.container.querySelector("img")).toBeNull();
  });
});


  it("shows the authoritative creation timestamp as a UTC−8 date", async () => {
    const view=mount();
    await expand(view);
    const row=within(await screen.findByRole("row",{name:/Alex Morgan/}));
    expect(row.getByText("Sep 30, 2026")).toHaveAttribute("datetime","2026-10-01T07:30:00.000Z");
    expect(screen.getByText(/Created dates use UTC−8/)).toBeInTheDocument();
  });

  it("sorts all accounts by creation date, resets to page one and toggles direction", async () => {
    const view=mount();
    await expand(view);await screen.findByText("1–50 of 54 accounts");
    await view.user.click(screen.getByRole("button",{name:"Next"}));await screen.findByText("51–54 of 54 accounts");
    await view.user.click(screen.getByRole("button",{name:"Sort by Created"}));
    await screen.findByText("1–50 of 54 accounts");
    expect(view.request).toHaveBeenLastCalledWith("/api/v1/admin/account-directory?limit=50&offset=0&sort=createdAt&direction=desc",expect.any(Object));
    expect(screen.getAllByRole("rowheader")[0]).toHaveTextContent("Manager 049");
    expect(screen.getByRole("columnheader",{name:"Created"})).toHaveAttribute("aria-sort","descending");
    await view.user.click(screen.getByRole("button",{name:"Sort by Created"}));
    await waitFor(()=>expect(screen.getAllByRole("rowheader")[0]).toHaveTextContent("Alex Morgan"));
    expect(screen.getByRole("columnheader",{name:"Created"})).toHaveAttribute("aria-sort","ascending");
    expect(screen.getByRole("columnheader",{name:"Username"})).toHaveAttribute("aria-sort","none");
  });

  it.each([["Email","email"],["Current leagues","league"],["Status","status"]])("requests server sorting from the %s header",async(label,sort)=>{
    const view=mount();await expand(view);await screen.findByText("1–50 of 54 accounts");
    await view.user.click(screen.getByRole("button",{name:"Sort by "+label}));
    await waitFor(()=>expect(screen.getByRole("columnheader",{name:label})).toHaveAttribute("aria-sort","ascending"));
    expect(view.request).toHaveBeenLastCalledWith("/api/v1/admin/account-directory?limit=50&offset=0&sort="+sort+"&direction=asc",expect.any(Object));
    await view.user.click(screen.getByRole("button",{name:"Sort by "+label}));
    await waitFor(()=>expect(screen.getByRole("columnheader",{name:label})).toHaveAttribute("aria-sort","descending"));
    expect(view.request).toHaveBeenLastCalledWith("/api/v1/admin/account-directory?limit=50&offset=0&sort="+sort+"&direction=desc",expect.any(Object));
  });

  it("offers the same sort orders through the mobile control and keeps the sort on the next page",async()=>{
    const view=mount();await expand(view);await screen.findByText("1–50 of 54 accounts");
    await view.user.selectOptions(screen.getByLabelText("Sort accounts"),"createdAt:asc");
    await waitFor(()=>expect(screen.getByRole("columnheader",{name:"Created"})).toHaveAttribute("aria-sort","ascending"));
    await view.user.click(screen.getByRole("button",{name:"Next"}));await screen.findByText("51–54 of 54 accounts");
    expect(view.request).toHaveBeenLastCalledWith("/api/v1/admin/account-directory?limit=50&offset=50&sort=createdAt&direction=asc",expect.any(Object));
    expect(screen.getByLabelText("Sort accounts")).toHaveValue("createdAt:asc");
  });

describe("Account directory contract", () => {
  it.each([0, 50, 100])("accepts a correctly paginated response at offset %i", offset => {
    expect(validateAccountDirectory(accountDirectoryFixture({ offset }), offset)).toBe(true);
  });
  it.each([
    data => { data.accounts[0].activeSeconds = 120; },
    data => { data.accounts[0].passwordHash = "unexpected"; },
    data => { data.accounts[0].email = null; },
    data => { data.accounts[0].createdAtMs = null; },
    data => { data.accounts[0].createdAtMs = -1; },
    data => { data.accounts[0].createdAtMs = 9_000_000_000_000_000; },
    data => { data.pagination.sort = "email"; },
    data => { data.pagination.direction = "desc"; },
    data => { data.accounts[0].username = "x".repeat(101); },
    data => { data.accounts[0].status = "administrator"; },
    data => { data.accounts[1].id = data.accounts[0].id; },
    data => { data.accounts[0].leagues.push(data.accounts[0].leagues[0]); },
    data => { data.accounts[0].leagues[0].managerName = "unexpected"; },
    data => { data.pagination.limit = 100; },
    data => { data.pagination.offset = 50; },
    data => { data.pagination.total = -1; },
    data => { data.pagination.hasMore = false; },
  ])("rejects unexpected private fields, individual activity and malformed responses", change => {
    const data = accountDirectoryFixture();
    change(data);
    expect(() => validateAccountDirectory(data)).toThrow();
  });
  it("rejects invalid requested page offsets and scopes query keys to the user", () => {
    expect(() => accountDirectoryQuery({}, "", 0)).toThrow();
    expect(() => accountDirectoryQuery({}, "admin", -50)).toThrow();
    expect(() => accountDirectoryQuery({}, "admin", 1)).toThrow();
    expect(accountDirectoryKey("one")).not.toEqual(accountDirectoryKey("two"));
    expect(accountDirectoryKey("one",0,"email","asc")).not.toEqual(accountDirectoryKey("one",0,"email","desc"));
    expect(()=>accountDirectoryQuery({},"one",0,"created_at_ms")).toThrow();
    expect(()=>accountDirectoryQuery({},"one",0,"username","DESC")).toThrow();
  });
});
