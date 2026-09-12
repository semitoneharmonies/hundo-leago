# M3-20 - Account and League-Selection Frontend Integration

## Document Status

`COMPLETE`

## Completion Date

`2026-07-21`

## Approved Boundary

M3-20 connected the frontend to the local/test target account, session,
league-visibility, and team-read contracts without enabling the target runtime
in shared staging or production.

The completed boundary:

1. adds one validated frontend environment boundary and one credentialed HTTP
   client with typed safe errors, in-memory CSRF, idempotency, and version
   headers;
2. represents unknown, authenticated, and unauthenticated session state without
   flashing private content;
3. provides sign-in, sign-up, sign-out, verification, credential setup,
   password-reset, and reactivation flows without persisting secrets;
4. removes action tokens from URL fragments immediately and retains them only
   in the active action-page lifecycle;
5. lists only backend-authorized leagues, routes by stable league and team IDs,
   and handles zero, one, and multiple visible leagues;
6. clears credential form values before successful SPA navigation and does not
   restore them through reload or browser history;
7. keeps compatibility feature pages available while supplying them no
   browser-claimed identity or authority; and
8. supplies isolated local browser fixtures and a repeatable real-Chrome
   verifier that never opens shared or production data.

## Files Changed

### Frontend account and league integration

* frontend environment, API, query, routing, session, account-action, league,
  and team modules under `src/`;
* focused Vitest and Testing Library coverage;
* responsive authenticated and unauthenticated top-bar behavior; and
* the reviewed frontend test dependencies and lockfile updates.

### Local connected-browser verification

* `scripts/start-m3-browser-fixture.js`
* `scripts/verify-m3-connected-browser.js`

The fixture uses an OS-temporary SQLite database, exact Node runtime checking,
synthetic users and leagues, and optional ephemeral valid action tokens. The
verifier uses an installed ordinary Chrome instance at a real `390 x 844`
viewport and audits interactive state, navigation, layout, and request bodies.

### Contract corrections found by integration

* `src/application/services/accounts/createSessionService.js`
* `src/application/services/accounts/createAccountEmailDeliveryService.js`
* focused backend foundation tests

The safe session projection now includes the approved display name, generated
account-action links use the canonical frontend paths, and frontend sign-out
sends the empty JSON body required by the unsafe-request boundary.

## Verification Evidence

All repository verification used Node `24.14.1`.

```text
Frontend tests: 57/57 passed
Frontend lint: passed
Frontend production build: passed
Complete backend suite: 533/533 passed across 133 suites
Backend browser-fixture and verifier syntax: passed
Repository diff checks: passed
Production target mount markers: 0
```

Ordinary installed Chrome completed the connected journey at a genuine mobile
viewport:

```text
Viewport: 390 x 844
Document width: 390
Horizontally overflowing elements: 0
Valid terminal action-link flows: 4
Native Enter submissions: 6
Credential DOM cleared before navigation: true
Credential restoration through history: false
Audited request bodies without authority claims: 8
```

The same run proved sign-in rejection and success, registration validation and
success, two-league selection, stable-ID team routing, session preservation
through reload and history, sign-out preservation through reload and history,
fragment removal, accessible errors and controls, and request-side CSRF. Final
account and team screenshots were visually inspected with no overlap or
horizontal document overflow.

## Safety Result

No target route was mounted in production, no shared database was opened or
migrated, no real account email was sent, and no deployment, commit, or push
was performed. Temporary SQLite data, browser evidence, server processes, and
the temporary Playwright installation were removed after verification.
