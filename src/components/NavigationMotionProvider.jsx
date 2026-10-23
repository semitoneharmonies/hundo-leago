import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavigationMotionContext } from "./navigationMotion.js";

export function NavigationMotionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pending = useRef(null);
  useEffect(() => {
    if (pending.current && pending.current.to !== `${location.pathname}${location.search}`) pending.current = null;
  }, [location.pathname, location.search]);
  const value = useMemo(() => ({
    selection(identity) {
      if (pending.current?.identity !== identity) return null;
      return pending.current;
    },
    complete(selection) {
      if (pending.current === selection) pending.current = null;
    },
    select(event, to, identity) {
      if (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      pending.current = { identity, to, rect: event.currentTarget.getBoundingClientRect(), createdAt: Date.now() };
      navigate(to);
    },
  }), [navigate]);
  return <NavigationMotionContext.Provider value={value}>{children}</NavigationMotionContext.Provider>;
}
