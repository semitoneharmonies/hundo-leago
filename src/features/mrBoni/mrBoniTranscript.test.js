import { describe, expect, it } from "vitest";
import { createRecorder, extendsCommands, validateCommands } from "../../../public/games/mr-boni/resurface-v1/replay.js";
import { copyMrBoniCommands, extendsMrBoniTranscript } from "./mrBoniTranscript.js";

describe("Mr. Boni published transcript compatibility", () => {
  it("accepts real recorder output byte-for-byte across segment flushes, actions and snapshots", () => {
    const recorder = createRecorder();
    for (let tick = 0; tick < 601; tick++) recorder.recordStep({ throttle: 1, steer: 0, brake: false });
    const first = recorder.snapshot();
    expect(first).toEqual([[0, 600, 1, 0, 0], [0, 1, 1, 0, 0]]);
    recorder.recordStep({ throttle: -1, steer: 1, brake: true });
    for (const action of [[1, 0], [1, 1], [1, 2], [2], [3], [4]]) recorder.recordAction(action);
    const final = recorder.snapshot();
    expect(JSON.stringify(copyMrBoniCommands(final))).toBe(JSON.stringify(validateCommands(final)));
    expect(extendsMrBoniTranscript(final, first)).toBe(true);
    expect(extendsCommands(first, final)).toBe(true);
    expect(first).toEqual([[0, 600, 1, 0, 0], [0, 1, 1, 0, 0]]);
  });
  it("accepts the exact published upper bounds and rejects one tick or command over them", () => {
    const hour = Array.from({ length: 360 }, () => [0, 600, 0, 0, 0]);
    const maximum = Array.from({ length: 24000 }, () => [3]);
    for (const valid of [hour, maximum]) expect(copyMrBoniCommands(valid)).toEqual(validateCommands(valid));
    for (const invalid of [[...hour, [0, 1, 0, 0, 0]], [...maximum, [3]]]) {
      expect(copyMrBoniCommands(invalid)).toBeNull();
      expect(() => validateCommands(invalid)).toThrow();
    }
  });
  it("rejects malformed opcode types, missing operands, nonintegers and oversized segments at both boundaries", () => {
    const invalid = [null, {}, [[0]], [[0, 600, 1, 0]], [[0, 0, 1, 0, 0]], [[0, 601, 1, 0, 0]],
      [[0, 1, 1.5, 0, 0]], [[0, 1, 0, -2, 0]], [[0, 1, 0, 0, true]], [[0, 1, null, 0, 0]],
      [[1]], [[1, 0.5]], [[1, 3]], [[1, "1"]], [[2, 0]], [[3, 0]], [[4, 0]], [[5]], [["0", 1, 0, 0, 0]]];
    for (const value of invalid) {
      expect(copyMrBoniCommands(value)).toBeNull();
      expect(() => validateCommands(value)).toThrow();
    }
  });
  it("rejects rewriting any committed operand, truncation or command reordering", () => {
    const previous = [[0, 60, 1, -1, 0], [1, 1], [2], [3], [4]];
    const variants = [previous.slice(0, -1), [...previous].reverse(), [[0, 61, 1, -1, 0], ...previous.slice(1)],
      [previous[0], [1, 2], ...previous.slice(2)], [[0, 60, -1, -1, 0], ...previous.slice(1)]];
    for (const next of variants) {
      expect(extendsMrBoniTranscript(next, previous)).toBe(false);
      expect(extendsCommands(previous, next)).toBe(false);
    }
    const next = [...previous, [0, 1, 0, 0, 0]];
    expect(extendsMrBoniTranscript(next, previous)).toBe(true);
    expect(extendsCommands(previous, next)).toBe(true);
  });
});
