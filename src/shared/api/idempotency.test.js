import { describe, expect, it, vi } from "vitest";

import { ApiError } from "./ApiError.js";
import { createIdempotencyKey } from "./idempotency.js";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("createIdempotencyKey", () => {
  it("creates one operation-scoped secure key", () => {
    const randomUUID = vi.fn(() => UUID);

    expect(
      createIdempotencyKey("fad-candidate-add", { randomUUID })
    ).toBe(`fad-candidate-add:${UUID}`);
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["", { randomUUID: () => UUID }],
    ["FAD-candidate", { randomUUID: () => UUID }],
    ["fad_candidate", { randomUUID: () => UUID }],
    ["a", { randomUUID: () => UUID }],
    ["x".repeat(41), { randomUUID: () => UUID }],
    ["fad-candidate", null],
    ["fad-candidate", {}],
    ["fad-candidate", { randomUUID: () => "not-a-uuid" }],
  ])("fails closed for invalid secure intent input %#", (scope, cryptoImpl) => {
    expect(() => createIdempotencyKey(scope, cryptoImpl)).toThrow(ApiError);
    try {
      createIdempotencyKey(scope, cryptoImpl);
    } catch (error) {
      expect(error).toMatchObject({
        code: "SECURE_INTENT_ID_UNAVAILABLE",
        category: "client",
      });
    }
  });

  it("does not expose a secure generator failure", () => {
    expect(() =>
      createIdempotencyKey("fad-candidate-add", {
        randomUUID() {
          throw new Error("private browser detail");
        },
      })
    ).toThrow("This request cannot be submitted securely in this browser.");
  });
});
