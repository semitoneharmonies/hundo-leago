import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { frontendConfig } from "../config/env.js";
import { ActionTokenProvider } from "../features/accounts/ActionTokenProvider.jsx";
import { SessionProvider } from "../features/session/SessionProvider.jsx";
import { TransactionInvalidationProvider } from "../features/transactions/TransactionInvalidationProvider.jsx";
import { createQueryClient } from "../shared/query/queryClient.js";
import { StartupConfigurationPage } from "./StartupConfigurationPage.jsx";

export function AppProviders(props) {
  const {
    children,
    queryClient: suppliedQueryClient,
    routerProps,
  } = props;
  const Router = props.Router || BrowserRouter;
  const config = props.config === undefined ? frontendConfig : props.config;
  const enableSession = props.enableSession !== false;
  const [queryClient] = useState(
    () => suppliedQueryClient || createQueryClient()
  );

  return (
    <Router {...routerProps}>
      <QueryClientProvider client={queryClient}>
        {!config ? (
          <StartupConfigurationPage />
        ) : enableSession ? (
          <SessionProvider
            apiOrigin={config.apiOrigin}
            {...props.sessionOptions}
            appEnv={config.appEnv}
          >
            <TransactionInvalidationProvider
              socketOrigin={config.socketOrigin}
              socketFactory={props.socketFactory}
            >
              <ActionTokenProvider initialToken={props.initialActionToken}>
                {children}
              </ActionTokenProvider>
            </TransactionInvalidationProvider>
          </SessionProvider>
        ) : (
          <ActionTokenProvider initialToken={props.initialActionToken}>
            {children}
          </ActionTokenProvider>
        )}
      </QueryClientProvider>
    </Router>
  );
}
