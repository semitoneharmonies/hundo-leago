import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { LeagueSelectionPage } from "./LeaguePages.jsx";

vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const id = n => `${String(n).padStart(8, "0")}-1111-4111-8111-111111111111`;
const adminId=id(1), candidateId=id(2), otherUserId=id(3), firstId=id(4), secondId=id(5), createdId=id(6), seasonId=id(7);
const config={appEnv:"local",apiOrigin:"http://localhost:4000",socketOrigin:"http://localhost:4000",buildId:null};
const json=data=>new Response(JSON.stringify({data,meta:{requestId:"admin-recovery"}}),{status:200,headers:{"Content-Type":"application/json"}});
const rejected=(code,status=503)=>new Response(JSON.stringify({error:{code,message:"Internal diagnostic must not be displayed.",requestId:"admin-rejected"}}),{status,headers:{"Content-Type":"application/json"}});
const league=(leagueId,name)=>({id:leagueId,name,status:"setup",timezone:"America/Vancouver",currentSeason:null,membership:{id:id(90),permissionCategory:"member",effectiveAuthority:"platform_administrator",status:"active",version:1},version:1});
const created=name=>({code:"LEAGUE_CREATED",league:{id:createdId,name,status:"setup",timezone:"America/Vancouver",currentSeasonId:seasonId,version:1},season:{id:seasonId,label:"2026",nhlSeasonKey:"20262027",status:"planned",version:1}});
const proposed=(leagueId=firstId,userId=candidateId,status="pending")=>({code:"COMMISSIONER_ASSIGNMENT_PROPOSED",assignment:{id:id(8),status,version:1},league:{id:leagueId,name:leagueId===firstId?"First League":"Second League",status:"setup",version:1},proposedUser:{id:userId,displayName:userId===candidateId?"First Candidate":"Other Candidate"}});
function fixture({create,assign,readLeagues,readMemberships}={}) {
  const writes=[];let reads=0;
  const fetchImpl=vi.fn(async(url,options={})=>{
    const p=new URL(url).pathname;
    if(p==="/api/v1/session")return json({csrfToken:"D".repeat(43),session:{id:id(20),userId:adminId,status:"active",createdAtMs:1,lastUsedAtMs:1,idleExpiresAtMs:2,absoluteExpiresAtMs:3,version:1},user:{id:adminId,displayName:"Local Administrator",status:"active",version:1}});
    if(p==="/api/v1/admin/users")return json({code:"ADMIN_USERS_FOUND",users:[{id:adminId,displayName:"Local Administrator",email:"admin@example.test",status:"active",isPlatformAdministrator:true},{id:candidateId,displayName:"First Candidate",email:"first@example.test",status:"active",isPlatformAdministrator:false},{id:otherUserId,displayName:"Other Candidate",email:"other@example.test",status:"active",isPlatformAdministrator:false}]});
    if(p==="/api/v1/leagues"){reads++;return readLeagues?readLeagues(reads):json({code:"LEAGUES_FOUND",leagues:[league(firstId,"First League"),league(secondId,"Second League")]});}
    if(p==="/api/v1/notifications")return json({code:"NOTIFICATIONS_FOUND",notifications:[],page:{limit:25,nextCursor:null}});
    if(p.endsWith("/memberships"))return readMemberships?readMemberships():json({code:"LEAGUE_MEMBERSHIPS_FOUND",memberships:[]});
    if(options.method==="POST"){
      const write={path:p,body:JSON.parse(options.body),key:new Headers(options.headers).get("Idempotency-Key")};writes.push(write);
      if(p==="/api/v1/admin/leagues")return create?create(write,writes.length):json(created(write.body.name));
      if(p.endsWith("/commissioner-assignments"))return assign?assign(write,writes.length):json(proposed(p.split("/")[5],write.body.userId));
    }
    throw new Error("Unexpected administrator request: "+p);
  });
  const view=renderWithProviders(<Routes><Route path="/leagues" element={<LeagueSelectionPage/>}/></Routes>,{initialEntries:["/leagues"],enableSession:true,config,sessionOptions:{fetchImpl}});
  return {...view,writes,fetchImpl};
}
async function creation(){const input=await screen.findByRole("textbox",{name:"League name"});return{input,form:input.closest("form")};}
async function assignment(view){await view.user.selectOptions(await screen.findByRole("combobox",{name:"League to manage"}),firstId);const select=await screen.findByRole("combobox",{name:"Commissioner",exact:true});await view.user.selectOptions(select,candidateId);return{select,form:select.closest("form")};}
const waitWrite=view=>waitFor(()=>expect(view.writes).toHaveLength(1));

