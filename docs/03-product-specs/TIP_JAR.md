# Tip Jar league side game

Staging integration candidate, 22 October 2026, based on the accepted October 12 staging website and its separate backend migration lineage. This document records the requested behavior; it is not evidence of a hosted release or physical-phone acceptance.

## Purpose and access

Tip Jar is optional entertainment on `/leagues/:leagueId/tip-jar`. It has no fantasy rewards, standings impact, roster effect, league activity entries or notifications. The shared league navigation exposes it on desktop and mobile. A current league member can view that league's leaderboard. Recording a run requires an authenticated current manager of a team in that league. Identity comes from the existing session.

The existing three-level game is loaded only when its page is opened. Desktop retains arrow-key aiming and hold/release Space. On touch devices, drag on the ice to aim and hold/release Shoot; a second finger can adjust aim during charging. Portrait framing removes the outer rink wings while retaining the shooter, goal, teammate, targets and full legal aiming range. The camera, touch controls and menus adapt to the embedded frame or fullscreen.

## Game and ranking

- Level 1 starts with 20 pucks and requires a tipped shot off each of the left post, right post and crossbar and into the net.
- Completing Level 1 adds 20 pucks to the remainder. Level 2 requires all five tipped targets.
- Completing Level 2 adds another 20. Level 3 requires all five tipped targets past the moving goalie.
- Each manager's best result is recorded separately per league. Higher completed level ranks first, then fewer cumulative shots through that completion. Equal results share a rank.
- A win displays all shots used to complete Levels 1, 2 and 3. An unfinished run displays the highest level completed and only the cumulative shots used through that level. For example, clearing Level 1 in 6 shots and Level 2 in 9, then failing Level 3, displays **Level 2 completed — 15 shots**.
- A played run that has not completed Level 1 displays **No levels completed — shots: —**. A later worse run cannot replace a better result.

Cosmetic target styles do not change scoring. Standalone browser personal-best data is not read or written by league mode, preventing another account's browser-local best from appearing as the signed-in manager's score.

## Persistence and isolation

The server issues a run ID and random seed. The game records legal shot inputs; the API replays the same pure physics modules and derives achievements, puck balance and shot counts itself. It never accepts an asserted score, manager name or user ID from the game. The shared ruleset is `campaign-v1`.

Checkpoint writes are serialized and idempotent. They preserve an immutable shot prefix and cannot worsen the saved best. Completed levels are saved as soon as the scoring result resolves, before the retrieval/intermission animation ends. A small bounded local outbox retains an unconfirmed transcript for the same account, league and ruleset if the page closes or a request fails. Only that signed-in identity can retry it. No credentials are stored in the outbox. Save failures are shown honestly with Retry, and new runs wait for older pending progress. A 15-second request timeout makes stalled requests retryable.

The website owns authenticated API access; the iframe receives no session or CSRF tokens. Message handling checks the parent/frame, origin, protocol and run ID. Leaving the league or changing accounts disposes the frame and ignores stale replies.

Staging migration 0087 adds `tip_jar_runs` and `tip_jar_bests`. Normal score operations write only those tables. Existing fantasy rows are preserved. Existing authorized league erasure explicitly removes only that league's game rows as part of its existing transaction. Old reset policies remain fail-closed. The separate production integration uses migration 0094 and must not be applied to the staging lineage.

## Delivery and acceptance

Game assets are packaged at `/games/tip-jar/campaign-v1/`. Its security policy allows same-origin embedding; the rest of the website retains its existing frame restrictions. The PWA's existing cache behavior is unchanged.

Required before production: the existing backup/restore and preservation process, a staging migration rehearsal, signed-in desktop and physical-phone playtests, and hosted verification of framing/cache/security headers. The prior staging schema-86 backend cannot simply be restarted against schema 87; use a schema-87-compatible rollback candidate to retain game rows and existing fantasy activity.

Future visual-only game updates can repackage the same ruleset. Gameplay or scoring changes require an explicit version/migration decision, matching API physics, and leaderboard comparability review. Desktop shortcut play continues to load the current standalone source independently of website publication.
