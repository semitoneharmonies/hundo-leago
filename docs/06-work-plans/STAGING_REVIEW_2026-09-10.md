# September 2026 staging review implementation

Graem approved the nine administrator, commissioner and manager review items.
He directly confirmed that the calendar defaults apply to all new 2026–27
seasons. Production and existing league schedules/data are outside this release.

Graem directly answered yes in the release task to committing, pushing and
deploying the prepared nine review fixes to staging. This supersedes the
earlier no-commit hold for this exact scope. All nine adjustments are now
published to `https://staging.hundoleago.com`.

Backend `b60781ffa3661a3b1b442111e3010e5400026ce3` became live through Render
deployment `dep-dah63nh42hec73ev80i0` at **08:44:25 UTC on 10 September**.
Its unchanged `npm ci && npm run check && npm test` gate passed **3,573 tests
across 443 suites**, with no failures, cancellations, skips or todo cases,
in 3,036,998.598 ms. The ready startup event and independent read-only runtime
inspection confirm the exact source commit and matching APP_BUILD_ID.

Frontend `b98875cb3b1cd57671a3bbea02dd83a7354e9e71` was published by promoting
the already-verified Netlify draft `6aa2571ac9d661e0f79481c6` at **08:45:58 UTC**.
The exact target was the existing `hundoleago-staging` site,
`95af8aa7-0b13-4954-af6d-855762acb147`. All **35 served asset checks** passed
against the primary staging domain at 08:46:47 UTC, in addition to the same
35 checks on the immutable draft. SPA routing and security headers passed.
This was promotion of the existing artifact, without another frontend build.

Independent runtime checks at 08:21 and 08:45 UTC found all **nine protected
table fingerprints unchanged** from the pre-release snapshot, all **936 pending
matchup jobs** preserved, zero SQL changes and zero foreign-key violations.
Email remains in send mode with its independent worker enabled. Statistics and
matchup processing controls remain false. No existing league calendar, roster,
contract, baseline or matchup state was changed by the release verification.

The first complete Render run is retained as failed evidence: 3,572 of 3,573
tests passed, with one old schedule-preview expectation. The seven-line
test-only correction added complete mocked week fields and asserted the new
public date projection. All 23 affected HTTP checks passed locally, both
affected suites passed in the replacement run, and the complete replacement
gate passed as reported above. Application behavior did not change in that
test correction.

## Approved behavior

1. Dashboard spotlight: stable outer frame, slower leftward animation inside,
   stable loading and score-health space; reduced-motion preference respected.
2. Team access: searchable account suggestions include existing managers and
   registered administrator-visible accounts. Existing members can receive an
   additional team assignment, accepted through Notifications. Existing teams
   and server-side eligibility/authority remain intact.
3. Competition tools: padding, typography and controls in the top two cards.
4. New 2026–27 season defaults: the saved season and break preferences, approved
   for all new seasons of that NHL year. Opening and closing partial weeks,
   holiday gaps and a complete week list appear before confirmation. Existing
   saved calendars and generated schedules retain their dates.
5. Four commissioner roster forms: centered width, comfortable spacing and
   prominent blue preview actions; workflows preserved.
6. Receiving managers see an automatic read-only trade preview, both teams'
   authoritative current/change/projected cap values and real roster warnings.
   Confirm/Decline make the decision. Incoming normal players use eligible
   Active slots after all outgoing players are removed, then Bench; prospects
   remain prospects. Execution, replay and reversal preserve that evidence.
7. Trade asset names/descriptions are larger, with subtle category colors and
   readable labels.
8. Standings retain team colors with thicker borders, bold outlined text.
9. Your leagues invitation cards share readable spacing, type and actions.

## Compatible API additions

The trade acceptance preview includes each team's before.cap, rosterCounts
and retentionSlots, as well as each asset's plannedRosterCategory. Existing
fields retain their types and meaning. Category-changing contract transfer
receipts add plannedRosterCategory; historical receipts without that field
keep their original category. Receipt validation and reversal understand both.

Schedule preview adds a weeks array containing sequence, startsAtMs and
endsAtMs. Existing request fields, confirmation, command hashes and persisted
calendar fields are unchanged. The exact approved 2026–27 calendar identifies
its immutable break rules; no migration or live data rewrite is required.

## Local verification checkpoint before publication

All checks below used isolated local fixtures; no real trade was accepted and
no existing hosted schedule was generated or changed.

- Frontend: 79 checks passed across eight focused files. Trade opening and
  retry checks prove no acceptance request on view, authoritative two-team cap
  changes, disabled confirmation after preview failure, and one request after
  Confirm. All changed JavaScript and JSX files pass ESLint.
- Backend: 135 affected checks passed across 16 suites in the development
  checkout. Eight focused checks also passed in the isolated staging-base
  release checkout, excluding four unrelated unpublished backend commits.
  Calendar checks cover every scoring day, both breaks, DST, bounded Week 1
  correction, the following season's rollover, read-only preview, confirmed
  persistence and replay. Trade checks cover outgoing-first placement,
  authoritative cap changes, prospects, replay and reversal.