describe("administrator league creation recovery",()=>{
  it("locks related inputs and blocks another submission while creation is pending",async()=>{
    let release;const held=new Promise(r=>release=r),view=fixture({create:async w=>{await held;return json(created(w.body.name));}}),{input,form}=await creation();
    fireEvent.change(input,{target:{value:"New League"}});fireEvent.submit(form);await waitWrite(view);
    try{expect(input).toBeDisabled();expect(screen.getByRole("combobox",{name:"League to manage"})).toBeDisabled();fireEvent.submit(form);await act(async()=>{});expect(view.writes).toHaveLength(1);}finally{await act(async()=>release());}
  });
  it("rejects a whitespace-only programmatic submission without a write",async()=>{const view=fixture(),{input,form}=await creation();fireEvent.change(input,{target:{value:"  "}});fireEvent.submit(form);await act(async()=>{});expect(view.writes).toHaveLength(0);});
  it("reuses the same creation intent after an uncertain response",async()=>{
    const view=fixture({create:(w,n)=>n===1?rejected("SERVER_UNAVAILABLE"):json(created(w.body.name))}),{input,form}=await creation();fireEvent.change(input,{target:{value:"Retry League"}});fireEvent.submit(form);
    await screen.findByText("We could not confirm whether the league was created.");expect(input).toHaveValue("Retry League");fireEvent.submit(form);await screen.findByText("Retry League was created. Choose its commissioner below.");expect(view.writes).toHaveLength(2);expect(view.writes[0].key).toBeTruthy();expect(view.writes[1].key).toBe(view.writes[0].key);
  });
  it("uses a different intent for a changed league name",async()=>{
    const view=fixture({create:()=>rejected("LEAGUE_NAME_UNAVAILABLE",409)}),{input,form}=await creation();fireEvent.change(input,{target:{value:"Taken League"}});fireEvent.submit(form);await screen.findByText("That league name is already in use.");fireEvent.change(input,{target:{value:"Another League"}});fireEvent.submit(form);await waitFor(()=>expect(view.writes).toHaveLength(2));expect(view.writes[1].key).not.toBe(view.writes[0].key);expect(input).toHaveValue("Another League");
  });
  it.each([{}, {code:"OTHER_RESULT",...{league:created("Draft League").league}}, {...created("Draft League"),league:{...created("Draft League").league,id:"not-an-id"}},created("Wrong League"),{...created("Draft League"),season:{...created("Draft League").season,id:id(99)}}])("rejects an incomplete or contradictory creation acknowledgement: %j",async data=>{
    fixture({create:()=>json(data)});const {input,form}=await creation();fireEvent.change(input,{target:{value:"Draft League"}});fireEvent.submit(form);await screen.findByText("We could not confirm whether the league was created.");expect(input).toHaveValue("Draft League");expect(screen.queryByText(/was created\. Choose its commissioner/)).not.toBeInTheDocument();
  });
  it("rejects an empty204 creation acknowledgement",async()=>{fixture({create:()=>new Response(null,{status:204})});const {input,form}=await creation();fireEvent.change(input,{target:{value:"Draft League"}});fireEvent.submit(form);await screen.findByText("We could not confirm whether the league was created.");expect(input).toHaveValue("Draft League");});
  it("preserves a confirmed creation and the form when the background league read fails",async()=>{
    fixture({readLeagues:n=>n===1?json({code:"LEAGUES_FOUND",leagues:[league(firstId,"First League")]}):rejected("LEAGUES_UNAVAILABLE")});const {input,form}=await creation();fireEvent.change(input,{target:{value:"Confirmed League"}});fireEvent.submit(form);await screen.findByText("Confirmed League was created. Choose its commissioner below.");await screen.findByText("The league request could not be completed.",{}, {timeout:3000});expect(screen.getByRole("heading",{name:"Set initial commissioner for Confirmed League"})).toBeInTheDocument();expect(screen.getByRole("combobox",{name:"League to manage"})).toHaveValue(createdId);
  });
});

