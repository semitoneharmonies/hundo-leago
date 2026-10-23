import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TeamMark } from "../../components/HundoUi.jsx";
import { renderWithProviders } from "../../test/render.jsx";
import { DEFAULT_TWO_TEAM_PATTERN } from "../../shared/teamPatternCatalog.js";
import { AccountSettingsPage } from "./AccountSettingsPage.jsx";

vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const id=n=>`44444444-4444-4444-8444-${String(n).padStart(12,"0")}`, userId=id(1), leagueId=id(2), teamId=id(3);
const config={appEnv:"local",apiOrigin:"http://localhost:4000",socketOrigin:"http://localhost:4000",buildId:null};
const json=(data,status=200)=>new Response(JSON.stringify(status===200?{data,meta:{requestId:"team-profile-recovery"}}:{error:{...data,requestId:"team-profile-recovery"}}),{status,headers:{"Content-Type":"application/json"}});
const rejected=(code,status)=>json({code,message:"Internal diagnostic must remain private."},status);
const initialTeam={id:teamId,leagueId,name:"Original Team",version:1,status:"active",primaryColour:"#112233",secondaryColour:"#445566",tertiaryColour:null,patternTemplate:DEFAULT_TWO_TEAM_PATTERN,logoReference:null,currentManager:{assignmentId:id(4),userId,displayName:"Team Manager",version:1}};
function fixture({patch,readTeams}={}){
  let team={...initialTeam}, reads=0;const writes=[];
  const user={id:userId,email:"team-manager@example.test",displayName:"Team Manager",status:"active",version:1},league={id:leagueId,name:"Profile League",version:1,status:"active",currentSeason:null,membership:{id:id(5),version:1,status:"active",permissionCategory:"manager"}};
  const fetchImpl=vi.fn(async(url,options={})=>{const pathname=new URL(url).pathname;
    if(pathname==="/api/v1/session")return json({csrfToken:"T".repeat(43),user,session:{id:"team-session",userId,status:"active",version:1,createdAtMs:1,lastUsedAtMs:1,idleExpiresAtMs:2,absoluteExpiresAtMs:3}});
    if(pathname==="/api/v1/account")return json({code:"ACCOUNT_PROFILE_FOUND",user});
    if(pathname==="/api/v1/leagues")return json({code:"LEAGUES_FOUND",leagues:[league]});
    if(pathname===`/api/v1/leagues/${leagueId}/teams`){reads++;if(readTeams)return readTeams(reads,()=>team);return json({code:"TEAMS_FOUND",teams:[team]});}
    if(pathname===`/api/v1/leagues/${leagueId}/teams/${teamId}`&&options.method==="PATCH"){
      const headers=new Headers(options.headers),write={body:JSON.parse(options.body),version:headers.get("If-Match"),intent:headers.get("Idempotency-Key")};writes.push(write);
      if(patch)return patch(write,()=>team,value=>{team=value;});
      const {logo,...fields}=write.body;team={...team,...fields,version:team.version+1,...(logo!==undefined?{logoReference:logo===null?null:`/api/v1/leagues/${leagueId}/teams/${teamId}/logo`}:{})};return json({code:"TEAM_PROFILE_UPDATED",team});
    }
    throw new Error("Unexpected team settings request: "+pathname);
  });
  const view=renderWithProviders(<Routes><Route path="/account" element={<AccountSettingsPage/>}/></Routes>,{initialEntries:["/account"],enableSession:true,config,sessionOptions:{fetchImpl}});
  return {...view,writes,get reads(){return reads;},get team(){return team;},setTeam:value=>{team={...team,...value};}};
}
async function teamForm(){const input=await screen.findByLabelText("Team name");return{input,form:input.closest("form"),save:screen.getByRole("button",{name:"Save team profile"})};}
afterEach(()=>vi.unstubAllGlobals());

