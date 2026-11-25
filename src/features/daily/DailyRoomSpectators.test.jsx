import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DailyRoom } from "./DailyRoom.jsx";

const api = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));
vi.mock("./dailyApi.js", async importOriginal => ({ ...(await importOriginal()),
  dailyRead: (session, path) => ({ queryKey: ["daily", session.user.id, path], queryFn: api.read }), dailyWrite: api.write,
}));
vi.mock("./DailyChat.jsx", () => ({ DailyChat: () => <div aria-label="Room chat access">Chat available</div> }));

const room = { id: "room", name: "Spectator room", date: "2030-11-25", phase: "auction", joined: false,
  firstGameAt: "2030-11-25T23:00:00Z", auctionStartsAt: "2030-11-25T22:30:00Z", auctionEndsAt: "2030-11-25T23:00:00Z",
  capacity: 1, memberCount: 1, commissionerId: "host", canClose: false, availablePlayers: [{ id: "player", name: "Pool skater", position: "F", team: "VAN", opponent: "SEA" }],
  auctions: [{ id: "active", name: "Auction skater", position: "D", team: "VAN", opponent: "SEA", endsAt: "2030-11-25T22:32:00Z", bidCount: 2, ownBid: null }],
  members: [{ id: "host", name: "Host", roster: [], spent: 0, reserved: null, availableCap: null, remainingCap: 100 }],
  rules: { minBid: 1 }, bidLimits: { F: { maxAmount: 0 }, D: { maxAmount: 0 } },
};

describe("spectator room screen", () => {
  it("shows a live room without gameplay controls, opens chat only by permission, and passes its outline identity", async () => {
    api.read.mockResolvedValue({ room });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const view = render(<MemoryRouter><QueryClientProvider client={client}><DailyRoom roomId="room" session={{ user: { id: "spectator" } }} outlineColour="teal"/></QueryClientProvider></MemoryRouter>);
    await screen.findByText("Watching as a spectator.");
    expect(screen.getByRole("article", { name: "Spectator room" })).toHaveAttribute("data-room-outline", "teal");
    expect(screen.getByText("Pool skater")).toBeVisible();
    expect(screen.getByText("Auction skater")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Bid on|Join room|Close room/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Room chat access")).not.toBeInTheDocument();
    expect(api.write).not.toHaveBeenCalled();
    await act(async () => client.setQueryData(["daily", "spectator", "/rooms/room"], { room: { ...room, allowSpectatorChat: true } }));
    await waitFor(() => expect(screen.getByLabelText("Room chat access")).toBeVisible());
    await act(async () => client.setQueryData(["daily", "spectator", "/rooms/room"], { room: { ...room, joined: true } }));
    await waitFor(() => expect(screen.queryByText("Watching as a spectator.")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Room chat access")).toBeVisible();
    view.unmount(); client.clear();
  });
});
