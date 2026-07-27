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

The fixture's player catalog and statistics are intentionally synthetic
Release-QA data. They are labelled as synthetic in the application and must
not be represented as SportsDataIO or live NHL data. A real last-season import
is a separate, explicit staging-only operation that requires the securely
configured backend provider key.

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
| Man A Leag A | `man.a.leag.a@release-qa.example.test` | Manager | Alpha only; manages Alpha Ravens |
| Man B Leag A | `man.b.leag.a@release-qa.example.test` | Manager | Alpha only; manages Alpha Wolves |
| Man A Leag B | `man.a.leag.b@release-qa.example.test` | Manager | Beta only; manages Beta Vipers |
| No League | `no.league@release-qa.example.test` | Active account without a league | Signed in, but no league membership |
| Pending | `pending@release-qa.example.test` | Pending email verification | Generic invalid-credentials response; no active-account access |
| Deactivated | `deactivated@release-qa.example.test` | Deactivated account | Same generic invalid-credentials response; no active-account access |

Alpha and Beta have deliberately distinct team names and rosters. Seeing the
other league while signed in as a league-specific manager is a privacy failure,
not a fixture quirk.

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

## Hosted Staging Remediation Tours

Run these tours only on the positively identified staging website after the
M7-10 deployment. They are not authorized against production. Record the
backend build, frontend build, account, league, route, and result before making
the first change.

### Tour 6 - Provider Catalog and League-Scoped Player Details

1. Sign in as an Alpha member and open Players.
2. Confirm that the catalog contains the imported NHL player set rather than
   only the small synthetic Release-QA set.
3. Search for an assigned player and a free agent, then open both details.
4. Confirm that the selected league's team, roster category, ownership type,
   salary, original term, AAV, and remaining years are correct where present.
5. Sign in to Beta and open the same player. Confirm that only Beta ownership
   and contract information appears.
6. As a commissioner or platform administrator, open Commissioner tools and
   inspect provider health. Confirm the provider is identified as SportsDataIO
   Discovery Lab, the data is labelled last-season-only, the catalog count is
   non-zero, and the last-success/stale state is understandable.

Expected result: global player identity and last-season statistics can overlap,
but league ownership and contracts never cross Alpha/Beta boundaries. Synthetic
fallback rows remain visibly labelled as synthetic.

### Tour 7 - Commissioner Roster and Contract Corrections

Use Comm A in Alpha. Record the selected player's initial team, category,
salary, term, versions, and the affected teams' cap projections.

1. Add an unassigned player to a team. Preview first, inspect roster and cap
   warnings, then apply once.
2. Move an owned player between Active and Bench. Preview and apply.
3. Preview an IR or Prospect move. Confirm that the exceptional-status warning
   must be explicitly accepted before apply.
4. Correct an active contract's total salary and term. Confirm that the
   displayed AAV and season schedule are derived by the server.
5. Remove a test player. Confirm the preview identifies the ownership and
   active-contract effect before apply.
6. Refresh the page after every apply and confirm the authoritative workspace,
   player detail, team roster, and cap impact agree.
7. Sign in as an Alpha manager and confirm the page and backend actions are
   denied. Sign in as Comm B and confirm Alpha records cannot be addressed.

Expected result: previews do not write, applies require CSRF and idempotency,
stale versions fail safely, warnings require confirmation, and every successful
change returns an audit activity identifier.

### Tour 8 - Trades, Matchup Evidence, Audit, and Reconnect

1. Open Trades and inspect the seeded pending, accepted, rejected, and
   invalid-cap scenarios. The accepted trade must show its real transferred
   assets. The invalid-cap acceptance preview must show
   `SALARY_CAP_EXCEEDED`, the projected over-cap amount, and the approved
   general-illegality warning before any explicit confirmation. Do not accept
   this seeded trade during smoke testing.
2. Open League activity and confirm trade events plus the commissioner add,
   move, contract, and remove actions from Tour 7 are visible with their
   recorded reasons.
3. Open the current matchup and confirm both vertical player lists and
   per-player statistics are non-empty.
4. With the page open, set the browser network to Offline, then restore Online.
   Do not click a manual reconnect button.
5. Confirm the current route and league stay selected and the active league
   queries refresh automatically after Socket.IO reconnect.

Expected result: persisted audit evidence is readable, matchup evidence is
populated, and reconnect recovery happens without an extra click.

### Tour 9 - Staging-Only Reset

Run this last because it intentionally replaces only the staging test-league
data and invalidates all sessions.

1. As a non-administrator, confirm no reset action is visible and a direct
   request is denied.
2. As the platform administrator, record provider catalog count, last
   successful import, Alpha/Beta team names, and one deliberately different
   roster assignment.
3. Open the reset panel, enter the exact displayed confirmation phrase and a
   bounded test reason, then submit once.
4. Confirm a verified pre-reset backup is reported and the session is signed
   out.
5. Sign in again. Confirm all fixture accounts, six Alpha teams, six Beta
   teams, different Alpha/Beta rosters, populated matchup statistics, and all
   seeded trade states have returned.
6. Confirm the imported provider catalog count and last successful import were
   preserved.

Expected result: reset is available only on the exact staging fixture identity,
is audited and idempotent, preserves the provider catalog, and never exposes a
production capability.

### Tour 10 - M7-15 Roster Depth and Review Follow-up

1. Reset the staging fixture and verify each of the 12 teams has 12 Active
   forwards, 6 Active defence players, 1-4 Bench players, the configured IR
   examples, and 3 under-19 Prospects. Confirm Active ordering defaults to
   forwards then defence, with descending AAV inside each group.
2. As a manager, move one Active player to Bench by its compact action and move
   a Bench player to Active by drag-and-drop. When a move causes a slot or cap
   overage, confirm the warning, verify the move persists, and verify a red
   authoritative illegal-roster banner remains until corrected.
3. Verify a Bench move above `$4.00 AAV` and an ineligible IR move remain hard
   rejections rather than confirmation warnings.
4. Create a trade proposal between managed fixture teams, sign in as the
   receiver, and verify a new in-app notification and the manager-team
   highlight on the pending proposal.
5. Verify Players favourite and auction controls begin as icons and expand on
   hover or keyboard focus, team and matchup colours fade to a readable neutral
   identity area, and both matchup stat halves fit without horizontal
   scrolling.
6. Verify auctions contain neither `Starting for ...` nor `Bidding for ...`
   labels when the team context is already authoritative.
7. As commissioner, verify Add Player searches free-agent names and assigns
   position/slot automatically. Verify Remove Player, Correct Roster, and
   Correct Contract require a team first and list only that team's eligible
   records.

Expected result: fixture depth, permission scope, eligibility, warnings,
authoritative illegality, notification delivery, and all visual follow-up
behave consistently without cross-league leakage or hidden writes.

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
| Commissioner tools | `/leagues/:leagueId/commissioner/rosters` | Current commissioner or platform administrator |
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
* provider catalog rows disappear during a staging fixture reset;
* a reset route is present on any non-staging fixture identity;
* shutdown leaves the fixture or port listener running.

This guide authorizes no commit, push, hosted deployment, production change,
real-provider action, or real-data operation.
