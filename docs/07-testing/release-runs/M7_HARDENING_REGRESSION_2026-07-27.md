# M7 Staging Hardening and Regression Run

## Run Summary

- Date: `2026-07-27`
- Work plan: `M7-18`
- Environment: isolated Netlify and Render staging resources
- Result: ready for manual staging testing
- Production changes: none
- Persistent staging-data changes: none
- Scheduled jobs, provider refresh, and outbound email: not activated

## Published Source

Frontend `staging` commits:

```text
82d1e48d8fc9617e174ffd34a77a40fc89c713f4
07cd689916c8083e84cbfd72281df8cb479699ec
```

Backend `staging` commits:

```text
cdcb139b0c2c859abfbf11d8fcedd9a0eecc9f70
b8f93af412df4d608d8d6f10103fec49edeb3ffa
522f0ce2a03428f6ed72f8a504d1b560d012ee35
```

Frontend Netlify deploy:

```text
6a6713c190a1d98698ab558b
https://hundoleago-staging.netlify.app
```

Final backend Render deploy:

```text
dep-d9jhfhsm0tmc73b0jjn0
https://hundo-leago-backend-staging.onrender.com
```

## Confirmed Defects Corrected

### Platform-administrator matchup authority

The authenticated platform administrator passed the outer commissioner policy
but was rejected by lower matchup repositories that rechecked the actor as the
league's named commissioner.

The outer authorization result now propagates an explicit inherited
platform-administrator authority flag through schedule, result, recovery, and
standings services and repositories. The real administrator user ID remains
the audit actor; no commissioner impersonation was introduced. Active league
membership is still required.

The hosted administrator can now preview a standings rebuild. Schedule
generation reaches the expected current-state conflict because the schedule
already exists, rather than failing commissioner authorization.

### Commissioner preview presentation

Competition previews no longer expose serialized JSON. Schedule, week, result,
and standings previews use labelled metrics, and standings includes a
user-facing projected table.

### Client diagnostic leakage

Legacy browser console logging of player URLs and counts, statistics responses,
trade objects, counter offers, bid payloads, auction search objects, and caught
error stacks was removed. The explicit no-browser-autosave guard required by
the M3 browser-authority verifier was preserved.

### Environment isolation

Frontend startup now rejects:

- a staging build pointed at the exact production Hundo Leago backend; and
- a production build pointed at the exact staging Hundo Leago backend.

### Response hardening

Netlify now serves:

- Content Security Policy;
- cross-origin opener and resource policies;
- restrictive Permissions Policy;
- Referrer Policy;
- HSTS;
- MIME sniffing protection;
- frame denial;
- immutable caching for fingerprinted assets; and
- no-store caching for `index.html`.

Both compatibility and deployed backend application composition disable the
Express `X-Powered-By` fingerprint.

## Automated Verification

Frontend:

```text
npm run lint
PASS

npm test -- --run
23 files, 126 tests passed

npm run build
PASS

npm run verify:m3-browser-authority
PASS: 15 compatibility files and 99 shipped source files inventoried

npm ls --all
PASS (platform-specific optional dependencies remain optional)

git diff --check
PASS
```

Backend:

```text
npm run check
PASS

npm test
983 tests: 982 passed, 1 workstation-runtime mismatch
Actual local Node: 24.11.1
Approved Node: 24.14.1

node --test test/foundation/targetDeploymentRuntimeFoundation.test.js \
  test/characterization/corsCompatibility.test.js
19 tests passed after final response hardening

npm ls --all
PASS (platform-specific optional dependencies remain optional)

git diff --check
PASS
```

The final Render build used Node `24.14.1` and ran:

```text
npm ci && npm run check && npm test
```

The accepted final deployment recorded:

```text
983 tests passed
0 failed
```

## Hosted Regression Coverage

The browser sweep exercised:

- platform administrator, two league commissioners, and a manager;
- administrator, commissioner, manager, account, and notification pages;
- dashboards, teams, players, rosters, auctions, trades, matchups, standings,
  activity, and commissioner roster operations;
- manager denial from commissioner routes;
- one commissioner denied direct access to the other commissioner's league;
- 100-player pagination followed by the next 100 unique records;
- player-name search suggestions;
- roster row counts, legal actions, and request-trade links;
- notification-to-trade deep links;
- human-readable administrator standings preview;
- schedule-preview inherited authority;
- page loading and team data under the deployed CSP; and
- a clean browser console after the final frontend deployment.

The public staging response returned the configured security headers. The
fingerprinted JavaScript asset returned JavaScript content with one-year
immutable caching, and `index.html` returned `Cache-Control: no-store`.

Backend liveness and readiness returned `200` after deployment.

## Static Review

- No use of `dangerouslySetInnerHTML`, `eval`, or `new Function` was found in
  shipped frontend source.
- No tracked private-key or credential-value pattern was found in either
  repository.
- No client transaction or provider-payload console logging remains.
- Frontend local storage remains limited to the quote index and preferred
  league selection.
- The installed TanStack packages contain neither the known malicious
  `@tanstack/setup` optional dependency nor `router_init.js`.
- No recent unexpected staging application errors were found in the inspected
  Render log window.

## Intentionally Preserved

- Backend authority remains the source of truth for calculations and writes.
- Named commissioners retain their existing authority.
- Platform-administrator inheritance still requires active league membership.
- Preview, version, confirmation, and idempotency requirements remain.
- League isolation, manager restrictions, and existing API response envelopes
  remain.
- Staging data, database schema, scheduler state, email state, and provider
  cache remain unchanged.

## Tests Not Performed

- No confirmed commissioner competition mutation was executed against hosted
  staging; hosted checks stopped at read-only preview.
- No destructive recovery, fixture reset, provider import, email delivery, or
  scheduled job was run.
- A true narrow mobile viewport could not be established in the available
  browser session. Responsive CSS was inspected, but a real-device/mobile
  browser pass remains outstanding.
- A registry-backed `npm audit` was not run because it would transmit the
  repository dependency tree to an external advisory service and that separate
  disclosure was not authorized during this run.

## Remaining Risks and Follow-up

1. Render's `npm ci` reported seven backend dependency advisories
   (`1 low`, `2 moderate`, `4 high`). The dependency tree resolves and all
   runtime tests pass, but the individual advisories remain unclassified.
   GitHub Dependabot alerts are disabled on both repositories. This does not
   block manual staging product testing, but dependency advisory review should
   be completed before production security sign-off.
2. The local workstation Node patch version does not match the pinned runtime.
   Render closed this gap by passing the full suite on Node `24.14.1`.
3. Canonical `CURRENT_STATE.md` still contains older architectural narrative in
   early sections. The roadmap and work-plan records are current; a dedicated
   documentation reconciliation should be scheduled rather than silently
   rewriting project history in this pass.
4. A real mobile-device regression pass remains required before launch.

## Documentation Decision

This release-run record and the M7-18 work-plan completion evidence are the
documentation updates for the pass. Product rules and API contracts did not
change.
