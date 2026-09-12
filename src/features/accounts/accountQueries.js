import { queryOptions } from "@tanstack/react-query";
import { ResponseContractError } from "../../shared/api/responseContracts.js";

const ID =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

function validateAccountProfile(data) {
  if (
    data?.code !== "ACCOUNT_PROFILE_FOUND" ||
    !data.user ||
    !ID.test(data.user.id || "") ||
    typeof data.user.email !== "string" ||
    typeof data.user.displayName !== "string" ||
    !Number.isSafeInteger(data.user.version)
  ) {
    throw new ResponseContractError("The account profile is invalid.");
  }
  return true;
}

export const accountKeys = Object.freeze({
  profile: ["account", "profile"],
});

export function accountProfileQuery(httpClient) {
  return queryOptions({
    queryKey: accountKeys.profile,
    queryFn: async ({ signal }) => {
      const response = await httpClient.request("/api/v1/account", {
        authenticated: true,
        dataKind: "object",
        validateData: validateAccountProfile,
        signal,
      });
      return response.data.user;
    },
    meta: { private: true },
    staleTime: 30_000,
  });
}

export async function updateAccountProfile(
  httpClient,
  input,
  expectedVersion
) {
  const response = await httpClient.request("/api/v1/account", {
    method: "PATCH",
    authenticated: true,
    body: input,
    version: expectedVersion,
    dataKind: "object",
  });
  return response.data.user;
}

export async function changePassword(httpClient, input) {
  const response = await httpClient.request("/api/v1/session/password", {
    method: "POST",
    authenticated: true,
    body: input,
    dataKind: "object",
  });
  return response.data;
}

export async function updateTeamProfile(
  httpClient,
  leagueId,
  teamId,
  input,
  expectedVersion,
  idempotencyKey
) {
  const part = encodeURIComponent;
  const response = await httpClient.request(
    `/api/v1/leagues/${part(leagueId)}/teams/${part(teamId)}`,
    {
      method: "PATCH",
      authenticated: true,
      body: input,
      version: expectedVersion,
      idempotencyKey,
      dataKind: "object",
    }
  );
  return response.data.team;
}
