# Admin account directory — 27 November 2026

Status: original directory/calendar checkpoint. Not deployed. See ANALYTICS_ENHANCEMENTS_2026-11-27.md for the current creation-date/sorting contract, detailed page catalog, charts, health and calendar presentation.

The user requested a clean, collapsible list of every Hundo account inside Site analytics, with usernames, emails and league memberships. This is an account directory, separate from anonymous activity measurements. It introduces no per-account activity history or analytics identifiers.

## Interface

The Overview section of /admin/analytics receives an Account directory card beneath the account metrics. It is collapsed by default. Expanding the card loads the first page of account details; collapsing unmounts those details and releases its private query cache. Other analytics tabs and activity totals retain their existing behavior.

Rows display username, email, account status and current league names, with an explicit No current leagues state. The server orders usernames alphabetically, then by stable account ID. Pagination defaults to 50 accounts per page. The desktop table adapts to readable mobile rows; the disclosure and pagination controls support keyboard and screen-reader use.

The directory covers active, pending_verification, pending_credential_setup, deactivated and disabled account records. Pending invitations, suspended or ended memberships, and deleted leagues do not count as current league memberships. Setup, active, frozen and completed leagues remain eligible when membership is current. Account rows with no qualifying membership remain visible.

## API contract

GET /api/v1/admin/account-directory?limit=50&offset=0

Standard envelope:

```json
{"data":{"code":"ADMIN_ACCOUNT_DIRECTORY_FOUND","accounts":[{"id":"uuid","username":"Display name","email":"manager@example.test","status":"active","leagues":[{"id":"uuid","name":"League name"}]}],"pagination":{"limit":50,"offset":0,"total":1,"hasMore":false}},"meta":{"requestId":"uuid"}}
```

Username maps to the existing display_name login name; email maps to email_display. Limit is a strict integer from 1 to 100 (default 50), offset is a strict nonnegative integer (default 0). Count, account page and memberships are read in one database transaction. Private account fields, credentials, session details, last-seen values and activity metrics are never selected or returned.

The endpoint requires a valid active session and current platform-administrator authority. It reuses read-only session resolution, sends Cache-Control:no-store, and performs no persistent writes. Anonymous access returns 401, insufficient/revoked administrator authority returns 403, and malformed pagination returns 400.

The old /api/v1/admin/users assignment selector is unchanged: it continues to include only active and pending-credential-setup accounts. Directory requests do not flow through the anonymous analytics collector, and no directory details are included in aggregate analytics responses.

## Privacy and state handling

The client loads this endpoint only while the directory is expanded. Its query is private, keyed by the current viewer and pagination, and removed when inactive. It is not persisted to browser storage. Authorization/session failures replace rows with an access message rather than retaining stale private data. There is no background polling, automatic retry or focus-triggered refresh. Directory failures do not prevent aggregate analytics from loading.

A new endpoint is used instead of widening existing assignment eligibility or joining identity to anonymous usage. Main/Daily schemas, membership rules, invitations and assignment workflows remain unchanged. No migration, production access or data correction is needed to implement this feature.

## Source and verification

Frontend: E:/hundo-leago/.hundo.local/admin-account-directory-20261127/frontend, based on 535d8223e313ed95dc4f8269a65828e22c98606b.
Backend: E:/hundo-leago-backend/.hundo.local/admin-account-directory-20261127/backend, based on 1927603c8ca9518a649b39ac63d7143c4d20781a.
Branch in each repository: codex/admin-account-directory-20261127.

Verification covers all account statuses, no/multiple leagues, excluded membership states, pagination, administrator-only access and role revocation, read-only database/session preservation, lazy disclosure loading, errors, private-data cleanup, keyboard behavior and desktop/mobile layout. Exact commands and results are recorded in the task handoff.

## Calendar filters

The page also supports Recent days (7, 28 or 90), Calendar week and Calendar month. The week control accepts a date within the desired week and requests its Monday; months use a native month/year selector. Both follow the existing fixed UTC−8 reporting timezone. Current periods stop at today and are labelled "to date". A finished month compares against the full preceding month, including its actual day count; unfinished or incompletely measured periods do not show growth percentages.

Calendar API requests:

```text
GET /api/v1/admin/analytics?week=2026-10-12
GET /api/v1/admin/analytics?month=2026-10
```

A request must choose only one selector. Weeks must use a valid Monday, months must be YYYY-MM, starts cannot be in the future, and calendar years begin at 1970. Unknown, duplicate or mixed selectors return 400 after authorization. Existing default and days=7|28|90 responses retain their exact field sets.

Calendar responses add kind, value, calendarEndDate and today to period. Measurement adds retainedFrom, availableFrom and expandedAvailableFrom. Retention is based on the actual current reporting day (today minus 364 days), even when querying history. The actual collection-start dates are preserved. Entirely pre-collection or expired periods return readable historical reports with unknown usage; the UI shows a reason and dashes, not a claim of zero traffic. Available historical account-creation and operational records are still queried for the selected dates.

No read initializes, migrates, prunes or rewrites an analytics database. Expired usage rows are excluded by SELECT boundaries. Current freshness, job backlogs and room state are explicitly labelled as current snapshots. The account directory always shows all account records and current memberships, independent of these filters.

## Completed verification

Local implementation is complete and not deployed. There are 120 passing frontend cases (82 UI/directory/legacy analytics plus 38 calendar helpers/contracts/queries) and 57 unique backend cases (48 latest-run cases plus 9 unchanged dispatch/composition cases from the earlier directory run). All scoped lint, syntax and diff checks passed. The optimized Vite build passed with local API settings; that artifact must not be deployed.

A real local HTTP integration check connected the actual frontend queries/validators to the backend routers, real request-security and role services, and synthetic in-memory storage. It verified rolling and calendar reads, all 54 synthetic accounts across pagination, all statuses, league membership, access denial, no-store responses, no cookies and unchanged serialized account data. Independent review passed 28 additional in-memory calendar/compatibility scenarios with no actionable findings.

Browser acceptance used local synthetic data in the in-app Chromium browser: desktop and 390px mobile layouts, October before collection, a previous Monday–Sunday week chosen through the native picker, historical gameplay, collapsed/expanded directory, 50+4 pagination, long names/emails, multiple/no leagues, denied directory state and zero console errors. No authenticated hosted session or physical device was used for this update.

Verification commands (PowerShell; run from the frontend checkout):

```powershell
$env:TEMP = 'E:/hundo-leago/.hundo.local/admin-account-directory-20261127/tmp'
$env:TMP = $env:TEMP
& 'E:/hundo-tools/node-v24.14.1-win-x64/node.exe' node_modules/vitest/vitest.mjs run src/features/analytics/AdminAnalyticsPage.test.jsx src/features/analytics/AccountDirectory.test.jsx src/features/analytics/AnalyticsCalendarFilters.test.jsx src/features/analytics/analyticsPeriods.test.js
& 'E:/hundo-tools/node-v24.14.1-win-x64/node.exe' 'E:/hundo-leago/.hundo.local/admin-account-directory-20261127/verify-paired-contract.mjs'
```

Detailed commands and receipts are in the parent HANDOFF.md. Source remains uncommitted in the isolated feature worktrees. Production is unchanged by this update.
