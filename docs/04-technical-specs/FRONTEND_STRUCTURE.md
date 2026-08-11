# Hundo Leago - Frontend Structure

## Document Status

`APPROVED`

This technical specification defines:

* the target React and Vite application structure for Season 2;
* application shell, routes, providers, session state, league context, server state, HTTP, Socket.IO, and feature boundaries;
* the safe incremental extraction from the current large `App.jsx`;
* frontend storage, forms, errors, styling, accessibility, responsive behavior, and testing;
* technical frontend decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the frontend-structure decisions and approved adoption of the resulting design on 2026-07-18.

The approved feature-specific frontend, route, query, privacy, realtime, and
cache-eviction amendment for the Free Agent Draft is defined at
`docs/04-technical-specs/FREE_AGENT_DRAFT.md`.

---

## Technical Purpose

The current frontend successfully exposes much of Hundo Leago's existing functionality, but its main application file also owns:

* hard-coded credentials;
* browser-only identity;
* a complete global league object;
* API URL derivation;
* repeated fetch logic;
* Socket.IO lifecycle;
* broad autosave;
* authoritative-looking rule calculations;
* navigation;
* many feature mutations and view states.

Season 2 requires separate users, leagues, permissions, feature endpoints, and server-state caches.

The frontend must become a clear presentation and interaction layer without becoming a second backend.

---

## Out of Scope

This specification does not:

* perform the frontend refactor;
* redesign the product visually;
* change league rules;
* implement backend accounts or endpoints;
* select deployment secrets;
* authorize removal of compatibility behavior before callers move;
* migrate the project to TypeScript;
* add Redux;
* add offline writes or a progressive web application;
* authorize production deployment.

Frontend extraction occurs through small vertical work-plan steps after the required backend contract exists.

---

# Part 1 - Authority and Current State

