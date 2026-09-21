import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

import { bootstrapSession } from "../../features/session/sessionApi.js";
import { useSession } from "../../features/session/sessionContext.js";
import {
  applyRealtimeInvalidation,
  isRealtimePrivacyBoundary,
  parseRealtimeEnvelope,
  reauthorizePrivateQueriesOnReconnect,
} from "./realtimeInvalidation.js";
import { RealtimeContext } from "./realtimeContext.js";

const EMPTY_MAPPERS = Object.freeze([]);

function belongsToLeague(query, leagueId) {
  const queryKey = query?.queryKey;
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === "league" &&
    queryKey[1] === leagueId
  );
}

export function RealtimeProvider({
  children,
  socketOrigin,
  socketFactory = io,
  invalidationMappers = EMPTY_MAPPERS,
}) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [privacyEpoch, setPrivacyEpoch] = useState(0);
  const sessionStatus = session.status;
  const sessionId = session.session?.id;
  const userId = session.user?.id;
  const adoptSession = session.adoptSession;
  const clearAuthentication = session.clearAuthentication;
  const httpClient = session.httpClient;

  if (
    !Array.isArray(invalidationMappers) ||
    invalidationMappers.some((mapper) => typeof mapper !== "function")
  ) {
    throw new TypeError("RealtimeProvider requires invalidation mapper functions.");
  }

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !socketOrigin) return undefined;

    let active = true;
    let authorizationGeneration = 0;
    let authorizationController;
    let reconnecting = 0;
    let eventPrivacyBoundaries = 0;
    let postPrivacyStatus = "connected";
    const settlePrivacyStatus = () => {
      if (active && reconnecting === 0 && eventPrivacyBoundaries === 0) {
        setSocketStatus(postPrivacyStatus);
      }
    };
    const socket = socketFactory(socketOrigin, {
      withCredentials: true,
      autoConnect: true,
    });

    const onAny = (eventName, payload) => {
      let envelope;
      try {
        envelope = parseRealtimeEnvelope(eventName, payload);
      } catch {
        return;
      }
      const privacyBoundary = isRealtimePrivacyBoundary(envelope);
      if (privacyBoundary) {
        eventPrivacyBoundaries += 1;
        setSocketStatus("reauthorizing");
        setPrivacyEpoch((value) => value + 1);
      }
      const applied = applyRealtimeInvalidation(
        queryClient,
        envelope,
        invalidationMappers
      );
      if (privacyBoundary) {
        void applied
          .then(() =>
            queryClient.invalidateQueries({
              predicate: (query) => belongsToLeague(query, envelope.leagueId),
              refetchType: "active",
            })
          )
          .catch(() => {})
          .finally(() => {
            eventPrivacyBoundaries -= 1;
            settlePrivacyStatus();
          });
      }
    };

    const reauthorizeSession = async (serverDisconnected = false) => {
      const generation = ++authorizationGeneration;
      authorizationController?.abort();
      const controller = new AbortController();
      authorizationController = controller;
      const isCurrent = () => active && generation === authorizationGeneration;
      reconnecting += 1;
      postPrivacyStatus = serverDisconnected ? "disconnected" : "connected";
      setSocketStatus("reauthorizing");
      setPrivacyEpoch((value) => value + 1);
      try {
        await reauthorizePrivateQueriesOnReconnect(queryClient);
        if (!isCurrent()) return;
        const current = await bootstrapSession(httpClient, { signal: controller.signal });
        if (!isCurrent()) return;
        const adopted = await adoptSession(current);
        if (!isCurrent() || adopted === false) return;
        await queryClient.invalidateQueries({ refetchType: "active" });
        if (serverDisconnected && isCurrent()) socket.connect();
      } catch (error) {
        if (isCurrent()) {
          postPrivacyStatus = "disconnected";
          // An explicit server disconnect is an authority boundary. If its
          // fresh HTTP check cannot confirm access, discard the old viewer.
          // HTTP 401 already clears authentication through the session client.
          if (serverDisconnected && error?.status !== 401) {
            await clearAuthentication("session-expired");
          }
        }
      } finally {
        reconnecting -= 1;
        settlePrivacyStatus();
      }
    };

    const onConnect = () => reauthorizeSession();
    const onDisconnect = (reason) => {
      postPrivacyStatus = "disconnected";
      if (reason === "io server disconnect") return reauthorizeSession(true);
      authorizationGeneration += 1;
      authorizationController?.abort();
      settlePrivacyStatus();
    };
    const onConnectError = (error) => {
      postPrivacyStatus = "disconnected";
      if (error?.data?.code === "SOCKET_SESSION_REQUIRED") {
        authorizationGeneration += 1;
        authorizationController?.abort();
        return clearAuthentication("session-expired");
      }
      settlePrivacyStatus();
    };

    socket.onAny(onAny);
    if (typeof socket.on === "function") {
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onConnectError);
    }

    return () => {
      active = false;
      authorizationController?.abort();
      socket.offAny(onAny);
      if (typeof socket.off === "function") {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);
      }
      socket.disconnect();
    };
  }, [
    adoptSession,
    clearAuthentication,
    httpClient,
    invalidationMappers,
    queryClient,
    sessionStatus,
    sessionId,
    userId,
    socketFactory,
    socketOrigin,
  ]);

  const status =
    sessionStatus === "authenticated" && socketOrigin
      ? socketStatus
      : "disconnected";
  const value = useMemo(
    () => Object.freeze({ status, privacyEpoch }),
    [privacyEpoch, status]
  );
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}
