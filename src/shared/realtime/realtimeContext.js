import { createContext, useContext } from "react";

export const RealtimeContext = createContext(
  Object.freeze({ status: "disconnected", privacyEpoch: 0 })
);

export function useRealtime() {
  return useContext(RealtimeContext);
}