## Required Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/07-testing/TESTING_STRATEGY.md
```

Product specifications own visible workflow. API Contracts own transport. Security owns session and request protections. This document owns frontend organization.

---

## Reviewed Frontend

Current foundation:

```text
React 19
Vite 7
React Router 7
Socket.IO client
JavaScript and JSX
Netlify
```

Reviewed facts:

* `src/App.jsx` is approximately 2,400 lines;
* `App.jsx` defines hard-coded manager and commissioner passwords;
* browser local storage restores a claimed current user;
* feature authorization is inferred from browser role and team name;
* the frontend loads and broadly saves a complete league object;
* HTTP calls are distributed through `App.jsx` and feature pages;
* Socket.IO is created inside `App.jsx`;
* rules and mutation helpers remain in `leagueUtils.js`;
* several large feature panels receive extensive props;
* routes exist for the current home, free-agent, matchup, and standings experiences;
* no automated frontend test runner exists;
* `src/components/TeamToolsPanel.jsx` contains unrelated local work that must be preserved.

These facts describe current implementation. They are not approved target authority or permission behavior.

---

## Operating Mode

Reviewed mode:

```text
OFFSEASON_RESET
```

Incremental local and staging frontend changes are permitted. The production frontend must not be left incompatible with the production backend.

---

# Part 2 - Approved Technical Foundation

## Language

Season 2 frontend code remains:

```text
JavaScript
JSX
ES modules
```

The project does not combine the structural refactor with a TypeScript migration.

New shared functions and API records use clear names and focused JSDoc when it materially improves contracts.

A future TypeScript decision requires its own work plan and cannot delay launch-critical work.

---

## Server-State Library

The frontend uses:

```text
@tanstack/react-query
```

for authoritative asynchronous server state.

It is selected for:

* query-key scoping;
* caching;
* cancellation;
* loading and error state;
* targeted invalidation;
* controlled refetch;
* mutation lifecycle.

The exact compatible version is pinned in `package-lock.json` when the frontend foundation is implemented.

TanStack Query does not become authorization and does not decide business outcomes.

---

## Client-State Decision

No Redux or general global-state package is introduced initially.

State uses:

* TanStack Query for server state;
* React context for current session services and realtime lifecycle;
* URL parameters for selected league, team, season, and resource;
* local component state for forms and temporary view state;
* narrowly allowlisted local storage for non-authoritative preferences.

If later evidence shows a general client-state store is required, it must solve a demonstrated problem through a focused decision.

---

## Forms

Initial forms use controlled React state and focused reusable field components.

No form or schema package is added preemptively.

The backend remains authoritative for validation. Frontend validation:

* catches missing or malformed input for usability;
* uses the same units and obvious limits;
* never promises that a write will succeed;
* displays backend field and business errors.

---

## Styling

The project keeps CSS and introduces:

* global reset and document styles;
* shared design tokens;
* layout styles;
* CSS Modules for newly extracted reusable and feature components;
* incremental migration of current global selectors.

No CSS-in-JS package and no broad visual redesign are included.

---

# Part 3 - Target Directory Structure

```text
src/
|-- main.jsx
|-- app/
|   |-- App.jsx
|   |-- AppProviders.jsx
|   |-- router.jsx
|   |-- queryClient.js
|   |-- RouteErrorPage.jsx
|   `-- NotFoundPage.jsx
|-- config/
|   `-- env.js
|-- layouts/
|   |-- PublicLayout.jsx
|   |-- AuthenticatedLayout.jsx
|   |-- LeagueLayout.jsx
|   |-- CommissionerLayout.jsx
|   `-- AdminLayout.jsx
|-- shared/
|   |-- api/
|   |   |-- httpClient.js
|   |   |-- ApiError.js
|   |   |-- responseContracts.js
|   |   `-- idempotency.js
|   |-- realtime/
|   |   |-- socketClient.js
|   |   `-- RealtimeProvider.jsx
|   |-- components/
|   |-- hooks/
|   |-- format/
|   |   |-- money.js
|   |   |-- fantasyPoints.js
|   |   `-- time.js
|   |-- storage/
|   |   `-- preferences.js
|   `-- styles/
|       |-- tokens.css
|       |-- globals.css
|       `-- utilities.css
|-- features/
|   |-- session/
|   |-- accounts/
|   |-- leagues/
|   |-- teams/
|   |-- players/
|   |-- rosters/
|   |-- contracts/
|   |-- auctions/
|   |-- trades/
|   |-- matchups/
|   |-- standings/
|   |-- activity/
|   |-- notifications/
|   |-- commissioner/
|   `-- admin/
|-- test/
|   |-- setup.js
|   |-- renderApp.js
|   |-- createTestQueryClient.js
|   |-- fakes/
|   `-- fixtures/
`-- assets/

e2e/
|-- fixtures/
|-- pages/
`-- *.spec.js
```

This is a target structure, not permission to create every empty directory at once.

Directories are added when their first real module moves.

---

# Part 4 - Dependency Rules

## Direction

Allowed direction:

```text
app and layouts
  -> features
  -> shared
```

Rules:

* `shared/` imports no feature;
* one feature does not reach into another feature's private component tree;
* cross-feature behavior uses an approved public feature module or shared primitive;
* pages compose feature APIs and components;
* API modules do not import presentation components;
* shared HTTP and realtime modules do not import the router;
* formatting functions do not fetch or mutate.

---

## Feature Shape

A feature adds only the folders it needs:

```text
features/rosters/
|-- api/
|   |-- rosterApi.js
|   `-- rosterQueries.js
|-- components/
|-- hooks/
|-- pages/
|-- domain/
|-- rosterRoutes.jsx
`-- index.js
```

Frontend `domain/` contains presentation-only transformations and form helpers. Authoritative cap, legality, ownership, transaction, matchup, and standings calculations stay in the backend.

---

## Public Feature Interface

Other features import from the owning feature's deliberate public exports.

Avoid broad barrel exports that:

* hide circular dependencies;
* expose internal files;
* increase bundle work;
* make ownership unclear.

An `index.js` exports only stable items intended for cross-feature use.

---

# Part 5 - Application Boot and Providers

## `main.jsx`

`main.jsx` remains small.

Target responsibility:

```jsx
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
)
```

