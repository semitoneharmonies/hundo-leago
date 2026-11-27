# Admin aggregate analytics — 27 November 2026

Status: implemented locally; not deployed. The user requested aggregate site analytics with no individual tracking or popups, then approved the expanded measurements and an installation counter. The original per-account activity proposal is superseded.

## Admin experience

Platform administrators open **Site analytics** from the account menu at `/admin/analytics`. The 7/28/90-day selector applies across four sections:

- **Overview:** page views, estimated active minutes, active minutes per page view, total/new account counts, reported installations, Leago/Daily/shared-page shares, daily chart and accessible table, popular broad sections, and fixed feature-action rankings.
- **Gameplay:** current room fill/completion snapshots split into scheduled/practice rooms; separately observed creation/start/completion/cancellation events and start-seat fill; stacked weekly bars and exact tables for completed trades, resolved auctions, roster changes, and Daily draft windows ended.
- **Experience:** reported installations, installed-app/browser openings, broad launch layout, action success/failure totals, browser performance rating buckets, latest recorded statistics/injury update results, and current processing backlog.
- **Timing & context:** weekday/six-hour activity totals after minimum coverage, recorded NHL/deadline counts, and trusted server builds first observed.

Ordinary users cannot read the API. Administrators without leagues can discover the link through an aggregate-only permission check when opening the account menu; this never requests an account list. The Admin page does not collect its own usage.

Account counts include all existing account statuses and are never joined to usage. There is no named account activity, last-seen metric, visitor identifier, unique-visitor estimate, visit frequency, or average time per visit. Page views are visible/focused page openings, not people or visits. Minutes per page view is aggregate active seconds divided by 60 and by page views; it is not a session duration.

All date buckets use fixed UTC−8 (`Etc/GMT+8`). Today and the first measurement day are partial. Earlier unmeasured dates display “Not measured,” rather than zero. Percentage comparisons require measurement to have started strictly before the previous period's first date. The original usage and expanded metrics have separate coverage start dates.

## Browser collection boundary

The separate `POST /api/v1/analytics/aggregate` accepts only one of these bounded shapes:

```json
{"product":"daily","category":"room","pageViews":1,"activeSeconds":0}
{"metric":"install.reported","value":1}
```

Product/category and metric names are fixed allowlists. Route IDs, full URLs, query strings, hashes, account IDs, names, email addresses, exact viewport size, device model, precise timestamps, referrers, search terms, player selections, message content, error messages, and free text are not sent.

Fetch uses `credentials: omit`, `referrerPolicy: no-referrer`, no authenticated client, no persistent queue, and no retries. There are no analytics cookies, local-storage identifiers, fingerprinting, remote analytics services, or new notices/popups. Existing GPC/Do Not Track signals disable browser collection.

Only transient browser state is retained. Estimated active time pauses when hidden/unfocused and after 120 seconds without interaction. Timer suspension gaps are discarded. Increments are bounded to 60 seconds, normally sent every 30 seconds and when leaving/hiding the page. Lost or blocked requests, overlapping devices/tabs, and synthetic traffic can affect estimates; people are not identified or deduplicated. Admin, recovery/token-action, and unknown routes are excluded. Changing a filter query on the same pathname does not create a page view. Separate static public mini-game documents do not load the React collector.

### Expanded metric definitions

- **Reported installations:** browser `appinstalled` reports. This is not a count of unique installations, current installations, devices, or people. Some iPhone/iPad installations do not produce this report.
- **Installed-app/browser openings:** one report per fresh document when an eligible page becomes visible. Reloads count. This does not attempt to recognize a returning visitor.
- **Launch layout:** one coarse classification per recorded opening: small at 767 CSS pixels or narrower, otherwise large. No exact dimensions or model are sent.
- **Feature actions:** Players filter changes/search submissions, favourite changes, explicit roster-schedule opens, explicit Daily-chat opens, and successful Daily-chat sends. Only the action enum is recorded.
- **Action outcomes:** join, bid actions (including edits/removals), trade actions (including accept/approve flows), and selected page-data request success/failure. Page-data requests include refreshes. Failed submissions can include rejected inputs or connection failures, so the rate is not a site uptime metric.
- **Browser performance samples:** LCP, INP, and CLS are calculated by the locally vendored standard `web-vitals` 6.2.3 implementation. Only the first reported good/needs-improvement/poor rating per document is sent. No raw timing, value, URL, or measurement ID is sent. INP/CLS commonly report on first backgrounding. Unsupported browsers and documents without the required interaction provide no sample. Bucket proportions are not P75 or other percentile scores.

## Server collection and source projections

