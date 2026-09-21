import { useMemo, useState } from "react";

import { ActionTokenContext } from "./actionTokenContext.js";

export function ActionTokenProvider({ children, initialToken = null }) {
  const [token, setToken] = useState(initialToken);
  const value = useMemo(
    () => ({ token, clear: () => setToken(null) }),
    [token]
  );
  return (
    <ActionTokenContext.Provider value={value}>
      {children}
    </ActionTokenContext.Provider>
  );
}
