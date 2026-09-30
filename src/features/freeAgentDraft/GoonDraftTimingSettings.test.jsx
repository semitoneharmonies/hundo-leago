import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { SessionContext } from "../session/sessionContext.js";
import { GoonDraftTimingSettings } from "./GoonDraftTimingSettings.jsx";

it("reads without writing and saves the commissioner-selected cutoff with the observed version", async () => {
  const leagueId="48e59cfb-b12d-4dfb-ae1a-4d8b3512ef03",fadId="e0293267-4215-42d6-b86e-8115e9cdba8c";
  const initial={leagueId,fadId,version:6,rolloverIntervalMinutes:15,auctionCreationCutoffMinutes:0,editable:true};
  const request=vi.fn(async (_path, options) => ({data:options?.method === "PUT" ? {...initial,...options.body,version:7} : initial}));
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>
    <SessionContext.Provider value={{httpClient:{request}}}><GoonDraftTimingSettings leagueId={leagueId} fadId={fadId}/></SessionContext.Provider>
  </QueryClientProvider>);
  const input=await screen.findByLabelText("Stop new auctions this many minutes before rollover");
  expect(request).toHaveBeenCalledTimes(1);
  const user=userEvent.setup();await user.clear(input);await user.type(input,"3");
  await user.click(screen.getByRole("button",{name:"Save timing options"}));
  await screen.findByText("Timing options saved.");
  expect(request.mock.calls[1][0]).toBe(`/api/v1/leagues/${leagueId}/free-agent-drafts/${fadId}/timing-settings`);
  expect(request.mock.calls[1][1]).toEqual({method:"PUT",authenticated:true,dataKind:"object",version:6,body:{rolloverIntervalMinutes:15,auctionCreationCutoffMinutes:3}});
  await waitFor(()=>expect(screen.getByRole("button",{name:"Save timing options"})).toBeEnabled());
});
