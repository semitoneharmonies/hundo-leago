import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuctionBoard } from "./DailyAuctionBoard.jsx";

describe("opening auction bid controls", () => {
  it("keeps every pool Bid visible while waiting, enables them on opening and preserves roster limits", () => {
    const players = Array.from({ length: 4 }, (_, i) => ({ id: String(i), name: `Skater ${i}`, team: "VAN", opponent: "SEA", position: i === 3 ? "D" : "F" }));
    const room = { id: "room", phase: "waiting", joined: true, availablePlayers: players, auctions: [],
      members: [{ id: "me", name: "Me", remainingCap: 100, availableCap: 100, reserved: 0, roster: [] }],
      rules: { minBid: 1 }, bidLimits: { F: { maxAmount: 100 }, D: { maxAmount: 0, reason: "Defence slots full" } } };
    const props = { session: { user: { id: "me" } }, command: { isPending: false, reset: vi.fn(), mutate: vi.fn() } };
    const view = render(<AuctionBoard room={room} {...props}/>);
    for (const player of players) expect(screen.getByRole("button", { name: `Bid on ${player.name}` })).toBeDisabled();
    view.rerender(<AuctionBoard room={{ ...room, phase: "auction" }} {...props}/>);
    for (const player of players.slice(0, 3)) expect(screen.getByRole("button", { name: `Bid on ${player.name}` })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Bid on Skater 3" })).toBeDisabled();
    view.rerender(<AuctionBoard room={{ ...room, phase: "auction", joined: false }} {...props}/>);
    expect(screen.queryByRole("button", { name: /Bid on/ })).not.toBeInTheDocument();
  });
});
