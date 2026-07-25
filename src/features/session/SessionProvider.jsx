import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { clearPrivateQueries } from "../../shared/query/queryClient.js";
import {
  bootstrapSession,
  createSession,
  deleteSession,
} from "./sessionApi.js";
import { validateSessionData } from "./sessionContracts.js";
import { SessionContext } from "./sessionContext.js";
import { createSessionHttpController } from "./sessionHttpController.js";

const UNKNOWN_SESSION = Object.freeze({
  status: "unknown",
  user: null,
  session: null,
  notice: null,
  bootstrapError: null,
});

function authenticatedSession(data) {
  validateSessionData(data);
  return Object.freeze({
    status: "authenticated",
    user: data.user,
    session: data.session,
    notice: null,
    bootstrapError: null,
  });
}

function unauthenticatedSession(notice = null) {
  return Object.freeze({
    status: "unauthenticated",
    user: null,
    session: null,
    notice,
    bootstrapError: null,
  });
}

export function SessionProvider({
  apiOrigin,
  children,
  fetchImpl = globalThis.fetch,
}) {
  const queryClient = useQueryClient();
  const bootstrapInProgressRef = useRef(true);
  const [state, setState] = useState(UNKNOWN_SESSION);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [httpController] = useState(() =>
    createSessionHttpController({ apiOrigin, fetchImpl })
  );
  const httpClient = httpController.httpClient;

  const clearAuthentication = useCallback(
    async (notice = null) => {
      httpController.clearCsrfToken();
      setState(unauthenticatedSession(notice));
      await clearPrivateQueries(queryClient);
    },
    [httpController, queryClient]
  );

  const adoptSession = useCallback((data) => {
    validateSessionData(data);
    httpController.setCsrfToken(data.csrfToken);
    setState(authenticatedSession(data));
  }, [httpController]);

  useEffect(() => {
    httpController.setOnUnauthorized(() =>
      clearAuthentication(
        bootstrapInProgressRef.current ? null : "session-expired"
      )
    );
    return () => httpController.setOnUnauthorized(() => {});
  }, [clearAuthentication, httpController]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    bootstrapInProgressRef.current = true;

    bootstrapSession(httpClient, { signal: controller.signal })
      .then((data) => {
        if (active) adoptSession(data);
      })
      .catch((error) => {
        if (!active || error?.code === "REQUEST_ABORTED") return;
        if (error?.status === 401) {
          clearAuthentication(null);
          return;
        }
        setState(
          Object.freeze({
            ...UNKNOWN_SESSION,
            bootstrapError: error,
          })
        );
      })
      .finally(() => {
        if (active) bootstrapInProgressRef.current = false;
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [adoptSession, bootstrapAttempt, clearAuthentication, httpClient]);

  const signIn = useCallback(
    async (credentials) => {
      const data = await createSession(httpClient, credentials);
      adoptSession(data);
      return data;
    },
    [adoptSession, httpClient]
  );

  const signOut = useCallback(async () => {
    let failure = null;
    try {
      await deleteSession(httpClient);
    } catch (error) {
      failure = error;
    }
    await clearAuthentication("signed-out");
    if (failure) throw failure;
  }, [clearAuthentication, httpClient]);

  const retryBootstrap = useCallback(() => {
    setState(UNKNOWN_SESSION);
    setBootstrapAttempt((attempt) => attempt + 1);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      httpClient,
      adoptSession,
      clearAuthentication,
      retryBootstrap,
      signIn,
      signOut,
    }),
    [
      adoptSession,
      clearAuthentication,
      httpClient,
      retryBootstrap,
      signIn,
      signOut,
      state,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
