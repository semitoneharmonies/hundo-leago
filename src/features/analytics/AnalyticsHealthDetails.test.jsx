import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../../shared/query/queryClient.js";
import { SessionContext } from "../session/sessionContext.js";
import { analyticsHealthFixture } from "../../test/analyticsHealthFixture.js";
import { AnalyticsHealthDetails, HEALTH_GROUP_LABELS } from "./AnalyticsHealthDetails.jsx";
import { analyticsHealthKey, analyticsHealthQuery, healthSelection, validateAnalyticsHealth } from "./analyticsHealthQueries.js";
const NOW = Date.parse("2026-11-27T20:00:00Z");
function mount({ group = "failed_jobs", period = { days: 28 }, fetch, total = 2, status = "available" } = {}) {
  const queryClient = createQueryClient(), close = vi.fn();
  const request = vi.fn(async (path, options) => {
    const data = fetch ? await fetch(path, options) : analyticsHealthFixture({ group, period, total, status, asOfMs: NOW });
    options.validateData(data);return { data };
  });
  const session = { status: "authenticated", user: { id: "admin-one" }, httpClient: { request } };
  const tree = (value, props = {}) => <QueryClientProvider client={queryClient}><SessionContext.Provider value={value}><AnalyticsHealthDetails group={group} period={period} onClose={close} {...props}/></SessionContext.Provider></QueryClientProvider>;
  const view = render(tree(session));
  return { ...view, queryClient, request, close, user: userEvent.setup(), update: (value,props) => view.rerender(tree({ ...session,...value },props)) };
}
describe("Health detail contract",()=>{
  it.each(Object.keys(HEALTH_GROUP_LABELS))("accepts only bounded safe %s records", group=>{
    const data=analyticsHealthFixture({group,asOfMs:NOW});expect(validateAnalyticsHealth(data,group)).toBe(true);
    expect(()=>validateAnalyticsHealth({...data,rawError:"SECRET"},group)).toThrow();
    expect(()=>validateAnalyticsHealth({...data,items:[{...data.items[0],payload:"secret@example.test"},data.items[1]]},group)).toThrow();
    expect(()=>validateAnalyticsHealth({...data,items:[{...data.items[0],reasonCode:"URL_SECRET"},data.items[1]]},group)).toThrow();
  });
  it.each([{days:7},{kind:"week",value:"2026-11-23"},{kind:"month",value:"2026-10"}])("preserves selector and scope for %j",period=>{
    const data=analyticsHealthFixture({group:"failed_injuries",period,asOfMs:NOW});
    expect(validateAnalyticsHealth(data,"failed_injuries",healthSelection(period))).toBe(true);
    const query=analyticsHealthQuery({request:vi.fn()},"admin","failed_injuries",period);
    expect(query.queryKey).toEqual(analyticsHealthKey("admin","failed_injuries",healthSelection(period)));
    expect(()=>validateAnalyticsHealth({...data,scope:"current"},"failed_injuries",healthSelection(period))).toThrow();
    expect(()=>validateAnalyticsHealth({...data,period:{...data.period,startDate:"2000-01-01"}},"failed_injuries",healthSelection(period))).toThrow();
  });
  it("rejects mismatched, excess, inconsistent or unsafe detail values",()=>{
    const data=analyticsHealthFixture({asOfMs:NOW});
    for(const change of [{group:"pending_jobs"},{total:3},{truncated:true},{limit:100},{asOfMs:null},{status:"unavailable"}])expect(()=>validateAnalyticsHealth({...data,...change},"failed_jobs")).toThrow();
    for(const change of [{kind:"username@example.test"},{attempts:-1},{completedAtMs:9e15},{status:"pending"}])expect(()=>validateAnalyticsHealth({...data,items:[{...data.items[0],...change},data.items[1]]},"failed_jobs")).toThrow();
    expect(validateAnalyticsHealth(analyticsHealthFixture({asOfMs:NOW,total:60}),"failed_jobs")).toBe(true);
    expect(validateAnalyticsHealth(analyticsHealthFixture({asOfMs:NOW,status:"unavailable"}),"failed_jobs")).toBe(true);
    expect(()=>validateAnalyticsHealth(analyticsHealthFixture({asOfMs:NOW,status:"not_measured"}),"failed_jobs")).toThrow();
  });
});
describe("Health details",()=>{
  it("fetches a private account-scoped GET and shows specific reason, attempts and read-only guidance",async()=>{
    const view=mount();await screen.findAllByText("Insufficient backup space");
    expect(view.request).toHaveBeenCalledExactlyOnceWith("/api/v1/admin/analytics/health?group=failed_jobs&days=28",expect.objectContaining({authenticated:true,signal:expect.any(AbortSignal)}));
    expect(view.request.mock.calls[0][1].method).toBeUndefined();
    expect(screen.getByText(/Current backlog, independent/)).toBeInTheDocument();expect(screen.getAllByText(/verified recoverable backup/)).toHaveLength(2);
    expect(screen.getByText(/does not retry jobs or change site data/)).toBeInTheDocument();
    const query=view.queryClient.getQueryCache().find({queryKey:analyticsHealthKey("admin-one","failed_jobs",28)});
    expect(query.meta.private).toBe(true);expect(query.options.gcTime).toBe(0);expect(query.options.retry).toBe(false);expect(query.options.refetchOnWindowFocus).toBe(false);expect(query.options.refetchOnReconnect).toBe(false);
    await view.user.click(screen.getByRole("button",{name:"Close health details"}));expect(view.close).toHaveBeenCalledOnce();
  });
  it("shows future scheduled jobs as normal waiting and unknown reasons honestly",async()=>{
    const view=mount({group:"pending_jobs"});await screen.findAllByText("Scheduled for later");expect(screen.getAllByText(/No intervention is indicated/)).toHaveLength(2);view.unmount();
    mount({fetch:()=>{const data=analyticsHealthFixture({asOfMs:NOW});data.items.forEach(row=>{row.reasonCode="unknown";});return data;}});await screen.findAllByText("Reason not recorded");expect(screen.getAllByText(/specific cause is not available/)).toHaveLength(2);
  });
  it("limits records and labels selected-period failures",async()=>{
    mount({group:"failed_statistics",period:{kind:"month",value:"2026-10"},total:63});
    expect(await screen.findByText("Showing the first 50 of 63 records",{exact:false})).toBeInTheDocument();
    expect(screen.getByText("Failures recorded 2026-10-01 through 2026-10-31")).toBeInTheDocument();expect(screen.getAllByRole("listitem")).toHaveLength(50);
  });
  it.each(["unavailable","not_measured"])("keeps %s distinct from a zero count",async status=>{
    mount({group:"daily_scoring_pending",status});expect(await screen.findByText(/No healthy zero is assumed/)).toBeInTheDocument();expect(screen.queryByText("No matching records")).not.toBeInTheDocument();
  });
  it("shows a true empty result",async()=>{mount({total:0});expect(await screen.findByText("No matching records")).toBeInTheDocument();});
  it("clears cache on unmount and aborts in-flight reads",async()=>{
    const view=mount();await screen.findAllByText("Insufficient backup space");view.unmount();await waitFor(()=>expect(view.queryClient.getQueryCache().getAll()).toHaveLength(0));
    let signal;const pending=mount({fetch:(_path,options)=>{signal=options.signal;return new Promise(()=>{});}});await waitFor(()=>expect(signal).toBeInstanceOf(AbortSignal));pending.unmount();await waitFor(()=>expect(signal.aborted).toBe(true));
  });
  it("hides rows after logout and uses a new private key for another account",async()=>{
    const view=mount();await screen.findAllByText("Insufficient backup space");view.update({status:"anonymous",user:null});expect(screen.queryByText("Insufficient backup space")).not.toBeInTheDocument();
    await waitFor(()=>expect(view.queryClient.getQueryCache().getAll()).toHaveLength(0));view.update({user:{id:"admin-two"}});await screen.findAllByText("Insufficient backup space");expect(view.request).toHaveBeenCalledTimes(2);
    expect(view.queryClient.getQueryCache().find({queryKey:analyticsHealthKey("admin-two","failed_jobs",28)})).toBeDefined();
  });
  it.each([401,403])("hides stale successful details and removes cache after %i",async status=>{
    let denied=false;const view=mount({fetch:()=>{if(denied)throw Object.assign(new Error("PRIVATE_RAW_FAILURE"),{status});return analyticsHealthFixture({asOfMs:NOW});}});
    await screen.findAllByText("Insufficient backup space");denied=true;await view.user.click(screen.getByRole("button",{name:"Refresh health details"}));
    expect(await screen.findByText("Administrator access required")).toBeInTheDocument();expect(screen.queryByText("Insufficient backup space")).not.toBeInTheDocument();expect(screen.queryByText("PRIVATE_RAW_FAILURE")).not.toBeInTheDocument();
    await waitFor(()=>expect(view.queryClient.getQueryCache().getAll()).toHaveLength(0));
  });
  it("shows safe errors and permits only a read retry",async()=>{
    let failed=true;const view=mount({fetch:()=>{if(failed)throw new Error("PRIVATE_RAW_FAILURE");return analyticsHealthFixture({asOfMs:NOW});}});
    expect(await screen.findByRole("alert")).toHaveTextContent("Health details could not be loaded");expect(screen.queryByText("PRIVATE_RAW_FAILURE")).not.toBeInTheDocument();failed=false;await view.user.click(screen.getByRole("button",{name:"Retry health details"}));await screen.findAllByText("Insufficient backup space");
  });
});

