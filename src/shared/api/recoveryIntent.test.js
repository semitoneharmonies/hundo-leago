import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindNewIntentToRecovery, observeRecoveryEpoch } from "./recoveryIntent.js";
import { createIdempotencyKey, createOperationId } from "./idempotency.js";
import { createIntentKey } from "../../features/accounts/accountApi.js";
import { createSessionHttpController } from "../../features/session/sessionHttpController.js";

const FIRST = "11111111-1111-4111-8111-111111111111";
const SECOND = "22222222-2222-4222-8222-222222222222";
const INTENT = "33333333-3333-4333-8333-333333333333";
const cryptoImpl = { randomUUID: () => INTENT };
const response = (epoch, status = 200) => new Response(JSON.stringify(status === 200
  ? { data: {}, meta: { requestId: "request-1" } }
  : { error: { code: "SESSION_REQUIRED", message: "Sign in again." } }), {
  status, headers: { "Content-Type": "application/json", ...(epoch === null ? {} : { "X-Hundo-Recovery-Epoch": epoch }) },
});

beforeEach(() => observeRecoveryEpoch("initial"));
afterEach(() => { observeRecoveryEpoch("initial"); vi.restoreAllMocks(); });

describe("recovery-bound user intents", () => {
  it("binds only newly created keys while preserving old strings across two recovery contexts", () => {
    const original = createIdempotencyKey("trade-proposal", cryptoImpl);
    expect(createOperationId(cryptoImpl)).toBe(INTENT);
    expect(createIdempotencyKey("trade-proposal", cryptoImpl, "-")).toBe(`trade-proposal-${INTENT}`);
    observeRecoveryEpoch(FIRST);
    const first = createIdempotencyKey("trade-proposal", cryptoImpl);
    observeRecoveryEpoch(SECOND);
    expect(createIdempotencyKey("trade-proposal", cryptoImpl)).toBe(`recovery:${SECOND}:${original}`);
    expect(first).toBe(`recovery:${FIRST}:${original}`);
    expect(original).toBe(`trade-proposal:${INTENT}`);
    expect(() => bindNewIntentToRecovery(first)).toThrow();
    expect(createIntentKey("account-signup", cryptoImpl)).toBe(`recovery:${SECOND}:account-signup:${INTENT}`);
    expect(createIdempotencyKey("a".repeat(40), cryptoImpl).length).toBeLessThanOrEqual(128);
    expect(createOperationId(cryptoImpl)).toBe(`recovery:${SECOND}:${INTENT}`);
    expect(createIdempotencyKey("trade-proposal", cryptoImpl, "-")).toBe(`recovery:${SECOND}:trade-proposal-${INTENT}`);
  });

  it("keeps the known context on missing or malformed headers and requires secure randomness", () => {
    observeRecoveryEpoch(FIRST); observeRecoveryEpoch(null);
    expect(() => observeRecoveryEpoch("private-invalid-value")).toThrow("The app could not verify this action.");
    expect(createIdempotencyKey("trade-proposal", cryptoImpl)).toContain(`recovery:${FIRST}:`);
    for (const factory of [createIdempotencyKey, createIntentKey]) {
      expect(() => factory("trade-proposal", {})).toThrow();
      expect(() => factory("trade-proposal", { randomUUID: () => "not-secure" })).toThrow();
    }
    expect(() => createOperationId({})).toThrow();
    expect(() => bindNewIntentToRecovery("x".repeat(100))).toThrow();
  });

  it("learns a recovery context from anonymous bootstrap failure before creating a sign-up intent", async () => {
    const fetchImpl = vi.fn(async () => response(FIRST, 401));
    const controller = createSessionHttpController({ apiOrigin: "https://example.test", fetchImpl });
    let keyDuringCleanup;
    controller.setOnUnauthorized(() => { controller.clearCsrfToken(); keyDuringCleanup = createIntentKey("account-signup", cryptoImpl); });
    await expect(controller.httpClient.request("/api/v1/session", { authenticated: true })).rejects.toMatchObject({ status: 401 });
    expect(keyDuringCleanup).toBe(`recovery:${FIRST}:account-signup:${INTENT}`);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("sends a saved key unchanged after session refresh and never retries automatically", async () => {
    const saved = createIdempotencyKey("trade-proposal", cryptoImpl);
    const fetchImpl = vi.fn().mockResolvedValueOnce(response(FIRST, 401)).mockResolvedValueOnce(response(FIRST, 409)).mockResolvedValueOnce(response(SECOND));
    const controller = createSessionHttpController({ apiOrigin: "https://example.test", fetchImpl });
    await expect(controller.httpClient.request("/api/v1/session", { authenticated: true })).rejects.toMatchObject({ status: 401 });
    controller.setCsrfToken("fresh-session-token");
    await expect(controller.httpClient.request("/api/v1/trades", { method: "POST", authenticated: true, body: {}, idempotencyKey: saved }))
      .rejects.toMatchObject({ status: 409 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][1].headers.get("Idempotency-Key")).toBe(saved);
    const first = createIntentKey("trade-proposal", cryptoImpl);
    await controller.httpClient.request("/api/v1/session");
    expect(first).toBe(`recovery:${FIRST}:${saved}`);
    expect(createIntentKey("trade-proposal", cryptoImpl)).toBe(`recovery:${SECOND}:${saved}`);
  });
});
