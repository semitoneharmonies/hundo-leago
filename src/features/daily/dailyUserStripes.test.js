import { describe, expect, it } from "vitest";
import { dailyUserStripeStyle } from "./dailyUserStripes.js";

const colours = { primaryColour:"#ffffff", secondaryColour:"#123456", tertiaryColour:null };

describe("Daily user stripe paint", () => {
  it("never supplies a default pattern for an unset or unknown appearance", () => {
    for (const appearance of [undefined,null,{},colours,{...colours,patternTemplate:"unknown"}]) {
      expect(dailyUserStripeStyle(appearance)).toEqual({});
    }
  });
  it("requires valid explicit colours before producing paint", () => {
    expect(dailyUserStripeStyle({...colours,patternTemplate:"even-two",primaryColour:"url(example)"})).toEqual({});
    expect(dailyUserStripeStyle({...colours,patternTemplate:"even-three"})).toEqual({});
    const paint = dailyUserStripeStyle({...colours,patternTemplate:"even-three",tertiaryColour:"#abcdef"});
    expect(paint["--daily-stripe-image"]).toContain("#abcdef");
    expect(paint["--daily-stripe-image"]).toContain("#123456");
  });
  it("preserves the shared catalog's repeating pattern dimensions", () => {
    const paint = dailyUserStripeStyle({...colours,patternTemplate:"checkerboard"});
    expect(paint["--daily-stripe-image"]).toContain("conic-gradient");
    expect(paint["--daily-stripe-size"]).toBe("32px 32px");
    expect(paint["--daily-stripe-repeat"]).toBe("repeat");
  });
});
