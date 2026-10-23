export function copyTipJarShots(shots) {
  if (!Array.isArray(shots) || shots.length < 1 || shots.length > 60) return null;
  let previousTime = -1;
  const result = [];
  for (const shot of shots) {
    if (!shot || ![shot.time, shot.x, shot.height, shot.power].every(Number.isFinite) ||
      shot.time < 0 || shot.time > 86400 || shot.time <= previousTime ||
      Math.abs(shot.x) > 10 || shot.height < 0 || shot.height > 5 || shot.power < 0 || shot.power > 100) return null;
    previousTime = shot.time;
    result.push(Object.freeze({ time: shot.time, x: shot.x, height: shot.height, power: shot.power }));
  }
  return Object.freeze(result);
}

export const extendsTipJarTranscript = (next, previous) => next.length >= previous.length && previous.every((shot, index) =>
  ["time", "x", "height", "power"].every((field) => shot[field] === next[index][field]));
