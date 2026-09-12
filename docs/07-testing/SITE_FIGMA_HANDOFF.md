# Site-Wide Figma Handoff

## Purpose

This document defines the current Hundo Leago information architecture and the
functional boundaries a site-wide Figma design must preserve. Figma may replace
temporary layout, styling, spacing, typography, responsive transformations,
and visual component treatment. It must not create a second implementation of
an existing feature or change backend-authoritative security and league data.

The detailed matchup data inventory remains in `MATCHUP_FIGMA_HANDOFF.md`. The
short local test workflow is in `M7_MANUAL_WEBSITE_TEST_GUIDE.md`.

## Theme A Implementation Checkpoint

Grae approved **Theme A - Midnight Rink** from the supplied
`Fantasy Hockey Website.zip` Figma Make export on `2026-07-23`. The local
frontend now applies that visual language to the authenticated shell, account
flows, league selection, dashboard, teams, rosters, players, auctions, trades,
matchups, standings, activity, notifications, and commissioner tools.

The Figma reference supplied visual direction rather than authoritative product
behavior. The implementation therefore uses the existing Hundo Leago routes,
backend contracts, permissions, league isolation, sealed-bid rules, cap and
roster rules, and matchup/standings authority. Its dashboard is the canonical
league home and summarizes real available league data; it does not introduce a
second browser-owned data model.

The complete frontend gate passes `95/95` tests across 19 files, ESLint,
production build, and the browser-authority verifier. The documented rendered
desktop, narrow-mobile, 200% zoom, navigation, keyboard, role, and two-league
Theme A acceptance matrix passes locally. Physical-device, Firefox, WebKit,
screen-reader, and hosted-staging acceptance remain open. This status is local
evidence only and does not authorize staging or production.

## Product Structure

The application has one public/account entry, one authenticated league
selection layer, and one league-scoped workspace:

```text
Account entry
  -> Your leagues
    -> Current league
      -> Teams -> Team roster
      -> Players -> Player detail
      -> Auctions
      -> Trades -> Trade detail
      -> Matchups
      -> Standings
      -> League activity
      -> Commissioner tools, when authorized
    -> Notifications
```

The top-bar **Menu** is the primary site navigation. The Hundo Leago logo
returns an authenticated user to the current league home, or to league
selection when a current league is not known. Account actions and League Rules
remain available without competing with league navigation.

## Canonical Pages

| Screen | Canonical route | Core purpose |
| --- | --- | --- |
| Account entry | `/` | Sign in, create account, and request account recovery |
| Email verification | `/verify-email` | Complete a token-driven verification |
| Account setup | `/setup-account` | Complete initial credential setup |
| Password reset | `/reset-password` | Complete a token-driven reset |
| Reactivation | `/reactivate` | Complete a token-driven reactivation |
| League selection | `/leagues` | Select from current active memberships |
| League home | `/leagues/:leagueId` | League identity, feature entry points, and teams |
| Teams | `/leagues/:leagueId/teams` | Canonical team index using league-home data |
| Team roster | `/leagues/:leagueId/teams/:teamId/roster` | Roster, contracts, cap, manager identity, and permitted operations |
| Players | `/leagues/:leagueId/players` | Search and browse approved league player projections |
| Player detail | `/leagues/:leagueId/players/:playerId` | Approved player identity, league ownership, and statistics |
| Auctions | `/leagues/:leagueId/auctions` | Search eligible players and manage permitted sealed bids |
| Trades | `/leagues/:leagueId/trades` | Create, filter, and inspect typed trade proposals |
| Trade detail | `/leagues/:leagueId/trades/:tradeId` | Proposal assets, history, preview, and permitted responses |
| Matchups | `/leagues/:leagueId/matchups` | Season/week selection and same-week matchup comparison |
| Standings | `/leagues/:leagueId/standings` | Authoritative six-team season standings |
| League activity | `/leagues/:leagueId/activity` | Safe chronological league transaction history |
| Commissioner tools | `/leagues/:leagueId/commissioner` | Authorized competition recovery and administration |
| Notifications | `/notifications` | Current user's notifications across authorized leagues |

