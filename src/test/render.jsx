import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { AppProviders } from "../app/AppProviders.jsx";
import { createQueryClient } from "../shared/query/queryClient.js";

export function renderWithRouter(ui, { initialEntries = ["/"] } = {}) {
  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    ),
  };
}

export function renderWithProviders(
  ui,
  {
    initialEntries = ["/"],
    queryClient = createQueryClient(),
    enableSession = false,
    config,
    initialActionToken,
    sessionOptions,
  } = {}
) {
  return {
    user: userEvent.setup(),
    queryClient,
    ...render(
      <AppProviders
        queryClient={queryClient}
        Router={MemoryRouter}
        routerProps={{ initialEntries }}
        enableSession={enableSession}
        config={config}
        initialActionToken={initialActionToken}
        sessionOptions={sessionOptions}
      >
        {ui}
      </AppProviders>
    ),
  };
}
