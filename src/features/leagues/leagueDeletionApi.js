import { ResponseContractError } from "../../shared/api/responseContracts.js";

function validateResult(data, leagueId, preview) {
  const validCounts = (counts) => counts && typeof counts === "object" && !Array.isArray(counts) &&
    Object.values(counts).every((count) => Number.isSafeInteger(count) && count >= 0);
  if (data?.code !== (preview ? "LEAGUE_DELETION_PREVIEW" : "LEAGUE_DELETED") ||
      data?.league?.id !== leagueId || typeof data.league.name !== "string" || !data.league.name ||
      (preview ? !/^[0-9a-f]{64}$/.test(data.previewHash || "") ||
        !validCounts(data.counts) || !validCounts(data.retainedCounts) ||
        !Number.isSafeInteger(data.totalRecords) || data.totalRecords < 1 ||
        data.totalRecords !== 1 + Object.values(data.counts).reduce((sum, count) => sum + count, 0)
        : !Number.isSafeInteger(data.deletedRecords) || data.deletedRecords < 1)) {
    throw new ResponseContractError("The league deletion response could not be verified.");
  }
  return true;
}

export async function previewLeagueDeletion(httpClient, leagueId) {
  return (await httpClient.request(`/api/v1/admin/leagues/${encodeURIComponent(leagueId)}/deletion-preview`, {
    authenticated: true, dataKind: "object", validateData: (data) => validateResult(data, leagueId, true),
  })).data;
}

export async function deleteLeague(httpClient, leagueId, input, idempotencyKey) {
  return (await httpClient.request(`/api/v1/admin/leagues/${encodeURIComponent(leagueId)}`, {
    method: "DELETE", authenticated: true, body: input, idempotencyKey,
    dataKind: "object", validateData: (data) => validateResult(data, leagueId, false),
  })).data;
}
