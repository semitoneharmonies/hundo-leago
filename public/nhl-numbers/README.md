# NHL jersey numeral assets

The 32 SVG symbol sets contain only digits 0–9. `BOS.svg` also supplies Utah's number shapes, as requested in the follow-up; Utah retains its own palette. Colours are applied by `PlayerJersey`, not baked into these assets. The browser fetches only the selected team's small same-origin file; no font installation or third-party image request is required.

Source: https://www.puckmarks.net/nhlnumbersfonts, checked 9 October 2026. Direct reference URLs, source-image SHA-256 hashes, colour values and Pantone provenance are in `docs/assets/nhl-branding-sources.json`.

These are digitized reference outlines, not official font binaries. Each home-reference image is 4500 × 3240. Its solid numeral fill is isolated by colour, retaining the ten main connected components in row/column order and their interior counters. Contours are simplified at one source pixel, normalized to a height of 100, and recorded in `n0`–`n9` symbols. Nashville's six string details are separate clipped symbols. `src/features/players/nhlNumberWidths.json` preserves each digit's proportions. The source images are reference material; no logo, background or image footer is distributed in the assets.

To replace a set, preserve the symbol IDs, update the matching widths and source provenance, and rerun the all-team browser checks. Inspect all ten glyphs against the linked reference, including narrow 1, open 4, counters in 0/6/8/9 and the font's original slant. Number styling is tied to the supplied reference, which may depict an earlier uniform generation.
