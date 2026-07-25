import { createContext, useContext } from "react";

export const ActionTokenContext = createContext(null);

export function useActionToken() {
  const value = useContext(ActionTokenContext);
  if (!value) {
    throw new Error("useActionToken must be used within ActionTokenProvider.");
  }
  return value;
}