describe("team profile draft and response recovery",()=>{
  it("keeps every populated league cache entry private after saving",async()=>{
    const view=fixture(),{input,form}=await teamForm();fireEvent.change(input,{target:{value:"Private Team"}});fireEvent.submit(form);await screen.findByText("Team profile saved.");
    const populated=view.queryClient.getQueryCache().findAll({predicate:query=>query.queryKey[0]==="league"&&query.state.data!==undefined});
    expect(populated.length).toBeGreaterThan(0);for(const query of populated)expect(query.meta?.private).toBe(true);
  });
  it("accepts the full35 Unicode code points without browser truncation",async()=>{
    const view=fixture(),{input,save}=await teamForm();await view.user.clear(input);await view.user.type(input,"🙂".repeat(35));expect(input).toHaveValue("🙂".repeat(35));await view.user.click(save);await screen.findByText("Team profile saved.");expect(view.writes[0].body.name).toBe("🙂".repeat(35));
  });
  it.each([" ","x".repeat(36),"Team\u0001Name"])("rejects an invalid name without a write: %s",async value=>{
    const view=fixture(),{input,form,save}=await teamForm();fireEvent.change(input,{target:{value}});fireEvent.submit(form);await act(async()=>{});expect(view.writes).toHaveLength(0);expect(input).toHaveAttribute("aria-invalid","true");expect(save).toBeDisabled();
  });
  it("locks every editable control and prevents another pending submission",async()=>{
    let release;const pending=new Promise(r=>release=r);const view=fixture({patch:async(write,get,set)=>{await pending;set({...get(),...write.body,version:2});return json({code:"TEAM_PROFILE_UPDATED",team:get()});}}),{input,form}=await teamForm();fireEvent.change(input,{target:{value:"Saved Team"}});fireEvent.submit(form);await waitFor(()=>expect(view.writes).toHaveLength(1));for(const control of form.querySelectorAll("input,select"))expect(control).toBeDisabled();fireEvent.submit(form);await act(async()=>{});expect(view.writes).toHaveLength(1);await act(async()=>release());await screen.findByText("Team profile saved.");expect(input).toHaveValue("Saved Team");
  });
  it("refreshes stale team data, keeps the draft and retries with the new version",async()=>{
    const view=fixture({patch:async(write,get,set)=>{if(write.version!=='"2"')return rejected("PRECONDITION_FAILED",412);set({...get(),...write.body,version:3});return json({code:"TEAM_PROFILE_UPDATED",team:get()});}}),{input,form}=await teamForm();fireEvent.change(input,{target:{value:"My Team Draft"}});view.setTeam({name:"Other Tab Team",version:2,primaryColour:"#abcdef"});fireEvent.submit(form);await screen.findByText("The saved team profile was refreshed. Your entries are still here. Review them and save again.");expect(input).toHaveValue("My Team Draft");fireEvent.submit(form);await screen.findByText("Team profile saved.");expect(view.writes.map(w=>w.version)).toEqual(['"1"','"2"']);expect(view.writes[1].body.primaryColour).toBe("#abcdef");
  });
  it("keeps the draft visible and does not claim refresh succeeded when the read fails",async()=>{
    const view=fixture({patch:async()=>rejected("PRECONDITION_FAILED",412),readTeams:async(reads,get)=>reads===1?json({code:"TEAMS_FOUND",teams:[get()]}):rejected("TEAM_READ_UNAVAILABLE",503)}),{input,form}=await teamForm();fireEvent.change(input,{target:{value:"Keep This Draft"}});fireEvent.submit(form);await screen.findByText("We could not refresh the saved team profile. Your entries are still here. Try saving again when the connection is restored.",{}, {timeout:3000});expect(screen.getByLabelText("Team name")).toHaveValue("Keep This Draft");expect(view.writes).toHaveLength(1);expect(screen.queryByText("Team profile saved.")).not.toBeInTheDocument();
  });
  it("explains an unavailable team name without exposing diagnostics or discarding entries",async()=>{
    const view=fixture({patch:async()=>rejected("TEAM_NAME_UNAVAILABLE",409)}),{input,form}=await teamForm();fireEvent.change(input,{target:{value:"Taken Team"}});fireEvent.submit(form);await screen.findByText("That team name is unavailable in this league.");expect(screen.getByText("Choose another team name and save again.")).toBeInTheDocument();expect(input).toHaveValue("Taken Team");expect(screen.queryByText(/Internal diagnostic/)).not.toBeInTheDocument();expect(view.writes).toHaveLength(1);
  });
  it.each([
    {},{code:"TEAM_PROFILE_UPDATED"},{code:"OTHER_RESULT",team:{...initialTeam,version:2}},
    {code:"TEAM_PROFILE_UPDATED",team:{...initialTeam,id:id(91),version:2}},
    {code:"TEAM_PROFILE_UPDATED",team:{...initialTeam,leagueId:id(92),version:2}},
    {code:"TEAM_PROFILE_UPDATED",team:{...initialTeam,version:1}},
  ])("rejects an unconfirmed or wrong-scope success: %j",async data=>{
    const view=fixture({patch:async()=>json(data)}),{input,form}=await teamForm();fireEvent.change(input,{target:{value:"Keep Team"}});fireEvent.submit(form);await screen.findByText("We could not confirm the team profile update.");expect(screen.queryByText("Team profile saved.")).not.toBeInTheDocument();expect(input).toHaveValue("Keep Team");expect(view.writes).toHaveLength(1);
  });
  it("rejects an empty204 instead of reporting the profile saved",async()=>{
    fixture({patch:async()=>new Response(null,{status:204})});const {input,form}=await teamForm();fireEvent.change(input,{target:{value:"Keep Team"}});fireEvent.submit(form);await screen.findByText("We could not confirm the team profile update.");expect(input).toHaveValue("Keep Team");expect(screen.queryByText("Team profile saved.")).not.toBeInTheDocument();
  });
  it("retains the confirmed saved profile when the following refresh fails",async()=>{
    const view=fixture({readTeams:async(reads,get)=>reads===1?json({code:"TEAMS_FOUND",teams:[get()]}):rejected("TEAM_READ_UNAVAILABLE",503)}),{input,form}=await teamForm();fireEvent.change(input,{target:{value:"Confirmed Team"}});fireEvent.submit(form);await screen.findByText("Team profile saved.");await screen.findByText("The account request could not be completed.",{}, {timeout:3000});expect(screen.getByLabelText("Team name")).toHaveValue("Confirmed Team");expect(view.queryClient.getQueryData(["league",leagueId,"teams"])[0].version).toBe(2);
  });
  it.each([["image/svg+xml",4],["image/png",524289]])("rejects unsupported or oversized selected logo before saving: %s",async(type,size)=>{
    const view=fixture(),{form}=await teamForm(),file=new File([new Uint8Array(size)],"invalid-logo",{type});fireEvent.change(within(form).getByLabelText("Team logo"),{target:{files:[file]}});fireEvent.submit(form);await screen.findByText("Choose a PNG, JPEG, or WebP image no larger than 512 KB.");expect(view.writes).toHaveLength(0);
  });
  it("clears the saved logo file input and releases its temporary preview",async()=>{
    const create=vi.fn(()=>"blob:team-logo-preview"),revoke=vi.fn();vi.stubGlobal("URL",class extends URL {static createObjectURL=create;static revokeObjectURL=revoke;});
    const view=fixture(),{form}=await teamForm(),fileInput=within(form).getByLabelText("Team logo");await view.user.upload(fileInput,new File(["fixture"],"logo.png",{type:"image/png"}));expect(fileInput.files).toHaveLength(1);fireEvent.submit(form);await screen.findByText("Team profile saved.");expect(within(form).getByLabelText("Team logo").files).toHaveLength(0);expect(revoke).toHaveBeenCalledWith("blob:team-logo-preview");expect(view.writes[0].body.logo.mediaType).toBe("image/png");
  });
});

describe("current team-logo rendering",()=>{
  it("requests the newer team version and recovers an earlier failed image",()=>{
    const url="http://localhost:4000/api/v1/leagues/league/teams/team/logo",view=render(<TeamMark team={initialTeam} logoUrl={url}/>);let img=view.container.querySelector("img");expect(img.src).toBe(url+"?v=1");fireEvent.error(img);expect(img.hidden).toBe(true);view.rerender(<TeamMark team={{...initialTeam,version:2}} logoUrl={url}/>);img=view.container.querySelector("img");expect(img.src).toBe(url+"?v=2");expect(img.hidden).toBe(false);
  });
  it("keeps selected blob previews unchanged",()=>{const view=render(<TeamMark team={initialTeam} logoUrl="blob:chosen-logo"/>);expect(view.container.querySelector("img").getAttribute("src")).toBe("blob:chosen-logo");});
});
