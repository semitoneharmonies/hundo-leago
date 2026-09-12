import { describe, expect, it, vi } from "vitest";
import { createHttpClient } from "../../shared/api/httpClient.js";
import { refreshStatistics } from "./statisticsRefreshApi.js";

const result = { jobId: "11111111-1111-4111-8111-111111111111", status: "succeeded", playerCount: 2686, capturedAtMs: 1789167600000 };

function fixture(data = result, status = 200) {
  const fetchImpl = vi.fn(async () => new Response(
    status === 204 ? null : JSON.stringify({ data, meta: { requestId: "refresh-test" } }),
    { status, headers: { "Content-Type": "application/json" } }
  ));
  return {
    fetchImpl,
    client: createHttpClient({ apiOrigin: "https://api.example.test", fetchImpl, getCsrfToken: () => "test-csrf" }),
  };
}

describe("administrator statistics API", () => {
  it("submits exactly one empty authenticated request with CSRF and returns confirmed totals", async () => {
    const { client, fetchImpl } = fixture();
    expect(await refreshStatistics(client)).toEqual(result);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.example.test/api/v1/operations/statistics/refresh");
    expect(options).toMatchObject({ method: "POST", body: "{}", credentials: "include" });
    expect(options.headers.get("X-CSRF-Token")).toBe("test-csrf");
  });

  it("accepts a confirmed zero-player result without inventing totals", async () => {
    const { client } = fixture({ ...result, playerCount: 0 });
    expect((await refreshStatistics(client)).playerCount).toBe(0);
  });

  it.each([
    ["missing result", null],
    ["incomplete status", { ...result, status: "running" }],
    ["failed status", { ...result, status: "failed" }],
    ["invalid job", { ...result, jobId: "not-a-job" }],
    ["negative count", { ...result, playerCount: -1 }],
    ["text count", { ...result, playerCount: "2686" }],
    ["missing timestamp", { ...result, capturedAtMs: undefined }],
    ["invalid date", { ...result, capturedAtMs: Number.MAX_SAFE_INTEGER }],
  ])("rejects %s instead of reporting success", async (_, data) => {
    const { client, fetchImpl } = fixture(data);
    await expect(refreshStatistics(client)).rejects.toMatchObject({ code: "APPLICATION_DATA_INVALID" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not mistake a bodyless response for completion", async () => {
    const { client } = fixture(null, 204);
    await expect(refreshStatistics(client)).rejects.toMatchObject({ code: "APPLICATION_DATA_INVALID" });
  });

  it("preserves provider-disabled errors and never retries the write", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: {
      code: "STATISTICS_OPERATION_DISABLED", message: "Not enabled.", requestId: "disabled-test",
    } }), { status: 503 }));
    const client = createHttpClient({ apiOrigin: "https://api.example.test", fetchImpl, getCsrfToken: () => "test-csrf" });
    await expect(refreshStatistics(client)).rejects.toMatchObject({ code: "STATISTICS_OPERATION_DISABLED", status: 503 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