describe("administrator commissioner proposal recovery",()=>{
  it("locks the recipient, league and creation form and prevents another pending proposal",async()=>{
    let release;const held=new Promise(r=>release=r),view=fixture({assign:async w=>{await held;return json(proposed(firstId,w.body.userId));}}),{select,form}=await assignment(view);fireEvent.submit(form);await waitWrite(view);
    try{expect(select).toBeDisabled();expect(screen.getByRole("combobox",{name:"League to manage"})).toBeDisabled();expect(screen.getByRole("textbox",{name:"League name"})).toBeDisabled();fireEvent.submit(form);await act(async()=>{});expect(view.writes).toHaveLength(1);}finally{await act(async()=>release());}
  });
  it("reuses the proposal intent after an uncertain response",async()=>{const view=fixture({assign:(w,n)=>n===1?rejected("SERVER_UNAVAILABLE"):json(proposed(firstId,w.body.userId))}),{form}=await assignment(view);fireEvent.submit(form);await screen.findByText("We could not confirm the commissioner assignment.");fireEvent.submit(form);await screen.findByText("Commissioner assignment sent to First Candidate. It becomes active after acceptance.");expect(view.writes).toHaveLength(2);expect(view.writes[1].key).toBe(view.writes[0].key);});
  it("can check the same uncertain proposal after the recipient becomes the current commissioner",async()=>{
    let accepted=false;
    const view=fixture({assign:(w,n)=>n===1?rejected("SERVER_UNAVAILABLE"):json(proposed(firstId,w.body.userId,"accepted")),readMemberships:()=>json({code:"LEAGUE_MEMBERSHIPS_FOUND",memberships:accepted?[{id:id(91),permissionCategory:"commissioner",status:"active",user:{id:candidateId,displayName:"First Candidate"},version:2}]:[]})}),{select,form}=await assignment(view);
    fireEvent.submit(form);await screen.findByText("We could not confirm the commissioner assignment.");accepted=true;
    await act(async()=>view.queryClient.invalidateQueries({queryKey:["league",firstId,"memberships"]}));
    await screen.findByText(/Current commissioner: First Candidate/);expect(select).toHaveValue(candidateId);
    fireEvent.submit(form);await screen.findByText("The earlier commissioner assignment for First Candidate is accepted.");
    expect(view.writes).toHaveLength(2);expect(view.writes[1].key).toBe(view.writes[0].key);expect(select).toHaveValue("");
    expect(within(select).queryByRole("option",{name:/First Candidate/})).not.toBeInTheDocument();
  });
  it("starts a new intent after choosing another recipient",async()=>{const view=fixture({assign:()=>rejected("COMMISSIONER_ASSIGNMENT_CONFLICT",409)}),{select,form}=await assignment(view);fireEvent.submit(form);await screen.findByText("The commissioner assignment could not be sent.");await view.user.selectOptions(select,otherUserId);fireEvent.submit(form);await waitFor(()=>expect(view.writes).toHaveLength(2));expect(view.writes[1].key).not.toBe(view.writes[0].key);});
  it.each([{}, {code:"COMMISSIONER_ASSIGNMENT_PROPOSED"},proposed(secondId),proposed(firstId,otherUserId),{...proposed(),assignment:{...proposed().assignment,status:"unknown"}}])("retains the selection after an invalid acknowledgement: %j",async data=>{const view=fixture({assign:()=>json(data)}),{select,form}=await assignment(view);fireEvent.submit(form);await screen.findByText("We could not confirm the commissioner assignment.");expect(select).toHaveValue(candidateId);expect(screen.queryByText(/Commissioner assignment sent to/)).not.toBeInTheDocument();});
  it("rejects an empty204 proposal acknowledgement",async()=>{const view=fixture({assign:()=>new Response(null,{status:204})}),{select,form}=await assignment(view);fireEvent.submit(form);await screen.findByText("We could not confirm the commissioner assignment.");expect(select).toHaveValue(candidateId);});
  it.each(["accepted","declined","expired"])("describes a replay whose assignment is already %s",async status=>{const view=fixture({assign:()=>json(proposed(firstId,candidateId,status))}),{form}=await assignment(view);fireEvent.submit(form);await screen.findByText(`The earlier commissioner assignment for First Candidate is ${status}.`);expect(screen.queryByText(/It becomes active after acceptance/)).not.toBeInTheDocument();});
  it("clears another league's proposal error when the selected league changes",async()=>{const view=fixture({assign:()=>rejected("COMMISSIONER_ASSIGNMENT_CONFLICT",409)}),{form}=await assignment(view);fireEvent.submit(form);await screen.findByText("The commissioner assignment could not be sent.");await view.user.selectOptions(screen.getByRole("combobox",{name:"League to manage"}),secondId);expect(screen.queryByText("The commissioner assignment could not be sent.")).not.toBeInTheDocument();});
  it("does not submit an empty recipient even through a programmatic form submission",async()=>{const view=fixture();await view.user.selectOptions(await screen.findByRole("combobox",{name:"League to manage"}),firstId);const select=await screen.findByRole("combobox",{name:"Commissioner",exact:true});fireEvent.submit(select.closest("form"));await act(async()=>{});expect(view.writes).toHaveLength(0);expect(within(select.closest("form")).getByRole("button")).toBeDisabled();});
});