It imports global styles and contains no feature fetch, login, or Socket.IO logic.

---

## Provider Order

`AppProviders` composes:

```text
BrowserRouter
QueryClientProvider
SessionProvider
RealtimeProvider
user-facing notification provider when implemented
```

League identity comes from route parameters and authorized session data. It is not a browser-claimed global authority provider.

Every test creates fresh providers and a fresh Query Client.

---

## Query Client

The application creates one Query Client per browser application instance.

Default target behavior:

* queries retry at most once for a transient network or `5xx` failure;
* no retry for `400`, `401`, `403`, `404`, `409`, `412`, `422`, `423`, or `429` unless an endpoint-specific policy says otherwise;
* mutations never retry automatically;
* private cached data is removed on sign-out, session replacement, deactivation, or authorization loss;
* refetch on reconnect is enabled for active private queries;
* feature modules choose meaningful `staleTime`;
* broad global cache invalidation is exceptional.

Server state is not persisted to local storage.

---

# Part 6 - Environment Configuration

## Target Variables

The target frontend reads:

```text
VITE_API_ORIGIN
VITE_SOCKET_ORIGIN
VITE_BUILD_ID
```

All `VITE_*` values are public bundle values.

They must not contain:

* passwords;
* session material;
* CSRF tokens;
* provider credentials;
* email secrets;
* database paths;
* administrator credentials.

---

## Validation

`src/config/env.js`:

* reads `import.meta.env` once;
* trims values;
* validates complete `http` or `https` origins;
* removes trailing slash;
* rejects paths for origin variables;
* allows loopback HTTP only in local development;
* requires HTTPS in staging and production;
* freezes and exports one configuration object;
* produces a clear startup error without printing secrets.

Feature modules do not read `import.meta.env` directly.

---

## Compatibility Variable Transition

Current code uses:

```text
VITE_API_URL
VITE_SOCKET_URL
VITE_STATS_URL
VITE_DISABLE_AUTOSAVE
```

During incremental migration:

* one compatibility adapter may translate the old API endpoint into an origin;
* a warning appears only in local development;
* new feature modules use only target configuration;
* production variables change only through the future Environment Setup and Deployment plans;
* the compatibility adapter is removed after all callers move.

The target API client constructs resource paths. Environment configuration does not store `/api/league` as the base.

---

# Part 7 - Routing

## Route Identity

Stable IDs appear in URLs.

Display names do not identify:

* league;
* team;
* season;
* player;
* transaction.

Target route families:

```text
/
/verify-email
/setup-account
/reset-password
/reactivate
/leagues
/leagues/:leagueId
/leagues/:leagueId/teams
/leagues/:leagueId/teams/:teamId/roster
/leagues/:leagueId/players
/leagues/:leagueId/players/:playerId
/leagues/:leagueId/auctions
/leagues/:leagueId/trades
/leagues/:leagueId/matchups
/leagues/:leagueId/standings
/leagues/:leagueId/activity
/leagues/:leagueId/security
/leagues/:leagueId/commissioner
/admin
/public/leagues/:leagueId/teams/:teamId/roster
```

Contract and related resource views may be nested under team or feature routes when their product page is implemented.

---

## Route Modules

`app/router.jsx` composes feature route arrays.

Features own their page elements and nested route definitions.

Major page routes use lazy loading after the application shell is stable.

Every route defines:

* loading behavior;
* not-found behavior;
* error boundary;
* session requirement;
* league requirement;
* user-facing title or context.

---

## Route Guards

Frontend guards improve presentation only.

They may:

* redirect an unauthenticated visitor;
* show no-membership or no-team state;
* hide unavailable controls;
* preserve an intended destination for normal login flow.

They do not:

* establish permission;
* trust role from URL or storage;
* make a backend write safe;
* confirm that a private resource exists.

The backend checks every protected request.

---

# Part 8 - Session and Account State

## Session Bootstrap

On application start:

1. create the Query Client;
2. request `GET /api/v1/session` with credentials;
3. classify the result as authenticated or unauthenticated;
4. store safe user, memberships, assignments, session times, and CSRF bootstrap data in memory;
5. render the appropriate route tree.

