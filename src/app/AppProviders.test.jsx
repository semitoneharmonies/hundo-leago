import { useQueryClient } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "../test/render.jsx";

function ProviderProbe() {
  const location = useLocation();
  const queryClient = useQueryClient();
  return (
    <output>
      {location.pathname}:{queryClient ? "query-ready" : "query-missing"}
    </output>
  );
}

describe("AppProviders", () => {
  it("composes a router and a fresh Query Client", () => {
    const first = renderWithProviders(<ProviderProbe />, {
      initialEntries: ["/first"],
      Router: MemoryRouter,
    });
    expect(screen.getByText("/first:query-ready")).toBeInTheDocument();
    const firstClient = first.queryClient;
    first.unmount();

    const second = renderWithProviders(<ProviderProbe />, {
      initialEntries: ["/second"],
      Router: MemoryRouter,
    });
    expect(screen.getByText("/second:query-ready")).toBeInTheDocument();
    expect(second.queryClient).not.toBe(firstClient);
  });
});
