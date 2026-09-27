# Player hockey cards: local verification

Status: local implementation complete; not deployed, committed or pushed. Existing unrelated and earlier roster/injury work was preserved.

Frontend worktree: `E:/hundo-leago/.hundo.local/roster-visuals-20260927`.
Backend worktree: `E:/hundo-leago-backend/.hundo.local/player-injuries-20260927`.

## Behavior

Shared cursor-anchored, viewport-clamped card from league player names. Mobile centers the scrollable card. Following Graem's visual refinement, styling uses Hundo's existing wordmark, fonts and navy/blue/orange palette, with a collectible border and optional team-coloured jersey number. The reference establishes the concept, not the cream/gold theme. No footer slogan or generated portrait. Key stats, health, current team/contract, net cap value, original signing sources and full executed trade details are preserved. No advanced-stat columns in the card.

Roster, Cap outlook, Players, dashboard leaders/auctions, Matchups, Trade block, trade asset/activity subjects, Auctions, draft results and expanded auction notifications use the shared trigger. Input suggestions and selection fields continue to select players. Existing detail URLs still work for direct links and modified clicks.

The new GET endpoint uses the existing active league membership/session boundary, is no-store and performs no writes. History excludes pending offers, private bids and Candidate proposals. Retention reduces the cap denominator; exempt categories are identified. Unknown injury status, zero/missing games, unsigned players and missing older history are handled explicitly. Cards close at account/navigation/authorization boundaries and do not reuse another league's data.

## Files for this change

Frontend new files:

- `src/features/players/PlayerName.jsx`, `PlayerCardProvider.jsx`, `playerCardContext.js`, `PlayerHockeyCard.jsx`, `PlayerHockeyCard.module.css`, `playerCardQuery.js`, `PlayerHockeyCard.test.jsx`.
- `src/test/playerCardFixture.js`, `e2e/fixtures/player-card.html`.
- `docs/03-product-specs/PLAYER_CARDS.md` and this record.

Frontend integration changes:

- `src/app/AppProviders.jsx`.
- `src/features/rosters/TeamRosterPage.jsx`, `CapOutlook.jsx`.
- `src/features/players/PlayersCatalogPage.jsx`, `PlayerPages.jsx`.
- `src/features/leagues/LeagueDashboard.jsx`.
- `src/features/competition/CompetitionPages.jsx` and its test.
- `src/features/transactions/TradeBlockPanel.jsx`, `TransactionPages.jsx` and its test.
- `src/features/auctions/AuctionPages.jsx` and its test.
- `src/features/freeAgentDraft/FreeAgentDraftResults.jsx`.
- `src/features/notifications/NotificationsPage.jsx`.
- `src/styles/theme-a.css`, `e2e/fixtures/player-injuries.jsx`, `docs/04-technical-specs/API_CONTRACTS.md`.

Backend new files: `src/application/services/players/createPlayerCardService.js`, `src/infrastructure/persistence/sqlite/SqlitePlayerCardRepository.js`, `test/foundation/playerCardFoundation.test.js`.