Session state has explicit:

```text
unknown
authenticated
unauthenticated
```

The application does not briefly render private content while session status is unknown.

---

## Session Secrets

The session token remains in the `HttpOnly` cookie and is unavailable to React.

The CSRF token:

* is returned by session bootstrap;
* is held only in memory;
* is sent through the shared HTTP client on authenticated unsafe requests;
* is cleared with session state;
* is never stored in local or session storage.

Passwords and action tokens stay only in the active form or action-page memory and are cleared after terminal completion.

---

## Authentication Failure

On a confirmed `401`:

* mark session unauthenticated;
* clear CSRF state;
* remove private Query Client caches;
* disconnect realtime;
* clear private view drafts where appropriate;
* navigate to the public account experience;
* show a safe expired-session explanation when applicable.

One failing background request must not produce repeated alerts from every mounted query.

---

## Membership Changes

Session remains valid after membership or role changes.

When current authorization changes:

* session or league summary refetches;
* inaccessible league query keys are removed;
* current route shows loss-of-access state or redirects to the league chooser;
* realtime rooms are reauthorized;
* no stale role from memory continues to expose controls.

---

# Part 9 - League Context

## URL Authority

For league pages, `leagueId` comes from the route.

The frontend confirms the ID appears in the session's current authorized memberships or receives an authorized public response for a public route.

It never defaults an unknown ID to:

* the original Hundo Leago league;
* the first cached league;
* a league inferred from team name.

---

## League Selection

After login:

1. keep a valid authorized league URL;
2. otherwise use a safe remembered league preference only if it is still authorized;
3. otherwise enter the only available league;
4. otherwise show the league chooser.

The remembered value is a navigation preference, not access authority.

---

## Team Context

`teamId` in a route identifies the viewed team.

Manager authority comes from current backend assignment, not:

* selected team;
* displayed team;
* team name;
* a prior local-storage user object.

The UI may allow a manager or commissioner to view other public or league-visible teams while showing controls only for backend-authorized actions.

---

# Part 10 - Shared HTTP Client

## Responsibilities

`shared/api/httpClient.js`:

* combines the validated API origin and supplied path;
* uses `credentials: "include"`;
* sends `Accept: application/json`;
* sends JSON content type only when a JSON body exists;
* sends CSRF on authenticated unsafe requests;
* supports `If-Match`;
* supports idempotency keys;
* passes `AbortSignal`;
* parses success and error envelopes;
* returns safe metadata such as request ID;
* throws one typed `ApiError`;
* never turns a failed response into success.

---

## `ApiError`

The error contains:

```text
HTTP status
stable backend code
safe message
safe details
request ID
retry-after when supplied
network-error category
```

It never contains:

* raw response secrets;
* cookie values;
* password fields;
* unrestricted stack traces.

Feature modules translate stable error codes into nearby actionable UI.

---

## Response Contracts

`responseContracts.js` performs lightweight boundary checks:

* expected envelope;
* expected `data` kind;
* required IDs and versions;
* integer money, FP, and timestamp fields;
* page metadata.

Malformed responses fail visibly as an application-data error.

The frontend does not silently manufacture missing arrays or default records in a way that hides backend corruption.

---

## Request Rules

The client:

* never sends client role, actor name, or team name as authority;
* never posts complete league state for target features;
* never retries a mutation automatically;
* never runs a mutation during component render;
* never writes because a read returned missing data;
* never logs a password, token, or full private body.

---

# Part 11 - Query Design

## Query Keys

Each feature exports a query-key factory.

Examples:

```js
["session"]
["leagues"]
["league", leagueId]
["league", leagueId, "team", teamId, "roster"]
["league", leagueId, "auctions", filters]
["league", leagueId, "season", seasonId, "matchups", weekId]
["league", leagueId, "season", seasonId, "standings"]
```

Every private league query includes `leagueId`.

Season-specific data includes `seasonId` when the API cannot safely infer current season.

---

## Query Ownership

