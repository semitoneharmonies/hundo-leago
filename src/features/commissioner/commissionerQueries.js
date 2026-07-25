import { queryOptions } from "@tanstack/react-query";

import {
  validateCommissionerCorrectionResult,
  validateCommissionerWorkspace,
  validateStagingFixtureResetResult,
} from "./commissionerContracts.js";

const part = (value) => encodeURIComponent(value);

export const commissionerKeys = Object.freeze({
  workspace: (leagueId) => [
    "league",
    leagueId,
    "commissioner",
    "roster-workspace",
  ],
});

const CORRECTION_PATHS = Object.freeze({
  add: "roster-additions",
  remove: "roster-removals",
  roster: "roster-corrections",
  contract: "contract-corrections",
});

function correctionPath(leagueId, operation, preview) {
  const path = CORRECTION_PATHS[operation];
  if (!path) throw new TypeError("The commissioner operation is invalid.");
  return `/api/v1/leagues/${part(leagueId)}/commissioner/${path}${
    preview ? "/previews" : ""
  }`;
}

export function commissionerWorkspaceQuery(httpClient, leagueId) {
  return queryOptions({
    queryKey: commissionerKeys.workspace(leagueId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${part(
          leagueId
        )}/commissioner/roster-workspace`,
        {
          authenticated: true,
          dataKind: "object",
          validateData: validateCommissionerWorkspace,
          signal,
        }
      );
      return response.data.workspace;
    },
    meta: { private: true, leagueId },
    staleTime: 10_000,
  });
}

export async function previewCommissionerCorrection(
  httpClient,
  leagueId,
  operation,
  input
) {
  const response = await httpClient.request(
    correctionPath(leagueId, operation, true),
    {
      method: "POST",
      body: input,
      authenticated: true,
      dataKind: "object",
      validateData: (data) =>
        validateCommissionerCorrectionResult(data, true),
    }
  );
  return response.data;
}

export async function applyCommissionerCorrection(
  httpClient,
  leagueId,
  operation,
  input,
  idempotencyKey
) {
  const response = await httpClient.request(
    correctionPath(leagueId, operation, false),
    {
      method: "POST",
      body: input,
      authenticated: true,
      idempotencyKey,
      dataKind: "object",
      validateData: (data) =>
        validateCommissionerCorrectionResult(data, false),
    }
  );
  return response.data;
}

export async function resetStagingFixture(
  httpClient,
  input,
  idempotencyKey
) {
  const response = await httpClient.request(
    "/api/v1/operations/staging-fixture-reset",
    {
      method: "POST",
      body: input,
      authenticated: true,
      idempotencyKey,
      dataKind: "object",
      validateData: validateStagingFixtureResetResult,
    }
  );
  return response.data;
}
