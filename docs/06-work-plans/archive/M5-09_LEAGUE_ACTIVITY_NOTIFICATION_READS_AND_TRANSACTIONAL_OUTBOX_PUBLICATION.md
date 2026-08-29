# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`ACTIVE`

## Work Plan ID

```text
M5-09
```

## Work Item

```text
League Activity, Notification Reads, and Transactional Outbox Publication
```

# Objective

Complete the approved authenticated transaction-history surface and durable
post-commit publication boundary. Successful auction and trade transactions
must preserve safe League Activity and outbox evidence atomically; listing
activity and notifications must remain read-only; notification acknowledgement
must be an explicit owner-only write; and retrying publication must never
repeat, repair, or otherwise mutate the authoritative feature transaction.

# Exact Scope

M5-09 may:

1. add the minimum ordered migration required for deterministic, idempotent
   league-outbox claiming or notification acknowledgement only if the existing
   schema cannot enforce the approved behavior;
2. add approved League Activity and metadata-only transactional-outbox rows to
   successful target auction and model-version-2 trade creation, response,
   cancellation, expiry, completion, and automatic-cancellation transactions;
3. preserve safe completed-trade activity metadata covering the actor,
   proposal, teams, transferred typed assets and unchanged contract terms,
   created or transferred obligations, completion time, commissioner reference,
   and resulting general-illegality evidence;
4. add league-member, league-scoped, deterministic cursor activity reads that
   reveal no active sealed bid values, private account data, matchup points,
   standings effects, or cross-league records;
5. add authenticated owner-only deterministic notification reads, one-record
   acknowledgement, and current-user read-all commands, with no mutation on
   list;
6. publish approved metadata-only Socket.IO invalidations after commit through
   a retry-safe league outbox worker and retain published or failed outcome
   evidence; and
7. compose the approved `/api/v1/leagues/:leagueId/activity`,
   `/api/v1/notifications`, `/api/v1/notifications/:notificationId/read`, and
   `/api/v1/notifications/read-all` target routes and runtime services.

# Explicit Boundaries

M5-09 does not:

* send email, push, or alternate auction or trade notifications;
* create separate in-app notification rows for normal auction or trade status;
* expose active competing auction bids or private negotiation information;
* make any read expire, repair, publish, acknowledge, or otherwise mutate data;
* execute or reverse a trade during outbox publication;
* add commissioner correction or reversal behavior;
* change matchup or standings data or create activity for those operations;
* start an unbounded background scheduler in the target runtime;
* edit frontend code; or
* deploy, commit, push, or change production authority.

# Atomicity and Retry Rules

The feature transaction writes its authoritative state, League Activity, and
outbox evidence in the same immediate SQLite transaction. A late insert failure
rolls back every row. Publishing begins only after commit. Claim, failure,
retry, and success update only the outbox row and external invalidation effect;
they never rerun the auction or trade command. Replaying a completed feature
command or a published outbox occurrence creates no duplicate activity,
notification, transaction, or transfer.

# Verification

Focused automated tests must prove:

* every approved auction and trade transaction creates the correct safe
  activity and outbox evidence atomically;
* completed-trade activity covers every approved typed asset and excludes
  matchup and standings effects;
* cross-league and non-member activity reads fail without changing storage;
* active bid values and private proposal information do not leak;
* notification list is byte-for-byte read-only and owner-scoped;
* marking one or all notifications read is explicit, idempotent, and cannot
  affect another user;
* outbox claim, retry, interrupted recovery, and publish are deterministic and
  do not duplicate or re-enter the feature transaction;
* a late activity or outbox failure rolls back the whole feature write;
* target routes and runtime composition enforce authentication, CSRF on writes,
  exact input, and stable error mapping; and
* the complete backend suite, JavaScript syntax checks, protected source hashes,
  process-leak check, and database-artifact check pass.

# Completion Gate

M5-09 is complete when the focused verification above passes, the full backend
suite and syntax checks remain green, the protected Season 1 source and reset
manifest hashes are unchanged, no temporary database or process remains, and
the verified result is recorded before M5-10 becomes active.
