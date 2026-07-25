# M7 Manual Website Test Guide

## Purpose

Use this guide for quick, repeatable testing of the real frontend against the
real target backend with disposable synthetic data. It is the short operator
companion to `MANUAL_QA_CHECKLIST.md`; it does not replace the full release
checklist or prove hosted staging, provider, physical-device, or production
behavior.

The launcher keeps scheduled jobs disabled, captures email locally, uses a
temporary SQLite database, and deletes its owned fixture after clean shutdown.
It does not use production data or credentials.

## Start the Disposable Website

Open PowerShell and run:

```powershell
Set-Location E:\hundo-leago-backend
$env:M7_RELEASE_QA_PASSWORD = 'hundo'
npm.cmd run release:qa:site
```

Wait for the terminal to display:

```text
Open: http://127.0.0.1:5173
```

Open that address in a browser. Keep the terminal open during testing. Press
`Ctrl+C` once when finished and wait for the clean-shutdown message before
closing the terminal.

Use `npm.cmd`, not `npm`, on Windows systems where PowerShell blocks `npm.ps1`.
The synchronized project used for this test is stored on `E:`.

## Test Accounts

Every account uses the test-only password `hundo`, supplied to the launcher in
`M7_RELEASE_QA_PASSWORD`. The launcher also prints this account list, but never
prints the password.

| Name | Email | State or role | Expected access |
| --- | --- | --- | --- |
| Admin | `admin@release-qa.example.test` | Platform administrator | Explicit membership in both Alpha and Beta plus inherited commissioner authority |
| Comm A | `comm.a@release-qa.example.test` | Commissioner | Release QA Alpha League and commissioner tools |
| Comm B | `comm.b@release-qa.example.test` | Commissioner | Release QA Beta League and commissioner tools |
| Man A Leag A | `man.a.leag.a@release-qa.example.test` | Manager | Alpha only; manages Owls |
| Man B Leag A | `man.b.leag.a@release-qa.example.test` | Manager | Alpha only; manages Ravens |
| Man A Leag B | `man.a.leag.b@release-qa.example.test` | Manager | Beta only; manages Owls |
| No League | `no.league@release-qa.example.test` | Active account without a league | Signed in, but no league membership |
| Pending | `pending@release-qa.example.test` | Pending email verification | Generic invalid-credentials response; no active-account access |
| Deactivated | `deactivated@release-qa.example.test` | Deactivated account | Same generic invalid-credentials response; no active-account access |

Alpha and Beta intentionally reuse team names. Seeing the other league while
signed in as a league-specific manager is a privacy failure, not a fixture
quirk.

## Five Short Test Tours

### Tour 1 - Alpha Manager and Primary Navigation

1. Sign in as `man.a.leag.a@release-qa.example.test`.
2. Confirm that only **Release QA Alpha League** is offered.
3. Open the top-left **Menu**.
4. Visit every visible page:
   Dashboard, Teams, Players, Auctions, Trades, Matchups, Standings, League
   activity, Notifications, and League Rules.
5. Confirm that the Hundo Leago logo returns to the current league home.
6. Confirm that the Dashboard uses live fixture data and that its links open
   the corresponding canonical pages.
7. Confirm that commissioner tools are absent.

Expected result: every menu item stays in Alpha, every page loads, and no old
duplicate matchup, standings, player, or roster page appears.

### Tour 2 - Corrected Functional Paths

While still signed in as the Alpha manager:

1. On league home, open a team and confirm its roster, contracts, and cap
   projection load instead of the application-data error.
2. Open Players and confirm player names are readable and player details open.
3. Open Auctions. In the **Player** field, type part of a name with different
   capitalization, choose a matching suggestion, and confirm money is shown in
   dollars rather than cents.
4. Open Matchups and choose a season, week, and same-week matchup. Confirm both
   teams, their vertical player lists, and each player's matchup statistics are
   available on the one canonical page.
5. Open Standings and confirm all six fixture teams appear in an understandable
   standings table.

Expected result: these operations remain within `/leagues/<league-id>/...`.
The old direct URLs `/free-agents`, `/matchups`, and `/standings` must redirect
to Players, Matchups, and Standings for the visible or remembered league.

### Tour 3 - League Isolation

1. Sign out from a nested Alpha route.
2. Confirm the application returns to sign-in rather than hanging on a
   “Checking secure league access” message.
3. Sign in as `man.a.leag.b@release-qa.example.test`.
4. Confirm only **Release QA Beta League** appears.
5. Use the menu, team links, Players, Matchups, and Standings.
6. While on a specific Beta page such as Auctions, Matchups, or a team roster,
   press the browser Refresh button. This is a “nested Beta URL.” Confirm that
   the same Beta page reloads and stays in Beta.

