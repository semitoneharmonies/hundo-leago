import { useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { DailyAudioContext } from "./dailyAudioContext.js";
import { createDailyAudio } from "./dailyAuctionSounds.js";
import { dailyNow } from "./dailyApi.js";

export function DailyAudioProvider({ userId, children }) {
  const audio = useMemo(() => createDailyAudio({ userId, now: dailyNow }), [userId]);
  useEffect(() => audio.connect(), [audio]);
  return <DailyAudioContext.Provider value={audio}>{children}</DailyAudioContext.Provider>;
}

export function DailySoundToggle({ auctioneer = false }) {
  const audio = useContext(DailyAudioContext);
  const settings = useSyncExternalStore(audio.subscribe, audio.getSnapshot, audio.getSnapshot);
  const enabled = auctioneer ? settings.auctioneerEnabled : settings.enabled;
  const { available } = settings;
  const label = auctioneer ? "Auctioneer" : "Sound FX";
  const Icon = enabled && available ? Volume2 : VolumeX;
  return <button type="button" className="hd-action hd-sound-toggle" aria-pressed={enabled && available}
    disabled={!available} title={!available ? "Auction audio isn’t supported in this browser"
      : auctioneer ? (settings.auctioneerStatus === "error" ? "Recording couldn’t load. Turn auctioneer off and on to retry."
        : "Quiet auctioneer loop during live auctions; begins after your first interaction")
        : "Bid, countdown and result sounds; begin after your first interaction"}
    onClick={() => auctioneer ? audio.setAuctioneerEnabled(!enabled) : audio.setEnabled(!enabled)}>
    <Icon size={16} aria-hidden="true"/>{label + (available ? " " + (enabled ? "on" : "off") : " unavailable")}
  </button>;
}
