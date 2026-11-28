import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { adminAnalyticsFixture, makeCalendarAnalytics, withPageDetail } from "../../test/adminAnalyticsFixture.js";
import { analyticsHealthFixture } from "../../test/analyticsHealthFixture.js";
import { createQueryClient } from "../../shared/query/queryClient.js";
import { SessionContext } from "../session/sessionContext.js";
import { AnalyticsPageRankings } from "./AnalyticsPageRankings.jsx";
import { AnalyticsCalendarContext } from "./AnalyticsCalendarContext.jsx";
import { WeeklyGameplayChart, TrafficProductChart } from "./AnalyticsChartViews.jsx";
import { Freshness } from "./AnalyticsExpandedPanels.jsx";
import { ANALYTICS_PAGE_CATALOG } from "./analyticsPageCatalog.js";
import { validateAdminAnalytics } from "./analyticsContracts.js";
import { adminAnalyticsQuery } from "./analyticsQueries.js";

describe("Detailed page analytics", () => {
  it("validates complete detailed reports without changing the legacy response", () => {
    const old = adminAnalyticsFixture();
    const detailed = withPageDetail(structuredClone(old));
    expect(validateAdminAnalytics(old,28,false)).toBe(true);
    expect(validateAdminAnalytics(detailed,28,true)).toBe(true);
    expect(() => validateAdminAnalytics(old,28,true)).toThrow();
    expect(() => validateAdminAnalytics(detailed,28,false)).toThrow();
    expect(validateAdminAnalytics(withPageDetail(makeCalendarAnalytics("month","2026-10")))).toBe(true);
  });
  it.each([
    d => { d.pageDetail.rows[0].email="secret@example.test"; },
    d => { d.pageDetail.rows.pop(); },
    d => { d.pageDetail.rows[0].category="unknown-route"; },
    d => { d.pageDetail.rows[0].pageViews+=1; },
    d => { d.pageDetail.dailyProducts[0].products[0].pageViews+=1; },
    d => { d.pageDetail.dailyProducts[0].products[0].product="private-league"; },
    d => { d.pageDetail.dailyProducts[0].date=d.period.endDate; },
    d => { d.pageDetail.availableFrom="2026-01-01"; },
    d => { d.pageDetail.startedOn="2026-11-28"; },
  ])("rejects private or inconsistent page detail %#", mutate => {
    const data=withPageDetail(adminAnalyticsFixture()); mutate(data);
    expect(()=>validateAdminAnalytics(data,28,true)).toThrow();
  });
  it("requests page detail explicitly with its own private cache entry", async () => {
    const data=withPageDetail(adminAnalyticsFixture());
    const request=vi.fn(async(_path,options)=>{options.validateData(data);return{data};});
    const query=adminAnalyticsQuery({request},28,{detail:true});
    await query.queryFn({signal:new AbortController().signal});
    expect(query.queryKey).toEqual(["admin","analytics",28,"pages"]);
    expect(request).toHaveBeenCalledWith("/api/v1/admin/analytics?days=28&detail=pages",expect.objectContaining({authenticated:true}));
    expect(adminAnalyticsQuery({},28).queryKey).toEqual(["admin","analytics",28]);
  });
  it("lists every active page type and preserves sorted historical combined rows", () => {
    const data=withPageDetail(adminAnalyticsFixture());
    render(<AnalyticsPageRankings data={data}/>);
    const table=within(screen.getByRole("region",{name:"Usage by site section"})).getByRole("table");
    const rows=within(table).getAllByRole("row");
    expect(rows.length).toBe(ANALYTICS_PAGE_CATALOG.filter(row=>row.kind!=="legacy").length+2);
    expect(rows[1]).toHaveTextContent("Rosters (legacy combined)");
    expect(screen.getByRole("rowheader",{name:/Tip Jar/})).toBeInTheDocument();
    expect(screen.getByRole("rowheader",{name:/Mr. Boni/})).toBeInTheDocument();
    expect(screen.getByText(/Older combined totals stay/)).toBeInTheDocument();
  });
  it("does not turn unmeasured mini games into zero views", () => {
    render(<AnalyticsPageRankings data={withPageDetail(makeCalendarAnalytics("month","2026-10"))}/>);
    const tip=screen.getByRole("rowheader",{name:/Tip Jar/}).parentElement;
    expect(tip).toHaveTextContent("Not measured");
    expect(within(tip).getAllByRole("cell").every(cell=>cell.textContent==="—")).toBe(true);
  });
});

