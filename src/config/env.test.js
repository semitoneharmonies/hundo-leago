import { describe, expect, it, vi } from "vitest";

import {
  FrontendConfigError,
  createFrontendConfig,
} from "./env.js";

const localConfig = Object.freeze({
  DEV: true,
  VITE_APP_ENV: "local",
  VITE_API_ORIGIN: " http://localhost:4000/ ",
  VITE_SOCKET_ORIGIN: "http://127.0.0.1:4000/",
});

describe("createFrontendConfig", () => {
  it("normalizes and freezes reviewed local target origins", () => {
    const config = createFrontendConfig(localConfig, { warn: vi.fn() });

    expect(config).toEqual({
      appEnv: "local",
      apiOrigin: "http://localhost:4000",
      socketOrigin: "http://127.0.0.1:4000",
      buildId: null,
    });
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("requires HTTPS and a build ID for deployed environments", () => {
    expect(() =>
      createFrontendConfig({
        VITE_APP_ENV: "staging",
        VITE_API_ORIGIN: "http://staging-api.example.test",
        VITE_SOCKET_ORIGIN: "https://staging-api.example.test",
        VITE_BUILD_ID: "build-1",
      })
    ).toThrow("must use HTTPS");

    expect(() =>
      createFrontendConfig({
        VITE_APP_ENV: "production",
        VITE_API_ORIGIN: "https://api.example.test",
        VITE_SOCKET_ORIGIN: "https://api.example.test",
      })
    ).toThrow("VITE_BUILD_ID");
  });

  it("rejects paths, URL credentials, and deployed loopback origins", () => {
    expect(() =>
      createFrontendConfig({
        ...localConfig,
        VITE_API_ORIGIN: "http://localhost:4000/api",
      })
    ).toThrow("without a path");

    expect(() =>
      createFrontendConfig({
        ...localConfig,
        VITE_API_ORIGIN: "http://user:pass@localhost:4000",
      })
    ).toThrow("invalid VITE_API_ORIGIN");

    expect(() =>
      createFrontendConfig({
        VITE_APP_ENV: "staging",
        VITE_API_ORIGIN: "https://localhost:4000",
        VITE_SOCKET_ORIGIN: "https://staging-api.example.test",
        VITE_BUILD_ID: "build-1",
      })
    ).toThrow("local origin");
  });

  it("maps only legacy local endpoint variables and warns", () => {
    const warn = vi.fn();
    const config = createFrontendConfig(
      {
        DEV: true,
        VITE_API_URL: "http://localhost:4000/api/league",
        VITE_SOCKET_URL: "http://localhost:4000/socket.io",
      },
      { warn }
    );

    expect(config).toEqual({
      appEnv: "local",
      apiOrigin: "http://localhost:4000",
      socketOrigin: "http://localhost:4000",
      buildId: null,
    });
    expect(warn).toHaveBeenCalledTimes(3);

    expect(() =>
      createFrontendConfig({
        VITE_APP_ENV: "staging",
        VITE_API_URL: "https://staging-api.example.test/api/league",
        VITE_SOCKET_URL: "https://staging-api.example.test",
        VITE_BUILD_ID: "build-1",
      })
    ).toThrow("VITE_API_ORIGIN");
  });

  it("fails closed for secret-shaped public input without echoing its value", () => {
    const secretValue = "Bearer should-not-appear-in-an-error";

    expect(() =>
      createFrontendConfig({
        ...localConfig,
        VITE_SESSION_TOKEN: "public-is-not-safe",
      })
    ).toThrow(FrontendConfigError);

    try {
      createFrontendConfig({
        ...localConfig,
        VITE_BUILD_ID: secretValue,
      });
      throw new Error("expected configuration validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(FrontendConfigError);
      expect(error.message).not.toContain(secretValue);
    }
  });
});
