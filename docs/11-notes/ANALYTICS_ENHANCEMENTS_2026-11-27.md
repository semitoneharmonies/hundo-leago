# Analytics improvements — 27 November 2026

Status: implemented and verified locally; not committed, pushed or deployed. This note supersedes the account-directory note where the directory contract and analytics presentation have changed.

## Account directory

Every account includes its authoritative createdAtMs from users.created_at_ms. The UI displays the creation date in fixed UTC−8. Username, email, creation date, current leagues and status are sortable. Created initially sorts newest first; clicking the same column reverses direction. Mobile exposes the same choices in a labelled selector.

GET /api/v1/admin/account-directory?limit=50&offset=0&sort=createdAt&direction=desc

Sort is one of username, email, createdAt, league or status. Direction is asc or desc. Defaults are username/asc. Pagination adds sort and direction; account objects add createdAtMs. Sorting occurs over the whole result before LIMIT/OFFSET, with stable name/ID tie-breaks. League sorting uses the first alphabetical current league and places no-league accounts last in both directions. Changing sort returns to page one. All previous authority, membership, lazy-loading and private-cache behavior is preserved. No schema migration or creation-date backfill occurs.

## Every page type and separate mini games

What gets viewed lists all 48 current collected page types, ranked by views, then active time, then name. Tip Jar and Mr. Boni have separate rows. These are fixed page types across all route instances, never league/player/room identities or raw addresses. The collector sends only approved product/category counts and rejects unknown combinations before transmission.

Seven original mixed categories remain available as legacy combined rows when they contain activity. Historical combined counts are never redistributed across newly separated pages. Newly separated categories have their own measurement start and show Not measured when appropriate. Missing prior collection or expired retention is not presented as zero. Authentication/token pages, Admin analytics, unknown pages and redirect-only paths remain explicitly excluded; the page lists those exclusions.

The new frontend opts into GET /api/v1/admin/analytics?days=28&detail=pages (the same flag works with week or month). The response adds pageDetail with startedOn, availableFrom, coverage, rows and dailyProducts. All 55 category rows are present in the response: 48 current plus 7 legacy combined. dailyProducts has one date entry with Leago, Daily and shared page-view/active-time totals; sums reconcile to existing daily and product totals.

Without detail=pages, the response retains the old fields and folds new category counts into the old 24-category report. The optional analytics_page_detail metadata table is created only during an accepted refined-category collection write. GET does not create or prune anything. Main/Daily schemas remain unchanged.

## Chart toggles

Traffic over time keeps its combined chart and adds Leago / Daily mode. This shows side-by-side Leago, Daily and shared-page bars on one scale; shared pages are not attributed to either product. The expanded daily totals table gains corresponding product columns. Existing per-product daily counters support historical splits; this does not require a new identity or session identifier.

Weekly gameplay retains the original activity-type stacked chart. Leago / Daily mode separates the sum of Leago trades, auctions and roster changes from Daily draft windows ended. The chart explains that these are different activity types. Exact product totals are available in a table. Unavailable Daily evidence remains unavailable, not zero.

## Expandable data health

Failed, pending and running jobs, Daily scoring pending, matchups awaiting data, and failed statistics/injury updates now open details only when clicked.

GET /api/v1/admin/analytics/health?group=failed_jobs&days=28

Allowed groups: failed_jobs, pending_jobs, running_jobs, daily_scoring_pending, matchups_awaiting_data, failed_statistics and failed_injuries. The same recent/week/month selectors apply. Backlogs are current snapshots independent of selection; failed update history uses the selected period. Responses state the scope and as-of time, total, limit 50 and truncation. The current summary may be older than newly opened details.

Rows contain only approved type/status enums, attempts, scheduled/start/completion/update times and a safe reason enum. No IDs, account or league names, raw errors, payloads, provider URLs or credentials are exposed. Specific advice is based on whitelisted recorded causes; unknown causes are explicitly unknown. Examples cover provider timeout/rate limits, rejected/incomplete data, backup space, state conflicts and expired leases. Scheduled pending jobs are explained as normal where the schedule is in the future. Advice never retries jobs or changes site data.

The endpoint uses current administrator authorization and read-only session resolution, sends no-store and does not initialize sidecars. The private query is viewer/group/period scoped, fetched only when expanded and removed when inactive. Access failures hide stale details. The detail panel uses the existing dark analytics palette and keyboard-accessible close/refresh controls.

## Hockey and deadlines

The daily all-column table is replaced by weekly cards. Each shows recorded NHL games, Daily draft totals and only actual positive deadline events with their date and count. Sunday auction events appear once on Sunday; the UI does not assume or invent a fixed recurrence. Any exceptional stored deadline date remains visible.

Each week can expand a compact daily hockey/Daily-draft table. Unknown schedule evidence stays Unknown, and partial weekly totals disclose how many days are unknown. Period-edge weeks are labelled partial. The cards collapse to one column on mobile.

## Verification and release boundaries

196 frontend tests passed across all 9 analytics test files. 63 distinct backend cases passed across aggregate analytics, directory, health, maintenance, dispatch and focused runtime verification. There were also 55 actual HTTP paired response checks and 30 independent in-memory review scenarios. Scoped lint, syntax, diff checks and the final optimized build passed.

Desktop and 390px mobile browser checks verified creation-date sorting, mobile sort controls, individual mini-game rows, traffic/product daily columns, gameplay split bars, failure and scheduled-job guidance, and expandable weekly calendar cards. Browser checks found a light fallback theme in the health panel and cramped inline labels; both were fixed and visually rechecked. No browser console errors or horizontal page overflow were observed.

The optimized build uses localhost API configuration and must not be published. Full repository suites, hosted administrator workflows and physical devices were not tested in this local update. Production and its databases were not changed.

Release order: compatible backend before frontend. The new backend supports old frontend reports. After refined-category reports have been stored, rolling the backend binary back to the original deployed aggregate reader would make its analytics response unavailable because it does not recognize those categories. A safe rollback must retain the compatible analytics reader; do not delete or reclassify history. This is an analytics compatibility constraint, not a main/Daily data migration.

Exact files, code patches, verification commands and receipts are recorded in the parent ENHANCEMENTS_HANDOFF.md and enhancements-source-manifest.json.
