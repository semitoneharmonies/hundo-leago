# Trade fog of war — staging review

Unexecuted trade assets are visible only to current participating managers.
Uninvolved league members see the teams and basic status, including through
direct trade links and League Activity. Commissioners have the same restriction
except when an accepted Future Considerations trade awaits their approval.
Execution reveals the full exchange and normal announcement. Rejected,
cancelled, expired and superseded offers remain private; executing a counter
does not reveal its declined original.

The backend filters existing records during reads. It preserves stored assets,
events and activity, and needs no migration. The frontend accepts the explicit
private response shape, displays a privacy notice and avoids impact requests
for hidden proposals. Participant response and counter behavior are preserved.

## Verification

- Seventeen focused backend HTTP privacy checks passed, covering both trade
  formats, all participant roles, ordinary observers, commissioner and inherited
  administrator access, acceptance timing, closure, automatic cancellation,
  counter execution, reversal, pagination, caller spoofing and league scope.
  Privacy reads are asserted byte-for-byte read-only.
- Fifty-nine frontend component/contract checks passed across six files,
  including two league contexts and visibility changing after execution.
- Ten desktop/mobile Chromium scenarios passed. One initial Vite page-load
  timeout passed on focused retry. Privacy screenshots were inspected.
- Initial frontend fork startup timeouts were resolved by running one worker.
  Tests exposed and verified a correction to the redacted activity title. An
  existing realtime test now waits for the actual rendered response update.
- Changed-file ESLint and the staging Vite build passed. The build retains its
  existing large-chunk warning.

Broader backend regression and hosted full-suite results, deployment receipts,
and final hosted checks are recorded in the private release folder:
`E:/hundo-leago-backend/.hundo.local/trades-staging-20260925/`.

## Release and preservation boundaries

Staging only; production remains on hold for user review. No hosted trades are
submitted by verification. The last verified encrypted staging backup has been
authenticated again in place. It is an existing backup, not a newly created
scheduled backup. Protected-record comparisons remain on staging and return
only pass/fail. The separate previously recorded scheduled-backup/restart
follow-up remains open.

Rollback is a code redeployment to the preceding staging revisions (backend
448fee40da14fb33b65dc3f211bfc25e6efa70ed, frontend
d173a9e41b5317303be415b32dc6bb362fa49fe7); it requires no database restoration.
An old code revision would restore the previous broad trade visibility, so a
privacy correction is preferable to rollback when possible.
