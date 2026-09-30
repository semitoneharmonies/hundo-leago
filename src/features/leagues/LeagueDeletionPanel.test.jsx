import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { createQueryClient } from "../../shared/query/queryClient.js";
import { LeagueDeletionPanel } from "./LeagueDeletionPanel.jsx";
import { previewLeagueDeletion, deleteLeague } from "./leagueDeletionApi.js";
import { readLeaguePreference, writeLeaguePreference } from "./leaguePreference.js";

const league = { id: "11111111-1111-4111-8111-111111111111", name: "Alpha League", status: "active" };
const other = { id: "22222222-2222-4222-8222-222222222222", name: "Beta League" };
const preview = { code: "LEAGUE_DELETION_PREVIEW", league, previewHash: "a".repeat(64),
  counts: { teams: 4, league_memberships: 5, seasons: 1 }, retainedCounts: { security_audit_events: 2 }, totalRecords: 11 };
const removed = { code: "LEAGUE_DELETED", league, deletedRecords: 11 };
function setup(implementation) {
  const httpClient = { request: vi.fn(implementation || (async (_path, options) => ({ data: options.method === "DELETE" ? removed : preview }))) };
  const onDeleted = vi.fn();
  const onBusyChange = vi.fn();
  const queryClient = createQueryClient();
  queryClient.setQueryData(["leagues"], [league, other]);
  queryClient.setQueryData(["league", league.id], { private: "alpha" });
  queryClient.setQueryData(["league", other.id], { private: "beta" });
  const view = renderWithProviders(<LeagueDeletionPanel league={league} httpClient={httpClient}
    onDeleted={onDeleted} onBusyChange={onBusyChange} />, { queryClient });
  return { ...view, httpClient, onDeleted, onBusyChange };
}
async function confirm(view) {
  await view.user.click(screen.getByRole("button", { name: "Review league deletion" }));
  await view.user.type(await screen.findByRole("textbox", { name: "Type Alpha League to confirm" }), league.name);
  await view.user.click(screen.getByRole("checkbox"));
}

describe("administrator league deletion", () => {
  it("does not request anything on open and cancel never deletes", async () => {
    const view = setup();
    expect(view.httpClient.request).not.toHaveBeenCalled();
    await view.user.click(screen.getByRole("button", { name: "Review league deletion" }));
    expect(await screen.findByText(/4 teams · 5 memberships · 1 season · 11 records/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Permanently delete league" })).toBeDisabled();
    await view.user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(view.httpClient.request.mock.calls).toHaveLength(1);
    expect(view.onDeleted).not.toHaveBeenCalled();
  });

  it("requires name and confirmation, then removes only the deleted league cache and preference", async () => {
    const view = setup();
    writeLeaguePreference(league.id);
    await confirm(view);
    await view.user.click(screen.getByRole("button", { name: "Permanently delete league" }));
    await waitFor(() => expect(view.onDeleted).toHaveBeenCalledWith(league));
    expect(view.httpClient.request).toHaveBeenLastCalledWith(`/api/v1/admin/leagues/${league.id}`, expect.objectContaining({
      method: "DELETE", body: { confirmed: true, leagueName: league.name, previewHash: preview.previewHash },
      authenticated: true, idempotencyKey: expect.any(String),
    }));
    expect(view.queryClient.getQueryData(["leagues"])).toEqual([other]);
    expect(view.queryClient.getQueryData(["league", league.id])).toBeUndefined();
    expect(view.queryClient.getQueryData(["league", other.id])).toEqual({ private: "beta" });
    expect(readLeaguePreference()).toBeNull();
  });

  it("prevents duplicate submission and retries an uncertain response with the same intent", async () => {
    let finish;
    let attempts = 0;
    const view = setup(async (_path, options) => {
      if (options.method !== "DELETE") return { data: preview };
      attempts += 1;
      if (attempts === 1) return new Promise((_resolve, reject) => { finish = reject; });
      return { data: removed };
    });
    await confirm(view);
    await view.user.dblClick(screen.getByRole("button", { name: "Permanently delete league" }));
    expect(attempts).toBe(1);
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await act(async () => finish(new Error("Connection lost")));
    expect(await screen.findByRole("alert")).toHaveTextContent("Connection lost");
    expect(view.onDeleted).not.toHaveBeenCalled();
    await view.user.click(screen.getByRole("button", { name: "Permanently delete league" }));
    await waitFor(() => expect(view.onDeleted).toHaveBeenCalled());
    const deletes = view.httpClient.request.mock.calls.filter(([, options]) => options.method === "DELETE");
    expect(deletes[0][1].idempotencyKey).toBe(deletes[1][1].idempotencyKey);
    expect(deletes[0][1].body).toEqual(deletes[1][1].body);
  });

  it("requires a new preview and confirmation after a stale-preview conflict", async () => {
    const view = setup(async (_path, options) => {
      if (options.method === "DELETE") throw Object.assign(new Error("The league changed."), { code: "LEAGUE_DELETION_PREVIEW_CHANGED" });
      return { data: preview };
    });
    await confirm(view);
    await view.user.click(screen.getByRole("button", { name: "Permanently delete league" }));
    await view.user.click(await screen.findByRole("button", { name: "Review updated deletion" }));
    expect(await screen.findByRole("textbox", { name: "Type Alpha League to confirm" })).toHaveValue("");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Permanently delete league" })).toBeDisabled();
  });

  it("rejects another league or malformed success response", async () => {
    const httpClient = { request: async (_path, options) => {
      const data = options.method === "DELETE" ? { ...removed, league: other } : { ...preview, totalRecords: 999 };
      options.validateData(data);
      return { data };
    } };
    await expect(previewLeagueDeletion(httpClient, league.id)).rejects.toThrow(/could not be verified/);
    await expect(deleteLeague(httpClient, league.id, {}, "test-key")).rejects.toThrow(/could not be verified/);
  });
});
