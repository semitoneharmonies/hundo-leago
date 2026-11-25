export const ROOM_OUTLINE_COLOURS = Object.freeze(['blue', 'green', 'red', 'silver', 'pink', 'teal', 'yellow', 'dark-purple']);

function colourSeed(id) {
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

// Random room IDs seed the palette, so polling and reordering never reroll it.
// Resolve collisions within the displayed stack; reuse only after all eight.
export function assignRoomOutlineColours(roomIds) {
  const colours = new Map(), used = new Set();
  const ids = [...new Set(roomIds.filter(id => typeof id === 'string' && id))].sort();
  for (const id of ids) {
    if (used.size === ROOM_OUTLINE_COLOURS.length) used.clear();
    const start = colourSeed(id) % ROOM_OUTLINE_COLOURS.length;
    let index = start;
    while (used.has(ROOM_OUTLINE_COLOURS[index])) index = (index + 1) % ROOM_OUTLINE_COLOURS.length;
    const colour = ROOM_OUTLINE_COLOURS[index];
    colours.set(id, colour);
    used.add(colour);
  }
  return colours;
}
