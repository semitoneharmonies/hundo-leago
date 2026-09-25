import { useQuery } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { createCapOutlookFixture, capOutlookId } from "../../test/capOutlookFixture.js";
import { TeamRosterPage } from "./TeamRosterPage.jsx";
import { teamWorkspaceQuery } from "./teamWorkspaceQueries.js";
import { validateTeamWorkspace } from "./teamWorkspaceContracts.js";

function Harness({ fixture }) {
  const client = { request: fixture.request, resourceUrl: (value) => value };
  const { data } = useQuery(teamWorkspaceQuery(client, fixture.league.id, fixture.team.id));
  return data && <TeamRosterPage workspace={data} teams={[fixture.team]} currentUserId={capOutlookId(3)} managerName="Preview manager" onTeamChange={() => {}} httpClient={client} />;
}

async function open(fixture = createCapOutlookFixture()) {
  const view = renderWithProviders(<Harness fixture={fixture} />);
  await view.user.click(await screen.findByRole("button", { name: "Cap outlook" }));
  return { ...view, fixture, table: within(screen.getByRole("region", { name: "Cap outlook by season" })) };
}

describe("cap outlook", () => {
  it("shows three seasons, expiring contracts, saved penalties and cap-exempt commitments without writes", async () => {
    const { table, fixture } = await open();
    expect(table.getByRole("columnheader", { name: /2028–29/ })).toBeInTheDocument();
    expect(table.getByRole("row", { name: /Nazem Kadri/ })).toHaveTextContent("$2.50——");
    expect(table.getByRole("row", { name: /Alex Ovechkin/ })).toHaveTextContent("$0.63$0.63$0.63");
    expect(table.getByRole("row", { name: /^Cap space/ })).toHaveTextContent("$51.37$53.87$58.62");
    expect(table.getByRole("row", { name: /Nick Suzuki/ })).toHaveTextContent("$5.00$5.00—");
    expect(table.getByRole("row", { name: /Unsigned Prospect/ })).toHaveTextContent("Unsigned");
    expect(fixture.requests.every((request) => !request.method)).toBe(true);
  });

  it("moves active players to bench and back, keeping this view open and refreshing every season", async () => {
    const { user, table, fixture } = await open();
    await user.click(table.getByRole("button", { name: "Move Connor McDavid to bench" }));
    await waitFor(() => expect(table.getByRole("row", { name: /^Cap space/ })).toHaveTextContent("$72.37$74.87$79.62"));
    expect(screen.getByRole("button", { name: "Cap outlook" })).toHaveAttribute("aria-pressed", "true");
    await user.click(table.getByRole("button", { name: "Move Connor McDavid to active" }));
    await waitFor(() => expect(table.getByRole("row", { name: /^Cap space/ })).toHaveTextContent("$51.37$53.87$58.62"));
    expect(fixture.requests.filter((request) => request.method === "POST").map((request) => request.body)).toEqual([
      { destinationCategory: "Bench", expectedVersion: 1, confirmedIllegal: false },
      { destinationCategory: "Active", expectedVersion: 2, confirmedIllegal: false },
    ]);
    await user.click(screen.getByRole("button", { name: "Table", exact: true }));
    expect(screen.getByRole("region", { name: "Active roster table" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hockey lines" }));
    expect(screen.getByRole("button", { name: "Hockey lines" })).toHaveAttribute("aria-pressed", "true");
  });

  it("preserves failed moves and uses the existing illegal-roster confirmation", async () => {
    const { user, table, fixture } = await open();
    fixture.failNext = true;
    await user.click(table.getByRole("button", { name: "Move Nick Suzuki to active" }));
    await screen.findByText("The roster action could not be completed.");
    expect(table.getByRole("row", { name: /^Cap space/ })).toHaveTextContent("$51.37$53.87$58.62");
    fixture.requireConfirmation = true;
    const confirm = vi.spyOn(globalThis, "confirm").mockReturnValue(true);
    try {
      await user.click(table.getByRole("button", { name: "Move Nick Suzuki to active" }));
      await waitFor(() => expect(table.getByRole("row", { name: /^Cap space/ })).toHaveTextContent("$46.37$48.87$58.62"));
      expect(confirm).toHaveBeenCalledOnce();
      expect(fixture.requests.filter((request) => request.method === "POST").at(-1).body.confirmedIllegal).toBe(true);
    } finally { confirm.mockRestore(); }
  });

  it("allows another team to be viewed without move controls", async () => {
    const fixture = createCapOutlookFixture(); fixture.setCanManage(false);
    const { table } = await open(fixture);
    expect(table.queryByRole("button")).toBeNull();
  });

  it("handles older responses and refuses malformed schedules", async () => {
    const fixture = createCapOutlookFixture();
    const data = fixture.workspace();
    expect(validateTeamWorkspace(data)).toBe(true);
    data.capOutlook.rows[0].amountsCents = [2100];
    expect(() => validateTeamWorkspace(data)).toThrow(/schedule/);
    delete data.capOutlook;
    expect(validateTeamWorkspace(data)).toBe(true);
    const { user } = renderWithProviders(<TeamRosterPage workspace={data} teams={[data.team]} httpClient={{ request: vi.fn(), resourceUrl: (value) => value }} onTeamChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Cap outlook" }));
    expect(screen.getByText(/Season-by-season cap information is not available/)).toBeInTheDocument();
  });
});
