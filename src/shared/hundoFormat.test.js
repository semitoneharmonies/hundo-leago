import { describe, expect, it } from "vitest";

import { leagueDateTime } from "./hundoFormat.js";

describe("leagueDateTime", () => {
  it("formats the persisted instant in the supplied league timezone with an explicit label", () => {
    const result = leagueDateTime(
      Date.parse("2026-08-11T19:30:00.000Z"),
      "America/Vancouver"
    );

    expect(result).toContain("America/Vancouver");
    expect(result).toContain("Aug");
    expect(result).not.toBe("Time unavailable");
  });

  it.each([
    [null, "America/Vancouver"],
    [1, ""],
    [1, "Not/A_Timezone"],
  ])("fails closed for invalid time input", (value, timeZone) => {
    expect(leagueDateTime(value, timeZone)).toBe("Time unavailable");
  });
});
