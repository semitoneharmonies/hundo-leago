# Dashboard trade block and history wording — 9 October 2026

Local implementation only. No commit, push, deployment, live-data access, or saved
history rewrite. Earlier player-card, matchup-row, and standings work is preserved.

## Changes

Frontend worktree: `E:/hundo-leago/.hundo.local/player-card-branding-20261009`.

- `src/features/transactions/TradeBlockPanel.jsx`: optional team-logo display.
- `src/features/leagues/LeagueDashboard.jsx`: disable logos in the dashboard trade
  block while retaining team names, player links, statistics, and trade actions.
- `src/features/transactions/TradeBlockPanel.test.jsx`: verify both display modes.
- `src/test/tradePrivacyFixture.js` and
  `src/features/transactions/TradePrivacy.test.jsx`: reflect the revised proposal
  sentence without exposing assets.

Backend worktree: `E:/hundo-leago-backend/.hundo.local/matchup-row-readability-20261009`.

- `src/application/services/activity/createLeagueActivityService.js`: show
  `[Team] bought out [Player]'s contract.` for both canonical buyout event types
  when the stored identity links resolve. Missing identities keep the saved summary.
- `src/infrastructure/persistence/sqlite/SqliteTradeVisibility.js`: proposal-created
  entries say `[Sender] sent a trade proposal to [Recipient].` Three-team proposals
  name both recipients. The actual team names are used. Other event types retain
  their appropriate existing wording. All private metadata redaction is preserved.
- `test/foundation/activityNotificationFoundation.test.js` and
  `test/helpers/tradeVisibilityFlow.js`: named summaries, pagination, league
  isolation, access boundaries, and byte-for-byte read-only checks.

These are read projections, so existing eligible history entries receive the new
wording as well as future ones. Both the dashboard and full activity log consume
the same improved summaries. Team logos elsewhere remain as before.

## Verification

- Focused Vitest: TradeBlockPanel, TradePrivacy, LeaguePages — 36 passed.
- Backend `node --test --test-name-pattern='trade fog-of-war HTTP privacy|classifies saved contract buyouts|league-scoped, cursor-paginated' test/foundation/tradeProposalCreationFoundation.test.js test/foundation/activityNotificationFoundation.test.js` — 19 passed.
- Privacy coverage includes two-/three-team offers, uninvolved commissioners,
  pending/declined/cancelled/expired proposals, counters, executed trades and
  reversals. Reading summaries preserves serialized database bytes.
- Focused ESLint, frontend build, and diff checks passed. Build retains its
  existing large-bundle warning.

All test storage and logs stayed on E:. Logs: frontend references directory
`E:/hundo-leago/.hundo.local/player-card-branding-references/dashboard-history-*.txt`
and backend `E:/hundo-leago-backend/.hundo.local/matchup-row-test-temp/dashboard-history-tests.txt`.
Hosted acceptance is unverified; publication remains separate.
