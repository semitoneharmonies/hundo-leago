import { queryOptions } from "@tanstack/react-query";

import { validatePublicRosterResponse } from "./publicRosterContracts.js";

export const publicRosterKeys = Object.freeze({
  team: (leagueId, teamId) => ["public-roster", leagueId, teamId],
});

export function publicRosterQuery(httpClient, leagueId, teamId) {
  return queryOptions({
    queryKey: publicRosterKeys.team(leagueId, teamId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(`/api/v1/public/leagues/${leagueId}/teams/${teamId}/roster`, {
        dataKind: "object",
        validateData: validatePublicRosterResponse,
        signal,
      });
      return response.data.roster;
    },
    meta: { private: false },
    staleTime: 15_000,
  });
}
