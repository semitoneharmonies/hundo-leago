import { screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import StandingsPage from "./StandingsPage";
import { renderWithRouter } from "../test/render";

describe("existing standings page smoke", () => {
  test("loads and renders an empty compatibility standings response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ standings: [], weeksCounted: 0 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithRouter(<StandingsPage />);

    expect(
      screen.getByRole("heading", { name: "Standings" })
    ).toBeInTheDocument();
    expect(await screen.findByText("No games played yet.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(
      /\/api\/matchups\/standings$/
    );
  });
});
