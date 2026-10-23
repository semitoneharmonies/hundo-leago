import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../../src/app/AppShell.jsx";
import { SessionContext } from "../../src/features/session/sessionContext.js";
import { createDesktopNavigationFixture } from "../../src/test/desktopNavigationFixture.js";
import "../../src/App.css";
import "../../src/styles/theme-a.css";

const fixture=createDesktopNavigationFixture();
const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});
const leaguePath=`/leagues/${fixture.leagues[0].id}`;

export function LoginPreview() {
  const [signedIn,setSignedIn]=useState(false);
  const session=signedIn?fixture.session:{...fixture.session,status:"anonymous",user:null};
  return <SessionContext.Provider value={session}><AppShell><Routes>
    <Route path="/" element={signedIn?<Navigate to={leaguePath} replace/>:<main><button onClick={()=>setSignedIn(true)}>Sign in as preview manager</button></main>}/>
    <Route path={leaguePath} element={<main className="hl-page"><h1>Signed-in dashboard</h1><Link to={`${leaguePath}/players`}>Open players</Link></main>}/>
    <Route path={`${leaguePath}/players`} element={<main className="hl-page"><h1>Players</h1></main>}/>
  </Routes></AppShell></SessionContext.Provider>;
}

createRoot(document.getElementById("root")).render(<StrictMode><HashRouter><QueryClientProvider client={queryClient}><LoginPreview/></QueryClientProvider></HashRouter></StrictMode>);
