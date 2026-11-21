import { createContext, useContext, useEffect } from "react";

export const DailyAudioContext = createContext(null);

export function useDailyRoomAudio(room, viewerId) {
  const audio = useContext(DailyAudioContext);
  useEffect(() => { audio?.observe(room, viewerId); }, [audio, room, viewerId]);
  const roomId = room?.id;
  useEffect(() => () => { if (roomId) audio?.forget(roomId); }, [audio, roomId]);
  return audio;
}
