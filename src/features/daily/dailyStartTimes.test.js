import { describe, expect, it } from "vitest";
import { dailyStartTimes } from "./dailyStartTimes.js";

describe("selectable Daily auction starts", () => {
  const now = Date.parse("2026-11-19T19:00:00Z");
  const slate = {status:"open",firstGameAt:"2026-11-20T00:00:00Z"};
  it("keeps future quarter hours that leave a full 30 minutes before puck drop", () => {
    expect(dailyStartTimes({...slate,auctionStartOptions:[
      "2026-11-19T23:30:00Z", "2026-11-19T19:30:00Z", "2026-11-19T19:30:00Z",
      "2026-11-19T19:00:00Z", "2026-11-19T23:45:00Z", "2026-11-19T19:31:00Z", "bad",
    ]},now)).toEqual(["2026-11-19T19:30:00Z","2026-11-19T23:30:00Z"]);
  });
  it("offers no slots for locked/unavailable days and respects an explicitly empty list", () => {
    for (const status of ["locked","no_games","unavailable"]) {
      expect(dailyStartTimes({...slate,status,auctionStartOptions:["2026-11-19T23:30:00Z"]},now)).toEqual([]);
    }
    expect(dailyStartTimes({...slate,auctionStartOptions:[],auctionStartsAt:"2026-11-19T23:30:00Z"},now)).toEqual([]);
  });
  it("retains the safe default when talking to an older Daily server", () => {
    expect(dailyStartTimes({...slate,auctionStartsAt:"2026-11-19T23:30:00Z"},now)).toEqual(["2026-11-19T23:30:00Z"]);
    expect(dailyStartTimes({...slate,auctionStartsAt:"2026-11-19T23:30:00Z"},Date.parse("2026-11-19T23:30:00Z"))).toEqual([]);
  });
  it("accepts the established numeric-millisecond slate contract", () => {
    expect(dailyStartTimes({...slate,firstGameAt:Date.parse(slate.firstGameAt),auctionStartOptions:["2026-11-19T19:30:00.000Z"]},now)).toEqual(["2026-11-19T19:30:00.000Z"]);
    expect(dailyStartTimes({...slate,firstGameAt:Date.parse(slate.firstGameAt),auctionStartsAt:Date.parse("2026-11-19T23:30:00Z")},now)).toEqual(["2026-11-19T23:30:00.000Z"]);
  });
});
