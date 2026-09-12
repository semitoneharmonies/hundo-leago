# Free Agent Draft, Auctions, and Players UX Staging Release

## Status

`STAGING VERIFIED`

Production remains untouched and unauthorized.

## Release Identity

```text
Release ID:       HL-20260818-1
Frontend branch: staging
Frontend app commit:       50f2414cdda5926942975577f70114b5868917a9
Frontend cache safeguard:  2ba016c9d5e6b016a150a62da757f28a9c0140c0
Backend branch:  staging
Backend commit:  9a2f5e8f06b054c84e37d086c1c3a43d0fafbc68
Target schema:   52
```

The final frontend branch preserves the concurrent stale-app-shell reload
protection already published to `origin/staging`. The older overlapping tie
and confirmation presentation from that concurrent branch was superseded by
the later approved manager-privacy and simplified-UX requirements.

## Scope

- selected-team Candidate Card results on Drafts, Free Agent Draft results,
  and historical Candidate Card pages;
- manager outcomes limited to Signed, Not won, and Tie — action required;
- restricted-tie visibility and actions limited to relevant managed teams;
- post-Candidate-deadline nominations, including eligible uncarded players;
- server-recorded binding acceptance with no manager checkbox;
- compact inline restricted-tie bidding and graceful manager deep links;
- server-side Players team filtering before pagination and preselected auction
  navigation from free-agent rows.

Backend audit, validation, authorization, contract, cap, roster, quarantine,
timing, fairness, and recovery controls remain enforced.

## Local Verification

Frontend:

- lint passed;
- `56` test files and `352` tests passed;
- the configured production build completed with `1,784` modules;
- the prebuilt artifact embeds the exact frontend commit and dedicated staging
  API/Socket origin, and does not embed the production API origin;
- the expected existing Vite chunk-size advisory remains non-blocking.

Backend:

- the focused affected matrix passed `152/152` tests;
- the bid-policy and persistence rerun passed `29/29` tests;
- the full local suite discovered `3,356` tests: `3,353` passed, one failed
  only because the workstation has Node `24.11.1` instead of the required
  `24.14.1`, and two Windows link-capability cases were intentionally skipped;
- syntax and whitespace checks passed;
- release preflight agreed on clean exact commits, schema `52`, a contiguous
  `52`-migration source, and checksum set
  `1979cc016fc1102e0f970940e7b6551a73644b7b94bacbe511202c7ac1111546`;
  its sole local blocker was the same Node-version mismatch.

Render's exact Node `24.14.1` build is the authoritative full-suite gate.

The post-deployment Auctions asset safeguard passed its focused responsive and
page matrix (`20/20` tests), lint, and production build. It changes only the
immutable Auctions stylesheet asset identity after an incomplete connector
upload briefly cached an HTML fallback under the prior CSS URL. The functional
application build identity remains the tested `50f2414...` release.

## Maintenance-Hold Deployment and Backup

```text
Render service:        srv-d9eo2turnols73ekb830
Held deploy:           dep-da20cp1t0dsc73aqgte0
Held deploy commit:    9a2f5e8f06b054c84e37d086c1c3a43d0fafbc68
Pre-migration backup:  ccde64d6-bff6-4903-b078-3dd9c1c0b71a
Encrypted SHA-256:     5e0939db8a539a6564a069ce5652943d08b2af584260a2ef74c9c8176b968ef2
Manifest checksum:     cb89a5529d887365b7751379b6b8da0ac006b2768912183d5f863210ed6c48c7
Plaintext SHA-256:      5d9ca9bb3fc856456418c332f3c5f8d45728b8dddb83cbaab20e1f7742dd532c
```

The encrypted offsite backup completed successfully. An independent restore to
a distinct temporary path reported SQLite integrity `ok` and zero foreign-key
violations; the verifier removed its temporary restored file afterward.

## Schema Migration

The migration ran only after the verified backup and clean restore, with
writes closed, scheduled jobs disabled, FAD routes disabled, email delivery
disabled, and the maintenance hold active.

Read-only post-migration inspection reported:

```text
SQLite user_version:          52
SQLite integrity:             ok
Foreign-key violations:       0
Migration 52 build identity:  9a2f5e8f06b054c84e37d086c1c3a43d0fafbc68
Previous migration:           51
```

Migration `0052_allow_post_candidate_deadline_nominations.sql` is forward-only.
It preserves the existing validation and audit triggers while allowing exact
post-deadline nomination states.

## Final Deployment and Hosted Verification

```text
Final Render deploy:   dep-da2147e417fc73brkqmg
Render commit:         9a2f5e8f06b054c84e37d086c1c3a43d0fafbc68
Hosted backend suite:  3,356 passed; 0 failed; 0 skipped
Final Netlify deploy:  6a8420054c9c5a624d86b2c3
Frontend build ID:     50f2414cdda5926942975577f70114b5868917a9
Frontend source head:  2ba016c9d5e6b016a150a62da757f28a9c0140c0
```

The final Render deploy became live after the exact Node `24.14.1` suite
passed. Both `/api/v1/health/live` and `/api/v1/health/ready` returned `200`
with `live` and `ready` status respectively.

The final Netlify deployment uploaded the prebuilt artifact without another
source build. Independent HTTPS inspection confirmed:

- the current index bundle is `index-BvKlwytP.js`;
- the embedded release build ID is the exact `50f2414...` application commit;
- the configured API and Socket origin is the staging API;
- no production API origin is embedded; and
- `AuctionPages-C2tbbcRw.css` returns `200` as `text/css`.

The signed-in Alpha League browser walkthrough was non-mutating and confirmed:

- Drafts and the dedicated Free Agent Draft results route use one compact
  timing summary, a labelled team selector, plain Signed / Not won / Tied
  totals, player search, and no Pending, allocation-filter, timezone, or
  server-workflow copy;
- Frost Vipers shows `11` Signed, `8` Not won, and `3` tied players; Cale Makar
  is correctly `Not won`, and the historical Candidate Card preserves grouped
  original offers with Won / Not won / Tie outcomes;
- Auctions loads with the simplified nomination and active-auction surfaces,
  omits the removed checkbox and technical/legal copy, hides all private ties
  from an account that manages no teams, and redirects an unavailable valid
  deep link back to Auctions without an error page;
- the Big Mac Players filter returns Matthew Schaefer, Miro Heiskanen, and Zach
  Werenski and reports `3 of 3`, instead of the former Matthew-only result; and
- a `playerId`-preselected Auctions URL loads cleanly without submitting a
  nomination.

The retained browser session identifies as `Admin`. The Teams page confirms
that Crimson Raptors, Frost Vipers, and Silver Cyclones are managed by the
separate `Man A Leag A` account. Therefore the live walkthrough could not
legitimately display or exercise that manager's inline tie controls or
preselected nomination form. Those authority-sensitive paths are covered by
the passing focused UI/API tests; no attempt was made to impersonate a manager,
change team authority, submit a bid, or mutate league data. The browser backend
also did not honor a temporary mobile viewport override, so responsive coverage
is recorded from the passing responsive test rather than claimed as a live
device-width observation.

## Rollback Boundary

The verified encrypted backup above is the pre-migration data rollback input.
After normal application traffic resumes on schema `52`, any code or schema
correction must follow the forward-fix rule unless an authorized staging
restore is deliberately selected. Netlify rollback does not restore backend
data. Production resources were not changed.
