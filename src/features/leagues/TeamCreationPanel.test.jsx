import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { createHttpClient } from "../../shared/api/httpClient.js";
import { TeamCreationPanel } from "./TeamCreationPanel.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
const otherLeagueId = "22222222-2222-4222-8222-222222222222";
function success(name = "North", id = leagueId, code = "TEAM_CREATED") {
  return new Response(JSON.stringify({ data: { code, team: {
    id: "33333333-3333-4333-8333-333333333333", leagueId: id,
    name, status: "setup", currentManager: null, version: 1,
    primaryColour: null, secondaryColour: null, logoReference: null,
  } }, meta: { requestId: "test-create-team" } }), { status: 201, headers: { "Content-Type": "application/json" } });
}
function renderPanel(fetchImpl, id = leagueId) {
  const httpClient = createHttpClient({ apiOrigin: "http://localhost:4000", fetchImpl, getCsrfToken: () => "test-csrf" });
  return renderWithProviders(<TeamCreationPanel key={id} leagueId={id} httpClient={httpClient} />, {
    config: { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null },
  });
}
async function submit(user, name = "North") {
  await user.type(screen.getByRole("textbox", { name: "Team name" }), name);
  await user.click(screen.getByRole("button", { name: "Create team" }));
}

describe("empty team creation", () => {
  it("uses the existing authenticated contract once, prevents duplicate submits and refreshes only the league cache", async () => {
    let finish;
    const fetchImpl = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    const { user, queryClient } = renderPanel(fetchImpl);
    queryClient.setQueryData(["league", leagueId, "teams"], []);
    queryClient.setQueryData(["league", otherLeagueId, "teams"], []);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Create team" })).toBeDisabled();
    await submit(user, "  North  ");
    fireEvent.submit(screen.getByRole("textbox", { name: "Team name" }).closest("form"));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe(`http://localhost:4000/api/v1/leagues/${leagueId}/teams`);
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("include");
    expect(options.headers.get("X-CSRF-Token")).toBe("test-csrf");
    expect(options.headers.get("Idempotency-Key")).toMatch(/^league-team-create:/);
    expect(JSON.parse(options.body)).toEqual({ name: "North" });
    await act(async () => finish(success()));
    expect(await screen.findByRole("status")).toHaveTextContent("North was created. Its manager is unassigned.");
    expect(queryClient.getQueryState(["league", leagueId, "teams"]).isInvalidated).toBe(true);
    expect(queryClient.getQueryState(["league", otherLeagueId, "teams"]).isInvalidated).toBe(false);
    expect(screen.getByRole("textbox", { name: "Team name" })).toHaveValue("");
  });

  it("does not retry an uncertain write automatically and reuses its key only on an explicit retry", async () => {
    const fetchImpl = vi.fn().mockRejectedValueOnce(new TypeError("private transport detail")).mockResolvedValueOnce(success());
    const { user } = renderPanel(fetchImpl);
    await submit(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t confirm");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "Team name" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("status")).toHaveTextContent("North was created");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][1].headers.get("Idempotency-Key")).toBe(fetchImpl.mock.calls[0][1].headers.get("Idempotency-Key"));
    expect(fetchImpl.mock.calls[1][1].body).toBe(fetchImpl.mock.calls[0][1].body);
  });

  it.each([[otherLeagueId, "TEAM_CREATED"], [leagueId, "TEAM_FOUND"]])("rejects a wrong-scope or malformed success response (%s, %s)", async (id, code) => {
    const fetchImpl = vi.fn().mockResolvedValue(success("North", id, code));
    const { user } = renderPanel(fetchImpl);
    await submit(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t confirm");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("shows a safe name-conflict error and allows a corrected new intent", async () => {
    const denied = new Response(JSON.stringify({ error: { code: "TEAM_NAME_UNAVAILABLE", message: "private database detail", requestId: "request-test" } }), { status: 409, headers: { "Content-Type": "application/json" } });
    const fetchImpl = vi.fn().mockResolvedValueOnce(denied).mockResolvedValueOnce(success("South"));
    const { user } = renderPanel(fetchImpl);
    await submit(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose another name");
    expect(screen.queryByText("private database detail")).not.toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Team name" }));
    await submit(user, "South");
    expect(await screen.findByRole("status")).toHaveTextContent("South was created");
    expect(fetchImpl.mock.calls[1][1].headers.get("Idempotency-Key")).not.toBe(fetchImpl.mock.calls[0][1].headers.get("Idempotency-Key"));
  });

  it("rejects overlong names but accepts 35 Unicode characters", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(success("🏒".repeat(35)));
    const { user } = renderPanel(fetchImpl);
    const input = screen.getByRole("textbox", { name: "Team name" });
    fireEvent.change(input, { target: { value: "N".repeat(36) } });
    expect(screen.getByRole("button", { name: "Create team" })).toBeDisabled();
    expect(fetchImpl).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "🏒".repeat(35) } });
    await user.click(screen.getByRole("button", { name: "Create team" }));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).name).toBe("🏒".repeat(35));
    await screen.findByRole("status");
  });
});
