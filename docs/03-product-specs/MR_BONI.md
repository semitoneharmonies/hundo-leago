# Mr. Boni mini game

Requested integration, 26 October 2026. This specification records behavior; release evidence is recorded separately.

## Access and navigation

The league menu contains **Mini Games**, with **Tip Jar** and **Mr. Boni** submenus on desktop and mobile. Existing Tip Jar links and scores remain available. The sign-in screen offers both games without an account, including while account-service bootstrap is unavailable.

Mr. Boni's public page is `/games/mr-boni`; its league page is `/leagues/:leagueId/mr-boni`. Public play is guest play, including when the visitor is already signed in. Signed-in visitors can choose their league to record an account result. Viewing either page only reads permitted data: no run or score is created until the player starts. A current league member can read their league board; the backend requires a current manager assignment to record a league score.

The game has no fantasy rewards, league standings effects, roster changes, activity messages or notifications. Account identity and league authorization come from the existing backend session. The iframe receives no session token, CSRF token or guest capability.

## Play and results

The accepted game presents one rink at a time, progressing through three levels with increasingly heavy snow. Existing movement, pump, snow dump, inspection, drying and smearing rules remain in the packaged game. Desktop keyboard and mobile driving controls remain available, including the mobile drive-button pump gesture and two reverse buttons. Fullscreen uses the native API when available and a full-viewport fallback otherwise, preserving the same running iframe.

More completed levels rank higher. At the same completed level, lower cumulative time wins; equal results share a rank. Every row explicitly displays **Level N completed** and the total time through that completion. For example, Level 1 in 75 seconds and Level 2 in 95 seconds yields **Level 2 completed — 2:50.000**, even if the player later abandons Level 3. Time spent on an unfinished level is excluded. A run with no finished levels has no ranked public result. A later worse run never replaces the player's best.

Each completed level triggers an immediate checkpoint. Active simulation time starts when the machine first enters the ice; pausing does not advance it. The server derives completed levels and time by replaying controls, rather than accepting an asserted client score. Gameplay/scoring changes require a new ruleset and leaderboard-comparability decision.

## Leaderboards and guests

League pages show the private league leaderboard and the public Hundo Leago leaderboard side by side on wide screens and stacked on mobile. Public results contain each account's best run across leagues plus named guests. They omit league IDs, account identifiers, email addresses and guest capabilities. Public ranking includes the top 100 places, including ties, with one best result per player.

After an eligible guest result is saved, the player can explicitly submit a 1–30 character leaderboard name. Guest rows carry **(Guest)**. Anonymous viewing does not persist a guest identity. Starting a guest run retains a random browser capability for saving and recovery; it remains in the wrapper. Clearing storage or changing browser creates a new guest identity. Guest records never enter league boards.

## Persistence and embedding

API roots are `/api/v1/games/mr-boni` and `/api/v1/leagues/:leagueId/mr-boni`. Ruleset `resurface-v1` uses protocol `mrboni-league-v1`. Run creation submits a client request ID. Checkpoints submit an append-only command transcript: fixed 60 Hz driving segments, pump selection, inspection, stop and next-level actions. Limits are 24,000 commands, 216,000 total simulation ticks and 600 ticks per driving segment. No client time, completed-level count or identity is accepted as score authority.

Writes are serialized and retry the same uncertain command prefix before any newer transcript. A bounded browser outbox is isolated by game, account/guest, league and ruleset. Reopening a page only reads pending progress and displays Retry; it does not silently submit a write. The player can retry explicitly or press Play; Play saves the older command prefix before creating a new run. Server replay may take longer than ordinary reads, so run/checkpoint requests allow 100 seconds; name submission allows 15 seconds. Failures remain visible with Retry, including in fullscreen. Leaving a league or replacing an account disposes the frame and ignores late responses.

The asset package is `/games/mr-boni/resurface-v1/`. Only that asset directory receives the same-origin framing override. The public wrapper has no-store caching and retains the normal website API policy. Existing Tip Jar assets, headers and website PWA behavior remain unchanged.

## Delivery safeguards

Use the currently accepted source/artifact baseline and preserve all existing fantasy, account, league and Tip Jar rows. New game persistence must use an additive migration with isolated rehearsal, verified recoverable backup, scoped before/after preservation evidence and a schema-compatible rollback. Do not submit synthetic scores or imports in production. Local, synthetic browser, anonymous hosted, authenticated hosted and physical-device acceptance remain separate verification claims.
