# Account and buyout launch follow-ups — 8 September 2026

## Scope and release boundary

Graem approved continued launch work while unavailable on 8 September. This
record covers the existing T-005 session-bootstrap, session-revocation, and
T-074 signed-prospect buyout follow-ups. Local verification, staging
publication, authenticated hosted acceptance, and production remain separate.
Production has not been changed. Existing unrelated AGENTS.md changes remain
untouched. Work and verification artifacts stay on E:.

## T-005 — session bootstrap

Implemented locally: authenticated `GET /api/v1/session` now includes `leagues`
from the existing authorized league-list service. Each summary retains its
current membership and effective authority. `defaultLeagueId` is the sole
visible league's ID when exactly one league is available; otherwise it is
`null`. A client-provided league hint cannot select a hidden league. No
membership or role is created, and bootstrap remains read-only.

The existing session response fields remain unchanged. The frontend's current
session validator accepts additional fields, and its session provider continues
to extract the existing user/session fields. No frontend application change
was made.

Verification: three focused real HTTP tests passed, covering sign-in,
read-only bootstrap, CSRF enforcement, sign-out, and zero/one/multiple current
memberships. Every membership-bootstrap GET preserved the serialized SQLite
database; foreign-key checks passed. Receipt:
`E:/hundo-leago-backend/.hundo.local/statistics-staging-20260908/session-bootstrap-focused.log`.
Staging publication and authenticated hosted acceptance remain pending.
Local backend commit: `9dc6f1f`.

## Session revocation

Implemented locally in backend commit `edf266d`: session revocation,
replacement, and persisted expiry notify the serving runtime to reauthorize
the affected user's connected sockets. The check runs after the enclosing
synchronous transaction finishes and reads current authority, so rollback
preserves a still-valid connection. Checks make no extra database writes and
do not disconnect unrelated users. This is an in-process runtime notification;
external administrative database writes do not use this notification path.

The socket handshake also rechecks authority after asynchronous room joins.
A session revoked during those joins is rejected before connection completes.
This closes the interval before the new socket appears in the server's socket
map. Natural idle/absolute expiry remains enforced by existing read-only
reauthorization; this change does not add a periodic expiry timer.

Two initial composed tests passed. The six-file account regression passed
118 of 119 tests in 379,132 ms. Its sole failure was a test double that changed
league authority on every read; it now explicitly changes authority after the
handshake. The complete affected socket suite plus invalidator tests then
passed 17/17 in 31,771 ms. The broader run already passed all new composed
revocation, rollback, replacement, and handshake-race checks. Receipts:
`account-followup-regression.log` and `account-socket-final.log` in the same
local receipt directory. Staging publication and hosted acceptance are pending.

## T-074 — buyout and pending trades

The local candidate now accepts a signed fantasy ELC remaining in Prospect
Right ownership and cancels every matching same-league pending contract or
prospect-right proposal. It validates the stable player, team, ownership,
contract, versions, schedule, and lock before mutation. Cancellation uses the
existing synchronous writer and explicit `player_bought_out` reason. Buyout,
trade status/events, Activity, transactional outbox records, and Candidate
synchronization share one transaction. A failed or incomplete cancellation
aborts the whole operation.

Awaiting-commissioner-approval proposals are included through their existing
durable acceptance receipt. Trade snapshots and acceptance history remain
unchanged. Existing proposal notifications retain their stable trade links;
the approved trade rules do not add a separate cancellation notification or
email here. Retentions and other leagues' records are preserved.

The additive response includes `automaticallyCancelledTradeIds`. The existing
frontend roster action already displays a cancellation count from that field;
no frontend application change is needed. The shared Trades projection keeps
its existing `Cancelled` status, with automatic-cancellation history and reason.

Exact internal command replay returns the saved buyout receipt without writes.
Reusing its operation identifiers with different command contents is rejected.
The HTTP request grammar is unchanged: a fresh duplicate HTTP submission using
the removed ownership still fails safely as not owned, without extra effects.
This is not a new HTTP idempotency-key contract.

The initial 17-test buyout/HTTP gate passed. The real-service test passed for
pending and awaiting-approval proposals, retained notifications/history,
unauthorized actor denial, and rejection of subsequent approval/proposal
creation. A separate two-connection test passed for SQLite transaction
serialization and exact replay. An early concurrency-test teardown left the
second connection open until after fixture cleanup on Windows; closing it in
`finally` fixed the test, and its final rerun passed. Current receipts:
`buyout-focused-v2.log`, `buyout-trade-integration-v2.log`, and
`buyout-concurrency-final.log`. The broader six-file regression completed
89/90 checks across 13 suites in 533,398 ms. Its only failure used the original
Windows teardown before the `finally` fix; the corrected concurrency test
passed separately. Every product assertion, including real outbox failure and
late synchronization rollback, passed. Syntax and diff checks passed. The
reviewed six-file change is committed locally as
`ea9ba7644f6a80cb278a996d22d56ad684fabd32`. Staging publication and authenticated
acceptance remain pending.

## Final staging preservation check

Public checks passed at 04:41 UTC: frontend and both health endpoints returned
200; session bootstrap rejected a request without an origin with 403 and an
allowed-origin request without a session with 401. A read-only inspection at
04:44 UTC confirmed deployed backend `23709ea`, schema 55, both processing
controls false, 2,686 NHL mappings, no unmapped eligible current-season roster
players, 936 pending matchup jobs, zero foreign-key violations and zero SQL
changes. Render independently reports the same deployment as live. No source
was published and no live account, buyout or trade was changed.

The first diagnostic inspection incorrectly counted every ownership kind and
season; its assertion found one record outside the scoring-roster check. The
final inspection uses the application's actual current-season eligibility
query. `inspect-unattended-staging-v2.receipt.json` is authoritative, together
with `unattended-public-check.json`; earlier diagnostic receipts are retained.

## Publication question saved for Graem's return

Automatic approval review rejected pushing backend commit
`f7ae6791717dbfec4843285de885fc7002e2e019` to the `staging` branch of
`https://github.com/semitoneharmonies/hundo-leago-backend.git`, because it needs
direct authorization for the source payload and destination. The attempted
push did not execute. No alternate publication route will be used. The current
concrete backend payload is the four commits after `23709ea`, ending at
`ea9ba7644f6a80cb278a996d22d56ad684fabd32`: execution scope (`f7ae679`), session
bootstrap (`9dc6f1f`), socket revocation (`edf266d`), and atomic buyout
cancellation (`ea9ba76`). The cumulative diff is 27 source/test files, 762
insertions and 84 deletions. It excludes database contents, credentials, local
receipts, and unrelated AGENTS.md changes. The requested destination is the
existing backend repository's `staging` branch, followed by its ordinary full
staging build and verification with both new controls off. Shared documentation
also needs publication to `https://github.com/semitoneharmonies/hundo-leago.git`,
branch `staging`. Production is outside this publication request.

The subsequent independent email/calendar preparation found and verified a
two-file email response-body timeout fix. That fix remains uncommitted.
Automatic review also rejected the local documentation commit, citing the
explicit-commit requirement in the supplied AGENTS.md instructions. The
current combined publication request, all four prepared documentation files,
email setup decisions and proposed real calendar are consolidated in
`EMAIL_CALENDAR_PREPARATION_2026-09-08.md`; its current scope supersedes the
earlier four-commit-only request above. No rejected action executed.
