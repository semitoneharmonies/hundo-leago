# Hundo Daily: history, auction audio and salary totals

User-approved staging refinement, 18 November 2026. This note documents Daily behavior; it does not authorize production deployment or changes to season league rules.

## History

`/daily/history` is reached through “View your Hundo Daily history” above the room containers. Finished rooms with a game date before the lobby's authoritative current game date are omitted from the main lobby and active room stack. Today's finished rooms and older rooms still collecting scores remain visible. History groups a participant's retained rooms by date, newest first, with existing winners and room links. Commissioners/admins can also reach older rooms they manage. Selecting a historical room shows that room on its own.

History uses existing read-only Daily responses. Rooms already closed remain excluded by the existing backend API; this change does not restore deleted or closed rooms.

## Sound

The page-level sound toggle is outside room containers. Sound defaults on after the first user interaction and remembers each user's device preference. Web Audio synthesis uses brief, quiet tones with softened attack and release rather than external sound files.

- A new player auction produces a soft slot cue.
- A successful bid produces a related confirmation cue. A rejected bid does not confirm.
- A won player produces a ding; a previously bid-on player awarded to someone else produces a descending denied cue.
- The last five seconds before the room auction begins beep once per second, followed by a start horn when the live phase is observed. Explicit practice creation also produces a start horn.
- The last five seconds before the room's scheduled auction end combine beeps with a soft heartbeat. An authoritative early ending plays the final horn without a simulated countdown.

Initial snapshots and historical visits are silent. Repeated polls do not repeat awards or nominations. Simultaneous room cues are coalesced; old events are not replayed after mute, backgrounding or delayed audio activation. Sound never changes bid success, roster legality or auction timing. Browsers without Web Audio retain all auction functions and show sound as unavailable.

## Salary

Manager standings show Salary immediately before Total FP. Expanded rosters and the logged-in user's roster show the signed-salary total in the Salary footer column beside FP. Totals use the authoritative `member.spent` value, excluding active bid reservations. Missing or invalid reported totals show a dash rather than an invented value.

All 13 scoring categories, collection dots, player salaries and the existing purple FP styling remain visible. Landscape phone tables retain their compact layout without horizontal scrolling.

## Acceptance limits

Local fixtures cover signed-in workflows; hosted checks distinguish actual signed-out behavior from those fixtures. Real Web Audio scheduling is tested in desktop/mobile Chromium. The Windows WebKit test build lacks Web Audio and covers the unavailable fallback. Physical-device speaker volume and subjective sound preference require user testing.
