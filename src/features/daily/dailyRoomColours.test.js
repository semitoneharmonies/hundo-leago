import { describe, expect, it } from 'vitest';
import { assignRoomOutlineColours, ROOM_OUTLINE_COLOURS } from './dailyRoomColours.js';

describe('Daily room outlines', () => {
  it('distinguishes eight rooms and remains stable through polling and reordering', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `room-${i}`);
    const colours = assignRoomOutlineColours(ids);
    expect(new Set(colours.values())).toEqual(new Set(ROOM_OUTLINE_COLOURS));
    expect(assignRoomOutlineColours([...ids].reverse())).toEqual(colours);
    expect(assignRoomOutlineColours([...ids, ids[0]])).toEqual(colours);
  });
  it('uses the full palette before repeating and handles an empty loading view', () => {
    const colours = [...assignRoomOutlineColours(Array.from({ length: 17 }, (_, i) => `room-${String(i).padStart(2, '0')}`)).values()];
    expect(new Set(colours.slice(0, 8)).size).toBe(8);
    expect(new Set(colours.slice(8, 16)).size).toBe(8);
    expect(ROOM_OUTLINE_COLOURS).toContain(colours[16]);
    expect(assignRoomOutlineColours([]).size).toBe(0);
  });
});
