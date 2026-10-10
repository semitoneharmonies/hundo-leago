# Player-card NHL branding — local verification, 9 October 2026

Status: implemented and locally verified. No commit, push, staging publication, authenticated hosted acceptance or production deployment was performed.

Worktree: `E:/hundo-leago/.hundo.local/player-card-branding-20261009`, branch `codex/player-card-branding-20261009`, based on release source `16b0f55`. The root frontend checkout predates player cards and contains unrelated work; it was preserved. Backend application files and league data were not changed.

## Result

- All 32 current NHL teams use explicit digital brand colours from the user-supplied Team Color Codes pages. The published HEX value takes precedence where that source's HEX and RGB differ. Source PMS labels and URLs are recorded, without claiming physical Pantone ink can be reproduced exactly on every screen.
- Team numeral shapes come from the supplied Puck Marks home-number images, digitized into ten SVG symbols per team. These are reference-derived vector outlines, not official font files. The number is rendered without forced generic italics or a system-font substitution.
- Each displayed team loads one same-origin SVG file; the set totals 251,063 bytes before compression, with none of the source photographs embedded. Existing Content Security Policy needs no additional third-party origin.
- Utah retains its official NHL black/blue/white palette and uses Boston Bruins numeral shapes following Graem's follow-up, replacing the originally approved Arizona fallback. Utah's actual Mammoth Sans numeral set was not located in usable verified form. Its PMS labels remain unverified.
- Removed colour mixing, texture and opacity from the NHL panel. Compact card dimensions, fantasy owner branding, authoritative number data, privacy boundaries, contract/statistics/history content and existing missing-appearance handling are preserved. Unknown teams retain generic Hundo styling.

## Files changed

Under the worktree above:

- `src/features/players/nhlTeamColours.js` — published screen palette and per-team number outlines.
- `src/features/players/PlayerJersey.jsx` and `PlayerJersey.module.css` — isolated graphic renderer, Utah fallback, proportions, accessible image label, forced-colour handling.
- `src/features/players/nhlNumberWidths.json` — measured glyph proportions.
- `src/features/players/PlayerHockeyCard.jsx` and `PlayerHockeyCard.module.css` — integrate the graphic and remove superseded styling.
- `public/nhl-numbers/ANA.svg`, `ARI.svg`, `BOS.svg`, `BUF.svg`, `CAR.svg`, `CBJ.svg`, `CGY.svg`, `CHI.svg`, `COL.svg`, `DAL.svg`, `DET.svg`, `EDM.svg`, `FLA.svg`, `LAK.svg`, `MIN.svg`, `MTL.svg`, `NJD.svg`, `NSH.svg`, `NYI.svg`, `NYR.svg`, `OTT.svg`, `PHI.svg`, `PIT.svg`, `SEA.svg`, `SJS.svg`, `STL.svg`, `TBL.svg`, `TOR.svg`, `VAN.svg`, `VGK.svg`, `WPG.svg`, `WSH.svg` and `README.md` — numeral symbols and provenance/method guidance.
- `docs/assets/nhl-branding-sources.json` — source URLs, source-image hashes, colour/Pantone references and Utah exception.
- `docs/03-product-specs/PLAYER_CARDS.md` — approved visual refinement.
- `e2e/fixtures/player-jersey-branding.html`, `player-jersey-branding.jsx` and `e2e/player-jersey-branding.spec.js` — synthetic all-team preview and browser regression checks.
- This verification record. The private development tracker receives a separate local checkpoint through its validated CLI.

## Verification actually run

From the worktree:

```powershell
$env:VITE_APP_ENV='local'
$env:VITE_API_ORIGIN='http://127.0.0.1:4199'
$env:VITE_SOCKET_ORIGIN='http://127.0.0.1:4199'
npm exec -- vitest run src/features/players/PlayerHockeyCard.test.jsx
npm exec -- eslint src/features/players/PlayerJersey.jsx src/features/players/PlayerHockeyCard.jsx src/features/players/nhlTeamColours.js e2e/fixtures/player-jersey-branding.jsx e2e/player-jersey-branding.spec.js
npm run build
git -c safe.directory=E:/hundo-leago/.hundo.local/player-card-branding-20261009 diff --check
```

All nine existing card tests pass. The initial test attempt lacked public local configuration and displayed the existing startup guard; supplying the loopback configuration above resolved that setup issue. Focused ESLint and whitespace checks pass. Final production build passes with the existing large-chunk warning; this is compilation evidence, not a deployable configured release or hosted acceptance.

A Node inspection compared every active team palette value with the saved source manifest and checked each mapped digit symbol: 32 palettes and 320 glyph mappings pass.

Local preview server: `npm run dev -- --host 127.0.0.1 --port 5189 --strictPort`.

```powershell
npm exec -- playwright test --config E:/hundo-leago/.hundo.local/player-card-branding-references/playwright.config.mjs --project=desktop-chromium --project=mobile-chromium --project=desktop-webkit --project=mobile-webkit
```

Final result: 8/8 browser tests pass. All 320 numeral instances have nonempty rendered geometry; SVG requests succeed; there are no page errors or horizontal overflow. Vancouver single-digit, Nashville repeated digits/string details, Winnipeg number containing zero and Utah fallback open in cards; cards and numerals fit both viewport sizes, Escape closes and focus returns. All-team screenshots and desktop/mobile card screenshots were inspected.

The first five-project run also attempted Firefox. Both Firefox checks stopped before page creation with `browserContext.newPage: Cannot read properties of undefined (reading '_page')`. Firefox is unverified; no application result is inferred from this runtime failure. No hosted signed-in checks were run.

Browser artifacts and downloaded research remain private on E: at `E:/hundo-leago/.hundo.local/player-card-branding-references/`. The preview is `http://127.0.0.1:5189/e2e/fixtures/player-jersey-branding.html` while its local server is running.

## Remaining limits

The user-supplied pages are the requested reference, and some depict earlier uniform generations or internally inconsistent colour conversions. The result reproduces those numeral references with the site's published digital palette, rather than claiming official font binaries or newly verified 2026 uniform specifications. Utah's Boston numeral style is intentional. Firefox and hosted acceptance remain unverified. Publication requires separate user authorization.


## Follow-up — Utah uses Boston numeral shapes

Graem requested Boston's number style in Utah colours, superseding Arizona. Updated `src/features/players/PlayerJersey.jsx`, the local preview JSX, the existing browser expectation, the product specification, numeral README and source manifest. `nhlTeamColours.js` was not changed in this follow-up. Utah still renders black `#010101`, blue `#6CACE4` and white; only its numeral source changes to `BOS.svg`.

Re-ran the focused ESLint command for the component, fixture and browser spec, `git diff --check`, and the four-project Playwright command above. All checks passed, including 8/8 desktop/mobile Chromium/WebKit tests and the 320-digit gallery. Inspected the updated Utah mobile screenshot. No new build or unit-test run was needed for this mapping-only change; previous results above remain historical. Firefox and hosted acceptance remain unverified. No publication, commit or data change.
