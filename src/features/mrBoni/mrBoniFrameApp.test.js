import { readFileSync } from "node:fs";
import { fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../public/games/mr-boni/resurface-v1/renderer.js", () => ({ ArenaRenderer: class {
  resize() {} render() {} getCameraState() { return {}; }
} }));
vi.mock("../../../public/games/mr-boni/resurface-v1/audio.js", () => ({ createSoundEffects: () => ({
  getState: () => ({ enabled: false, supported: true }), stop() {}, play() {}, unlock: async () => {}, playFromGesture: async () => true,
}) }));
vi.mock("../../../public/games/mr-boni/resurface-v1/feedback.js", () => ({ createFeedback: () => ({ show: () => null, current: () => null, clear() {} }) }));
// Reach the real app's limit handling without simulating an hour of play.
vi.mock("../../../public/games/mr-boni/resurface-v1/replay.js", () => ({ createRecorder: () => {
  let actions = 0;
  return { recordStep() {}, snapshot: () => [], reset: () => { actions = 0; }, recordAction() { if (++actions > 1) throw Error("recording limit"); } };
} }));

afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ""; });

describe("Mr. Boni real frame dialog lifecycle", () => {
  it("keeps an exhausted recording stopped until a fresh server-issued run starts", async () => {
    const html = readFileSync("public/games/mr-boni/resurface-v1/index.html", "utf8");
    document.body.innerHTML = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)[1];
    for (const dialog of document.querySelectorAll("dialog")) {
      dialog.showModal = function () { this.open = true; };
      dialog.close = function () { this.open = false; };
    }
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    vi.stubGlobal("requestAnimationFrame", vi.fn());
    const host = { postMessage: vi.fn() };
    vi.stubGlobal("parent", host);
    await import("../../../public/games/mr-boni/resurface-v1/app.js");
    fireEvent.submit(document.querySelector("#welcome form"));
    const start = host.postMessage.mock.calls.find(([message]) => message.type === "start")[0];
    fireEvent(window, new MessageEvent("message", { origin: window.location.origin, source: host,
      data: { protocol: "mrboni-league-v1", type: "start", requestId: start.requestId, run: {
        runId: "11111111-1111-4111-8111-111111111111", rulesetVersion: "resurface-v1",
      } } }));
    fireEvent.click(document.getElementById("start-cleaning"));
    fireEvent.click(document.querySelector('[data-pump="0.5"]'));
    fireEvent.click(document.querySelector('[data-pump="0"]'));
    const limit = document.getElementById("limit-reached");
    expect(limit.open).toBe(true);
    expect(window.mrBoniSnapshot().status).toBe("paused");
    fireEvent.keyDown(limit, { code: "Escape" });
    expect(limit.open).toBe(true);
    expect(window.mrBoniSnapshot().status).toBe("paused");
    fireEvent(limit, new Event("cancel", { cancelable: true }));
    expect(limit.open).toBe(true);
    fireEvent.click(document.getElementById("limit-new-run"));
    expect(host.postMessage.mock.calls.filter(([message]) => message.type === "start")).toHaveLength(2);
  });
});