The browser endpoint rejects cookies, Authorization, query parameters, nonallowlisted fields or enums, malformed/oversized JSON, invalid increments, and server-only lifecycle metric names. It applies allowed-origin checks and a global submission limit without IP-based rate buckets. Accepted collection does not perform authentication, audit/request-ID collection, or request-data logging. Analytics failure is nonblocking for normal browsing.

Trusted Daily lifecycle hooks increment aggregate room creation/start/completion/cancellation and total occupied/capacity seats at start, split into practice/scheduled. Browser requests cannot submit those enums. Event-day totals can refer to different room cohorts; created/completed totals must not be presented as a conversion funnel. Historical start fill is not reconstructed.

The Admin response separately reads existing game/operational records and returns only counts:

- Room snapshots use the selected **play-date cohort**, current occupied seats/capacity, and current completion/cancellation/scoring state. Occupancy can include practice participants.
- Gameplay uses completed trades, resolved auctions, roster changes, and noncancelled Daily draft windows that ended with draft activity. Weekly buckets start Monday in UTC−8; boundary weeks can be partial. Draft windows ended does not mean scoring completed.
- Freshness shows last recorded successful statistics/injury updates and rounded time since each update as of the current analytics refresh, failure counts in the selected period, and current job/scoring/matchup backlog. Viewing the page does not trigger any refresh job.
- Calendar NHL counts use recorded schedule evidence only. Unknown days remain null/“Unknown,” never inferred to have zero games. Deadline counts aggregate across leagues without exposing league names or IDs.
- Build observations come only from trusted backend build configuration, first seen during an eligible analytics write. Multiple server builds may first appear on one day. These are not deployment timestamps and do not cover frontend-only releases.

Unavailable projection sources are explicit section states or nullable fields. They do not become fabricated zeroes or hide otherwise available analytics.

## Storage, privacy thresholds, and reads

Aggregates use a separate lazy SQLite sidecar `<main database path>.analytics.sqlite3`, application ID 1212239444. Schema 2 stores daily category totals, daily fixed metric totals, daily six-hour timing totals, coarse coverage dates, and trusted server-build observations. Existing schema-1 analytics remains readable and is expanded only during an accepted analytics write. No main/Daily schema migration is introduced.

There is no individual event history or account-to-usage connection. Startup and reads never create, upgrade, or clean the sidecar. A validated collection POST or trusted room-event write can initialize it. Daily rows older than 365 days are removed during later accepted writes; reads never perform cleanup.

The timing heatmap requires at least 14 measured days **within the selected period** and at least 20 measured page views. The 7-day selection therefore cannot display it. Published cells combine weekdays into four six-hour blocks; nonzero cells below five page views have both count and active time withheld.

`GET /api/v1/admin/analytics?days=7|28|90` enforces current platform-administrator authority and resolves sessions without activity/expiry persistence. It returns only aggregate counts, fixed categories, coverage, source status, public server-build references, and standard response metadata. The client strictly validates these contracts, including suppression and numeric consistency. Missing analytics storage means measurement has not started; corrupt/unavailable analytics storage returns 503. Registration totals use an independent aggregate SELECT. Main schema 97 and Daily storage are preserved. Maintenance mode blocks browser collection while leaving Admin reads available.

Hosting infrastructure still receives ordinary network metadata such as IP addresses. This feature does not store those in its analytics dataset; hosting-log retention has not been audited or changed. This is not a claim that no network metadata is ever processed.

## Release and verification boundaries

Frontend base: `b9f64dc0a25beb6031f97fc1362fab77827376ab`.
Backend base: `1e0acb3db754771e36af72f126d5608f251e7c61`.
Both feature branches: `codex/admin-analytics-20261127` in separate repositories.

No deployment, commit, push, environment change, main-schema migration, reseed, or production database access is part of this local implementation. The performance library is vendored locally with its license; it sends no data to a third party. Review persistent-disk placement and hosting-log policy during a later authorized release.

Existing main/Daily backup schedules do not automatically include the analytics sidecar. Aggregate history is nonauthoritative and needs separate recovery handling if retention is desired. Never restore main league data to recover analytics. Compatible code rollback can leave the sidecar in place.

The local fixture `e2e/fixtures/admin-analytics.html` uses synthetic data and the real frontend HTTP response parser. It is not a production route or part of the Vite production artifact. Fixture factory `src/test/adminAnalyticsFixture.js` supports complete, partial, not-started, separately unmeasured expanded metrics, and unavailable-source states. Local build artifacts use local origins and are verification-only.

Exact changed files, focused test commands/results, browser acceptance, and remaining limits are maintained in `E:/hundo-leago/.hundo.local/admin-analytics-20261127/HANDOFF.md` and associated verification receipts.