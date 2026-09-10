# Account email and real-season calendar preparation

## Current checkpoint — 10 September 2026 UTC

The historical preparation and approval questions below are retained as dated
evidence. The staging email setup and new-season calendar decisions have since
been resolved; do not repeat their earlier requests or activation operations.

Staging email was activated with Graem's explicit approval on September 10.
The existing Resend sender domain was verified, a domain-restricted sending
key was installed through Render secret settings, and the independent worker
processed the six authorized queued messages. The provider reported Parker's
verification Delivered. This does not prove that he opened the message or
completed verification. Read-only runtime inspection at 07:14 UTC still
confirmed send mode and the enabled worker. No additional email is requested.
Broader password-recovery acceptance and the response-body timeout source fix
remain separate follow-ups. The private activation receipt is
`E:/hundo-leago-backend/.hundo.local/staging-email-setup-20260910/STATUS.md`.

Graem directly confirmed that his calendar preferences apply to **all new
2026–27 seasons**: September 29 through April 10, excluding the Christmas and
All-Star breaks, with partial weeks where needed. The older October 5/April 12
proposal below is superseded. Existing schedules stay unchanged. Implementation
and local checks are recorded in `STAGING_REVIEW_2026-09-10.md`; its approved
staging release is in progress, not yet hosted schedule acceptance.

The next source review is prepared in isolated checkouts under
`E:/hundo-test-work/20260910-launch-followups/`. Its backend starts from reviewed
staging commit `b60781ffa3661a3b1b442111e3010e5400026ce3` and adds only the
29 previously prepared execution-scope, session, buyout and email-timeout
source/test files. Its documentation starts from frontend review commit
`b98875cb3b1cd57671a3bbea02dd83a7354e9e71` and includes the same four shared
documents listed below. These follow-ups remain uncommitted and unpublished;
they are excluded from the nine-item release already authorized separately.

Direct approval for this exact next payload and the existing GitHub staging
destinations is still required under the prior automatic review rejection.
The proposed source-only release keeps the statistics and matchup controls
off and preserves the now-enabled email configuration. It does not execute
scheduled jobs, reset credentials, send test messages, create or alter a
league schedule, replace saved baselines, or change production. Hosted
acceptance that needs account interaction or isolated test data remains a
separate concrete action. Graem requested continued independent work while
such decisions await his return.

Prepared during the unattended September 8, 2026 work session; verification
timestamps below are September 9 UTC. This completes the independent local
preparation for tracker tasks `accounts-recovery` and
`competition-season-setup`. Live delivery, a real league schedule, hosted
account acceptance and production launch remain open gates.

## Account recovery readiness

Resend is already the approved provider in
`docs/04-technical-specs/ENVIRONMENT_SETUP.md`. Recovery uses a verified-account
password-reset link under `docs/03-product-specs/USER_ACCOUNTS.md`; no new
provider selection or alternative password-reset mechanism is needed.

Read-only staging inspection at 05:03 UTC found valid security configuration,
capture mode, the email worker off, configured sender/reply-to, no Resend
credential, a configured action-token encryption key, no recipient allowlist,
and `https://staging.hundoleago.com` as the link origin. Credential values were
not read out or saved. The 05:06 UTC inspection used the deployed runtime's
actual helper to verify that staging automatic account verification is also
off. Neither inspection sent email or changed configuration.

The account outbox contains four pending session-replacement notifications.
Other account messages are already published or discarded. Enabling delivery
would make those pending notifications eligible, so the approved activation
plan must explicitly account for them. Do not erase them or switch to capture
delivery just to empty the queue. No outbox payload, address, token or
ciphertext was exported by these inspections.

The existing local workflows passed 48/48 tests across 13 suites in 70,532 ms:

```powershell
& 'E:\hundo-tools\node-v24.14.1-win-x64\node.exe' --test test/foundation/accountEmailProviderFoundation.test.js test/foundation/accountRegistrationFoundation.test.js test/foundation/securityFoundations.test.js
```

