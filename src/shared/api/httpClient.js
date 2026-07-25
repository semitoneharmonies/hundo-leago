import { ApiError } from "./ApiError.js";
import {
  ResponseContractError,
  parseErrorEnvelope,
  parseSuccessEnvelope,
} from "./responseContracts.js";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SAFE_PATH = /^\/(?!\/)/;
const IDEMPOTENCY_KEY = /^[\x21-\x7E]{1,200}$/;

function clientError(message) {
  return new ApiError({
    code: "CLIENT_REQUEST_INVALID",
    message,
    category: "client",
  });
}

function canonicalVersion(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw clientError("The request version is invalid.");
  }
  return `"${value}"`;
}

function retryAfterSeconds(response) {
  const value = response.headers.get("Retry-After");
  if (!value || !/^\d+$/.test(value)) return null;
  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds <= 86_400 ? seconds : null;
}

async function readJson(response) {
  const text = await response.text();
  if (!text) throw new ResponseContractError("The response body is empty.");
  try {
    return JSON.parse(text);
  } catch {
    throw new ResponseContractError("The response body is not valid JSON.");
  }
}

function applicationDataError(response) {
  return new ApiError({
    status: response.status,
    code: "APPLICATION_DATA_INVALID",
    message: "The server returned data the application could not use.",
    category: "application-data",
  });
}

export function createHttpClient({
  apiOrigin,
  fetchImpl = globalThis.fetch,
  getCsrfToken = () => null,
  onUnauthorized = () => {},
} = {}) {
  let origin;
  try {
    origin = new URL(apiOrigin).origin;
  } catch {
    throw new TypeError("The HTTP client requires a valid API origin.");
  }
  if (origin !== apiOrigin || !/^https?:\/\//.test(origin)) {
    throw new TypeError("The HTTP client requires a normalized HTTP API origin.");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("The HTTP client requires fetch.");
  }
  if (typeof getCsrfToken !== "function" || typeof onUnauthorized !== "function") {
    throw new TypeError("The HTTP client requires session callbacks.");
  }

  async function request(
    path,
    {
      method = "GET",
      body,
      authenticated = false,
      version,
      idempotencyKey,
      signal,
      dataKind,
      validateData,
    } = {}
  ) {
    if (typeof path !== "string" || !SAFE_PATH.test(path)) {
      throw clientError("The request path is invalid.");
    }
    const normalizedMethod = String(method).toUpperCase();
    if (!/^[A-Z]+$/.test(normalizedMethod)) {
      throw clientError("The request method is invalid.");
    }
    const hasBody = body !== undefined;
    if (hasBody && ["GET", "HEAD"].includes(normalizedMethod)) {
      throw clientError("This request method cannot include a JSON body.");
    }

    const headers = new Headers({ Accept: "application/json" });
    if (hasBody) headers.set("Content-Type", "application/json");
    if (version !== undefined) headers.set("If-Match", canonicalVersion(version));
    if (idempotencyKey !== undefined) {
      if (
        typeof idempotencyKey !== "string" ||
        !IDEMPOTENCY_KEY.test(idempotencyKey) ||
        idempotencyKey !== idempotencyKey.trim()
      ) {
        throw clientError("The idempotency key is invalid.");
      }
      headers.set("Idempotency-Key", idempotencyKey);
    }
    if (authenticated && UNSAFE_METHODS.has(normalizedMethod)) {
      const csrfToken = getCsrfToken();
      if (typeof csrfToken !== "string" || !csrfToken) {
        throw clientError("The authenticated request has no CSRF token.");
      }
      headers.set("X-CSRF-Token", csrfToken);
    }

    let response;
    try {
      response = await fetchImpl(`${origin}${path}`, {
        method: normalizedMethod,
        credentials: "include",
        headers,
        ...(hasBody ? { body: JSON.stringify(body) } : {}),
        ...(signal ? { signal } : {}),
      });
    } catch (error) {
      if (error?.name === "AbortError" || signal?.aborted) {
        throw new ApiError({
          code: "REQUEST_ABORTED",
          message: "The request was cancelled.",
          category: "aborted",
        });
      }
      throw new ApiError({
        code: "NETWORK_ERROR",
        message: "The server could not be reached.",
        category: "network",
      });
    }

    if (response.status === 401 && authenticated) {
      try {
        await onUnauthorized();
      } catch {
        // Authentication loss still takes precedence over cleanup callback failure.
      }
    }

    if (response.status === 204 && response.ok) {
      return Object.freeze({ data: null, meta: Object.freeze({ requestId: null }) });
    }

    let envelope;
    try {
      envelope = await readJson(response);
    } catch (error) {
      if (error instanceof ResponseContractError) {
        throw applicationDataError(response);
      }
      throw error;
    }

    if (!response.ok) {
      try {
        const parsed = parseErrorEnvelope(envelope);
        throw new ApiError({
          status: response.status,
          ...parsed,
          retryAfterSeconds: retryAfterSeconds(response),
          category: "http",
        });
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError({
          status: response.status,
          code: "HTTP_REQUEST_FAILED",
          message: "The request could not be completed.",
          retryAfterSeconds: retryAfterSeconds(response),
          category: "http",
        });
      }
    }

    try {
      return parseSuccessEnvelope(envelope, { dataKind, validateData });
    } catch (error) {
      if (error instanceof ResponseContractError) {
        throw applicationDataError(response);
      }
      throw error;
    }
  }

  return Object.freeze({ request });
}