Feature query modules own:

* path;
* query key;
* response contract;
* stale policy;
* enabled conditions;
* invalidation helpers.

Components do not construct arbitrary fetch URLs.

---

## Cache Behavior

Feature defaults:

* private mutable data uses short, explicit stale periods and realtime invalidation;
* stable player identity may remain fresh longer;
* active auction and matchup views refetch on focus and reconnect;
* countdown display uses local time against backend deadline but does not infer final state;
* hidden pages do not poll without need;
* public data follows backend caching headers where appropriate.

Socket.IO invalidates and refetches. It does not directly replace authoritative cached records with broad event payloads.

---

# Part 12 - Mutations and Concurrency

## Mutation Modules

Feature mutation hooks:

* accept a complete user intent;
* create or reuse the correct idempotency key;
* send current version through `If-Match` when required;
* disable duplicate submission for the active intent;
* display pending state;
* use authoritative response data;
* invalidate only affected query families;
* expose backend warning separately from error.

---

## Idempotency Keys

Use browser `crypto.randomUUID()` for a new eligible user intent.

The key:

* remains stable when the user retries the same uncertain request;
* changes after a confirmed success, deliberate cancellation, or materially edited intent;
* is not a session secret;
* is not reused across leagues or operation types;
* is not stored indefinitely.

If secure ID generation is unavailable, the write is blocked with an understandable error rather than using a weak predictable key.

---

## Stale Versions

On `412 PRECONDITION_FAILED`:

* preserve the user's draft when safe;
* refetch current authoritative records;
* explain that the data changed;
* require the user to review and resubmit;
* never merge the stale complete object over the current response.

---

## Optimistic Updates

Optimistic updates are not the default for:

* auctions;
* trades;
* roster ownership;
* contracts;
* retention;
* buyouts;
* draft selections;
* commissioner corrections.

These interfaces show pending state and then use the authoritative response.

An optimistic presentation may be added for a low-risk preference only when rollback is trivial and tested.

---

# Part 13 - Socket.IO

## One Lifecycle

`RealtimeProvider` owns one Socket.IO client for the authenticated application.

Components do not call `io()` directly.

The provider:

* uses the validated Socket origin;
* sends credentials;
* connects after session bootstrap;
* disconnects on sign-out or session invalidation;
* exposes safe connection status;
* registers listeners once;
* removes listeners on cleanup;
* handles reconnect through session reauthorization.

---

## Event Handling

Target events carry:

* event type;
* schema version;
* league ID;
* affected resource type and stable ID;
* safe invalidation reason;
* event or correlation ID when useful.

They do not carry:

* active competing bid values;
* complete private league records;
* session or CSRF data;
* authority claims.

The provider verifies event league scope against current authorized context before invalidating query keys.

---

## Reconnect

After reconnect:

1. confirm current session;
2. rejoin backend-authorized rooms;
3. invalidate active relevant queries;
4. refetch authoritative data.

Correctness does not depend on receiving every event while disconnected.

---

# Part 14 - Feature Boundaries

## Accounts and Session

Owns:

* sign-up;
* verification;
* setup;
* sign-in;
* sign-out;
* password change and reset;
* deactivation and reactivation;
* session-expiry warning.

It does not own league membership.

---

## Leagues, Teams, and Memberships

Owns:

* league chooser;
* league summary;
* administrative league creation;
* membership and invitation presentation;
* commissioner assignment;
* team identity;
* manager assignment.

It does not infer team authority from selection.

---

## Players

Owns:

* player search;
* player detail;
* provider fields;
* season statistics display;
* league-specific ownership projection.

It does not preload the entire player database as the target default.

---

## Rosters and Contracts

Owns:

* roster category display;
* movement forms;
* legality response;
* cap projection from backend;
* contract and obligation display;
* prospect and ELC actions;
* buyout workflow.

It does not recalculate authoritative cap or legality independently.

---

## Auctions and Trades

Owns:

* active auction display;
* own bid form and values;
* trade proposals and assets;
* confirmations;
* outcome and warnings.

