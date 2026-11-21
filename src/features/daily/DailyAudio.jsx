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

export function DailySoundToggle() {
  const audio = useContext(DailyAudioContext);
  const { enabled, available } = useSyncExternalStore(audio.subscribe, audio.getSnapshot, audio.getSnapshot);
  const Icon = enabled && available ? Volume2 : VolumeX;
  return <button type="button" className="hd-action hd-sound-toggle" aria-pressed={enabled && available}
    disabled={!available} title={available ? "Subtle auction sounds; begin after your first interaction" : "Auction audio isn’t supported in this browser"}
    onClick={() => audio.setEnabled(!enabled)}>
    <Icon size={16} aria-hidden="true"/>{available ? "Sounds " + (enabled ? "on" : "off") : "Sound unavailable"}
  </button>;
}
