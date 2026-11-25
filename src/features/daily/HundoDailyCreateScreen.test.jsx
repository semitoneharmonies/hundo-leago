import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { DailyCreateScreen, RoomCard } from "./HundoDailyRoomScreens.jsx";
import { formatDay, formatTime } from "./dailyApi.js";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => vi.restoreAllMocks());

const startsAt = "2026-11-25T03:15:00.000Z";
const firstGameAt = "2026-11-26T00:00:00.000Z";
const date = "2026-11-25";
const label = value => formatDay(value) + " · " + formatTime(value);

it("distinguishes tonight's auction from tomorrow's game day and requires tomorrow confirmation", () => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-25T03:00:00Z"));
  const onCreate = vi.fn();
  render(<DailyCreateScreen today="2026-11-24" initialDate={date} viewer={{ id: "host", displayName: "Host" }}
    options={[{ date, day: "tomorrow", status: "open", firstGameAt,
      auctionStartOptions: [startsAt, "2026-11-25T23:30:00.000Z"] }]} onCreate={onCreate} onCancel={() => {}}/>);
  expect(screen.getByRole("option", { name: label(startsAt) })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: label("2026-11-25T23:30:00.000Z") })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Room name"), { target: { value: "Draft tonight" } });
  fireEvent.change(screen.getByLabelText("Auction start time"), { target: { value: startsAt } });
  const preview = screen.getByRole("complementary", { name: "Room preview" });
  expect(preview).toHaveTextContent('Every $1 unspent adds 0.25% to positive team FP. A $60 roster gets a 10% boost.');
  expect(within(preview).getByText(label(startsAt))).toBeVisible();
  expect(within(preview).getByText(label(firstGameAt))).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Create room" }));
  expect(onCreate).not.toHaveBeenCalled();
  const dialog = screen.getByRole("dialog", { name: "Create a room for tomorrow?" });
  expect(within(dialog).getByText("tomorrow’s slate of games")).toBeVisible();
  expect(within(dialog).getByText(label(startsAt))).toBeVisible();
  fireEvent.click(within(dialog).getByRole("button", { name: "Create tomorrow’s room" }));
  expect(onCreate).toHaveBeenCalledWith({ name: "Draft tonight", capacity: 8, slateDate: date,
    auctionStartsAt: startsAt, allowSpectatorChat: false, capSavingsBonus: true }, expect.any(String));
});

it("keeps spectator chat off by default and binds an enabled choice to the creation request", () => {
  const onCreate = vi.fn();
  render(<DailyCreateScreen today="2026-11-24" initialDate="2026-11-24" practice
    practiceSlate={{ date: "2026-11-24", status: "available", firstGameAt }}
    viewer={{ displayName: "Host" }} onCreate={onCreate} onCancel={() => {}}/>);
  const choice = screen.getByRole("checkbox", { name: "Allow spectators in chat" });
  expect(choice).not.toBeChecked();
  expect(screen.getByRole("complementary", { name: "Room preview" })).toHaveTextContent("Members only");
  fireEvent.change(screen.getByLabelText("Room name"), { target: { value: "Watch party" } });
  fireEvent.click(screen.getByRole("button", { name: "Start practice room" }));
  expect(onCreate.mock.calls[0][0]).toMatchObject({ allowSpectatorChat: false, mode: "practice" });
  fireEvent.click(choice);
  expect(choice).toBeChecked();
  expect(screen.getByRole("complementary", { name: "Room preview" })).toHaveTextContent("Members and spectators");
  fireEvent.click(screen.getByRole("button", { name: "Start practice room" }));
  expect(onCreate.mock.calls[1][0]).toMatchObject({ allowSpectatorChat: true, mode: "practice" });
  expect(onCreate.mock.calls[1][1]).not.toBe(onCreate.mock.calls[0][1]);
});

it("labels a lobby room with the auction's actual date when its games are tomorrow", () => {
  render(<MemoryRouter><RoomCard slate={{ date }} viewer={{ id: "host" }} onJoin={() => {}}
    room={{ id: "room", name: "Draft tonight", date, firstGameAt, auctionStartsAt: startsAt,
      phase: "waiting", capacity: 4, memberCount: 1, commissionerName: "Host", joined: true }}/></MemoryRouter>);
  expect(screen.getByText("Auction · " + formatDay(startsAt))).toBeVisible();
  expect(screen.queryByText("Auction · " + formatDay(firstGameAt))).toBeNull();
});

it('lets the creator disable the bonus and changes the creation retry key with the rule',()=>{
 const onCreate=vi.fn();
 render(<DailyCreateScreen today="2026-11-24" initialDate="2026-11-24" practice practiceSlate={{date:'2026-11-24',status:'available',firstGameAt}} onCreate={onCreate} onCancel={()=>{}}/>);
 const choice=screen.getByRole('checkbox',{name:'Use cap savings bonus'});
 expect(choice).toBeChecked();
 fireEvent.change(screen.getByLabelText('Room name'),{target:{value:'Choice room'}});
 fireEvent.click(screen.getByRole('button',{name:'Start practice room'}));
 expect(onCreate.mock.calls[0][0].capSavingsBonus).toBe(true);
 fireEvent.click(choice);
 expect(screen.getByRole('complementary',{name:'Room preview'})).toHaveTextContent('Team score uses hockey FP only.');
 fireEvent.click(screen.getByRole('button',{name:'Start practice room'}));
 expect(onCreate.mock.calls[1][0].capSavingsBonus).toBe(false);
 expect(onCreate.mock.calls[1][1]).not.toBe(onCreate.mock.calls[0][1]);
});
it('labels bonus-on, bonus-off and legacy lobby rooms before joining',()=>{
 const base={date,firstGameAt,auctionStartsAt:startsAt,phase:'waiting',capacity:4,memberCount:1};
 render(<MemoryRouter>{[.25,0,undefined].map((rate,i)=><RoomCard key={i} viewer={{id:"viewer"}} room={{...base,id:String(i),name:'Room '+i,capBonusRatePercent:rate}} onJoin={()=>{}}/>)}</MemoryRouter>);
 expect(screen.getByText('Cap bonus on · 0.25%/$1 saved')).toBeVisible();
 expect(screen.getAllByText('Cap bonus off')).toHaveLength(2);
});
