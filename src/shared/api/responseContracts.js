const SAFE_CODE = /^[A-Z][A-Z0-9_]{0,127}$/;
const SAFE_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export class ResponseContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "ResponseContractError";
  }
}

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseRequestId(value, location) {
  contract(isRecord(value), `${location} must be an object.`);
  contract(
    SAFE_IDENTIFIER.test(value.requestId || ""),
    `${location}.requestId is invalid.`
  );
  return value.requestId;
}

function expectedKind(data, kind) {
  if (!kind) return true;
  if (kind === "array") return Array.isArray(data);
  if (kind === "object") return isRecord(data);
  if (kind === "null") return data === null;
  return typeof data === kind;
}

function parsePage(value) {
  contract(isRecord(value), "page must be an object.");
  contract(
    value.nextCursor === null || SAFE_IDENTIFIER.test(value.nextCursor || ""),
    "page.nextCursor is invalid."
  );
  contract(typeof value.hasMore === "boolean", "page.hasMore is invalid.");
  return Object.freeze({
    nextCursor: value.nextCursor,
    hasMore: value.hasMore,
  });
}

export function parseSuccessEnvelope(value, { dataKind, validateData } = {}) {
  contract(isRecord(value), "The success response must be an object.");
  contract(
    Object.prototype.hasOwnProperty.call(value, "data"),
    "The success response is missing data."
  );
  contract(
    expectedKind(value.data, dataKind),
    `The success response data must be ${dataKind}.`
  );
  const requestId = parseRequestId(value.meta, "meta");
  const page = Object.prototype.hasOwnProperty.call(value, "page")
    ? parsePage(value.page)
    : null;

  if (validateData) {
    contract(typeof validateData === "function", "validateData must be a function.");
    contract(validateData(value.data) !== false, "The response data is invalid.");
  }

  return Object.freeze({
    data: value.data,
    meta: Object.freeze({ requestId }),
    ...(page ? { page } : {}),
  });
}

export function parseErrorEnvelope(value) {
  contract(isRecord(value), "The error response must be an object.");
  contract(isRecord(value.error), "The error response is missing error data.");
  const { code, message, details, requestId } = value.error;
  contract(SAFE_CODE.test(code || ""), "The error code is invalid.");
  contract(
    typeof message === "string" && message.length > 0 && message.length <= 500,
    "The error message is invalid."
  );
  contract(
    details === undefined || details === null || typeof details === "object",
    "The error details are invalid."
  );
  contract(SAFE_IDENTIFIER.test(requestId || ""), "The request ID is invalid.");

  return Object.freeze({
    code,
    message,
    details: details ?? null,
    requestId,
  });
}

export function assertResourceIdentity(value, { requireVersion = false } = {}) {
  contract(isRecord(value), "The resource must be an object.");
  contract(SAFE_IDENTIFIER.test(value.id || ""), "The resource ID is invalid.");
  if (requireVersion) {
    contract(
      Number.isSafeInteger(value.version) && value.version >= 0,
      "The resource version is invalid."
    );
  }
  return true;
}

export function assertIntegerField(value, field, { min, max } = {}) {
  contract(isRecord(value), "The record must be an object.");
  const number = value[field];
  contract(Number.isSafeInteger(number), `${field} must be an integer.`);
  if (min !== undefined) contract(number >= min, `${field} is too small.`);
  if (max !== undefined) contract(number <= max, `${field} is too large.`);
  return true;
}
