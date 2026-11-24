import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DailySoundToggle } from "./DailyAudio.jsx";
import { DailyAudioContext } from "./dailyAudioContext.js";

function controls(settings = {}) {
  let snapshot = { enabled: true, auctioneerEnabled: true, available: true, auctioneerStatus: "idle", ...settings };
  const listeners = new Set();
  const publish = patch => { snapshot = { ...snapshot, ...patch }; for (const listener of listeners) listener(); };
  const audio = {
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    getSnapshot: () => snapshot,
    setEnabled: vi.fn(value => publish({ enabled: value })),
    setAuctioneerEnabled: vi.fn(value => publish({ auctioneerEnabled: value })),
  };
  render(<DailyAudioContext.Provider value={audio}><DailySoundToggle/><DailySoundToggle auctioneer/></DailyAudioContext.Provider>);
  return audio;
}

describe("separate Daily sound controls", () => {
  it("exposes independent names, pressed state and actions", () => {
    const audio = controls();
    expect(screen.getByRole("button", { name: "Sound FX on" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Auctioneer on" }));
    expect(audio.setAuctioneerEnabled).toHaveBeenCalledWith(false);
    expect(audio.setEnabled).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Auctioneer off" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Sound FX on" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Sound FX on" }));
    expect(audio.setEnabled).toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: "Sound FX off" })).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps separate unavailable labels and disables both when Web Audio is unsupported", () => {
    controls({ available: false });
    for (const name of ["Sound FX unavailable", "Auctioneer unavailable"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("explains a recording load failure without disabling the sound effects control", () => {
    const audio = controls({ auctioneerStatus: "error" });
    expect(screen.getByRole("button", { name: "Auctioneer on" })).toHaveAttribute("title", expect.stringContaining("Turn auctioneer off and on to retry"));
    fireEvent.click(screen.getByRole("button", { name: "Sound FX on" }));
    expect(audio.setEnabled).toHaveBeenCalledWith(false);
    expect(audio.setAuctioneerEnabled).not.toHaveBeenCalled();
  });
});
