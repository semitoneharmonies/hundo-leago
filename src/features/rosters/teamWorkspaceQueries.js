import { queryOptions } from "@tanstack/react-query";

import { validateTeamWorkspace } from "./teamWorkspaceContracts.js";

const part = (value) => encodeURIComponent(value);

export const teamWorkspaceKeys = Object.freeze({
  detail: (leagueId, teamId) => [
    "league",
    leagueId,
    "team",
    teamId,
    "workspace",
  ],
});

export function teamWorkspaceQuery(httpClient, leagueId, teamId) {
  return queryOptions({
    queryKey: teamWorkspaceKeys.detail(leagueId, teamId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${part(leagueId)}/teams/${part(teamId)}/roster`,
        {
          authenticated: true,
          dataKind: "object",
          validateData: validateTeamWorkspace,
          signal,
        }
      );
      return response.data;
    },
    meta: { private: true, leagueId },
    staleTime: 10_000,
  });
}

export async function saveRosterDisplayOrder(
  httpClient,
  leagueId,
  teamId,
  input
) {
  const response = await httpClient.request(
    `/api/v1/leagues/${part(leagueId)}/teams/${part(teamId)}/roster-display-order`,
    {
      method: "PUT",
      authenticated: true,
      body: input,
      dataKind: "object",
    }
  );
  return response.data;
}
