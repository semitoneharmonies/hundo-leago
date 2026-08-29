const APP_ENVIRONMENTS = new Set(["local", "staging", "production"]);
const SECRET_NAME_PATTERN =
  /(?:^|_)(?:PASSWORD|PASSCODE|SECRET|TOKEN|API_KEY|PRIVATE_KEY|CREDENTIAL|SESSION|CSRF|DATABASE)(?:_|$)/i;
const SECRET_VALUE_PATTERN =
  /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~-]+|(?:password|secret|api[_-]?key)\s*[:=])/i;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const HUNDO_DEPLOYED_BACKENDS = Object.freeze({
  production: new Set([
    "api.hundoleago.com",
    "hundo-leago-backend.onrender.com",
  ]),
  staging: new Set([
    "api-staging.hundoleago.com",
    "hundo-leago-backend-staging.onrender.com",
  ]),
});

export class FrontendConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "FrontendConfigError";
  }
}

function fail(message) {
  throw new FrontendConfigError(message);
}

function trimmed(value) {
  return typeof value === "string" ? value.trim() : "";
}

function rejectSecretShapedValues(source) {
  for (const [name, rawValue] of Object.entries(source || {})) {
    if (!name.startsWith("VITE_")) continue;
    if (SECRET_NAME_PATTERN.test(name)) {
      fail(`Frontend configuration contains a prohibited public variable: ${name}.`);
    }
    const value = trimmed(rawValue);
    if (value && SECRET_VALUE_PATTERN.test(value)) {
      fail(`Frontend configuration contains a secret-shaped value in ${name}.`);
    }
  }
}

function parseOrigin(name, rawValue, appEnv, { compatibility = false } = {}) {
  const value = trimmed(rawValue);
  if (!value) fail(`Frontend configuration is missing ${name}.`);

  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`Frontend configuration has an invalid ${name}.`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    fail(`Frontend configuration has an invalid ${name}.`);
  }
  if (url.username || url.password || url.search || url.hash) {
    fail(`Frontend configuration has an invalid ${name}.`);
  }
  if (!compatibility && url.pathname !== "/") {
    fail(`${name} must be an origin without a path.`);
  }

  const isLoopback = LOOPBACK_HOSTS.has(url.hostname.toLowerCase());
  if (appEnv !== "local" && isLoopback) {
    fail(`${name} cannot use a local origin in a deployed environment.`);
  }
  if (url.protocol === "http:" && (appEnv !== "local" || !isLoopback)) {
    fail(`${name} must use HTTPS outside loopback local development.`);
  }
  const forbiddenHundoBackends =
    appEnv === "staging"
      ? HUNDO_DEPLOYED_BACKENDS.production
      : appEnv === "production"
        ? HUNDO_DEPLOYED_BACKENDS.staging
        : null;
  if (
    forbiddenHundoBackends?.has(url.hostname.toLowerCase())
  ) {
    fail(`${name} points at the wrong Hundo Leago environment.`);
  }

  return url.origin;
}

function resolveAppEnvironment(source, warning) {
  const configured = trimmed(source?.VITE_APP_ENV);
  if (APP_ENVIRONMENTS.has(configured)) return configured;

  const hasLegacyLocalConfig =
    source?.DEV === true &&
    (trimmed(source?.VITE_API_URL) || trimmed(source?.VITE_SOCKET_URL));
  if (!configured && hasLegacyLocalConfig) {
    warning(
      "Using legacy local Vite variables. Add VITE_APP_ENV and target origin variables."
    );
    return "local";
  }

  fail("Frontend configuration has an invalid VITE_APP_ENV.");
}

function resolveOrigin(source, appEnv, targetName, legacyName, warning) {
  const targetValue = trimmed(source?.[targetName]);
  if (targetValue) return parseOrigin(targetName, targetValue, appEnv);

  const legacyValue = trimmed(source?.[legacyName]);
  if (appEnv === "local" && source?.DEV === true && legacyValue) {
    warning(`Using legacy ${legacyName}; migrate local configuration to ${targetName}.`);
    return parseOrigin(legacyName, legacyValue, appEnv, { compatibility: true });
  }

  fail(`Frontend configuration is missing ${targetName}.`);
}

export function createFrontendConfig(source, { warn = console.warn } = {}) {
  if (!source || typeof source !== "object") {
    fail("Frontend configuration is unavailable.");
  }
  if (typeof warn !== "function") {
    throw new TypeError("Frontend configuration requires a warning function.");
  }

  rejectSecretShapedValues(source);

  const warnings = new Set();
  const warning = (message) => {
    if (warnings.has(message)) return;
    warnings.add(message);
    warn(message);
  };
  const appEnv = resolveAppEnvironment(source, warning);
  const apiOrigin = resolveOrigin(
    source,
    appEnv,
    "VITE_API_ORIGIN",
    "VITE_API_URL",
    warning
  );
  const socketOrigin = resolveOrigin(
    source,
    appEnv,
    "VITE_SOCKET_ORIGIN",
    "VITE_SOCKET_URL",
    warning
  );
  const buildId = trimmed(source.VITE_BUILD_ID);
  if (appEnv !== "local" && !buildId) {
    fail("Frontend configuration is missing VITE_BUILD_ID.");
  }

  return Object.freeze({
    appEnv,
    apiOrigin,
    socketOrigin,
    buildId: buildId || null,
  });
}

export const frontendConfigResult = (() => {
  try {
    return Object.freeze({
      config: createFrontendConfig(import.meta.env),
      error: null,
    });
  } catch (error) {
    return Object.freeze({
      config: null,
      error:
        error instanceof FrontendConfigError
          ? error
          : new FrontendConfigError("Frontend configuration is invalid."),
    });
  }
})();

export const frontendConfig = frontendConfigResult.config;
