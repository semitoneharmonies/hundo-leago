import { describe, expect, it } from "vitest";

import {
  ResponseContractError,
  assertIntegerField,
  assertResourceIdentity,
  parseErrorEnvelope,
  parseSuccessEnvelope,
} from "./responseContracts.js";

describe("response contracts", () => {
  it("parses resource and collection success envelopes", () => {
    expect(
      parseSuccessEnvelope(
        {
          data: { id: "league-1", version: 4 },
          meta: { requestId: "request-1" },
        },
        {
          dataKind: "object",
          validateData: (data) =>
            assertResourceIdentity(data, { requireVersion: true }),
        }
      )
    ).toEqual({
      data: { id: "league-1", version: 4 },
      meta: { requestId: "request-1" },
    });

    expect(
      parseSuccessEnvelope(
        {
          data: [],
          page: { nextCursor: null, hasMore: false },
          meta: { requestId: "request-2" },
        },
        { dataKind: "array" }
      )
    ).toEqual({
      data: [],
      page: { nextCursor: null, hasMore: false },
      meta: { requestId: "request-2" },
    });
  });

  it("parses only the documented safe error fields", () => {
    expect(
      parseErrorEnvelope({
        error: {
          code: "RATE_LIMITED",
          message: "Please try again later.",
          details: { reason: "limit" },
          requestId: "request-3",
          stack: "must not escape",
        },
      })
    ).toEqual({
      code: "RATE_LIMITED",
      message: "Please try again later.",
      details: { reason: "limit" },
      requestId: "request-3",
    });
  });

  it("preserves opt-in actions and contract-specific pages without changing default envelopes", () => {
    const longCursor = "a".repeat(256);
    const parsed = parseSuccessEnvelope(
      {
        data: [],
        actions: { startTeams: [] },
        page: { nextCursor: longCursor, hasMore: true },
        meta: { requestId: "request-auctions" },
      },
      {
        dataKind: "array",
        actionsKind: "object",
        validateActions: (actions) =>
          Object.keys(actions).join("|") === "startTeams" &&
          Array.isArray(actions.startTeams),
        validatePage: (page) =>
          Object.keys(page).sort().join("|") === "hasMore|nextCursor" &&
          page.nextCursor === longCursor &&
          page.hasMore === true,
      }
    );

    expect(parsed).toEqual({
      data: [],
      actions: { startTeams: [] },
      page: { nextCursor: longCursor, hasMore: true },
      meta: { requestId: "request-auctions" },
    });
    expect(Object.isFrozen(parsed.actions)).toBe(true);
    expect(() =>
      parseSuccessEnvelope(
        {
          data: [],
          page: { nextCursor: longCursor, hasMore: true },
          meta: { requestId: "request-default-page" },
        },
        { dataKind: "array" }
      )
    ).toThrow("nextCursor");
    expect(
      parseSuccessEnvelope(
        {
          data: [],
          actions: { ignoredWithoutOptIn: true },
          meta: { requestId: "request-existing" },
        },
        { dataKind: "array" }
      )
    ).toEqual({
      data: [],
      meta: { requestId: "request-existing" },
    });
  });

  it("fails closed when opt-in actions or page contracts are missing or rejected", () => {
    const base = {
      data: [],
      meta: { requestId: "request-auctions" },
    };
    expect(() =>
      parseSuccessEnvelope(base, {
        dataKind: "array",
        actionsKind: "object",
      })
    ).toThrow("missing actions");
    expect(() =>
      parseSuccessEnvelope(base, {
        dataKind: "array",
        validatePage: () => true,
      })
    ).toThrow("missing page");
    expect(() =>
      parseSuccessEnvelope(
        { ...base, actions: { extra: true } },
        {
          dataKind: "array",
          actionsKind: "object",
          validateActions: () => false,
        }
      )
    ).toThrow("actions are invalid");
    expect(() =>
      parseSuccessEnvelope(
        { ...base, page: { nextCursor: "cursor", hasMore: false } },
        { dataKind: "array", validatePage: () => false }
      )
    ).toThrow("page is invalid");
  });

  it("fails visibly for malformed envelopes and resource fields", () => {
    expect(() =>
      parseSuccessEnvelope({ data: [], meta: {} }, { dataKind: "array" })
    ).toThrow(ResponseContractError);
    expect(() =>
      parseErrorEnvelope({ error: { message: "No stable code." } })
    ).toThrow(ResponseContractError);
    expect(() => assertResourceIdentity({ id: "", version: 1 })).toThrow(
      ResponseContractError
    );
    expect(() => assertIntegerField({ cents: 1.5 }, "cents")).toThrow(
      ResponseContractError
    );
  });
});
