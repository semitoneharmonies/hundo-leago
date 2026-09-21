import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { PendingLeagueAccess } from "./NotificationsPage.jsx";

const assignmentId="11111111-1111-4111-8111-111111111111",leagueId="22222222-2222-4222-8222-222222222222";
const data=status=>({code:"COMMISSIONER_ASSIGNMENT_FOUND",assignment:{id:assignmentId,status,version:1},league:{id:leagueId,name:"New League"}});
const config={appEnv:"local",apiOrigin:"http://localhost:4000",socketOrigin:null,buildId:null};
function fixture({decide,read}={}){
  let status="pending";const writes=[],reads=[];
  const request=vi.fn(async(path,options={})=>{
    if(path.startsWith("/api/v1/notifications?"))return{data:{code:"NOTIFICATIONS_FOUND",notifications:[],page:{limit:25,nextCursor:null}}};
    let result;
    if(options.method==="POST") {writes.push(path);result=decide?await decide(path):data(path.endsWith("/accept")?"accepted":"declined");if(result?.assignment)status=result.assignment.status;}
    else {reads.push(path);result=read?await read(status):data(status);}
    options.validateData?.(result);return{data:result};
  });
  const session={status:"authenticated",httpClient:{request},user:{id:"33333333-3333-4333-8333-333333333333"}};
  return {...renderWithProviders(<PendingLeagueAccess session={session}/>,{config,initialEntries:["/leagues?assignmentId="+assignmentId]}),writes,reads,setStatus:value=>{status=value;}};
}
describe("commissioner decision recovery",()=>{
  it("offers decline and confirms it without accepting the role",async()=>{
    const view=fixture();await view.user.click(await screen.findByRole("button",{name:"Decline commissioner role"}));
    await screen.findByText("Commissioner invitation declined.");expect(view.writes).toEqual([`/api/v1/commissioner-assignments/${assignmentId}/decline`]);expect(screen.queryByRole("link",{name:"Continue league setup"})).not.toBeInTheDocument();
  });
  it.each(["accept","decline"])("locks both decisions while %s is pending",async decision=>{
    let release;const held=new Promise(r=>release=r),view=fixture({decide:async()=>{await held;return data(decision==="accept"?"accepted":"declined");}});
    const accept=await screen.findByRole("button",{name:"Accept commissioner role"}),decline=screen.getByRole("button",{name:"Decline commissioner role"});
    fireEvent.click(decision==="accept"?accept:decline);await waitFor(()=>expect(view.writes).toHaveLength(1));
    try{expect(accept).toBeDisabled();expect(decline).toBeDisabled();fireEvent.click(accept);fireEvent.click(decline);expect(view.writes).toHaveLength(1);}finally{await act(async()=>release());}
  });
  it.each(["accepted","declined"])("refreshes a pending invitation without a socket event and stops polling after %s",async status=>{
    vi.useFakeTimers();let view;try{
      view=fixture();await act(async()=>{await vi.advanceTimersByTimeAsync(50);});
      expect(screen.getByRole("button",{name:"Accept commissioner role"})).toBeVisible();
      view.setStatus(status);await act(async()=>{await vi.advanceTimersByTimeAsync(15001);});
      expect(screen.getByText(status==="accepted"?"Commissioner role accepted.":"Commissioner invitation declined.")).toBeVisible();
      expect(screen.queryByRole("button",{name:"Accept commissioner role"})).not.toBeInTheDocument();
      const count=view.reads.length;expect(count).toBeGreaterThan(1);
      await act(async()=>{await vi.advanceTimersByTimeAsync(30001);});expect(view.reads).toHaveLength(count);expect(view.writes).toHaveLength(0);
    }finally{view?.unmount();vi.useRealTimers();}
  });
  it.each([undefined,data("pending"),data("declined")])("does not confirm an invalid acceptance response: %j",async result=>{
    const view=fixture({decide:()=>result});await view.user.click(await screen.findByRole("button",{name:"Accept commissioner role"}));
    await screen.findByText("Your commissioner response could not be confirmed.");expect(screen.queryByText("Commissioner role accepted.")).not.toBeInTheDocument();
  });
  it("retains a confirmed decision when the later assignment read fails",async()=>{
    const view=fixture({read:status=>{if(status!=="pending")throw new Error("Controlled read failure");return data(status);}});
    await view.user.click(await screen.findByRole("button",{name:"Accept commissioner role"}));await screen.findByText("Commissioner role accepted.");
    await act(async()=>view.queryClient.invalidateQueries({queryKey:["notifications"]}));expect(screen.getByText("Commissioner role accepted.")).toBeVisible();
  });
  it("clears uncertain decision feedback after a later status read confirms acceptance",async()=>{
    vi.useFakeTimers();let view;try{
      view=fixture({decide:()=>{throw new Error("Lost response");}});
      await act(async()=>{await vi.advanceTimersByTimeAsync(50);});fireEvent.click(screen.getByRole("button",{name:"Accept commissioner role"}));
      await act(async()=>{await vi.advanceTimersByTimeAsync(50);});expect(screen.getByText("Your commissioner response could not be confirmed.")).toBeVisible();
      view.setStatus("accepted");await act(async()=>{await vi.advanceTimersByTimeAsync(15001);});
      expect(screen.getByText("Commissioner role accepted.")).toBeVisible();expect(screen.queryByText("Your commissioner response could not be confirmed.")).not.toBeInTheDocument();expect(view.writes).toHaveLength(1);
    }finally{view?.unmount();vi.useRealTimers();}
  });
});
