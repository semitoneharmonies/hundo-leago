import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DailyLobbyScreen, RoomCard } from "./HundoDailyRoomScreens.jsx";

const makeRoom = (id, date, changes = {}) => ({ id, name: id, date, firstGameAt: date + "T23:00:00Z",
  auctionStartsAt: "2026-11-24T20:00:00Z", capacity: 4, memberCount: 4, phase: "auction", joined: false,
  commissionerName: "Host", ...changes });

describe("Daily slate groups and spectator links", () => {
  it("groups by the NHL slate date, keeping incoming order within each day even for auctions the night before", () => {
    const rooms = [makeRoom("Wednesday newer", "2026-11-25"), makeRoom("Tuesday", "2026-11-24"),
      makeRoom("Wednesday joined", "2026-11-25", { joined: true })];
    render(<MemoryRouter><DailyLobbyScreen rooms={rooms} viewer={{ id: "me" }} onJoin={vi.fn()}/></MemoryRouter>);
    expect(screen.getAllByRole("heading", { level: 2 }).map(el => el.textContent)).toEqual([
      "Tuesday, Nov 24 games", "Wednesday, Nov 25 games",
    ]);
    const wednesday = screen.getByRole("region", { name: "Wednesday, Nov 25 games" });
    expect(within(wednesday).getAllByRole("heading", { level: 3 }).map(el => el.textContent)).toEqual(["Wednesday newer", "Wednesday joined"]);
    expect(within(wednesday).getByText("Your room")).toBeVisible();
    expect(within(wednesday).getByRole("link", { name: "Watch auction" })).toHaveAttribute("href", "/daily/rooms/Wednesday%20newer");
  });

  it.each(["waiting", "auction", "locked", "finished"])("lets a nonmember view a full %s room without a join action", phase => {
    const onJoin = vi.fn();
    render(<MemoryRouter><RoomCard room={makeRoom("full-room", "2026-11-25", { phase })} viewer={{ id: "viewer" }} onJoin={onJoin}/></MemoryRouter>);
    expect(screen.getByRole("link", { name: phase === "auction" ? "Watch auction" : "View room" })).toHaveAttribute("href", "/daily/rooms/full-room");
    expect(screen.queryByRole("button", { name: /Join/ })).not.toBeInTheDocument();
    expect(onJoin).not.toHaveBeenCalled();
  });

  it("offers joining and watching separately when a seat is available", () => {
    render(<MemoryRouter><RoomCard room={makeRoom("open-room", "2026-11-25", { memberCount: 1 })} viewer={{ id: "viewer" }} onJoin={vi.fn()}/></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Join open-room" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Watch auction" })).toBeVisible();
  });
});
