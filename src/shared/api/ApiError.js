const SAFE_CODE = /^[A-Z][A-Z0-9_]{0,127}$/;

function optionalString(value, maximumLength) {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= maximumLength
    ? value
    : null;
}

export class ApiError extends Error {
  constructor({
    status = 0,
    code,
    message,
    details = null,
    requestId = null,
    retryAfterSeconds = null,
    category = "http",
  }) {
    const safeMessage = optionalString(message, 500) || "The request failed.";
    super(safeMessage);
    this.name = "ApiError";
    this.status = Number.isInteger(status) && status >= 0 ? status : 0;
    this.code = SAFE_CODE.test(code || "") ? code : "REQUEST_FAILED";
    this.details =
      details !== null && typeof details === "object" ? details : null;
    this.requestId = optionalString(requestId, 128);
    this.retryAfterSeconds =
      Number.isInteger(retryAfterSeconds) && retryAfterSeconds >= 0
        ? retryAfterSeconds
        : null;
    this.category = optionalString(category, 40) || "http";
  }
}
