# Matchup Figma Handoff

## Purpose

The canonical matchup flow and data contracts are ready for a visual design.
Figma may replace the page's temporary semantic layout and styling without
changing league isolation, route behavior, score authority, or read-only
behavior.

## Theme A Implementation Status

The approved Theme A implementation now uses one league-scoped matchup page
with season and week controls, a same-week matchup sidebar, a score comparison,
and side-by-side vertical player rows with the authoritative matchup-period
statistics below. It preserves explicit empty/missing-data states and contains
the wide comparison table so the document itself does not require horizontal
scrolling. Automated competition tests and the documented local rendered
desktop, narrow-mobile, and 200% zoom acceptance pass. Physical-device,
multi-browser, screen-reader, and hosted-staging acceptance remain open.

## Canonical Flow

* `/leagues/:leagueId/matchups` is the only matchup page.
* `/matchups` redirects to the preferred visible league, the only visible
  league, or league selection when a league choice is required.
* A manager can select a season, week, and matchup.
* The selected matchup refreshes every five minutes and has a manual Refresh
  action.

## Required Screens and States

The design should cover:

* signed out and league access denied;
* initial loading and background refresh;
* no configured season;
* season with no generated schedule;
* week with no pairings and a week containing a bye;
* future matchup before roster lock/baseline;
* current live matchup;
* delayed statistics and temporarily unavailable scoring;
* illegal locked roster;
* missing data for an individual player;
* final result and corrected official result;
* desktop and narrow mobile layouts.

## Available Matchup Data

Each matchup provides team names, status, timing, official team totals when
finalized, and a live or final scoring projection when available. Each scoring
side provides roster legality, team FP, and locked player rows with:

* player name;
* forward or defense position and slot number;
* matchup games played;
* goals;
* assists;
* NHL points;
* fantasy points;
* available or missing data status.

Empty forward and defense slots remain explicit. For a corrected result, the
official corrected team totals are authoritative while player rows remain the
recorded source-snapshot breakdown.

## Interaction and Accessibility Constraints

* Keep season, week, and same-week matchup choices keyboard operable.
* Preserve visible focus, useful headings, table semantics, status messages,
  and error alerts.
* Do not encode meaning through color alone.
* Avoid whole-page horizontal overflow at mobile widths. A wide stat table may
  use its own contained overflow or a Figma-approved mobile transformation.
* Keep delayed/unavailable messages understandable to managers; raw provider
  timestamps and internal status codes are not primary UI.
* Refresh and navigation actions must remain read-only.
