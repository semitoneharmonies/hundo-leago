# HL-20260821-3 strict manager-transfer browser helper

This tracked release-test artifact supplies the explicit same-cookie browser
actions required by the approved strict hosted manager-transfer choreography.
It is not application functionality and must not be added to the Vite source,
source manifest, or normal build.

## Retired state

The helper is retired. Strict phase one stopped on the frozen Manager B
diagnostic-counter gate, the canonical staging site was restored to its sealed
baseline, and the temporary helper-specific `netlify.toml` rule was removed.
The runtime and source files remain only as release evidence; they do not
authorize rebuilding, republishing, or rearming the helper.

Verify the current post-removal repository state with:

```text
node docs/07-testing/release-tools/HL-20260821-3/verify-strict-manager-transfer.mjs --retired-baseline-root dist
```

This mode requires the original global Netlify rules and rejects any
reintroduced helper header scope. It also verifies the complete pinned
baseline inventory and requires the helper runtime subtree to be absent. It
cannot be combined with `--overlay-root`. The unflagged verifier commands
below describe the historical authorized overlay boundary and intentionally
fail against the retired baseline.

## Boundaries

The helper:

* runs only at the exact URL
  `https://staging.hundoleago.com/release-qa/hl-20260821-3/strict-manager-transfer`;
* calls only `https://api-staging.hundoleago.com`;
* constructs a distinct bundled `@tanstack/react-query` `QueryClient`, proves
  both of its caches stay empty, mounts no FAD query or realtime provider, and
  issues zero script-initiated API, fetch, XHR, or WebSocket requests during
  initialization after the browser's normal HTML/JS/CSS loads;
* performs only the pinned session, Team 1, and assignment GET prechecks plus
  the explicitly selected release action;
* requires the write-arm checkbox plus a separate exact action click;
* fetches a fresh session and current CSRF value immediately before each
  POST (including the replay), keeps the value only in the current function
  call, and never renders or persists it;
* fetches the exact same-origin `enabled.json` with `cache: no-store`
  immediately before every POST, rejects any marker drift, and hard-stops at
  `2026-08-23T07:00:00.000Z`;
* permits only the pinned Admin, Manager A, and Manager B identities;
* validates the exact release, fixture, league, team, caller, assignment,
  backend build, frontend build, publisher result, and zero-write replay;
* renders only a fixed sanitized projection of validated responses; and
* permanently disables its controls after any ambiguous or rejected write.

It has no sign-in form, password field, notification reader, generic request
editor, arbitrary URL, arbitrary body, or arbitrary idempotency control. It
does not read or write cookies, Web Storage, IndexedDB, or browser caches.
Credential cookies and browser security headers are supplied by the browser's
normal credentialed CORS request path.

An exact successful proposal places only its stable assignment ID and phase in
the URL fragment. The fragment is not sent in HTTP requests; it supplies the
auditable handoff URL for the accepting manager's independent cookie jar.

If the page reports `STRICT_STOP`, do not reload it and do not retry the
publisher. Restore the full maintenance hold and select strict abort recovery.

## Exact-build overlay

First verify the existing `dist/` is the already-approved frontend build. The
verifier pins its complete original inventory, including `index.html` SHA-256
`1982ecf04cc456d989f7b42f15f3ced49a5d825df0dedd948deaffe8d8c1adc8`
and the 527,839-byte main bundle SHA-256
`5b2336e5b1e099ef32747b48124c331495cefad1511e26d244e09d5567460394`.
Do not run the normal application build merely to add this helper.

The helper JavaScript is its own additive bundle. Rebuild only that bundle:

```text
npx vite build --config docs/07-testing/release-tools/HL-20260821-3/vite.config.mjs
```

Copy these four release runtime files under the exact existing output:

```text
dist/release-qa/hl-20260821-3/strict-manager-transfer.html
dist/release-qa/hl-20260821-3/strict-manager-transfer.js
dist/release-qa/hl-20260821-3/strict-manager-transfer.css
dist/release-qa/hl-20260821-3/enabled.json
```

The physical HTML file is intentional, but operators must browse only the
lowercase extensionless URL above. Netlify's Pretty URLs redirect the
uppercase `.html` spelling, so the runtime origin guard rejects it.

The release-specific `[[headers]]` rule in the tracked `netlify.toml` is the
sole response-header authority for this helper. It must remain immediately
after the unchanged global header rule for the no-build deploy and pins
no-store, noindex, no-referrer, nosniff, frame denial, and the narrow CSP. The
HTML also applies the matching enforceable meta-CSP directives. Do not create
or copy a `dist/_headers` file for this overlay.

This overlay changes the temporary Netlify deploy content digest, but does not
change the approved application bundle, application index, or pinned frontend
build ID `0e8eee92e2e323dd7f25ec3112988feaf23f96f0`.

Run the static verifier before and after copying:

```text
node docs/07-testing/release-tools/HL-20260821-3/verify-strict-manager-transfer.mjs
node docs/07-testing/release-tools/HL-20260821-3/verify-strict-manager-transfer.mjs --overlay-root dist
npx vitest run docs/07-testing/release-tools/HL-20260821-3/strict-manager-transfer.test.mjs
```

The overlay command verifies every original file plus the exact additive
runtime; any missing, extra, or byte-drifted file fails. It also verifies that
the tracked `netlify.toml` retains the exact original global response headers
for non-helper routes and the exact temporary helper rule in canonical order.

## Operator sequence

Use the helper as the separate action tab in each existing cookie jar. Keep
the normal FAD results tab mounted in that same jar.

1. Click **Verify current session** and confirm the exact sanitized role and
   user ID.
2. Check the write-arm box.
3. As Admin, click the applicable proposal button. It first proves Team 1's
   exact current manager and predecessor assignment. Copy the emitted
   fragment-bearing action URL into the accepting manager's helper tab.
4. As the exact target manager, verify the session again, enter the assignment
   ID, and click the exact acceptance button.
5. After the acceptance reports `ACCEPTANCE_OK`, click the applicable
   **publish + verify replay** button once. That click issues the fresh
   publisher call, validates its two writes, immediately issues the identical
   replay, and validates zero writes.
6. Wait for both mounted FAD diagnostics to settle before changing any browser
   identity or starting the return phase.

Do not open Notifications during the choreography. Remove this temporary
overlay and the release-specific `netlify.toml` header rule from the final
activated site after the strict hosted evidence is captured, then redeploy the
approved baseline.