The frontend never receives competing active bid values.

---

## Matchups and Standings

Owns:

* matchup-period display;
* locked lineup and matchup-only goals, assists, points, and FP;
* live status;
* finalized results;
* read-only standings.

Season totals remain on roster/player pages.

Normal roster changes after lock do not alter the displayed locked matchup snapshot.

---

## Activity and Audit

League Activity and Security Audit use separate queries and pages.

Matchup and standings operations do not appear in League Activity.

Frontend filtering cannot reveal records the backend omitted.

---

# Part 15 - UI Components and Layout

## Shared Components

`shared/components/` contains genuinely reusable primitives such as:

* button;
* link button;
* field;
* select;
* dialog;
* confirmation;
* banner;
* spinner;
* empty state;
* error state;
* pagination;
* accessible tabs;
* table shell;
* money and time display.

League-specific business components stay in their feature.

---

## Layouts

Layouts own:

* consistent navigation;
* page shell;
* responsive content width;
* route outlet;
* session and league identity presentation;
* global safe banners.

Commissioner and admin layouts separate sensitive operations from ordinary manager workflows.

The authenticated application header may present the approved static hockey
quote catalog as non-authoritative atmosphere. The modern ticker:

* shuffles a copy of the catalog in memory once per full page load;
* performs no API request, mutation, or browser-storage write;
* stays clipped inside the flexible space between location and account
  controls;
* remains visually subordinate to navigation;
* pauses while hovered or keyboard-focused; and
* replaces continuous movement with one static quote when reduced motion is
  requested.

---

## Loading and Empty State

Every page distinguishes:

```text
session unknown
loading
empty
unauthenticated
unauthorized
not found
validation failure
conflict
rate limited
provider delayed
backend unavailable
success
```

The interface does not present stale data as a confirmed successful write.

---

# Part 16 - Forms and Errors

## Form Drafts

Form state stays local to the feature unless a route transition must preserve it.

Sensitive forms:

* do not persist passwords or action tokens;
* disable browser autocomplete only where appropriate, not broadly;
* clear secret fields after terminal outcome;
* avoid copying secrets into error state;
* show password rules without exposing stored credentials.

---

## Confirmation

High-impact actions use a focused confirmation component with:

* exact action;
* affected league or team;
* material consequence;
* backend preview where approved;
* typed confirmation where the product specification requires it;
* pending protection.

Browser `window.confirm` is replaced incrementally, not through an unrelated visual rewrite.

---

## User-Facing Errors

Errors are displayed near the responsible form or page.

The UI may show:

* safe backend message;
* field details;
* request ID;
* retry guidance.

It does not show:

* stack;
* SQL;
* filesystem path;
* cookie;
* token;
* password;
* cross-league existence detail.

---

# Part 17 - Local Storage

## Allowed

Versioned local storage may hold:

* last authorized league ID as a navigation preference;
* sound preference;
* theme or display density when implemented;
* dismissed client-only help;
* last shown non-authoritative quote in disabled legacy compatibility code;
* other explicitly documented view preferences.

Every stored value is parsed defensively and may be discarded.

---

## Prohibited

Local and session storage must not hold:

* current user as proof of identity;
* password;
* session token;
* CSRF token;
* verification, setup, reset, or reactivation token;
* authoritative role;
* membership;
* team assignment;
* bid;
* trade;
* roster;
* contract;
* private Query Client cache;
* unsent high-impact mutation without an approved draft design.

Backend notifications replace current timestamp-based local notification authority where the product requires durable notification state.

---

# Part 18 - Styling, Accessibility, and Responsive Behavior

## Tokens

`tokens.css` defines approved reusable:

* colors;
* spacing;
* type scale;
* radii;
* shadows;
* focus ring;
* z-index layers;
* responsive breakpoints.

Team colors are data and pass through validated style variables, not arbitrary injected CSS.

---

## CSS Modules

New extracted components use:

```text
ComponentName.module.css
```

Global CSS is limited to:

* reset;
* document defaults;
* tokens;
* deliberate utility classes;
* temporary legacy selectors.

