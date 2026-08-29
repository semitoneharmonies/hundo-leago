import { useMemo, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { frontendConfig } from "../config/env.js";
import { ActionTokenProvider } from "../features/accounts/ActionTokenProvider.jsx";
import { freeAgentDraftInvalidationActions } from "../features/freeAgentDraft/freeAgentDraftInvalidation.js";
import { SessionProvider } from "../features/session/SessionProvider.jsx";
import { createQueryClient } from "../shared/query/queryClient.js";
import { RealtimeProvider } from "../shared/realtime/RealtimeProvider.jsx";
import { StartupConfigurationPage } from "./StartupConfigurationPage.jsx";

const DEFAULT_REALTIME_INVALIDATION_MAPPERS = Object.freeze([
  freeAgentDraftInvalidationActions,
]);

export function AppProviders(props) {
  const {
    children,
    queryClient: suppliedQueryClient,
    routerProps,
  } = props;
  const Router = props.Router || BrowserRouter;
  const config = props.config === undefined ? frontendConfig : props.config;
  const enableSession = props.enableSession !== false;
  const configuredRealtimeMappers = props.realtimeInvalidationMappers;
  const realtimeInvalidationMappers = useMemo(() => {
    if (configuredRealtimeMappers === undefined) {
      return DEFAULT_REALTIME_INVALIDATION_MAPPERS;
    }
    if (!Array.isArray(configuredRealtimeMappers)) {
      return configuredRealtimeMappers;
    }
    return Object.freeze([
      freeAgentDraftInvalidationActions,
      ...configuredRealtimeMappers.filter(
        (mapper) => mapper !== freeAgentDraftInvalidationActions
      ),
    ]);
  }, [configuredRealtimeMappers]);
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
            <RealtimeProvider
              socketOrigin={config.socketOrigin}
              socketFactory={props.socketFactory}
              invalidationMappers={realtimeInvalidationMappers}
            >
              <ActionTokenProvider initialToken={props.initialActionToken}>
                {children}
              </ActionTokenProvider>
            </RealtimeProvider>
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
