import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

import { useSession } from "../session/sessionContext.js";
import {
  invalidateOnSocketReconnect,
  invalidationPrefixes,
} from "./transactionInvalidation.js";

export function TransactionInvalidationProvider({ children, socketOrigin, socketFactory = io }) {
  const session = useSession();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (session.status !== "authenticated" || !socketOrigin) return undefined;
    const socket = socketFactory(socketOrigin, { withCredentials: true, autoConnect: true });
    const onAny = (eventName, payload) => {
      for (const queryKey of invalidationPrefixes(eventName, payload)) {
        queryClient.invalidateQueries({ queryKey });
      }
    };
    const onConnect = () => invalidateOnSocketReconnect(queryClient);
    socket.onAny(onAny);
    if (typeof socket.on === "function") socket.on("connect", onConnect);
    return () => {
      socket.offAny(onAny);
      if (typeof socket.off === "function") socket.off("connect", onConnect);
      socket.disconnect();
    };
  }, [queryClient, session.status, socketFactory, socketOrigin]);
  return children;
}
