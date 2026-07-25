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

const STAGING_RESET_NOTICE = "staging-fixture-reset";
const BACKUP_ID = /^backup-v1-[a-f0-9]{64}$/;
const FIXTURE_BUILD_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const MAX_TIMESTAMP_MS = 8_640_000_000_000_000;

const UNKNOWN_SESSION = Object.freeze({
  status: "unknown",
  user: null,
  session: null,
  notice: null,
  stagingResetReceipt: null,
  bootstrapError: null,
});

function authenticatedSession(data) {
  validateSessionData(data);
  return Object.freeze({
    status: "authenticated",
    user: data.user,
    session: data.session,
    notice: null,
    stagingResetReceipt: null,
    bootstrapError: null,
  });
}

function sanitizeStagingResetReceipt(value, { appEnv, notice }) {
  if (
    appEnv !== "staging" ||
    notice !== STAGING_RESET_NOTICE ||
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !FIXTURE_BUILD_ID.test(value.fixtureBuildId || "") ||
    !BACKUP_ID.test(value.backupId || "") ||
    !Number.isSafeInteger(value.resetAtMs) ||
    value.resetAtMs < 0 ||
    value.resetAtMs > MAX_TIMESTAMP_MS ||
    !Number.isSafeInteger(value.providerCatalogPlayerCount) ||
    value.providerCatalogPlayerCount < 0 ||
    value.sessionInvalidated !== true
  ) {
    return null;
  }
  return Object.freeze({
    backupId: value.backupId,
    fixtureBuildId: value.fixtureBuildId,
    providerCatalogPlayerCount: value.providerCatalogPlayerCount,
    resetAtMs: value.resetAtMs,
    sessionInvalidated: true,
  });
}

function unauthenticatedSession(notice = null, stagingResetReceipt = null) {
  return Object.freeze({
    status: "unauthenticated",
    user: null,
    session: null,
    notice,
    stagingResetReceipt,
    bootstrapError: null,
  });
}

export function SessionProvider({
  apiOrigin,
  appEnv,
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
    async (notice = null, receipt = null) => {
      httpController.clearCsrfToken();
      setState(
        unauthenticatedSession(
          notice,
          sanitizeStagingResetReceipt(receipt, { appEnv, notice })
        )
      );
      await clearPrivateQueries(queryClient);
    },
    [appEnv, httpController, queryClient]
  );

  const consumeStagingResetReceipt = useCallback(() => {
    setState((current) => {
      if (
        current.status !== "unauthenticated" ||
        current.stagingResetReceipt === null
      ) {
        return current;
      }
      return unauthenticatedSession(null, null);
    });
  }, []);

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
      appEnv,
      httpClient,
      adoptSession,
      clearAuthentication,
      consumeStagingResetReceipt,
      retryBootstrap,
      signIn,
      signOut,
    }),
    [
      adoptSession,
      appEnv,
      clearAuthentication,
      consumeStagingResetReceipt,
      httpClient,
      retryBootstrap,
      signIn,
      signOut,
      state,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
