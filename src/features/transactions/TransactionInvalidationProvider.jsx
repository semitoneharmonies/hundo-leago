import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

import { useSession } from "../session/sessionContext.js";
import { invalidationPrefixes } from "./transactionInvalidation.js";

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
    socket.onAny(onAny);
    return () => {
      socket.offAny(onAny);
      socket.disconnect();
    };
  }, [queryClient, session.status, socketFactory, socketOrigin]);
  return children;
}