Legacy `App.css` is reduced as components move. It is not mass-rewritten first.

---

## Accessibility

Requirements:

* semantic landmarks and headings;
* real buttons and links;
* programmatic labels;
* keyboard-accessible menus and dialogs;
* focus placement after navigation and dialog actions;
* visible focus;
* status and error announcements where needed;
* no color-only state;
* sufficient contrast;
* reduced-motion respect;
* table alternatives or responsive structure where tables cannot reflow;
* accessible names for team logos and controls.

Testing follows `TESTING_STRATEGY.md`.

---

## Responsive Design

New and migrated pages are verified at:

* narrow mobile;
* wide mobile;
* tablet;
* desktop.

Responsive behavior uses CSS media queries and layout primitives.

Components do not generally attach a window resize listener merely to choose markup. JavaScript viewport logic requires a behavior that CSS cannot provide and must clean up correctly.

Critical transaction controls remain visible and understandable without horizontal-page overflow.

---

# Part 19 - Security

Frontend security requirements include:

* no shipped hard-coded credential;
* no client authorization;
* no secret in Vite variables;
* no token in URL query;
* action tokens removed from fragment history immediately;
* no user-controlled HTML rendering;
* no `dangerouslySetInnerHTML` without a separate sanitization approval;
* exact API and Socket origins;
* credentials and CSRF through the shared client;
* no private response in broad console logging;
* restrictive deployment CSP;
* no third-party script on account-action pages without approval.

Hiding a control is usability, not security.

---

# Part 20 - Frontend Testing

Frontend tooling and gates follow `TESTING_STRATEGY.md`.

Every migrated feature adds:

* pure utility tests;
* Query and mutation tests;
* loading, empty, error, unauthorized, conflict, and success component tests;
* Strict Mode effect-lifecycle tests;
* focused responsive and accessibility checks;
* Playwright coverage for launch-critical workflows.

Tests use a fresh Query Client and in-memory router.

No test relies on a real production account or production backend.

---

# Part 21 - Incremental Migration

## Principle

Do not rewrite the 2,400-line `App.jsx` in one change.

Each extraction:

1. characterizes current behavior;
2. creates the target shared boundary or feature module;
3. moves one route or workflow;
4. preserves compatibility while required;
5. adds tests;
6. verifies build and browser behavior;
7. removes only newly unused code.

---

## Sequence

### FE-00 - Frontend Test Foundation

Add:

* Vitest;
* jsdom;
* Testing Library;
* test setup and render helper;
* one existing-page smoke component test;
* lint, test, and build gate.

No feature behavior changes.

### FE-01 - Configuration and HTTP Client

Add validated environment configuration, `ApiError`, response-envelope parsing, credentials, abort support, and compatibility URL translation.

Move no feature write until the client is tested.

### FE-02 - Query and Provider Foundation

Add Query Client, provider composition, query test helper, and global error coordination.

The current broad league fetch may use a temporary compatibility query but remains clearly legacy.

### FE-03 - Application Shell and Routes

Create layouts, route error pages, not-found behavior, and feature route composition.

Keep current visible routes compatible.

### FE-04 - Session and Account Slice

When the backend account API exists:

* remove hard-coded passwords;
* remove local-storage identity;
* implement session bootstrap and account pages;
* add in-memory CSRF;
* clear caches on auth loss.

This change must coordinate backend and frontend deployment.

### FE-05 - League and Team Context

Add league chooser, stable-ID routes, membership-aware navigation, team pages, and authorized league cache scoping.

### FE-06 - Realtime Lifecycle

Move Socket.IO to `RealtimeProvider`, add scoped invalidation, cleanup, reconnect, and session handling.

### FE-07 - Players, Rosters, and Contracts

Move these target feature slices after their `/api/v1` contracts are implemented.

Retire related complete-league mutations.

### FE-08 - Auctions and Trades

Move sealed bids and trade workflows to feature commands, idempotency, versions, and authoritative responses.

### FE-09 - Matchups and Standings

Move matchup and standings reads to season- and league-scoped queries. Preserve locked-snapshot display rules.

