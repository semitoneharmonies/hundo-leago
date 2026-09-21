import { ApiError } from "../../shared/api/ApiError.js";

const REFRESH_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

function validRefresh(data) {
  return (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    typeof data.jobId === "string" &&
    REFRESH_ID.test(data.jobId) &&
    data.status === "succeeded" &&
    Number.isSafeInteger(data.playerCount) &&
    data.playerCount >= 0 &&
    Number.isSafeInteger(data.capturedAtMs) &&
    data.capturedAtMs > 0 &&
    Number.isFinite(new Date(data.capturedAtMs).getTime())
  );
}

export async function refreshStatistics(httpClient) {
  const { data } = await httpClient.request("/api/v1/operations/statistics/refresh", {
    method: "POST",
    authenticated: true,
    body: {},
    dataKind: "object",
    validateData: validRefresh,
  });
  // A 204 response also passes through the shared client; it cannot prove completion.
  if (!validRefresh(data)) {
    throw new ApiError({
      code: "APPLICATION_DATA_INVALID",
      message: "The statistics refresh result could not be confirmed.",
      category: "application-data",
    });
  }
  return data;
}