- Browser: all 14 selected desktop/mobile Chromium cases now pass. The first
  run passed 10 and failed four; the four corrective cases passed after fixing
  the mobile score-warning height reserve and correcting timeout/fixture
  expectations. A further mobile form check passed after scrolling all four
  preview buttons into view. Screenshots confirm readable controls. These are
  local browser and accessibility checks, not signed-in hosted acceptance.
- Build: a staging-configured Vite build passed. Its 36-file artifact has
  verified entry assets, the expected staging API origin and build identifier,
  SPA redirects, and recorded file hashes. No environment, source-map or
  database files are in the artifact. Existing chunk-size advice is nonfatal.
- Both isolated release checkouts passed git diff --check. At this initial
  local checkpoint, source had not yet been committed or pushed. The subsequent
  approved publication actions are recorded above. Original working folders
  and unrelated changes remain preserved.

Private evidence is under
E:/hundo-leago-backend/.hundo.local/staging-review/20260909/.
The reviewable release checkouts and prepared artifact are under
E:/hundo-test-work/20260910-review-release/.

## Hosted observations and remaining launch work

The published asset checks and read-only running-instance checks above prove
the served versions and preservation boundaries. The selected local browser
and functional checks remain separate evidence. The existing Chrome review
task subsequently reported these nonidentifying
read-only observations against the newly published frontend:

| Review item | Hosted result | Coverage |
| --- | --- | --- |
| Spotlight | Passed | Fixed outer viewport; continuous leftward inner movement; readable health copy. |
| Account selector | Unavailable | The required selector was not accessible in the current session. |
| Competition cards | Unavailable | The required management view was not accessible. |
| Calendar defaults | Unavailable | No accessible unconfigured season preview; no season was created. |
| Roster forms | Unavailable | The required operations view was not accessible. |
| Receiving-manager trade preview | Unavailable | The required decision view was not accessible; no decision was made. |
| Trade assets | Passed | Larger bold names; distinct subtle contract and draft-pick colors. |
| Standings | Passed | 3px themed borders, bold outlined values, contained 390px viewport with internal table scrolling. |
| Invitations | Unavailable | No existing invitation card was available; none was created. |

The review task reported no state-changing action. Three available views passed;
six were unavailable, not failed or accepted. No real team assignment, invitation
acceptance, trade confirmation/decline, roster correction or hosted schedule
application was tested. Those functional and role-specific acceptance gaps remain
open on their existing dashboard tasks. Local coverage and publication are
complete; this record does not claim full hosted acceptance of all nine workflows.

A separate observation found a displayed draft-pick year of 2026 where an
earlier request/review note described 2028. The reviewer did not inspect the
proposal payload, so this is not a confirmed payload-versus-render defect.
Local tracing shows the chooser preserves the backend pick ID and label;
proposal creation snapshots the exact pick's joined target-season label, and
the card displays that saved label directly. The review release did not change
the year-label expression. No stored data or display override was changed.
The discrepancy remains open for a narrowly authorized comparison with the
intended request; see the private `DRAFT_PICK_YEAR_TRACE.md` evidence note.
The existing focused draft-pick display regression test also passed (one
selected case; sixteen other cases excluded by its name filter), preserving
the supplied season label without any application change.

The next dashboard-priority package remains separate: 29 backend source/test
files and four shared documents passed 262 local compatibility checks on the
new review base. Graem subsequently approved the exact source publication,
this completed review record, and the existing Render staging deployment.
Backend commit `45251f9b7c2fcdb21253a956b4a250fa2da05f5b` was pushed to
`staging` at 13:40 UTC on September 10. Render deploy
`dep-dahb6lp5efls738pj9eg` started the unchanged full build/test gate;
this checkpoint does not yet claim its completion. The read-only pre-deploy
snapshot confirmed the nine protected table fingerprints, 936 pending matchup
jobs, both processing controls off, email delivery and its worker enabled,
zero foreign-key violations, and zero diagnostic database changes.
Its source, exact GitHub staging destinations and limits are recorded in
`EMAIL_CALENDAR_PREPARATION_2026-09-08.md` and the private
`E:/hundo-test-work/20260910-launch-followups/PUBLICATION_REVIEW.md`.
Current publication receipts are under
`E:/hundo-leago-backend/.hundo.local/launch-publication/20260910/`.
Statistics/matchup job activation, isolated hosted acceptance that requires
data operations, and production launch remain separate gates.

Private publication evidence is
`E:/hundo-leago-backend/.hundo.local/staging-review/20260909/STAGING_PUBLISHED.json`,
with `render-final-gate.json`, `render-live-release.json`, and
`runtime-before.json` / `runtime-after.json` in the same directory. Netlify
verification receipts and the exact artifact are under
`E:/hundo-test-work/20260910-review-release/published-artifact/`.