The old direct URLs `/free-agents`, `/matchups`, and `/standings` are
compatibility entrances only. They redirect to Players, Matchups, and Standings
inside the visible or remembered league. They are not separate Figma screens.

## Global Shell

Design desktop, tablet, narrow mobile, and 200% browser-zoom behavior for:

* Hundo Leago logo;
* main Menu trigger and dropdown;
* current league label;
* account identity;
* Notifications;
* Sign in or Sign out;
* League Rules;
* maintenance or write-freeze banner;
* loading, disconnected, delayed-data, and error announcements.

The menu must stay in the viewport and remain operable by keyboard. The logo
must never overlap menu, account, status, or page content. Navigation must not
depend on hover. Closing by Escape, outside pointer action, and link selection
should have an intentional design. At 200% zoom, controls may reflow or collapse
but cannot disappear off-screen.

### Manager Menu

In this order unless Figma demonstrates a clearer tested hierarchy:

1. Your league or Switch league
2. League home
3. Teams
4. Players
5. Auctions
6. Trades
7. Matchups
8. Standings
9. League activity
10. Notifications
11. League Rules

### Commissioner Difference

Add Commissioner tools after the ordinary league pages. A manager must not see
that entry. The backend remains authoritative even when a control is hidden.

## Page Design Requirements

### Account Entry and Account Actions

Provide clear sign-in and account-creation separation without duplicating form
labels. Include pending, submitting, success, field error, safe server error,
rate limit, expired token, invalid token, deactivated account, and
pending-verification states. Passwords and tokens must never be echoed.

### League Selection and League Home

Cover zero, one, and multiple visible leagues. One visible league may enter
automatically; multiple leagues need a clear selector and remembered-league
indicator. League home must identify the current league and membership role,
offer the feature destinations, and list all teams. A team link opens the one
authoritative team-roster experience.

### Team Roster

Visually separate:

* team and manager identity;
* current cap summary;
* active forwards and defense;
* bench;
* injured reserve;
* prospects and prospect rights;
* contracts, AAV, term, and yearly obligations;
* retained salary, buyout, and other cap obligations;
* legality, missing-slot, and data-availability states;
* manager or commissioner actions from read-only information.

Empty slots must remain explicit. Currency is displayed in dollars. A manager
may operate only their authorized team; commissioner authority is distinct.

### Players and Player Detail

The player index needs a case-insensitive search treatment, clear empty/no-match
states, position, ownership context, and links to player details. Player detail
must distinguish global identity and statistics from league-specific position
correction and ownership. Missing or delayed statistics are not zero.

### Auctions

The creation field is named **Player**, not Player ID. It searches
case-insensitively and displays matching eligible player names for selection.
Money is entered and displayed in dollars even when transport/storage uses
integer cents.

Cover:

* no active auctions;
* eligible-player search idle/loading/no-match/error/results;
* selected player;
* initial sealed bid;
* editing the user's own bid;
* cooldown or edit restriction;
* participant names without competing bid amounts;
* auction closing/resolution;
* success, validation failure, lost concurrency, and authorization failure.

The design must never reveal another team's sealed bid.

### Trades and Trade Detail

Support typed assets, simultaneous offers, proposal status filters, clear
proposing and receiving teams, expiration, cancellation, rejection, preview,
confirmation, completion, and correction-required states. A destructive or
final acceptance requires a preview and deliberate confirmation. Asset
ownership and permissions remain backend-authoritative.

### Matchups

Use the data and states defined in `MATCHUP_FIGMA_HANDOFF.md`. The desired
desktop structure is a side-by-side team comparison with vertical player rows
and each player's matchup statistics. A same-league matchup selector should
remain available beside or near the comparison, similar in usefulness to the
old version without reusing the old page.

Figma must provide an explicit narrow-mobile transformation. A contained
horizontal stat-table scroller is acceptable; whole-page horizontal scrolling
is not.

### Standings

