# September 2026 staging review implementation

Graem approved the nine administrator, commissioner and manager review items.
He directly confirmed that the calendar defaults apply to all new 2026–27
seasons. Production and existing league schedules/data are outside this release.

Graem directly answered yes in the release task to committing, pushing and
deploying the prepared nine review fixes to staging. This supersedes the
earlier no-commit hold for this exact scope. Backend review commit
65edb714889860edf33a5de889742de2d39e18ba is pushed to staging. Render deployment
dep-dah5a9rl550s73dl9t9g is running the normal build and full test gate.

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

## Verification checkpoint

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
- Both isolated release checkouts pass git diff --check. Nothing is staged,
  committed or pushed. Original worktrees and unrelated changes are preserved.

Private evidence is under
E:/hundo-leago-backend/.hundo.local/staging-review/20260909/.
The reviewable release checkouts and prepared artifact are under
E:/hundo-test-work/20260910-review-release/.

## Remaining publication and acceptance

Publish only the isolated review commits to the existing staging services,
wait for Render's normal build checks, and verify the hosted result. The
current build is not yet hosted acceptance. Render and Netlify production
targets remain outside this release. Unrelated account email, statistics,
session and buyout source changes are excluded.
