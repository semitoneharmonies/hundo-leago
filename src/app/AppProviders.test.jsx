import { useQueryClient } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "../shared/query/queryClient.js";
import { renderWithProviders } from "../test/render.jsx";
import { useRealtime } from "../shared/realtime/realtimeContext.js";
import { REALTIME_RELATED_ID_KEYS } from "../shared/realtime/realtimeInvalidation.js";
import { AppProviders } from "./AppProviders.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
const fadId = "22222222-2222-4222-8222-222222222222";
const teamId = "33333333-3333-4333-8333-333333333333";
const cardId = "44444444-4444-4444-8444-444444444444";
const config = Object.freeze({
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
});

function sessionResponse() {
  return new Response(
    JSON.stringify({
      data: {
        csrfToken: "A".repeat(43),
        session: {
          id: "session-1",
          userId: "user-1",
          status: "active",
          createdAtMs: 1,
          lastUsedAtMs: 2,
          idleExpiresAtMs: 3,
          absoluteExpiresAtMs: 4,
          version: 1,
        },
        user: {
          id: "user-1",
          displayName: "Provider Manager",
          status: "active",
          version: 1,
        },
      },
      meta: { requestId: "request-session" },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function related(overrides = {}) {
  return Object.fromEntries(
    REALTIME_RELATED_ID_KEYS.map((key) => [
      key,
      Object.prototype.hasOwnProperty.call(overrides, key)
        ? overrides[key]
        : null,
    ])
  );
}

function ProviderProbe() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const realtime = useRealtime();
  return (
    <output>
      {location.pathname}:{queryClient ? "query-ready" : "query-missing"}:
      {realtime.status}
    </output>
  );
}

describe("AppProviders", () => {
  it("composes a router and a fresh Query Client", () => {
    const first = renderWithProviders(<ProviderProbe />, {
      initialEntries: ["/first"],
      Router: MemoryRouter,
    });
    expect(
      screen.getByText("/first:query-ready:disconnected")
    ).toBeInTheDocument();
    const firstClient = first.queryClient;
    first.unmount();

    const second = renderWithProviders(<ProviderProbe />, {
      initialEntries: ["/second"],
      Router: MemoryRouter,
    });
    expect(
      screen.getByText("/second:query-ready:disconnected")
    ).toBeInTheDocument();
    expect(second.queryClient).not.toBe(firstClient);
  });

  it("wires the default FAD mapper through the one shared realtime provider", async () => {
    let onAny;
    const socket = {
      onAny: vi.fn((listener) => {
        onAny = listener;
      }),
      offAny: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      disconnect: vi.fn(),
    };
    const socketFactory = vi.fn(() => socket);
    const fetchImpl = vi.fn(async () => sessionResponse());
    const queryClient = createQueryClient();
    const additionalMapper = vi.fn(() => []);
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    const view = render(
      <AppProviders
        config={config}
        queryClient={queryClient}
        Router={MemoryRouter}
        routerProps={{ initialEntries: [`/leagues/${leagueId}`] }}
        sessionOptions={{ fetchImpl }}
        socketFactory={socketFactory}
        realtimeInvalidationMappers={[additionalMapper]}
      >
        <p>Realtime application</p>
      </AppProviders>
    );
    await waitFor(() => expect(socketFactory).toHaveBeenCalledTimes(1));

    await act(async () => {
      onAny("candidate_card.changed", {
        eventId: "55555555-5555-4555-8555-555555555555",
        type: "candidate_card.changed",
        leagueId,
        resourceId: cardId,
        version: 2,
        reasonCode: "card_changed",
        occurredAt: 1_786_432_100_000,
        related: related({ fadId, teamId, cardId }),
      });
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [
        "league",
        leagueId,
        "free-agent-draft",
        fadId,
        "private-card",
        teamId,
      ],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["league", leagueId, "free-agent-draft", fadId, "overview"],
    });
    expect(additionalMapper).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });
});