This covered registration, activation, expired links, encrypted outbox
rollback, retry/discard, secret redaction, allowed modes, exact recipients and
provider behavior with injected fake requests. Password-reset lifecycle and
session invalidation were also covered by the earlier account regression
recorded in `ACCOUNT_BUYOUT_FOLLOWUPS_2026-09-08.md`. These checks do not prove
real mailbox delivery or signed-in hosted recovery.

### Response timeout correction

Review found that `createResendEmailAdapter.js` cleared its timer immediately
after response headers, before reading the body. A provider that stopped
sending after its headers could hold a delivery cycle indefinitely. The fix
keeps body reading inside the existing timeout and treats an aborted body as a
retryable provider failure, including when the headers carried a client-error
status. Provider response details remain hidden.

The new regression reproduced the original failure (timer cleared too early)
and then passed for both 200 and 400 response headers. The entire affected
provider file passed 14/14 tests across three suites in 108 ms. Diff checks
passed. The two-file fix is saved locally, uncommitted and unpublished:

- `E:/hundo-leago-backend/src/infrastructure/email/createResendEmailAdapter.js`
- `E:/hundo-leago-backend/test/foundation/accountEmailProviderFoundation.test.js`

No additional worker, scheduler, storage or API behavior changed.

### Ready-to-review email activation sequence

