import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { frontendConfig } from "../../config/env.js";
import { analyticsAllowed, analyticsCategory, createAggregateSender, startAggregatePageCounter } from "./aggregateCollector.js";
import { startAggregateBrowserMetrics } from "./aggregateMetrics.js";
import { startAggregatePerformance } from "./aggregatePerformance.js";

export function AggregateAnalyticsCollector({ apiOrigin = frontendConfig?.apiOrigin }) {
  const { pathname } = useLocation();
  const browserMetrics = useRef(null);
  useEffect(() => {
    if (!apiOrigin || !analyticsAllowed()) return undefined;
    const browser = startAggregateBrowserMetrics({ apiOrigin, onReady: startAggregatePerformance });
    browserMetrics.current = browser;
    return () => { browser.stop(); browserMetrics.current = null; };
  }, [apiOrigin]);
  useEffect(() => {
    const page = analyticsCategory(pathname);
    if (!apiOrigin || !page || !analyticsAllowed()) return undefined;
    const send = createAggregateSender(apiOrigin);
    return startAggregatePageCounter({ page, send: body => {
      if (body.pageViews) browserMetrics.current?.opening();
      send(body);
    } });
  }, [apiOrigin, pathname]);
  return null;
}