Expected result: no Alpha league name, team record, player ownership, bid,
trade, matchup, activity, or notification is disclosed.

### Tour 4 - Authority and Account States

1. Sign in as an Alpha manager and confirm commissioner tools are absent.
2. Sign in as the Alpha commissioner and confirm commissioner tools appear.
3. Sign in as the platform administrator and confirm both leagues are visible.
   Open each league and confirm the account is labelled **Platform
   administrator** and Commissioner tools are available.
4. Sign in with the no-membership account and confirm the explicit
   no-membership state.
5. Try the pending-verification and deactivated accounts with the fixture
   password. Both must return the same generic invalid-credentials response.
   This is intentional anti-account-enumeration behavior; sign-in must not
   reveal whether an account exists, awaits verification, or is deactivated.

Expected result: navigation and actions match the account's backend authority;
hidden controls do not substitute for backend authorization.

### Tour 5 - Responsive, Keyboard, and Reconnect

1. At normal zoom, test desktop and a narrow mobile viewport.
2. At 200% browser zoom, open and close the main menu, follow every menu link,
   sign in, and sign out.
3. Confirm the logo does not cover buttons or text, the menu stays in frame,
   focus outlines remain visible, and the page has no whole-page horizontal
   scroll.
4. Use Tab and Shift+Tab through visible controls and use Enter to submit
   sign-in.
5. While signed in on a specific page such as Auctions, Matchups, Standings,
   or a team roster, press the browser Refresh button. Confirm that the same
   signed-in page returns rather than the home or sign-in page.
6. Repeat the Socket.IO offline/online reconnect procedure from
   `MANUAL_QA_CHECKLIST.md`.

Expected result: the current feature remains usable without a mouse, at narrow
width, after reload, and after reconnect.

## Canonical Route Inventory

The menu should expose page-level destinations. Detail routes are reached from
their parent page.

| Page | Canonical route | Who should see it in the menu |
| --- | --- | --- |
| League selection | `/leagues` | Every authenticated account |
| League home | `/leagues/:leagueId` | Active league member |
| Teams | `/leagues/:leagueId/teams` | Active league member |
| Team roster | `/leagues/:leagueId/teams/:teamId/roster` | From team links |
| Players | `/leagues/:leagueId/players` | Active league member |
| Player detail | `/leagues/:leagueId/players/:playerId` | From player links |
| Auctions | `/leagues/:leagueId/auctions` | Active league member |
| Trades | `/leagues/:leagueId/trades` | Active league member |
| Trade detail | `/leagues/:leagueId/trades/:tradeId` | From trade links |
| Matchups | `/leagues/:leagueId/matchups` | Active league member |
| Standings | `/leagues/:leagueId/standings` | Active league member |
| League activity | `/leagues/:leagueId/activity` | Active league member |
| Commissioner tools | `/leagues/:leagueId/commissioner` | Current commissioner only |
| Notifications | `/notifications` | Every authenticated account |
| League rules | Main-menu disclosure | Everyone |

Account-action links such as email verification, password reset, account setup,
and reactivation are token-driven flows rather than normal main-menu pages.

## Current Visual Retest Targets

These are the highest-value rendered checks for the approved Theme A
implementation:

1. Header logo and main menu at 200% zoom.
2. Main menu visibility at desktop, tablet, and 390-pixel mobile width.
3. Dashboard cards, real-data states, and links at all required sizes.
4. One and only one Players, Matchups, Standings, and team-roster experience.
5. Six-team standings readability.
6. Side-by-side matchup comparison with usable mobile transformation.
7. Auction player search, selection, and dollar inputs.
8. Team link to the authoritative roster/contract/cap projection.
9. League Rules accuracy and usability from the primary menu.
10. Signed-out redirect from every protected nested route.
11. Alpha/Beta isolation after sign-out, sign-in, reload, and reconnect.

Record the browser, viewport, zoom, account, route, expected result, actual
result, and screenshot for any failure. Do not include passwords, cookies,
tokens, private IDs, or real personal information in screenshots or reports.

## Stop Conditions

Stop the local test and investigate if:

* the scheduler is reported as enabled;
* a non-loopback frontend or backend origin is shown;
* real email or provider credentials are requested;
* Alpha and Beta data cross account boundaries;
* a read-only page changes stored league data;
* shutdown leaves the fixture or port listener running.

This guide authorizes no commit, push, hosted deployment, production change,
real-provider action, or real-data operation.
