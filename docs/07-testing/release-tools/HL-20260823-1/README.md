# HL-20260823-1 strict manager-transfer browser helper

This tracked release-test artifact supplies the explicit same-cookie browser
actions required by the approved strict hosted manager-transfer choreography.
It is temporary release tooling, not application functionality. Do not add it
to the normal Vite source, source manifest, or application build.

## Active release identity

The helper is authorized only for:

* release `HL-20260823-1`;
* frontend build `4dfe12d1366314e3d9df722c50771324647743c9`;
* backend build `234547e4d8453b7515fc081ea6ebe4c2d022dc54`;
* URL
  `https://staging.hundoleago.com/release-qa/hl-20260823-1/strict-manager-transfer`;
* API origin `https://api-staging.hundoleago.com`; and
* an exclusive action horizon ending at `2026-08-25T07:00:00.000Z`.

`enabled.json` is the runtime activation authority. It must contain exactly the
eight pinned contract fields checked by the verifier. A fixture receipt or
database fingerprint must never be added to the marker.

## Boundaries

The helper:

* runs only at the exact extensionless URL above;
* constructs a distinct bundled `@tanstack/react-query` `QueryClient`, proves
  both of its caches stay empty, mounts no FAD query or realtime provider, and
  issues zero script-initiated API, fetch, XHR, or WebSocket requests during
  initialization after the browser's normal HTML, JavaScript, and CSS loads;
* performs only the pinned session, Team 1, and assignment GET prechecks plus
  the explicitly selected release action;
* requires the write-arm checkbox plus a separate exact action click;
* fetches a fresh session and current CSRF value immediately before each POST,
  including the replay, keeps the value only in that function call, and never
  renders or persists it;
* fetches the exact same-origin `enabled.json` with `cache: no-store`
  immediately before every POST, rejects marker drift, and hard-stops at the
  expiry above;
* permits only the pinned Admin, Manager A, and Manager B identities;
* validates the exact release, fixture, league, team, caller, assignment,
  backend build, frontend build, publisher result, and zero-write replay;
* renders only a fixed sanitized projection of validated responses; and
* permanently disables its controls after an ambiguous or rejected write.

It has no sign-in form, password field, notification reader, generic request
editor, arbitrary URL, arbitrary body, or arbitrary idempotency control. It
does not read or write cookies, Web Storage, IndexedDB, or browser caches.
Credential cookies and browser security headers are supplied by the browser's
normal credentialed CORS request path.

An exact successful proposal places only its stable assignment ID and phase in
the URL fragment. The fragment is not sent in HTTP requests; it supplies the
auditable handoff URL for the accepting manager's independent cookie jar.

If the page reports `STRICT_STOP`, do not reload it and do not retry the
publisher. Restore the full maintenance hold and use strict abort recovery.

## Exact-build additive overlay

The sealed application build is
`.netlify/strict-release-HL-20260823-1/original-dist`. Its verifier inventory
contains exactly 33 files with canonical inventory digest
`2d8069ca1aa61e02b5be14b09b97ded73b8363ae5e699c0e712f32026903ae6c`,
including:

* `index.html`: 472 bytes, SHA-256
  `90620768a37b57b905a35cd576077cd4c4f1a760da28fc8c1c8a9347458383ca`;
* `assets/index-BFtuYVmF.js`: 527,839 bytes, SHA-256
  `19ee27ed0fa33016e9614b5dd63095b3f1d3af1fc8f33616b4c30a3c961cd201`.

Do not rebuild or modify that sealed directory. Rebuild only the standalone
helper bundle with the approved portable runtime:

```text
scripts/npm-approved.cmd exec -- vite build --config docs/07-testing/release-tools/HL-20260823-1/vite.config.mjs
```

Create the additive deploy candidate at
`.netlify/strict-release-HL-20260823-1/helper-overlay-dist` by copying the
sealed 33-file directory, then add only these four runtime files:

```text
release-qa/hl-20260823-1/strict-manager-transfer.html
release-qa/hl-20260823-1/strict-manager-transfer.js
release-qa/hl-20260823-1/strict-manager-transfer.css
release-qa/hl-20260823-1/enabled.json
```

The result must contain exactly 37 files, and all 33 baseline files must remain
byte-identical. The physical HTML file is intentional, but operators must use
only the lowercase extensionless URL. Netlify Pretty URLs redirect the
uppercase `.html` spelling, so the runtime origin guard rejects it.

The release-specific `[[headers]]` rule in `netlify.toml` is the sole
response-header authority for this helper. It must remain immediately after
the unchanged global rule and pins no-store, noindex, no-referrer, nosniff,
frame denial, and the narrow CSP. The HTML applies the matching enforceable
meta-CSP directives. Do not create or copy a `_headers` file.

Run the focused gates with the approved portable runtime:

```text
.tools/node-v24.14.1-win-x64/node.exe docs/07-testing/release-tools/HL-20260823-1/verify-strict-manager-transfer.mjs
.tools/node-v24.14.1-win-x64/node.exe docs/07-testing/release-tools/HL-20260823-1/verify-strict-manager-transfer.mjs --overlay-root .netlify/strict-release-HL-20260823-1/helper-overlay-dist
scripts/npm-approved.cmd exec -- vitest run docs/07-testing/release-tools/HL-20260823-1/strict-manager-transfer.test.mjs
```

The overlay verifier rejects every missing, extra, or byte-drifted file. It
also requires the original global and non-helper Netlify rules plus the exact
temporary helper rule in canonical order.

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
5. After `ACCEPTANCE_OK`, click the applicable **publish + verify replay**
   button once. It validates the two-write publish and immediate zero-write
   replay.
6. Wait for both mounted FAD diagnostics to settle before changing browser
   identity or beginning the return phase.

Do not open Notifications during the choreography.

## Retirement

After strict evidence is complete, remove only the additive overlay and the
release-specific `netlify.toml` rule, restore the canonical site to the sealed
33-file baseline, and verify the post-removal state with:

```text
.tools/node-v24.14.1-win-x64/node.exe docs/07-testing/release-tools/HL-20260823-1/verify-strict-manager-transfer.mjs --retired-baseline-root .netlify/strict-release-HL-20260823-1/original-dist
```

Retirement mode intentionally rejects any remaining helper header scope or
runtime subtree. Preserve this tracked directory as release evidence; do not
rewrite or reuse it for another release.
