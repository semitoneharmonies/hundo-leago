# Trade review and proposer impact — staging

The saved-offer page requested impact only while a manager could respond.
Consequently, proposers and invited managers who already accepted saw
unavailable projected caps even though the builder preview worked.

Proposers now use the existing authoritative read-only draft-preview endpoint
with the saved proposal's asset references and destinations. Invited managers
retain acceptance-preview access after their response. The backend's current
permissions, execution rules and fog-of-war filtering are unchanged.

Both builders and counter builders now open a review screen before sending.
The screen reuses the sending/receiving cards and shows the server's cap and
roster impact. Edit trade preserves selections; only final submission creates
the offer or atomically declines the countered original. Failed or mismatched
previews block sending. The submission guard remains locked after success
until navigation finishes and unlocks on error, preserving retry identity.

## Verified locally

- Four initial component failures reproduced the missing proposer impact and
  missing review step. Final focused Vitest run passed 69/69 across seven
  files, including two league contexts, all current selectable asset types,
  retained salary, wrong-league/team previews, privacy, failed sends, counters,
  duplicate clicks and accepted invitees. A later fast-response test caught
  the submission guard unlocking before navigation; the final run includes
  that correction.
- Final Playwright run passed 12/12 scenarios across desktop and mobile
  Chromium. Review, edit, retry, submission, proposer impact, participant
  responses and dismissal are covered. No hosted trades were submitted.
  Screenshots were inspected and viewport overflow checks passed. An initial
  fixture role mismatch was corrected before the successful browser runs.
- Changed-file ESLint, git diff checks and the staging Vite build passed.
  The build retains its existing large-chunk advisory.

Commands use the existing Vitest and Playwright CLIs with one worker, the
seven transaction test files, and `two-team-proposal`, `counter-proposal`,
and `three-team-trade` browser specs for both Chromium projects.

## Publication boundary

Frontend only, targeting the separate staging Netlify site
`95af8aa7-0b13-4954-af6d-855762acb147` at https://staging.hundoleago.com.
Backend f0b2b62cdbaca071e356bd426a528722154e1947 remains deployed. No schema,
configuration, league records or production deployment changes are required.
Rollback is the preceding frontend 6138b8b9b4b05be131452b5efd968b9e4e1fa780
and does not require restoring data. Production remains on hold for user review.

Final publication receipts, public asset hashes, read-only readiness checks,
signed-out hosted startup evidence and source revision are retained at
`E:/hundo-leago-backend/.hundo.local/trades-staging-20260925/` in
`STAGING_REVIEW.md` and the `*-review.json` receipts. Local fixture verification
and signed-out startup do not replace signed-in user review on staging.
