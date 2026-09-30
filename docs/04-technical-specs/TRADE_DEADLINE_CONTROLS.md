# Trade deadline controls

Local commissioner-controls branch implementation, 29 September 2026. No hosted
acceptance, publication or live data operation is implied by this contract.

## Access and routes

Current commissioner or inherited platform administrator authority is required
on every request and again inside the write transaction. Active managers without
that authority cannot use the control. The league must be in setup or active;
an active league requires its active current season.

All routes use the base
`/api/v1/leagues/:leagueId/calendar/trade-deadline`:

| Method/path | Behavior |
| --- | --- |
| GET base | Current deadline, timezone, edit availability and most recent 25 changes; no writes |
| POST /preview | Validate reason/date and return aggregate impact counts and a state-bound preview hash; no writes |
| POST /apply | Confirm that preview with an idempotency key; one atomic audited change |

Mutations use the existing session, same-origin and CSRF protections. Responses
are private/no-store. Read and preview do not process overdue offers. The legacy
setup-only deadline endpoint is retained for existing creation clients.

Preview input is exactly `{ reason, tradeDeadlineAtMs }`. Reason is trimmed,
3..500 characters, without control characters. The new deadline is a safe UTC
millisecond timestamp in the future and differs from the saved value. Apply adds
`confirmed: true` and `previewHash`, with an Idempotency-Key header.

The hash binds current league/settings/season versions, proposal timing, actor,
requested change and impact. Changed proposals, revoked authority or expiry
between review and confirmation require a new review. A successfully accepted
request with the same key and body returns its receipt without another write.

## Pending offers and privacy

Only current-season pending proposal identities, timing and versions are read
internally. Assets, participants, offered terms and private events are not loaded.
The response contains counts only: shortened, extended, unchanged and already
expired offers retained. Public activity and notifications have no proposal IDs
or impact counts.

For each unexpired proposal, the effective deadline becomes the earlier of its
original seven-day expiry and the new league deadline. Receiver acceptance and
Future Considerations approval history are retained. Existing trade services
continue using the updated effective deadline. No separate trade-expiry job is
created or replayed; the existing worker reads proposal clocks.

An offer at or past its old effective expiry remains expired even if its stored
status still awaits worker processing. Reopening a passed league deadline allows
new proposals subject to the existing opening/season/ownership rules; it never
revives those old offers. Completed trades and original proposal receipts remain
usable and unchanged.

Legacy pending proposal models, missing clocks or clocks inconsistent with the
saved league deadline block editing instead of guessing at historical intent.
New future deadlines are supported in this slice. Immediate closure, backdated
corrections and completed-event reversals remain pending scope.

## Persistence and effects

Migration 0070 adds `league_trade_deadline_changes`, with league-first history
index, version-bound insert validation and immutable update/delete guards.
It preserves every preexisting table row and schema object, except the exact
data-model metadata advance and migration ledger additions.

One immediate transaction inserts the change, conditionally updates affected
proposal clocks/versions, updates league settings and league version, inserts
general League Activity and member inbox notices, and emits the existing
`league.changed` invalidation. Any failure rolls everything back. Before/after
proposal timing is retained internally in the immutable change; API history
exposes only actor, reason, global dates and change time.

The runtime now has 149 endpoint contracts, including the unchanged 29 dedicated
FAD routes. Schema 70 has 149 tables including the migration ledger, 148
application catalogue entries and 84 immutable delete guards. The old signed
reset manifest is unchanged; the added table joins its require-empty boundary.

## Website

`TradeDeadlineControls.jsx` appears under the commissioner/admin authority gate
on the competition page. Dates use the league timezone for display and input.
Review is read-only; confirmation explains the seven-day limit, expired-offer
preservation, counts and reopening. Editing withdraws the preview. Network retry
keeps the same accepted-command key. Recent changes are available in a disclosure.
New deadline notices link to the league dashboard.

## Verification and remaining release work

The [work plan](../06-work-plans/COMMISSIONER_CONTROLS_2026-09-29.md)
records exact commands, files and logs. Local evidence includes a populated
schema-69-to-70 migration, real two-party and commissioner-approved trade flows,
expired-offer preservation, injected rollback, read-only database fingerprints,
session/CSRF checks, current authority, replay and stale-preview rejection.
Frontend interaction and notification cases, desktop/mobile browser checks and
visual inspection cover privacy, timezone conversion and confirmation.

No production or staging services were accessed. Release still needs review of
the complete package, compatible rollback, protected backup/restore rehearsal,
production-copy migration rehearsal and authenticated hosted acceptance.
