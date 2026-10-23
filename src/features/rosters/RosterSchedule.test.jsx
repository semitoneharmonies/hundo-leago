import { screen, within, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { createRosterScheduleFixture } from "../../test/rosterScheduleFixture.js";
import { RosterSchedule } from "./RosterSchedule.jsx";
import { TeamRosterPage } from "./TeamRosterPage.jsx";
import { rosterScheduleQuery, validateRosterSchedule } from "./rosterScheduleQueries.js";

describe("roster schedule", () => {
  it("adds a peer view, fetches only when opened, and preserves the other roster views", async () => {
    const fixture = createRosterScheduleFixture();
    const { user } = renderWithProviders(<TeamRosterPage workspace={fixture.workspace()} teams={[fixture.team]} httpClient={fixture.client} onTeamChange={() => {}} />);
    expect(fixture.scheduleRequests).toHaveLength(0);
    const selector = screen.getByRole("group", { name: "Roster view" });
    expect(within(selector).getAllByRole("button").map((button) => button.textContent.trim())).toEqual(["Table", "Cap outlook", "Schedule"]);
    await user.click(within(selector).getByRole("button", { name: "Schedule" }));
    const row = await screen.findByRole("article", { name: "Connor McDavid schedule" });
    expect(within(row).getByLabelText("4 games this week")).toBeInTheDocument();
    expect(within(row).getByText("vs VAN")).toBeInTheDocument();
    expect(within(row).getByText("@ SEA")).toBeInTheDocument();
    expect(within(selector).getByRole("button", { name: "Schedule" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(selector).getByRole("button", { name: "Table", exact: true }));
    expect(screen.queryByRole("region", { name: "Roster schedule" })).not.toBeInTheDocument();
    await user.click(within(selector).getByRole("button", { name: "Cap outlook" }));
    expect(await screen.findByRole("region", { name: "Cap outlook by season" })).toBeInTheDocument();
    expect(fixture.requests.every((request) => !request.method)).toBe(true);
  });

  it("uses persisted weeks across a break and shows empty, unknown-team and postponed states distinctly", async () => {
    const fixture = createRosterScheduleFixture();
    const { user } = renderWithProviders(<RosterSchedule workspace={fixture.workspace()} httpClient={fixture.client} nowMs={fixture.nowMs} />);
    const unknown = await screen.findByRole("article", { name: "Unsigned Prospect schedule" });
    expect(within(unknown).getByText("NHL schedule unavailable for this player")).toBeInTheDocument();
    expect(within(unknown).getByLabelText("Game count unavailable")).toBeInTheDocument();
    const postponed = screen.getByRole("article", { name: "Nikita Kucherov schedule" });
    expect(within(postponed).getByText("Postponed")).toBeInTheDocument();
    expect(within(postponed).getByLabelText("0 games this week")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous matchup week" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next matchup week" }));
    expect(await screen.findByText("vs TOR")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Matchup week" })).toHaveValue(fixture.weeks[1].id);
    expect(screen.getByRole("button", { name: "Next matchup week" })).toBeDisabled();
    expect(within(screen.getByRole("article", { name: "Cale Makar schedule" })).getByText("No NHL games this week")).toBeInTheDocument();
    expect(fixture.scheduleRequests.at(-1)).toContain(fixture.weeks[1].id);
  });

  it("shows loading, provider failure and retry without claiming there are no games", async () => {
    const fixture = createRosterScheduleFixture();
    fixture.scheduleFailure = true;
    const { user } = renderWithProviders(<RosterSchedule workspace={fixture.workspace()} httpClient={fixture.client} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading matchup weeks");
    expect(await screen.findByRole("alert")).toHaveTextContent("NHL schedule is unavailable");
    expect(screen.queryByText("No NHL games this week")).not.toBeInTheDocument();
    fixture.scheduleFailure = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("article", { name: "Connor McDavid schedule" })).toBeInTheDocument();
  });

  it("does not fetch NHL data before matchup weeks exist", async () => {
    const fixture = createRosterScheduleFixture();
    fixture.emptyWeeks = true;
    renderWithProviders(<RosterSchedule workspace={fixture.workspace()} httpClient={fixture.client} />);
    expect(await screen.findByText(/matchup weeks haven’t been scheduled/)).toBeInTheDocument();
    expect(fixture.scheduleRequests).toHaveLength(0);
  });

  it("scopes cache keys and rejects wrong-league/week responses and invalid games", async () => {
    const fixture = createRosterScheduleFixture();
    const scope = { leagueId: fixture.league.id, seasonId: fixture.workspace().season.id, weekId: fixture.weeks[0].id };
    const options = rosterScheduleQuery(fixture.client, scope.leagueId, scope.seasonId, scope.weekId);
    const data = await options.queryFn({});
    expect(validateRosterSchedule(data, scope)).toBe(true);
    for (const changes of [{ leagueId: "other" }, { weekId: "other" }, { timeZone: "invalid" }, { games: [{ ...data.games[0], startsAtMs: data.endsAtMs }] }, { games: [data.games[0], data.games[0]] }]) {
      expect(() => validateRosterSchedule({ ...data, ...changes }, scope)).toThrow();
    }
    expect(rosterScheduleQuery(fixture.client, "other-league", scope.seasonId, scope.weekId).queryKey).not.toEqual(options.queryKey);
    const fixtureB = createRosterScheduleFixture();
    fixtureB.league.id = "22222222-2222-4222-8222-222222222222";
    const { unmount, queryClient } = renderWithProviders(<RosterSchedule key="a" workspace={fixture.workspace()} httpClient={fixture.client} />);
    await screen.findByRole("article", { name: "Connor McDavid schedule" });
    unmount();
    renderWithProviders(<RosterSchedule key="b" workspace={fixtureB.workspace()} httpClient={fixtureB.client} />, { queryClient });
    await waitFor(() => expect(fixtureB.scheduleRequests.length).toBe(1));
    expect(fixtureB.scheduleRequests[0]).toContain(fixtureB.league.id);
  });
});
