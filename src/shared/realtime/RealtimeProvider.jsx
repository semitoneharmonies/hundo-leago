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
  const adoptSession = session.adoptSession;
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

    const onConnect = async () => {
      reconnecting += 1;
      postPrivacyStatus = "connected";
      setSocketStatus("reauthorizing");
      setPrivacyEpoch((value) => value + 1);
      try {
        await reauthorizePrivateQueriesOnReconnect(queryClient);
        const current = await bootstrapSession(httpClient);
        if (!active) return;
        await adoptSession(current);
        await queryClient.invalidateQueries({ refetchType: "active" });
      } catch {
        postPrivacyStatus = "disconnected";
      } finally {
        reconnecting -= 1;
        settlePrivacyStatus();
      }
    };

    const onDisconnect = () => {
      postPrivacyStatus = "disconnected";
      settlePrivacyStatus();
    };

    socket.onAny(onAny);
    if (typeof socket.on === "function") {
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onDisconnect);
    }

    return () => {
      active = false;
      socket.offAny(onAny);
      if (typeof socket.off === "function") {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onDisconnect);
      }
      socket.disconnect();
    };
  }, [
    adoptSession,
    httpClient,
    invalidationMappers,
    queryClient,
    sessionStatus,
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