describe("Product chart views", () => {
  it("keeps combined gameplay and separates the actual Leago and Daily totals", async () => {
    const rows=[{weekStartDate:"2026-11-16",completedTrades:2,resolvedAuctions:3,rosterChanges:4,dailyDrafts:5}];
    render(<WeeklyGameplayChart rows={rows}/>);
    expect(screen.getByRole("img",{name:/Weekly activity totals stacked/})).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button",{name:"Leago / Daily"}));
    expect(screen.getByRole("img",{name:/shown separately/})).toBeInTheDocument();
    const row=within(screen.getByRole("table",{name:"Weekly gameplay by product"})).getAllByRole("row")[1];
    expect(within(row).getAllByRole("cell").map(cell=>cell.textContent)).toEqual(["9","5"]);
    await userEvent.click(screen.getByRole("button",{name:"Combined"}));
    expect(screen.queryByRole("table",{name:"Weekly gameplay by product"})).not.toBeInTheDocument();
  });
  it("keeps unavailable Daily gameplay distinct from zero", async () => {
    render(<WeeklyGameplayChart rows={[{weekStartDate:"2026-11-16",completedTrades:2,resolvedAuctions:0,rosterChanges:0,dailyDrafts:null}]}/>);
    await userEvent.click(screen.getByRole("button",{name:"Leago / Daily"}));
    expect(within(screen.getByRole("table",{name:"Weekly gameplay by product"})).getByText("Unavailable")).toBeInTheDocument();
  });
  it("shows shared pages separately in product traffic", () => {
    const data=withPageDetail(adminAnalyticsFixture({days:7}));
    render(<TrafficProductChart rows={data.pageDetail.dailyProducts} measured={()=>true}/>);
    expect(screen.getByRole("img",{name:/Hundo Leago, Hundo Daily and shared pages/})).toBeInTheDocument();
    expect(screen.getByText("Shared pages")).toBeInTheDocument();
  });
});

describe("Compact hockey calendar", () => {
  const day=(date,extra={})=>({date,recordedNhlGames:2,dailyDrafts:1,matchupDeadlines:0,auctionDeadlines:0,tradeDeadlines:0,...extra});
  it("shows only real deadline dates and keeps daily details collapsible", async () => {
    render(<AnalyticsCalendarContext calendar={{days:[day("2026-11-16"),day("2026-11-17",{tradeDeadlines:1}),day("2026-11-22",{auctionDeadlines:3})]}}/>);
    expect(screen.getAllByText("Auctions")).toHaveLength(1);
    expect(within(screen.getByRole("list")).getByText("Sun, Nov 22")).toBeInTheDocument();
    expect(within(screen.getByRole("list")).getByText("Tue, Nov 17")).toBeInTheDocument();
    expect(screen.getByRole("table")).not.toBeVisible();
    await userEvent.click(screen.getByText("Daily hockey & draft details"));
    const table=screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map(cell=>cell.textContent)).toEqual(["Day · UTC−8","NHL games","Daily drafts"]);
    expect(within(table).queryByText("Auction deadlines")).not.toBeInTheDocument();
  });
  it("preserves unknown evidence in weekly summaries", () => {
    render(<AnalyticsCalendarContext calendar={{days:[day("2026-11-16",{recordedNhlGames:null,dailyDrafts:null}),day("2026-11-17",{dailyDrafts:null})]}}/>);
    expect(screen.getByText("1 day unknown")).toBeInTheDocument();
    expect(screen.getAllByText("Unknown")[0]).toBeVisible();
    expect(screen.getByText("No deadlines recorded this week.")).toBeInTheDocument();
  });
});

describe("Clickable health integration", () => {
  it("fetches details only when a count is expanded and restores focus on close", async () => {
    const data=adminAnalyticsFixture();
    const request=vi.fn(async(path,options)=>{
      const group=new URL(path,"https://test.invalid").searchParams.get("group");
      const response=analyticsHealthFixture({group,period:data.period,total:1});
      options.validateData(response); return {data:response};
    });
    const client=createQueryClient();
    render(<QueryClientProvider client={client}><SessionContext.Provider value={{status:"authenticated",user:{id:"synthetic-admin"},httpClient:{request}}}><Freshness data={data} asOfMs={Date.parse("2026-11-27T20:00:00Z")}/></SessionContext.Provider></QueryClientProvider>);
    expect(request).not.toHaveBeenCalled();
    const button=screen.getByRole("button",{name:/Failed jobs: 1. View details/});
    await userEvent.click(button);
    await waitFor(()=>expect(request).toHaveBeenCalledTimes(1));
    expect(button).toHaveAttribute("aria-expanded","true");
    expect(await screen.findByText("Insufficient backup space")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button",{name:/Close/}));
    expect(button).toHaveAttribute("aria-expanded","false");
    expect(button).toHaveFocus();
  });
});
