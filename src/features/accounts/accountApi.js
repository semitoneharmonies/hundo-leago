import { ApiError } from "../../shared/api/ApiError.js";
import { validateSessionData } from "../session/sessionContracts.js";

function acceptedData(data) {
  return data?.accepted === true;
}

export function createIntentKey(scope, cryptoImpl = globalThis.crypto) {
  if (
    typeof scope !== "string" ||
    !/^[a-z][a-z0-9-]{1,39}$/.test(scope) ||
    !cryptoImpl ||
    typeof cryptoImpl.randomUUID !== "function"
  ) {
    throw new ApiError({
      code: "SECURE_INTENT_ID_UNAVAILABLE",
      message: "This request cannot be submitted securely in this browser.",
      category: "client",
    });
  }
  return `${scope}:${cryptoImpl.randomUUID()}`;
}

export async function registerAccount(httpClient, input, idempotencyKey) {
  const response = await httpClient.request("/api/v1/accounts", {
    method: "POST",
    body: input,
    idempotencyKey,
    dataKind: "object",
    validateData: acceptedData,
  });
  return response.data;
}

async function requestGenericLink(httpClient, path, email) {
  const response = await httpClient.request(path, {
    method: "POST",
    body: { email },
    dataKind: "object",
    validateData: acceptedData,
  });
  return response.data;
}

export function requestEmailVerification(httpClient, email) {
  return requestGenericLink(
    httpClient,
    "/api/v1/accounts/email-verification-requests",
    email
  );
}

export function requestPasswordReset(httpClient, email) {
  return requestGenericLink(httpClient, "/api/v1/password-reset-requests", email);
}

export function requestAccountReactivation(httpClient, email) {
  return requestGenericLink(
    httpClient,
    "/api/v1/account/reactivation-requests",
    email
  );
}

export async function verifyEmail(httpClient, token) {
  const response = await httpClient.request(
    "/api/v1/accounts/email-verifications",
    {
      method: "POST",
      body: { token },
      dataKind: "object",
      validateData: validateSessionData,
    }
  );
  return response.data;
}

export async function completeCredentialSetup(httpClient, input) {
  const response = await httpClient.request(
    "/api/v1/accounts/credential-setups",
    { method: "POST", body: input, dataKind: "object" }
  );
  return response.data;
}

export async function resetPassword(httpClient, input) {
  const response = await httpClient.request("/api/v1/password-resets", {
    method: "POST",
    body: input,
    dataKind: "object",
  });
  return response.data;
}

export async function reactivateAccount(httpClient, input) {
  const response = await httpClient.request("/api/v1/account/reactivations", {
    method: "POST",
    body: input,
    dataKind: "object",
  });
  return response.data;
}