Backend integration changes: `src/bootstrap/createTargetRuntime.js`, `src/transport/http/createPlayerRouter.js`, `test/foundation/targetRuntimeFoundation.test.js` (131 registered routes; schema remains the existing local injury candidate's 65).

## Verification performed

- `node --test test/foundation/playerCardFoundation.test.js`: final 4/4 passed. Signing source distinctions, original signing team/price, net cap ratio and missing data, actual executed trade assets, pending offer exclusion, two league scopes, unauthorized league denial, and byte-identical SQLite state after reads.
- Existing `leaguePlayerReadFoundation.test.js`: 12/12 passed.
- Full `targetRuntimeFoundation.test.js` after route integration: 46/46 passed (49 total when run alongside the then-three card tests). Exact route installation/dispatch and composition remain valid. After final history enrichment, targeted composed HTTP/player tests passed: 200/no-store authorized card, 401 anonymous, 404 other league, unchanged database. Full backend suite was not run.
- Frontend Vitest roster/cap/card batch: 29/29 passed initially. Final card tests: 5/5, including authorization-epoch closure and fresh reads. Players catalog/detail, dashboard/loading, Matchups, Auctions, transactions, Trade block, notifications and Free Agent Draft page tests passed in focused batches. Final changed card/transaction/matchup/draft batch: 77/77. Auction batch: 34/34 after updating the old no-player-link expectation. No full frontend suite was run.
- Vite build passed. It reports the existing application chunk-size advisory; this is not a failed build.
- ESLint passed for changed application components, card/query/context/test, fixture data and preview entry. The preview component is exported for the refresh rule.
- Both worktrees passed `git diff --check`; status inspected before and after changes.
- Chromium script `E:/hundo-leago/.hundo.local/check-player-card.mjs` passed: name click without route change, full three-team synthetic deal, 1440/768/390px viewport bounds, no card horizontal overflow, Escape, outside click, keyboard activation, focus return/trapping, combined injury/trade-block gradient, and unsigned/no-history state. Axe scan scoped to the open dialog reported no violations. Full-site accessibility and other browser engines were not tested.
- Desktop, expanded trade and mobile screenshots were generated; desktop and mobile were visually inspected.

## Local review

Open `http://127.0.0.1:5174/e2e/fixtures/player-card.html` and click a roster name. This preview uses synthetic data and an in-memory API, clearly labelled in the page; it does not show a signed-in real league or prove hosted acceptance.

Screenshots: `E:/hundo-leago/.hundo.local/player-hockey-card.png`, `player-hockey-card-desktop.png`, `player-hockey-card-trade.png`, `player-hockey-card-mobile.png`.

Generated portraits and physical appearance are deferred. Optional jersey-number reads from the existing NHL public feed are implemented locally; deployment has not occurred. No live storage, migrations, production accounts, bids, rosters or trades were changed by this task.

## Brand and jersey-number refinement

Files changed for this follow-up (relative to the worktrees above):

- Frontend: `src/features/players/PlayerHockeyCard.jsx`, `PlayerHockeyCard.module.css`, `PlayerHockeyCard.test.jsx`, `playerCardQuery.js`; new `nhlTeamColours.js`; `src/test/playerCardFixture.js`; `e2e/fixtures/player-injuries.jsx` (uses the same CSS/font entry as the application).
- Backend: new `src/infrastructure/nhl/NhlPlayerAppearanceAdapter.js` and `test/foundation/nhlPlayerAppearanceFoundation.test.js`; `src/application/services/players/createPlayerCardService.js`, `src/bootstrap/createTargetRuntime.js`, `src/transport/http/createPlayerRouter.js`, `test/foundation/playerCardFoundation.test.js`.
- Documentation: `docs/03-product-specs/PLAYER_CARDS.md`, `docs/04-technical-specs/API_CONTRACTS.md`, this record.

The original statistics/catalogue path does not save jersey numbers. The optional card adapter reads NHL `sweaterNumber` and `currentTeamAbbrev` by a saved `nhl` identity after membership checks. Matching active profiles only; no guesses by name. Timeout 1.5 seconds, four concurrent requests maximum, in-flight deduplication, six-hour memory cache with 512-entry limit, five-minute unavailable cache. Failures return a card without decoration, preserving its saved information. No database schema change or writes. Team and number are paired from the same response. Colours are decorative team accents sourced from official NHL team marks, not exact jersey reproductions.

Follow-up verification:

- `node --test test/foundation/nhlPlayerAppearanceFoundation.test.js test/foundation/playerCardFoundation.test.js`: 10/10 passed, including cache expiry/eviction, concurrent deduplication and limits, stalled-feed cancellation, HTTP/JSON/network failure fallback, invalid/inactive/mismatched identities, authorization before the provider lookup, saved history and byte-identical database checks.
- `node --test --test-name-pattern='serves isolated read-only league player context' test/foundation/targetRuntimeFoundation.test.js`: 1/1 passed; async card route preserves 200/no-store, 401 anonymous, 404 unauthorized league, contract data and unchanged storage.
- `node E:/hundo-leago/node_modules/vitest/vitest.mjs run src/features/players/PlayerHockeyCard.test.jsx`: 5/5 passed, including numbered and unnumbered cards, response team/number consistency and existing interaction/privacy checks.
- Changed-file ESLint, Vite build and syntax checks passed. Vite retains its existing large-chunk advisory. No broad test suites rerun for this visual/metadata follow-up.
- Chromium preview checks passed at 1440/768/390px, with no horizontal overflow or dialog Axe violations; full-deal expansion, click/Escape/backdrop, focus return/trapping and absent-history behavior preserved. Desktop and mobile screenshots inspected. Checks also ran with access to the application's Google Fonts; sandbox-only runs use fallback fonts because network access is denied.
- Live, read-only adapter smoke check: McDavid 97/EDM (239ms), Nylander 88/TOR (153ms), Makar 8/COL (155ms). NHL public logo colour values fetched for all 32 current teams. No production Hundo data queried or changed. The provider remains an external availability dependency; missing saved NHL mappings produce no number.

The local preview still uses synthetic statistics and transaction history. It demonstrates the design and does not prove hosted acceptance. No commit, push or deployment.

## Compact layout and owning-team identity refinement

Graem requested a smaller card, a larger owning-team name, its saved colour/stripe template, and removal of the season/update line, cap-value explanatory sentence and older-history disclaimer. These are implemented locally. The dialog is now at most 380px wide (previously 430px) and the smaller of 680px or 82dvh tall. Jersey artwork is 98px high; spacing, stat panels and history rows are condensed. Long/expanded history remains scrollable, with keyboard and close behavior preserved. Empty-data messages remain. Owning-team text is 21px in the site display font, with the shared team pattern renderer behind its strip. NHL jersey colours remain separate.

Files changed in this refinement:

- Frontend `src/features/players/PlayerHockeyCard.jsx`, `PlayerHockeyCard.module.css`, `src/test/playerCardFixture.js`, `e2e/fixtures/player-injuries.jsx`.
- Backend `src/infrastructure/persistence/sqlite/SqlitePlayerCardRepository.js`, `src/application/services/players/createPlayerCardService.js`, `test/foundation/playerCardFoundation.test.js`.
- Product spec `docs/03-product-specs/PLAYER_CARDS.md` and this report. Local browser script `E:/hundo-leago/.hundo.local/check-player-card.mjs` adds checks for dimensions, removed copy and team-pattern rendering.

The read-only card projection adds current owner's primary/secondary/tertiary colours and saved pattern. Its league filter and ID match preserve isolation. No migration or data writes, and no changes to signing/trade history, cap calculation, jersey lookup or existing player list/detail responses.

Verification: backend `node --test test/foundation/playerCardFoundation.test.js` 4/4 passed, including actual stored owning-team colour/pattern values and byte-identical SQLite after reads; frontend `node E:/hundo-leago/node_modules/vitest/vitest.mjs run src/features/players/PlayerHockeyCard.test.jsx` 5/5 passed. Changed-file ESLint, Vite build and both diff checks passed (existing Vite chunk-size advisory). Chromium with site fonts passed 1440/768/390px checks, confirmed width at most 380px and height at most 680px/82vh, removed copy, 21px owner name and the saved chevron/colour rendering. Existing full-trade, focus, keyboard, error/empty and Axe checks passed. Updated desktop and mobile screenshots inspected. No full application suites or hosted acceptance run for this local refinement.

The focused composed HTTP test also passed (1/1), confirming authorized reads, access denial and unchanged database state after the colour projection. Additional browser checks at 320×640, 390×667 and 1280×720 confirmed settled cards remain fully within the viewport, at 82% height or less, without horizontal overflow.
