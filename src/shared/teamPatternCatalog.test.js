import { describe, expect, it } from "vitest";

import {
  TEAM_PATTERN_GROUPS,
  TEAM_PATTERN_TEMPLATES,
  teamPatternPaint,
  teamPatternTemplate,
} from "./teamPatternCatalog.js";

describe("team pattern catalog", () => {
  it("publishes the approved deduplicated template set", () => {
    expect(TEAM_PATTERN_TEMPLATES).toHaveLength(35);
    expect(new Set(TEAM_PATTERN_TEMPLATES.map(({ id }) => id)).size).toBe(35);
    expect(TEAM_PATTERN_TEMPLATES.some(({ id }) => id === "zebra")).toBe(
      false
    );
    expect(
      TEAM_PATTERN_GROUPS.map(({ label, templates }) => [
        label,
        templates.length,
      ])
    ).toEqual([
      ["Even splits", 2],
      ["Hockey stripes", 21],
      ["Patterns", 12],
    ]);
  });

  it("gives every template a fixed colour count and usable paint", () => {
    for (const template of TEAM_PATTERN_TEMPLATES) {
      expect([2, 3]).toContain(template.colourCount);
      const paint = teamPatternPaint(template.id, {
        primaryColour: "#112233",
        secondaryColour: "#ddeeff",
        tertiaryColour:
          template.colourCount === 3 ? "#cc3300" : null,
      });
      expect(paint.entry).toBe(template);
      expect(paint.image).toBeTruthy();
      expect(paint.image).not.toContain("undefined");
    }
  });

  it("preserves legacy two- and three-colour teams with even splits", () => {
    expect(teamPatternTemplate(null, null).id).toBe("even-two");
    expect(teamPatternTemplate(null, "#cc3300").id).toBe("even-three");
  });
});