Design a readable table for all teams in the active fixture league, currently
six. Use approved authoritative columns and stable alignment for rankings and
totals. Define loading, no season, no standings, delayed data, error, and
refresh behavior. Mobile may use a contained table scroller or an annotated
row-card transformation without omitting authoritative values.

### League Activity and Notifications

Activity is league-scoped chronological history. Notifications are user-scoped
and may span authorized leagues. Clearly distinguish unread/read,
informational/actionable, empty, loading, pagination, and error states. Do not
surface internal event payloads, hidden IDs, or secret operational metadata.

### Commissioner Tools

Separate ordinary observations from state-changing recovery controls. Each
command needs eligibility, reason when required, pending, success, validation,
conflict, and failure states. Dangerous-looking styling does not itself provide
authorization; the server enforces authority and state preconditions.

## Shared Component Inventory

Figma should define reusable components and variants for:

* app header and primary-menu states;
* current-league switcher/label;
* page title and contextual actions;
* tabs, segmented filters, and select controls;
* search combobox with typed results;
* team, player, contract, cap, matchup, and standings rows;
* currency, status, authority, unread, and data-quality badges;
* table, responsive row card, empty state, skeleton, alert, and status message;
* modal or confirmation surface;
* toast or non-blocking completion notice;
* pagination or cursor continuation;
* freeze/maintenance and disconnected banners.

Provide default, hover, focus-visible, pressed, selected, disabled, loading,
success, warning, and error variants wherever applicable. Color alone cannot
carry status.

## Required Responsive Frames

At minimum, provide frames for:

* desktop at `1440 x 900`;
* narrow mobile at `390 x 844`;
* one intermediate tablet width;
* representative desktop content at 200% browser zoom.

Long league, team, manager, and player names must be tested. Designs should
remain usable with browser text enlargement and without exact pixel-height
assumptions.

## Accessibility Contract

The implemented design must retain:

* logical heading order and landmarks;
* native links, buttons, labels, tables, and form controls where appropriate;
* complete keyboard operation with visible focus;
* Enter submission and Escape dismissal where expected;
* understandable loading/status announcements and error alerts;
* sufficient contrast in every component state;
* non-color status cues;
* touch targets appropriate for narrow mobile;
* reduced-motion compatibility;
* no keyboard trap and no whole-page horizontal overflow.

Figma annotations should state the intended accessible name, focus order,
keyboard behavior, live announcement, and responsive transformation for any
custom-looking control.

## Backend-Authoritative Boundaries

Visual work must preserve:

* backend sessions and CSRF protection;
* active membership and team/commissioner authorization;
* strict Alpha/Beta league isolation;
* sealed-bid privacy;
* integer-cent transport/storage even when UI shows dollars;
* read-only matchup scoring and standings reads;
* authoritative roster, contract, cap, result, and correction data;
* missing/delayed provider data distinct from zero;
* no hidden write in a GET, refresh, navigation, or reconnect action.

Do not invent fields, compute authoritative totals in the browser, or use old
browser-owned league state to fill a design.

## Figma Delivery Package

For efficient implementation, provide:

1. one page showing site map and navigation behavior;
2. one page of tokens and shared components with variants;
3. one page per feature group using the canonical screen names above;
4. desktop, tablet, mobile, and zoom examples;
5. loading, empty, error, denied, delayed, disconnected, and confirmation
   states;
6. component measurements through Auto Layout and constraints;
7. typography, spacing, color, icon, radius, border, shadow, and motion tokens;
8. annotations for interaction, accessibility, responsive behavior, and any
   data assumptions;
9. exported assets or asset specifications with licensing/source information;
10. a short change log naming the final approved frames and components.

Avoid flattened screenshots for implementable UI. Keep text as text, expose
component variants, and name layers consistently. If a frame intentionally
changes the information architecture or hides available data, call that out for
product review before implementation.

## Acceptance Retest

After implementation, run `M7_MANUAL_WEBSITE_TEST_GUIDE.md` against the
disposable two-league fixture. The design is not accepted solely because it
matches screenshots; it must also pass route unification, role visibility,
league isolation, keyboard, 200% zoom, narrow mobile, reload, reconnect, and
safe failure-state checks.
