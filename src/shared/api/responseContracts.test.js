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
