import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "../../shared/query/queryClient.js";
import { renderWithProviders } from "../../test/render.jsx";
import { useSession } from "./sessionContext.js";

const config = Object.freeze({
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sessionEnvelope(requestId = "request-session") {
  return {
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
        displayName: "Session Manager",
        status: "active",
        version: 1,
      },
    },
    meta: { requestId },
  };
}

function SessionProbe() {
  const session = useSession();
  if (session.status === "unknown") return <p>Checking session</p>;
  if (session.status === "unauthenticated") return <p>Signed out</p>;
  return (
    <div>
      <p>Private: {session.user.displayName}</p>
      <button type="button" onClick={() => session.signOut()}>
        Sign out
      </button>
    </div>
  );
}

function ReplacementProbe({ events, replacement }) {
  const session = useSession();
  if (session.status !== "authenticated") return <p>Checking replacement</p>;
  events.push(`render:${session.user.id}`);
  return (
    <div>
      <p>Viewer: {session.user.displayName}</p>
      <button
        type="button"
        onClick={async () => {
          await session.adoptSession(replacement);
          await session.httpClient.request("/api/v1/replacement-proof", {
            method: "POST",
            authenticated: true,
            body: {},
          });
        }}
      >
        Replace session
      </button>
    </div>
  );
}

describe("SessionProvider", () => {
  it("does not render authenticated content before bootstrap completes", async () => {
    let resolveBootstrap;
    const fetchImpl = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveBootstrap = resolve;
        })
    );
    renderWithProviders(<SessionProbe />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    expect(screen.getByText("Checking session")).toBeInTheDocument();
    expect(screen.queryByText(/Private:/)).toBeNull();

    resolveBootstrap(jsonResponse(sessionEnvelope()));
    expect(await screen.findByText("Private: Session Manager")).toBeInTheDocument();
    expect(fetchImpl.mock.calls[0][1].credentials).toBe("include");
  });

  it("classifies a missing session as unauthenticated", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "SESSION_REQUIRED",
            message: "A valid session is required.",
            requestId: "request-401",
          },
        },
        401
      )
    );
    renderWithProviders(<SessionProbe />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    expect(await screen.findByText("Signed out")).toBeInTheDocument();
  });

  it("sends in-memory CSRF on sign-out and clears presentation state", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(sessionEnvelope()))
      .mockResolvedValueOnce(
        jsonResponse({
          data: { signedOut: true },
          meta: { requestId: "request-sign-out" },
        })
      );
    const view = renderWithProviders(<SessionProbe />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    await view.user.click(await screen.findByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(screen.getByText("Signed out")).toBeInTheDocument());

    const [, request] = fetchImpl.mock.calls[1];
    expect(request.method).toBe("DELETE");
    expect(request.headers.get("Content-Type")).toBe("application/json");
    expect(request.headers.get("X-CSRF-Token")).toBe("A".repeat(43));
    expect(request.body).toBe("{}");
  });

  it("purges the old viewer's private cache before adopting a different authenticated user", async () => {
    const events = [];
    const replacement = structuredClone(sessionEnvelope().data);
    replacement.csrfToken = "B".repeat(43);
    replacement.session.id = "session-2";
    replacement.session.userId = "user-2";
    replacement.user.id = "user-2";
    replacement.user.displayName = "Replacement Manager";
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(sessionEnvelope()))
      .mockImplementationOnce((_url, request) => {
        events.push(`request:${request.headers.get("X-CSRF-Token")}`);
        return Promise.resolve(new Response(null, { status: 204 }));
      });
    const queryClient = createQueryClient();
    const privateKey = ["viewer", "private"];
    const publicKey = ["site", "public"];
    queryClient.setQueryDefaults(privateKey, { meta: { private: true } });
    queryClient.setQueryDefaults(publicKey, { meta: { private: false } });
    queryClient.setQueryData(privateKey, { salary: "old-viewer-only" });
    queryClient.setQueryData(publicKey, { label: "safe-public-data" });
    const originalRemoveQueries = queryClient.removeQueries.bind(queryClient);
    vi.spyOn(queryClient, "removeQueries").mockImplementation((filters) => {
      events.push("private-removed");
      return originalRemoveQueries(filters);
    });

    const view = renderWithProviders(
      <ReplacementProbe events={events} replacement={replacement} />,
      {
        enableSession: true,
        config,
        queryClient,
        sessionOptions: { fetchImpl },
      }
    );

    await view.user.click(
      await screen.findByRole("button", { name: "Replace session" })
    );
    expect(await screen.findByText("Viewer: Replacement Manager")).toBeInTheDocument();
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));

    expect(queryClient.getQueryData(privateKey)).toBeUndefined();
    expect(queryClient.getQueryData(publicKey)).toEqual({ label: "safe-public-data" });
    expect(events.indexOf("private-removed")).toBeLessThan(
      events.indexOf("render:user-2")
    );
    expect(events.indexOf("private-removed")).toBeLessThan(
      events.indexOf(`request:${"B".repeat(43)}`)
    );
  });
});
