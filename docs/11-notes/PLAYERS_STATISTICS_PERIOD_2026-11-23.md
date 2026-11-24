# Players statistics period — local build, 23 November 2026

Status: implemented and locally verified; held for the queued Build Hundo Daily release. No commit, push or deployment is authorized by this record.

## Requested behavior

The period selector is inside the existing collapsed **More filters** section. It offers Season to date, an inclusive Date range, and each player's Last X games. Date and count edits require **Apply period**. The applied period is identified even while More filters is collapsed. Season selection resets immediately.

Current ownership, contracts, positions and NHL teams retain their existing meaning. The period changes displayed statistics only. Last X counts actual completed appearances, including games with zero scoring events, and skips games missed. GP shows the number actually available when fewer than X exist. This slice supports the current NHL regular season, not browsing earlier seasons or historical ownership.

## Additive API contract

Both league-member reads accept optional period parameters:

- `GET /api/v1/leagues/:leagueId/players`
- `GET /api/v1/leagues/:leagueId/players/:playerId`

`statsPeriod=season` or omission retains the existing season response. `statsPeriod=dateRange` requires `startDate` and `endDate` in YYYY-MM-DD format, inclusive in the league time zone, within July 1 through June 30 of the current NHL season. `statsPeriod=lastGames` requires an integer `lastGames` from 1 through 200. Parameters from different modes cannot be combined. Invalid inputs return `400 PLAYER_READ_INPUT_INVALID`.

Selected-period responses use the existing statistics fields for GP, G, A, P, categories and FP. They add `statistics.period` as `{mode:"dateRange",startDate,endDate,timeZone}` or `{mode:"lastGames",lastGames,timeZone}`. A player without statistics retains `statistics:null`. FPG uses returned FP and GP. Selected GP and FP govern filtering, sorting and cursor pagination before the page limit; favourites request the same scope. Responses with missing or mismatched period metadata are rejected by the frontend instead of silently showing season totals.

## Data and safety

The read-only backend validates existing completed-game cache identities, hashes, appearances and categories against accepted current-season totals. Missing, corrupt, newer-than-accepted or unsupported history returns `503 PLAYER_PERIOD_UNAVAILABLE` with a clear recovery message. It does not fetch NHL data, write derived totals, create tables, migrate, or alter scoring/league records. Existing league scoring and position rules apply. Vancouver date labels reuse the existing permanent-Pacific compatibility policy.

A bounded in-process projection cache reuses unchanged game history across pages, filters and unrelated league writes. Accepted refreshed/corrected game data invalidates that projection. No dependency, runtime, collector, job, schema or configuration change is included.

## Verification

- Backend: 9 period-specific tests and 19 existing player-read regression tests passed. Coverage includes date inclusivity/time zone, actual appearances, zero-event and negative-FP games, fewer-than-X, current FA/position/team filters, minimum GP, both cursor orderings, detail reads, league weights, read-only preservation, missing/corrupt/unaccepted history, accepted corrections, cache reuse and HTTP errors.
- Frontend: 49 tests across PlayersCatalogPage, playerQueries and realtimeInvalidation passed; scoped ESLint, diff checks and local Vite build passed.
- Local Chromium sample-data checks passed at 1440×1000, 390×844 and 844×390: controls hidden until expanded, date validation/apply, period summary while collapsed, last-X, favourites, existing FA filter, unavailable-data recovery and no horizontal page overflow or page errors.
- Two broader pre-existing PlayerPages tests fail identically on untouched production baseline f344b11b because their mocks omit teams/auction readiness reads. They were not changed. The existing build chunk-size advisory remains.

The interactive CUA preview connection was unavailable, so local browser automation supplied visual/interaction checks. These checks use fictional sample records, not hosted or physical-device acceptance. No current live game-history completeness or production latency claim is made.

## Integration boundary

Backend base: eabf3d5802a431beb22f5b0b55e3f81a073f217e. Frontend base: f344b11b8076e8b314d73a5a80f14ca10806b03d. Isolated sources are under each repository's `.hundo.local/players-stat-period-20261123/`.

The queued Daily staging backend d69e66 lacks the complete-game cache and its helper, despite its independently numbered schema87. Default season reads remain available there; scoped history explicitly returns unavailable. The release owner must reconcile the combined release with production's newer statistics infrastructure and frontend changes. Do not replace the production Players page with the older staging copy. This filter has no migration or separate deployment to run.