### FE-10 - Activity, Notifications, Commissioner, and Admin

Separate ordinary history, Security Audit, notifications, league operations, and platform operations.

### FE-11 - Compatibility Retirement

After all callers move:

* remove broad `POST /api/league`;
* remove hard-coded old API URL derivation;
* remove legacy authorization helpers;
* remove obsolete autosave;
* remove migrated code from root `App.jsx`;
* retire frontend `server.cjs` through a focused verified cleanup;
* reduce legacy global CSS.

---

## Root `App.jsx` Transition

During migration, current `src/App.jsx` may temporarily re-export the target app or host a clearly named `LegacyLeagueApp`.

It must shrink after every completed feature extraction.

Completion target:

* provider and router composition only;
* no feature calculations;
* no direct fetch;
* no direct Socket.IO;
* no hard-coded users;
* no broad league autosave.

---

# Part 22 - Compatibility and Deployment

Coordinated frontend/backend contract changes define:

1. backend compatibility period;
2. target endpoint availability;
3. frontend switch;
4. staging verification;
5. production deployment order;
6. rollback behavior;
7. old endpoint retirement.

The frontend must not deploy first when it requires an unavailable backend endpoint.

The backend must not retire an endpoint while the production frontend still calls it.

Netlify preview origins are not automatically granted production credentialed CORS.

---

# Part 23 - Completion Criteria

Frontend structure is complete for launch when:

* `App.jsx` is a small application composition boundary;
* all server state uses feature queries rather than one global league object;
* one shared HTTP client owns session, CSRF, errors, versions, and idempotency;
* one realtime provider owns Socket.IO;
* session identity comes only from backend bootstrap;
* league and team routes use stable IDs;
* private caches are league-scoped and cleared on authorization loss;
* no hard-coded credentials ship;
* no complete-league target write remains;
* feature calculations do not override backend authority;
* major routes have loading, empty, unauthorized, conflict, and error states;
* critical pages pass component, browser, responsive, and accessibility tests;
* legacy `server.cjs` is no longer an active frontend backend;
* production and staging contracts deploy safely.

---

# Part 24 - Verification

Document verification:

```powershell
Get-Content docs/04-technical-specs/FRONTEND_STRUCTURE.md
Select-String -Path docs/04-technical-specs/FRONTEND_STRUCTURE.md -Pattern '^`APPROVED`$','@tanstack/react-query','FE-00','Compatibility Retirement'
```

Implementation verification, after the foundation exists:

```powershell
npm run lint
npm test
npm run build
npm run test:e2e -- --project=chromium
git diff --check
git status --short
```

Expected:

* lint, unit/component tests, build, and focused browser tests pass;
* no secret enters the frontend bundle;
* no unrelated local file is changed;
* exact affected workflows are manually checked.

---

# Technical References

Implementation should use current official guidance for:

* React;
* Vite environment variables;
* React Router;
* TanStack Query;
* Vitest;
* React Testing Library;
* Playwright;
* Socket.IO client;
* browser cookie, CSP, accessibility, and Fetch behavior.

Patch versions are chosen and locked at implementation time after compatibility review. A dependency change never silently changes approved product behavior.

---

# Final Approved Decisions

The frontend structure is approved with:

* JavaScript and JSX retained for Season 2;
* React Router for stable-ID route context;
* TanStack Query for authoritative server state;
* no Redux or general client-state package initially;
* controlled React forms without a new form package initially;
* one validated environment module;
* one shared credentialed HTTP client;
* in-memory CSRF and no browser-stored identity proof;
* URL-derived league and team context verified against backend authorization;
* feature-scoped query keys;
* no automatic mutation retry;
* one Socket.IO lifecycle for scoped invalidation;
* feature-first modules and strict dependency direction;
* CSS Modules for newly extracted components and incremental legacy CSS reduction;
* Vitest, Testing Library, and Playwright under the approved Testing Strategy;
* an eleven-step incremental migration rather than a broad rewrite.

No frontend code, dependency, environment, or deployment was changed by writing this specification.
