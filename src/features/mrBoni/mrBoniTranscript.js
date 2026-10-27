// Compact fixed-step commands. The server replays them and derives the result.
export function copyMrBoniCommands(commands) {
  if (!Array.isArray(commands) || commands.length < 1 || commands.length > 24000) return null;
  const result = [];
  let ticks = 0;
  for (const command of commands) {
    if (!Array.isArray(command) || !Array.from(command).every(Number.isSafeInteger)) return null;
    const [type] = command;
    if (type === 0) {
      if (command.length !== 5 || command[1] < 1 || command[1] > 600 ||
        Math.abs(command[2]) > 1 || Math.abs(command[3]) > 1 || ![0, 1].includes(command[4])) return null;
      ticks += command[1];
      if (ticks > 216000) return null;
    } else if (type === 1) {
      if (command.length !== 2 || command[1] < 0 || command[1] > 2) return null;
    } else if (![2, 3, 4].includes(type) || command.length !== 1) return null;
    result.push(Object.freeze([...command]));
  }
  return Object.freeze(result);
}
export const extendsMrBoniTranscript = (next, previous) => next.length >= previous.length && previous.every((command, index) =>
  command.length === next[index].length && command.every((value, field) => value === next[index][field]));