1. Confirm the staging sender domain and approved test account recipient.
   Resend requires domain verification using its DNS records. Use a
   staging-only key restricted to sending, with domain restriction when
   available; do not expand credentials to full access just for diagnostics.
   See [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction)
   and [Resend key permissions](https://resend.com/docs/api-reference/api-keys/create-api-key).
2. Publish the reviewed backend fixes after the direct source-publication
   approval. Keep the email worker off while installing and validating an
   approved staging configuration. Keep the current action-token encryption
   key; rotating it could make pending envelopes unreadable.
3. Review the four pending notifications and their intended recipient scope
   before approving delivery. The recommended first live acceptance uses an
   exact-recipient allowlist and the independent account-email worker. A
   sandbox check cannot prove delivery to the user's mailbox. The allowlist
   intentionally rejects other recipients, so do not enable it until its
   effect on the existing queue is accepted.
4. With a working account and approved recipient, verify request, delivery,
   new-password confirmation, old-link rejection, session invalidation and
   sign-in with the replacement password. Do not reset existing QA accounts
   or send messages during unattended preparation.

## Real-season calendar

NHL dates: September 29, 2026 through April 10, 2027.
[Official NHL schedule announcement](https://www.nhl.com/news/nhl-announces-2026-27-regular-season-schedule).

The following is a Hundo calendar proposal derived from those dates and the
existing scheduling policy. It is not a persisted calendar or an NHL claim
about scoring boundaries. All local times are midnight in America/Vancouver.

| Calendar input | Proposed local date | Exact UTC instant |
|---|---|---|
| NHL regular-season opening date | September 29, 2026 | 2026-09-29T07:00:00Z |
| Week 1 | October 5, 2026 | 2026-10-05T07:00:00Z |
| Fantasy playoffs begin | March 15, 2027 | 2027-03-15T07:00:00Z |
| Fantasy playoffs / scoring range close | April 12, 2027 | 2027-04-12T07:00:00Z |

This produces 23 regular-season weeks. Playoffs would be March 15–21,
March 22–28, and a two-week final March 29–April 11. The end is exclusive.
The final Monday boundary includes the final NHL game date; the currently
named `nhlRegularSeasonEndsAtMs` input would contain this scoring boundary,
not the literal last game date. That distinction must be approved and made
clear before entering a real schedule. Do not silently change the canonical
rule or present April 12 as the NHL's last game date.

The current policy rejects a literal April 10 end or the following midnight:
subtracting its required 28 elapsed days does not produce Monday midnight.
Ending on April 5 excludes the final partial NHL week and crosses the spring
clock change; four local weeks there contain 671 hours, which the policy
rejects. The proposed March 15–April 12 playoff range is 672 hours and passes.
Regular weeks correctly include 167-, 168- and 169-hour spans while retaining
Monday midnight boundaries.

The four-case direct policy proof passed. The schedule policy and command
gate passed 37/37 tests across four suites in 1,669 ms:

```powershell
& 'E:\hundo-tools\node-v24.14.1-win-x64\node.exe' .hundo.local/statistics-staging-20260908/verify-real-season-calendar.cjs
& 'E:\hundo-tools\node-v24.14.1-win-x64\node.exe' --test test/foundation/matchupSchedulePolicyFoundation.test.js test/foundation/matchupScheduleCommandFoundation.test.js
```

The first command writes its receipt exclusively; inspect the saved receipt
instead of rerunning it into the same path. These are local policy/command
checks, not an authenticated hosted preview or confirmed schedule mutation.

The read-only staging inspection found eight current 2026–27 seasons: one
planned season with all calendar fields null, and seven active seasons with
existing test calendars. Do not overwrite the seven calendars. The intended
league, commissioner, season, team readiness and draft deadlines must be
identified before any actual preview or application. The October 5 proposal
can move later if Entry Draft/FAD readiness requires it; playoffs remain fixed.

## Combined backend release gate

Local segmented verification is complete. All 350 discovered backend test
files are covered, and every reported failure has passing corrective evidence.
Two filesystem-link cases were skipped because this Windows host could not
create the required links. This is not a single clean full-suite run, signed-in
hosted acceptance, or production launch.

| Evidence segment | File coverage | Actual result |
|---|---:|---|
| Original run, beginning about 05:14 UTC | 145 completed prefix files | Interrupted without a final summary; one environment-related failure later rechecked successfully |
| Resumed run, 13:41–16:29 UTC | 205 remaining files | 2,128 tests: 2,076 passed, 50 failed, two skipped; no cancellations or todo cases |
| Isolated corrective runs | Ten affected files, overlapping the rows above | 108/108 tests passed across 15 suites, with no failures, cancellations or skips |

Do not add those test counts into a new aggregate: corrective checks overlap
the earlier files, and the interrupted prefix has no complete test-count
summary. The installed Node 24 discovery order, completed prefix boundary,
remaining-file list and all receipts establish the 350-file coverage.

All 50 resumed failures belong to nine files. Those nine files and the one
failing prefix file are covered by the ten passing corrective files. The final
reconciliation independently checked each failure's file, both corrective
exit receipts, all log hashes and all 935 current tracked files against the
verified source copy. No reported failure remains unresolved. The resumed
process correctly retains exit code one in its historical receipt; that
receipt is never relabeled as a clean pass.

The environment issue was TEMP inside the backend checkout. Repository-artifact
checks rejected temporary databases and source bundles there, while import
verification correctly enforced its outside-repository boundary. An unchanged
rehearsal reproduced `STAGING_VERIFY_PATH_UNSAFE` with that placement and
passed after TEMP and TMP moved outside the checkout, still on E:.

The isolated source copy is at
`E:/hundo-test-work/20260909-launch-gate/checkout`, with sibling `tmp`.
Its first eight files passed 100/100 checks in 1,456,983 ms, and the additional
import/verification files passed 8/8 in 64,426 ms. Both runs preserved all 935
source hashes. Existing local artifacts and original work were preserved.
No application safeguard, staging configuration or hosted data changed.

The original versions of the transformation and reset-report tests pass in
that environment, so the two earlier test-only workarounds were removed.
Their old logs remain historical evidence. The current backend source scope
is 29 files: four existing local commits after `23709ea` through
`ea9ba76`, plus the two uncommitted email timeout files. Version 8 review
artifacts bind this final source scope to the current shared documents.

The two reported skips are in
`sportsDataIoLiveCapabilityArtifactFoundation.test.js`: the symlink-lock
case and linked artifact-target case. Adjacent parent-path, contention and
simulated reparse checks passed. Those native link cases still need a host
that supports creating their required links; this local result does not claim
they ran. The later ordinary hosted build remains a separate publication gate.

The independent local preparation and verification are finished. The remaining
decisions below concern exact source publication, a working hosted account,
email delivery and the real-season calendar. Keep the public launch and hosted
acceptance gates open until their actual evidence exists.

## Evidence and remaining decisions

All private receipts are under
`E:/hundo-leago-backend/.hundo.local/statistics-staging-20260908/`:

- `inspect-email-readiness.receipt.json`: configuration presence/modes.
- `inspect-launch-preparation.receipt.json`: authoritative runtime-derived
  auto-verification, email queue counts and current calendar groups; query-only
  database connection, zero SQL changes and zero foreign-key violations.
- `account-email-readiness.log`: original 48-test passing gate.
- `account-email-body-timeout-before.log`: reproduced timeout defect.
- `account-email-body-timeout-after.log`: 14-test passing correction gate.
- `cutover-temp-boundary-before.log` and `cutover-temp-boundary-after.log`:
  unchanged rehearsal failure/pass proving the temporary-directory boundary.
- `remaining-release-gate-plan.json` and remaining-backend-release-gate receipts:
  exact interrupted-prefix and resumed-suffix coverage.
- `isolated-release-checks-plan.json` and isolated-release-checks receipts/log:
  source-copy hashes, original-test proof and the completed 100-test gate.
- `isolated-import-checks` start/log/exit receipts: the completed eight-test
  follow-up for persistent staging import and independent verification.
- `segmented-release-gate-final.json`: verified 350-file coverage, all 50
  resumed failure locations, the passing corrective evidence and two skips.
- `TEST_ENVIRONMENT_RECOVERY_2026-09-09.md`: private environment investigation.
- `real-season-calendar.receipt.json`: four calendar alternatives.
- `real-calendar-schedule-gate.log`: 37-test passing scheduling gate.
- `unattended-publication-review-v8.json` and `unattended-backend-review-v8.patch`:
  exact local source payload, repository destinations and file hashes for
  reviewing the combined commit/publication request. They contain no database
  export, environment secret or unrelated AGENTS.md change.
  The original unsuffixed review artifacts are retained as the earlier
  29-file snapshot; v2 through v5 preserve earlier test-workaround and
  documentation checkpoints. Version 6 removes the now-unnecessary workarounds.

Automatic approval review rejected the backend GitHub push because it needs
direct approval for the exact source payload and destination. It separately
rejected a local shared-documentation commit, citing the supplied AGENTS.md
requirement for an explicit commit request. Neither rejected action executed.
No alternate commit/publication mechanism will be used to bypass that result.

Questions saved together for Graem's return:

1. Explicitly approve committing the two timeout files and four prepared
   shared documentation files, preserving unrelated AGENTS.md edits; approve
   publishing the reviewed backend changes after `23709ea` (four existing
   local commits through `ea9ba76`, plus the timeout fix) to
   `https://github.com/semitoneharmonies/hundo-leago-backend.git`, branch
   `staging`, followed by the ordinary full build with statistics/matchup
   controls off. Approve the four documentation files to
   `https://github.com/semitoneharmonies/hundo-leago.git`, branch `staging`.
   The docs are API_CONTRACTS.md, STATISTICS_MATCHUPS_2026-09-08.md,
   ACCOUNT_BUYOUT_FOLLOWUPS_2026-09-08.md, and this preparation record.
2. Restore a working signed-in administrator session in the user's existing
   Chrome for actual hosted acceptance; the saved QA credential failed and
   the browser bridge's trusted-path setup is still unavailable.
3. Supply/confirm the verified staging sender and approved test recipient,
   install the staging send-only credential through the service's secret
   settings, and approve the treatment of the four pending notifications
   before an email-delivery check. Do not paste credentials into this record.
4. Identify the intended league and confirm the proposed Week 1/playoff dates
   and the April 12 exclusive scoring boundary, or select a different calendar.

Production, live data resets, automatic matchup activation and credential
resets are outside these prepared actions.
