import { validateSessionData } from "./sessionContracts.js";

export async function bootstrapSession(httpClient, { signal } = {}) {
  const response = await httpClient.request("/api/v1/session", {
    authenticated: true,
    dataKind: "object",
    validateData: validateSessionData,
    signal,
  });
  return response.data;
}

export async function createSession(httpClient, credentials) {
  const response = await httpClient.request("/api/v1/session", {
    method: "POST",
    body: credentials,
    dataKind: "object",
    validateData: validateSessionData,
  });
  return response.data;
}

export async function deleteSession(httpClient) {
  const response = await httpClient.request("/api/v1/session", {
    method: "DELETE",
    authenticated: true,
    body: {},
    dataKind: "object",
  });
  return response.data;
}
