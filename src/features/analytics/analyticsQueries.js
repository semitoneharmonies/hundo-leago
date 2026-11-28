import { queryOptions } from "@tanstack/react-query";
import { validateAdminAnalytics } from "./analyticsContracts.js";
import { calendarPeriod, normalizeAnalyticsSelection } from "./analyticsPeriods.js";

export function adminAnalyticsQuery(httpClient, selection = 28, { detail = false } = {}) {
  if (typeof detail !== "boolean") throw new TypeError("Choose a supported analytics detail.");
  const selected = normalizeAnalyticsSelection(selection);
  const rolling = selected.kind === "days";
  if (!rolling) calendarPeriod(selected.kind, selected.value);
  const queryString = (rolling ? `days=${selected.days}` : `${selected.kind}=${encodeURIComponent(selected.value)}`) + (detail ? "&detail=pages" : "");
  const key = rolling ? ["admin", "analytics", selected.days] : ["admin", "analytics", selected.kind, selected.value];
  return queryOptions({
    queryKey: detail ? [...key, "pages"] : key,
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(`/api/v1/admin/analytics?${queryString}`, {
        authenticated: true,
        dataKind: "object",
        validateData: (data) => validateAdminAnalytics(data, selected, detail),
        signal,
      });
      return response.data;
    },
    meta: { private: true, suppressGlobalError: true },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
