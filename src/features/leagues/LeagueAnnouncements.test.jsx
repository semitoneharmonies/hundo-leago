import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LeagueAnnouncements } from "./LeagueAnnouncements.jsx";

describe("Sidebar announcement authority", () => {
  it.each(["manager", "commissioner", "platform_administrator"])("shows the all-leagues entry only to an administrator: %s", async authority => {
    const leagueId = "11111111-1111-4111-8111-111111111111";
    const client = { request: vi.fn(async () => ({ data: { code: "LEAGUE_ANNOUNCEMENTS_FOUND", announcements: [], page: { nextCursor: null } } })) };
    render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <LeagueAnnouncements league={{ id: leagueId, membership: { effectiveAuthority: authority } }} session={{ httpClient: client }} />
    </QueryClientProvider></MemoryRouter>);
    await screen.findByText("No announcements yet.");
    const link = screen.queryByRole("link", { name: "Announce to all leagues" });
    if (authority === "platform_administrator") expect(link).toHaveAttribute("href", `/leagues/${leagueId}/commissioner/communications?audience=all_leagues`);
    else expect(link).not.toBeInTheDocument();
    expect(client.request.mock.calls.every(([, options]) => !options.method)).toBe(true);
  });
});
