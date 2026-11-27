import { queryOptions } from "@tanstack/react-query";
import { validateAdminAnalytics } from "./analyticsContracts.js";

export function adminAnalyticsQuery(httpClient, days = 28) {
  if (![7, 28, 90].includes(days)) throw new TypeError("Choose a supported analytics period.");
  return queryOptions({
    queryKey: ["admin", "analytics", days],
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(`/api/v1/admin/analytics?days=${days}`, {
        authenticated: true,
        dataKind: "object",
        validateData: (data) => validateAdminAnalytics(data, days),
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