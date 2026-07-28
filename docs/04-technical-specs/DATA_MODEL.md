# Hundo Leago - Data Model

## Document Status

`APPROVED`

This technical specification consolidates:

* approved stable-identifier, league-isolation, season, permission, roster, contract, transaction, matchup, standings, history, and recovery requirements;
* the current file-backed JSON shapes that must be migrated safely;
* the approved normalized SQLite target model;
* approved identity, time, money, versioning, constraint, history, and deletion conventions;
* technical decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the technical data-model decisions and approved adoption of the resulting design on 2026-07-18.

---

## Technical Purpose

Hundo Leago needs one relational model that can preserve league truth across a complete season while preventing:

* cross-league relationships;
* duplicate player ownership;
* duplicate processing;
* name-based authorization;
* partial trades, auctions, rollovers, or corrections;
* floating-point monetary drift;
* matchup and standings history loss;
* hidden mutation during reads;
* unsafe JSON replacement.

This document defines the logical target model. Exact SQLite DDL and migration scripts belong in SQLite Migration.

---

## Out of Scope

This document does not define:

* exact REST or Socket.IO payloads;
* exact SQL migration files;
* exact indexes chosen from measured query plans;
* password hashing algorithms;
* encryption or secret-storage configuration;
* backup schedules and retention;
* analytics, billing, or commercial multi-tenancy.

---

# Part 1 - Authority and Current Data

## Source Documents

```text
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/
docs/04-technical-specs/ARCHITECTURE.md
```

Approved business rules remain authoritative. The schema must support them without inventing new league rules.

---

## Current Sources

Current backend persistence includes:

```text
league-state.json
players.json
stats-cache.json
backups/*.json
snapshots/*.json
```

The current league state contains nested teams, rosters, bids, trades, activity, matchup locks, baselines, results, settings, and job markers.

Current JSON keys and nesting are migration evidence, not the target relational design.

---

## Migration Safety

This data model does not authorize migration or reset.

Before SQLite cutover:

* migration input is copied and hashed;
* a verified rollback point exists;
* current record and monetary totals are inventoried;
* ambiguous name-only records are reported rather than guessed;
* protected player IDs are preserved;
* staging migration succeeds;
* the approved reset list and protected-data list are applied exactly.

---

# Part 2 - Global Conventions

## Stable Internal IDs

The model uses backend-generated UUID strings for internal primary keys.

Examples include:

* user ID;
* league ID;
* season ID;
* membership ID;
* team ID;
* contract ID;
* trade ID;
* matchup ID;
* activity ID.

IDs are opaque. Frontend code must not derive meaning from their format.

---

## External IDs

Provider-owned identifiers are stored separately from internal IDs.

For example:

```text
players.id                  internal Hundo Leago player ID
player_external_ids.value  external provider player ID
```

External identifiers are stored as text so the model does not assume every provider uses a numeric key.

---

## League Scope

Every league-specific mutable table includes `league_id`, even when the relationship could also be reached indirectly.

Cross-league references use composite validation or equivalent constraints so a record from League A cannot reference a team, season, contract, pick, matchup, or asset from League B.

Global tables such as users, players, schema migrations, and provider definitions do not require `league_id`.

---

## Season Scope

Season-dependent records include `season_id`.

Each season belongs to exactly one league.

The model distinguishes:

* product season label;
* NHL source season;
* league season;
* lifecycle status;
* start and end boundaries.

Completed season data remains queryable and is not overwritten by creating the next season.

---

## Timestamps

The database stores event timestamps as integer Unix milliseconds in UTC.

League timezone is stored as an IANA timezone name, with `America/Vancouver` used for the original league.

Display formatting and calendar-boundary calculation use the stored timezone rather than the server's local timezone.

---

## Money

All monetary values are stored as integer cents.

Examples:

```text
$1.00   -> 100
$1.50   -> 150
$100.00 -> 10000
```

This applies to:

* total contract value;
* AAV;
* auction bid value;
* retained AAV;
* buyout penalty;
* cap limit;
* cap totals.

The backend converts to user-facing decimal values at the API boundary.

---

## Fantasy Points

Persisted fantasy-point totals use integer hundredths.

Examples:

```text
1 goal   -> 125
1 assist -> 100
```

Raw goals, assists, NHL points, and games played remain integers.

---

## Booleans and Statuses

SQLite booleans use constrained integer values:

```text
0 = false
1 = true
```

Statuses use documented text values with database checks where practical.

Unknown status text is not silently converted into a default valid state.

---

## Record Metadata

Mutable aggregate roots include:

* `created_at`;
* `updated_at`;
* `version`.

Actor-owned writes also preserve `created_by_user_id` or the applicable event actor.

Version starts at `1` and increments only after an authoritative mutation.

---

## JSON Columns

Core relationships, ownership, money, permissions, and statuses are normalized columns and foreign keys.

JSON columns may be used only for:

* provider payload fragments retained for diagnostics;
* immutable before/after snapshots;
* non-authoritative display metadata;
* job result details;
* explicitly versioned feature metadata that does not replace relational constraints.

---

# Part 3 - Schema and Migration Metadata

## `schema_migrations`

Records each applied migration:

* migration ID;
* name;
* checksum;
* applied timestamp;
* application build or version;
* execution duration;
* success state when safely recordable.

A changed checksum for an already-applied migration is an error.

---

## `application_metadata`

Stores limited database-wide values such as:

* data-model version;
* migration source identifier;
* migration completion marker;
* environment identity;
* database creation timestamp.

It does not store league settings or secrets.

---

# Part 4 - Accounts, Leagues, and Teams

## Account Tables

| Table | Purpose | Important relationships |
| --- | --- | --- |
| `users` | Stable account identity and lifecycle | Global |
| `user_credentials` | Password hash and credential metadata | One active row per user |
| `sessions` | Backend-managed authenticated sessions | User |
| `platform_roles` | Explicit platform-administrator authority | User |
| `account_events` | Security and lifecycle history | User and actor |

---

## `users`

Fields include:

* `id`;
* `email_normalized`;
* `email_display`;
* `display_name`;
* `status`;
* `created_at`;
* `updated_at`;
* `version`.

Normalized email is unique across the platform.

Account deactivation changes status and revokes sessions; it does not silently delete league history.

---

## Credentials and Sessions

`user_credentials` is separated from display identity so normal user queries do not select password hashes.

`sessions` stores:

* opaque session ID or hashed session secret reference;
* user ID;
* created, last-used, and expiry timestamps;
* revoked timestamp and reason;
* safe client metadata where approved.

The initial model permits only one active session per user.

---

## League Tables

| Table | Purpose |
| --- | --- |
| `leagues` | Stable league identity and lifecycle |
| `league_settings` | Approved fixed and setup-time values |
| `seasons` | Historical and current league seasons |
| `league_memberships` | User access to one league |
| `league_invitations` | Invitation and acceptance lifecycle |
| `teams` | Stable team identity and profile |
| `team_manager_assignments` | Current and historical team control |
| `team_events` | Team identity and lifecycle changes |

---

## `leagues`

Fields include:

* `id`;
* `name`;
* `name_normalized`;
* `status`;
* `timezone`;
* `commissioner_membership_id`;
* `current_season_id`;
* `created_at`;
* `updated_at`;
* `version`.

League name is unique platform-wide under the approved initial product rule.

Exactly one active league membership is referenced as commissioner for an operational league.

---

## `league_settings`

Explicit fields include:

* salary-cap cents;
* trade-deadline timestamp;
* maximum teams;
* active forward slots;
* active defence slots;
* bench slots and maximum bench AAV;
* injured-reserve slots;
* prospect-slot policy;
* scoring-rule version;
* standings-rule version.

The table stores settings even when commissioners cannot edit them.

Material setting history uses explicit versioned records or season configuration rather than overwriting historical interpretation.

---

## `seasons`

Fields include:

* `id`;
* `league_id`;
* `label`;
* `nhl_season_key`;
* `status`;
* regular-season start and end;
* fantasy playoff start and end;
* nullable Free Agent Draft completion timestamp controlling seasonal auction reopening;
* `created_at`;
* `updated_at`;
* `version`.

One league may have only one current active season.

---

## Memberships

`league_memberships` connects one user to one league.

Fields include:

* membership ID;
* league ID;
* user ID;
* status;
* joined and ended timestamps;
* membership permission category when required;
* version.

A user has at most one current membership row per league.

Platform-administrator authority remains separate from league membership.

---

## Teams and Manager Assignments

`teams` stores:

* stable ID;
* league ID;
* current display name and normalized name;
* status;
* approved pattern-template ID;
* primary and secondary colours plus an optional tertiary colour;
* logo object key or URL;
* created and updated timestamps;
* version.

Team names are case-insensitively unique inside one league.

For target team-profile writes, colours use canonical lowercase six-digit
sRGB hex strings in the form `#rrggbb`. Primary and secondary are null
together while a newly created team profile is incomplete, or both contain
canonical values. `teams.pattern_template` stores one approved template ID and
determines the required colour count. Tertiary is null for a two-colour
template and contains a canonical value for a three-colour template. The
colours do not need to differ and have no league-uniqueness or contrast
constraint.

The approved template IDs are:

* even splits: `even-two`, `even-three`;
* hockey stripes: `wide-centre-stripe`, `thin-centre-stripe`,
  `triple-pinstripe`, `double-accent-bands`, `angular-peak`,
  `mirrored-centre-band`, `offset-outlined-stack`, `layered-six-band`,
  `alternating-ladder`, `double-hairline`, `double-light-top-accent`,
  `layered-monochrome`, `split-colour-block`, `two-tone-stack`,
  `outlined-block`, `layered-contrast`, `mirrored-seven-band`,
  `accent-line-band`, `outlined-centre`, `two-stage-contrast`, and
  `layered-double-light`;
* decorative patterns: `tiger`, `leopard`, `cowhide`, `camouflage`,
  `snake-scales`, `honeycomb`, `checkerboard`, `argyle`, `chevrons`,
  `ocean-waves`, `two-colour-gradient`, and `three-colour-gradient`.

Existing two-colour teams migrate to `even-two`; existing teams with a
tertiary colour migrate to `even-three`.

`teams.logo_reference` is null or a backend-generated stable UUID that refers
to a current `team_logo_objects` row. Raw bytes, data URLs, client filenames,
filesystem paths, and third-party URLs are never stored in `teams`.

`team_logo_objects` stores:

* a backend-generated stable UUID object key;
* league and team IDs with a same-league team foreign key;
* one allowlisted media type: PNG, JPEG, or WebP;
* decoded byte length, width, and height;
* lowercase SHA-256 content digest;
* the inspected binary content as a SQLite BLOB;
* creation timestamp.

Target logo objects contain at most `524288` decoded bytes, have dimensions
from `1` through `2048` pixels on each axis, and are static raster content.
Animated PNG or WebP, GIF, SVG, HTML, and unrecognized content are rejected.

Profile mutation inserts a replacement object, updates the team reference,
deletes the former object, changes the team version, and writes required audit
and idempotency evidence in one immediate SQLite transaction. A failed write
therefore leaves neither an orphan replacement nor a missing current object.
Existing pre-target non-null logo references remain migration-compatible but
are not accepted as new target writes and do not resolve through the target
logo-object reader.

`team_manager_assignments` stores assignment history with:

* team;
* user;
* membership;
* assigned, accepted, and ended timestamps;
* assigning actor;
* status.

A team has at most one active accepted manager assignment. One user may manage more than one team.

---

# Part 5 - Players, Ownership, and Rosters

## Player Tables

| Table | Purpose |
| --- | --- |
| `players` | Global Hundo Leago player identity |
| `player_external_ids` | Provider-specific stable identifiers |
| `player_names` | Optional aliases and historical names |
| `player_source_state` | Current normalized provider attributes |
| `league_player_positions` | Explicit league-specific position correction |
| `player_ownerships` | One current league ownership state |
| `ownership_events` | Append-only ownership and roster history |

---

## `players`

Fields include:

* internal stable ID;
* canonical first, last, and full name;
* birth date when available;
* global active or historical state;
* created and updated timestamps.

Names and NHL teams are mutable display attributes and are never ownership keys.

---

## League Position

Imported source positions are normalized to F or D.

`league_player_positions` stores an explicit commissioner correction for one player in one league without changing the global provider record.

There is at most one current Hundo Leago position per league and player.

---

## `player_ownerships`

The table is the single current ownership record for a player inside one league.

Fields include:

* ownership ID;
* league, season, player, and team IDs;
* ownership kind: `Rostered` or `Prospect Right`;
* roster category: `Active`, `Bench`, `Injured Reserve`, or `Prospect`;
* position group;
* slot number when applicable;
* informational trade-block flag;
* acquired transaction type and ID;
* created and updated timestamps;
* version.

A unique constraint on league and player prevents two teams in the same league from owning the same player or right.

No ownership row means the player is unowned in that league, subject to feature-specific eligibility.

The trade-block flag has no transaction or approval effect. It clears
automatically when the ownership moves to another team.

An auction winner is normally assigned to the first available finite Active
slot for the player's effective F/D position. If every such slot is occupied,
the approved atomic auction completion may persist one explicitly unplaced
Active row with `slot_number = NULL` and
`acquired_transaction_type = auction_resolution`.

An approved transaction or explicitly confirmed ordinary roster move may also
leave an Active, Bench, or injured-reserve ownership unplaced when no finite
destination slot is available. In that case `slot_number = NULL` records the
authoritative temporary illegal state. `acquired_transaction_type` remains
immutable acquisition history and does not determine whether a later
confirmed roster overage may be represented. Prospect ownership remains
slotless by definition.

---

## Slots

Only occupied slots create ownership rows.

Slot constraints are:

* Active F: slots 1 through 12;
* Active D: slots 1 through 6;
* Bench: slots 1 through 4;
* Injured Reserve: slots 1 through 4;
* Prospect: no slot number.

An explicitly unplaced normal-roster ownership is surfaced separately by
roster projections and makes structural roster legality false; it is not
presented as occupying a finite slot.

Unique team/category/position/slot constraints prevent two players from occupying one finite slot.

Empty roster slots require no placeholder player records.

---

## Ownership History

`ownership_events` is append-only and records:

* acquisition;
* roster-category movement;
* prospect signing or decline;
* release;
* trade;
* auction;
* draft selection;
* buyout;
* contract expiration;
* commissioner correction.

`ownership_id` is a stable historical reference, not a foreign key to the
current-state `player_ownerships` table. A confirmed release removes the current
ownership row while every prior event retains the released ownership ID. League,
season, player, team, and actor relationships remain foreign-key constrained.

Matchup scoring eligibility does not read current ownership after lock; it reads persisted matchup lock rows.

---

# Part 6 - Contracts and Cap Obligations

## Contract Tables

| Table | Purpose |
| --- | --- |
| `contracts` | Stable contract identity and original terms immutable outside explicit commissioner correction |
| `contract_years` | Per-season contract schedule |
| `contract_events` | Creation, transfer, expiration, and correction history |
| `retention_obligations` | Stable retained-AAV obligation |
| `retention_years` | Per-season retained cap schedule |
| `buyout_obligations` | Stable buyout penalty |
| `buyout_years` | Per-season buyout cap schedule |

---

## `contracts`

Fields include:

* contract ID;
* league and player;
* current owning team;
* contract type: normal or fantasy ELC;
* original total value cents;
* original term years;
* AAV cents;
* start season;
* status;
* acquisition source type and ID;
* auction buyout-lock expiry;
* created and updated timestamps;
* version.

Original value, term, start season, and AAV do not change during ordinary
transactions. An explicit, permission-checked commissioner correction may
replace those values atomically when it preserves the approved total, term,
AAV, contract-year, cap, correction-history, and League Activity invariants.

Original total value and rounded AAV are related but independently preserved.
AAV is calculated from integer cents as original total divided by original term
and rounded to the nearest cent. Therefore a three-year `$10.00` contract stores
`1000` original-total cents and `333` AAV cents; the one-cent multiplication
difference is an approved rounding consequence and does not rewrite the total.

A trade changes the current owning team without restarting or extending the contract.

---

## `contract_years`

One row represents one contract season.

Fields include:

* contract;
* league season;
* year number;
* AAV cents;
* status: future, current, completed, expired, or eliminated;
* rollover timestamp.

The schedule makes current-year inclusion and end-of-season expiration explicit.

---

## Retention

`retention_obligations` stores:

* underlying contract;
* player;
* originating team;
* current responsible team;
* retained AAV cents;
* creation trade;
* status;
* version.

`retention_years` stores the obligation amount for each affected season.

Trading a whole retention obligation changes the responsible team without changing its amount or schedule.

Retention continues when the underlying player is bought out.

---

## Buyout Penalties

`buyout_obligations` stores:

* eliminated contract;
* player;
* originating team;
* current responsible team;
* annual penalty basis;
* buyout transaction;
* status;
* version.

`buyout_years` stores the exact 25% full-underlying-AAV penalty for each remaining contract season.

Trading a whole buyout obligation changes the responsible team without changing its annual amount or schedule.

---

# Part 7 - Auctions

## Auction Tables

| Table | Purpose |
| --- | --- |
| `auctions` | One player auction lifecycle |
| `auction_bids` | One team's private active or resolved bid |
| `auction_events` | Start, edit, removal, resolution, and recovery history |
| `auction_resolutions` | Durable authoritative outcome |

---

## `auctions`

Fields include:

* auction ID;
* league and season;
* player;
* status;
* opened and resolution timestamps;
* opening actor;
* version.

Only one active auction may exist for a player in one league.

---

## `auction_bids`

Fields include:

* bid ID;
* auction, league, season, team, and submitting user;
* total value cents;
* term years;
* lowest valid offered AAV cents, preserved across later edits for anti-bluff
  resolution pricing;
* first-submission timestamp;
* last-edit timestamp;
* edit count;
* status;
* idempotency reference;
* version.

One team has at most one current bid per auction. Bid edits preserve the stable
bid ID and first-submission timestamp. Commissioner replacements do not consume
the manager edit count.

Active bid values and terms remain stored but are returned only to the bid owner through authorized queries. Commissioner access does not reveal competing values.

The original `auction_started` or `bid_submitted` event preserves the submitting
actor, membership, authority category, and occurrence time used to revalidate
historical submission authority during resolution. Later membership or manager-
assignment termination does not invalidate authority that was valid when the
bid was first submitted; missing, mismatched, or corrupt evidence makes that bid
ineligible.

---

## Resolution

`auction_resolutions` records:

* scheduled occurrence;
* explicit winner, no-winner, player-unavailable, or season-closed outcome;
* winning team and bid;
* anti-bluff price inputs, winning term, final contract value, and final AAV;
* created contract and ownership;
* durable general-illegality flag and warning evidence;
* resolution timestamp;
* automatic or commissioner-triggered actor;
* idempotency key;
* status.

M5-04 saves the full resolution as one immediate, league-scoped transaction.
The transaction re-reads the auction, season, player availability, current
bids, and historical submission authority before consuming the M5-03
deterministic decision. A winner creates one rounded-AAV contract, the required
contract years, one ownership and Active assignment, legality evidence, auction
and ownership history, one authenticated League Activity signing, and one
metadata-only outbox invalidation. No-winner and automatic cancellation create
the authoritative resolution, auction history, terminal auction/bid states,
and invalidation without a contract, ownership, or signing activity row.

One-, two-, and three-year winning terms reuse matching future league seasons
when present. Otherwise the same transaction creates only the next one or two
required `planned` seasons with no dates and does not change the league's
current season or activate a future season.

The scheduled occurrence and auction each remain unique. An exact replay
returns the already-persisted successful outcome without duplicating any row or
publication. Any later failure, including activity or outbox persistence,
rolls the entire completion back.

---

# Part 8 - Trades

## Trade Tables

| Table | Purpose |
| --- | --- |
| `trades` | Two-team proposal lifecycle |
| `trade_assets` | Typed proposed transfer in one direction |
| `trade_events` | Proposal, response, cancellation, completion, reversal, and correction |
| `future_considerations` | Stable outstanding future obligation |

---

## `trades`

Fields include:

* trade ID;
* league and season;
* proposing and receiving teams;
* proposing user;
* creating membership and manager-or-commissioner authority;
* status;
* created and expires timestamps;
* persisted effective acceptance deadline;
* responded and completed timestamps;
* commissioner-completion reference;
* proposal model version;
* version.

Proposals do not reserve assets.

The completed `M5-05` foundation keeps proposal evaluation and authenticated
league-member history reads SELECT-only. It derives current proposing-manager
or league-commissioner authority from active membership and assignment records,
opens trading from the current season's ready, active, or completed Entry Draft
start, and treats the configured league trade deadline as closed at the exact
stored instant. A generated preview identity is explicitly non-persisted and
does not create a `trades`, `trade_assets`, or `trade_events` row.

The completed `M5-06` typed-asset step persists the pending proposal, at least
one valid owned asset from each team, immutable proposal display snapshots, the
effective acceptance-deadline snapshot, the creation event, and the completed
idempotency result atomically. Legacy imported rows remain model version 1 with
unknown creating membership, authority, and effective-deadline evidence; every
new target proposal is complete model version 2. Proposal creation still
reserves or transfers nothing.

The completed `M5-07` lifecycle step uses the existing `trades`,
`trade_events`, `idempotency_requests`, and durable `job_runs` records without
a schema migration. Receiver rejection, proposer cancellation, explicit
commissioner action, and exact-deadline expiry are pending-only terminal
transitions with append-only evidence. The expiry job uses one stable occurrence
per proposal and effective deadline; authenticated reads never expire or repair
a proposal.

Acceptance preflight is also SELECT-only. It re-reads current actor authority,
proposal version and deadline, every persisted typed asset, current contract and
ownership evidence, current-season cap obligations, roster counts and finite
slots, and retention limits. It returns both proposal-time and current snapshots,
resulting team previews, and one approved general-illegality flag without
changing any row.

The completed `M5-08` execution step repeats those checks inside one immediate
transaction. It moves the proposal directly from storage `proposed` to
`completed`; transfers rostered ownership and its active contract, prospect
rights and any fantasy ELC, unused draft-pick ownership, whole retention and
buyout obligations, and existing Future Considerations without changing their
underlying terms; creates approved requested-retention schedules and new Future
Considerations; appends typed history; and automatically cancels other pending
proposals made stale by the transferred asset identities. A generally illegal
normal roster may persist a null finite slot; the ownership remains explicit
and requires a later normal roster move. Exact idempotent replay changes no
row.

---

## `trade_assets`

Each row identifies:

* trade;
* direction;
* source and destination teams;
* asset type;
* exactly one typed asset reference or approved requested retention instruction;
* immutable proposal snapshot metadata needed for display;
* asset model version;
* sequence.

Approved asset types include:

* player and contract;
* prospect right;
* draft pick;
* retention obligation;
* buyout obligation;
* Future Considerations.

Database checks and service validation ensure exactly one valid asset reference
or explicit Future Considerations instruction and same-league ownership. New
model-version-2 assets require a non-empty valid JSON snapshot. A requested-
retention row links the exact included outgoing contract and amount; the amount
does not consume a retention slot until acceptance. Existing whole obligations
and new requested instructions remain distinct asset identities.

---

## Trade Completion

The completed `M5-08` work revalidates every asset inside one immediate
transaction and saves:

* transfers;
* contract ownership;
* new retention obligations;
* obligation transfers;
* Future Considerations;
* proposal status;
* automatic cancellation of conflicting proposals;
* typed completion and automatic-cancellation history.

All changes occur in one transaction.

The completed `M5-09` work adds approved League Activity and transactional
outbox records to successful auction and trade transaction boundaries,
composes authenticated read-only activity and notification queries plus
explicit notification-read commands, and publishes league invalidations after
commit through a bounded retry-safe worker.
Auction and trade status remains the in-app notification surface for those
features; no separate email, push, or trade-notification row is required.

The active `M5-10` work uses completed model-version-2 trade snapshots and
append-only execution history to preview exact post-trade recoverability. A
safe commissioner reversal returns every transferred asset and category,
removes only obligations created by that trade, restores transferred
obligation responsibility, and appends reversal, correction-index, activity,
and outbox evidence atomically. An unsafe reversal transfers nothing; an
explicit separate command may mark the trade `correction_required` and index
the recovery need without providing arbitrary row editing.

---

# Part 9 - Entry Draft

## Deferred Implementation Boundary

Entry Draft tables are part of the target model but are not required for the initial Season 2 launch.

They may be implemented during the season using the approved lottery and player-eligibility rules in `ENTRY_DRAFT.md`, but the complete feature must be verified before the first Season 2 Entry Draft is used.

---

## Draft Tables

| Table | Purpose |
| --- | --- |
| `entry_drafts` | Draft setup and lifecycle |
| `draft_lottery_runs` | One immutable lottery execution |
| `draft_lottery_results` | Ordered lottery outcome |
| `draft_eligibility_snapshots` | Confirmed eligible-pool identity and source |
| `draft_eligible_players` | Immutable players in one eligibility snapshot |
| `draft_picks` | Stable current and future pick asset |
| `draft_pick_ownership_events` | Complete pick ownership history |
| `draft_selections` | Immutable manual or automatic selection |
| `draft_queue_items` | Private manager ordering |
| `draft_events` | Operational history |

---

## Draft Picks

`draft_picks` stores:

* stable ID;
* league and target season;
* round and position;
* original team;
* current owning team;
* status: unused, used, or forfeited;
* selection ID when used;
* version.

A unique constraint prevents duplicate round/position picks in one draft.

Picks are created for the current draft and following three drafts.

---

## Lottery Records

`draft_lottery_runs` stores:

* draft, league, and season;
* official standings source version;
* algorithm version;
* participant count;
* commissioner actor and confirmation;
* secure-random audit inputs;
* committed timestamp;
* immutable status.

`draft_lottery_results` stores each original team, current pick owner, reverse-standings position, integer weight, draw order when selected, and final draft position.

The champion and losing finalist retain their fixed final positions and are not lottery participants.

---

## Eligibility Snapshot

`draft_eligibility_snapshots` stores the source NHL Entry Draft identity, imported source version, confirmation actor, and confirmation time.

`draft_eligible_players` stores each eligible canonical player, eligibility reason, NHL draft year and selection metadata when applicable, or prior-year rights-release reference.

Goalies and players without a valid F or D normalization cannot enter the confirmed snapshot.

Post-confirmation source corrections create a new versioned eligibility snapshot and never silently rewrite the prior snapshot.

---

## Selections and Queues

`draft_selections` stores:

* draft and pick;
* player;
* selecting team;
* manual, commissioner, or automatic-timeout source;
* actor when applicable;
* timestamp.

One pick and one league player may appear in at most one selection for that draft.

Selection rows are immutable.

`draft_queue_items` is private to one user, team, league, and draft and stores ordered eligible players.

---

# Part 10 - Player Statistics

## Statistics Tables

| Table | Purpose |
| --- | --- |
| `stat_sources` | External-provider identity |
| `stat_refreshes` | Import attempt and freshness history |
| `player_stat_totals` | Latest or source-season normalized totals |
| `stat_snapshots` | Immutable scoring snapshot metadata |
| `stat_snapshot_players` | Player totals captured in one snapshot |

---

## Source Totals

`player_stat_totals` stores normalized:

* NHL source season;
* player;
* games played;
* goals;
* assists;
* NHL points;
* calculated FP hundredths;
* source version or timestamp;
* refresh ID.

Failed refreshes do not overwrite the last valid totals.

---

## Snapshots

A stat snapshot records:

* snapshot ID;
* source refresh;
* captured timestamp;
* intended scoring use;
* league and week when applicable;
* completeness and freshness state.

Snapshot player rows are immutable after the snapshot is committed.

---

# Part 11 - Matchups and Standings

## Matchup Tables

| Table | Purpose |
| --- | --- |
| `matchup_weeks` | Authoritative weekly boundaries and state |
| `matchups` | Two-team pairing |
| `matchup_byes` | Explicit team bye assignment |
| `matchup_roster_locks` | One team's normal or late lock |
| `matchup_roster_players` | Immutable scoring-eligible players |
| `matchup_results` | Stable result identity and official version pointer |
| `matchup_result_versions` | Append-only calculated or corrected outcome |
| `matchup_operations` | Finalization, retry, correction, and rollover history |

---

## Weeks and Pairings

`matchup_weeks` stores:

* league and season;
* stable week ID and sequence;
* start, baseline, lock, end, and rollover timestamps;
* status;
* version.

`matchups` references two different teams from the same league and season.

A team may have at most one matchup or bye in one week.

---

## Roster Locks

`matchup_roster_locks` stores:

* team and week;
* normal or late lock type;
* legal state;
* lock timestamp;
* baseline snapshot;
* source freshness state;
* version.

`matchup_roster_players` stores each locked player and the relevant baseline values.

Later normal roster changes never update these rows.

---

## Result Versions

`matchup_results` supplies stable identity and points to the current official version.

`matchup_result_versions` stores:

* team scores in FP hundredths;
* win, loss, or tie;
* source snapshot;
* calculated or correction source;
* actor and optional reason;
* timestamp;
* superseded version relationship.

No correction overwrites the prior result version.

---

## Standings

Current standings are derived from official finalized regular-season matchup result versions.

Standings persistence uses:

| Table | Purpose |
| --- | --- |
| `standings_snapshots` | Versioned season calculation or completed-season snapshot |
| `standings_rows` | Team values and official rank in one snapshot |
| `standings_operations` | Rebuild and correction-propagation history |

Standings tables do not become an independently editable source of wins, points, or rank.

---

# Part 12 - Activity, Notifications, and Operations

## History Tables

| Table | Purpose |
| --- | --- |
| `league_activity` | Authenticated league transaction history |
| `notifications` | In-app user notifications |
| `commissioner_corrections` | Searchable cross-feature correction index |
| `administrator_requests` | Protected approval workflow |
| `league_freezes` | Freeze and reopen history |
| `operational_events` | Jobs, failures, retries, and recovery |

---

## League Activity

`league_activity` stores:

* activity ID;
* league and season;
* event type;
* actor and authority;
* affected team, player, or transaction references;
* safe display summary;
* optional reason;
* timestamp;
* immutable versioned metadata when needed.

Matchup and standings operations do not create League Activity rows.

Entry Draft activity contains only draft start, lottery results, and draft completion.

---

## Notifications

`notifications` stores:

* user and league;
* event type;
* safe message data;
* created timestamp;
* read timestamp;
* related feature and record;
* delivery state.

In-app notification reads use an explicit write to mark a notification read; merely listing notifications does not mutate them.

---

## Commissioner and Administrator Operations

`commissioner_corrections` indexes feature-specific corrections without replacing detailed feature history.

`administrator_requests` stores:

* request type;
* requesting commissioner;
* reviewing administrator;
* affected league and records;
* preview reference;
* requested, reviewed, and completed timestamps;
* status and optional reason.

Protected operations include team erase and restoration approval.

---

# Part 13 - Reliability Tables

## Reliability Tables

| Table | Purpose |
| --- | --- |
| `idempotency_requests` | Duplicate-write protection |
| `job_runs` | Durable scheduled and manual job execution |
| `outbox_events` | Post-commit Socket.IO and notification publication |
| `backup_catalog` | Verified backup metadata |
| `migration_reports` | Import counts, totals, warnings, and verification |

---

## Idempotency

`idempotency_requests` is scoped by:

* actor;
* league;
* operation;
* client key.

It stores request hash, status, result reference, and expiry.

Reusing a key for a different request is an error.

---

## Job Runs

`job_runs` stores one logical scheduled occurrence and its attempts.

A unique occurrence key and lease fields prevent duplicate processing after restart or deployment overlap.

For target auction resolution, the occurrence is scoped by league, job type,
auction, and due instant. A worker may reclaim an expired or failed lease while
preserving the stable run row and incrementing its attempt count. A succeeded
occurrence is replay-safe after restart. Stored success metadata contains only
the auction ID and coarse completion outcome; failures store only a sanitized
error code.

M5-03 permits the resolution coordinator to write only this `job_runs` state.
It may mark success only after an injected atomic completion service confirms a
completed `resolved`, `no_winner`, or `cancelled` outcome. The coordinator is
not scheduled or started by the target runtime in M5-03.

---

## Transactional Outbox

The `outbox_events` table records post-commit work in the same transaction as the feature change.

After commit, a publisher sends Socket.IO invalidations and creates or dispatches approved notifications.

Published rows retain outcome and retry metadata.

This prevents a committed write from being permanently invisible only because the process stopped before emitting an event.

---

# Part 14 - Constraints and Indexing

## Required Constraint Categories

The schema must enforce, where applicable:

* foreign keys;
* same-league composite relationships;
* unique normalized emails;
* unique league and team names under approved scope;
* one active commissioner per league;
* one active membership per user and league;
* one active manager per team;
* one current owner per league and player;
* one finite roster slot occupant;
* one active contract per league and player;
* valid contract term and monetary precision;
* retention and buyout schedules;
* one active auction per league and player;
* one current bid per team and auction;
* two different teams per trade and matchup;
* one matchup or bye per team and week;
* one draft selection per pick;
* immutable result and selection versions;
* valid status and boolean values.

Service validation remains necessary for rules that cannot be expressed safely as local database constraints.

---

## Indexing

Every league-scoped query path begins with an index containing `league_id`.

Likely indexes include:

* membership by user and league;
* teams by league;
* ownership by league, team, category, and player;
* current contracts and cap obligations by league and team;
* active auctions and bids by league;
* pending trades by team and expiry;
* draft picks by draft and owner;
* matchup weeks and results by season;
* unread notifications by user;
* activity by league and timestamp;
* due jobs by status and scheduled time.

Final indexes must be verified against actual query plans.

---

# Part 15 - Lifecycle and Deletion

## Normal Lifecycle

Users, memberships, leagues, seasons, contracts, transactions, and operations use explicit statuses rather than generic hidden soft-delete flags.

Completed historical records remain queryable unless an approved destructive product workflow says they are erased.

---

## Team Erase

The approved team erase:

* is allowed only after the Entry Draft and before the Free Agent Draft;
* requires commissioner confirmation and administrator approval;
* removes the team and its approved dependent league records;
* releases players and removes contracts and obligations as defined by the product specification;
* erases team matchup, standings, transaction, and team history;
* preserves one league-level administrative record identifying the erase.

The implementation uses an explicit service transaction rather than relying on an unreviewed generic cascade.

---

## League Deletion

Approved permanent league deletion uses a dedicated administrator operation that:

* identifies affected records;
* confirms the operating-mode boundary;
* writes the required external administrative audit evidence;
* deletes league-scoped rows in a controlled transaction;
* does not delete global users or players merely because they were referenced by the league.

---

## Account Deactivation

Account deactivation:

* revokes sessions;
* blocks new access;
* triggers the approved commissioner and manager continuity workflows;
* preserves attributable historical actor IDs.

The initial model does not hard-delete a user account through normal self-service.

---

# Part 16 - Migration Verification

Migration reports must compare:

* source file hashes;
* schema version;
* users, leagues, teams, and players;
* roster ownership by team and category;
* contract counts and total/AAV values;
* retention and buyout obligations;
* auctions, bids, trades, and activity;
* draft assets when present;
* matchup weeks, locks, baselines, and results;
* standings inputs and snapshots;
* orphan, duplicate, and ambiguous records;
* totals before and after migration.

Migration fails rather than guesses when:

* a player lacks a stable mapping;
* two teams appear to own one league player;
* name-only references are ambiguous;
* money cannot be represented under approved rounding;
* cross-league ownership would result;
* required relationships are missing.

---

# Part 17 - Required Testing

Data-model tests must cover:

* migration on copied current JSON;
* empty local and populated staging databases;
* foreign-key and same-league rejection;
* duplicate email, membership, commissioner, manager, ownership, contract, slot, auction, bid, matchup, pick, and selection rejection;
* money and FP integer conversion;
* contract, retention, and buyout year schedules;
* atomic auction, trade, buyout, correction, and rollover transactions;
* immutable activity, draft selection, stat snapshot, and result-version history;
* session revocation and membership deactivation;
* team erase and league deletion boundaries;
* stale-version and idempotency conflicts;
* scheduled-job occurrence leases;
* outbox retry;
* read-only query proof;
* multi-league isolation with identical display names and player pools;
* backup, restore, integrity check, and migration rollback.

---

# Part 18 - Approval Checklist

## Inherited Approved Constraints

- [x] SQLite becomes authoritative for mutable Season 2 league data.
- [x] Stable IDs, not names, define relationships.
- [x] Every league-specific record belongs to the correct league.
- [x] Historical seasons remain available.
- [x] Users, memberships, teams, players, contracts, transactions, matchups, and history require durable identities.
- [x] Money supports two decimal places and approved rounding.
- [x] Multi-record transactions save atomically.
- [x] Read-only requests never seed, migrate, normalize-and-save, or repair data.
- [x] Existing JSON is preserved through an approved migration and rollback process.
- [x] Matchup and standings history remains outside League Activity.
- [x] Entry Draft selections are immutable.
- [x] Team and league destructive actions follow their approved authorization and consequences.

## Approved Data Model Decisions

- [x] Internal primary keys use backend-generated UUID strings.
- [x] External provider IDs are stored separately as text.
- [x] Every league-specific mutable table includes `league_id`.
- [x] Same-league relationships are enforced with composite constraints or an equivalent database guarantee.
- [x] Season-dependent records include `season_id`.
- [x] One league has at most one current active season.
- [x] Event timestamps are stored as UTC Unix milliseconds.
- [x] League timezones use IANA names.
- [x] All money is stored as integer cents.
- [x] Persisted fantasy points are stored as integer hundredths.
- [x] Booleans use constrained `0` and `1`.
- [x] Statuses use documented text with database checks where practical.
- [x] Mutable aggregate roots use `created_at`, `updated_at`, and integer `version`.
- [x] Core ownership, permission, money, and status relationships are not stored only in JSON columns.
- [x] Applied migrations are immutable and checksum-verified in `schema_migrations`.
- [x] Normal user queries cannot select password hashes because credentials are stored separately.
- [x] Normalized email is platform-wide unique.
- [x] The initial session model permits only one active session per user.
- [x] Platform roles are stored separately from league memberships.
- [x] Each operational league references exactly one active commissioner membership.
- [x] One user has at most one current membership row per league.
- [x] Team names are case-insensitively unique inside a league.
- [x] Manager assignment history is separate from team identity.
- [x] One team has at most one active accepted manager; one user may manage multiple teams.
- [x] League settings use explicit relational fields rather than one unvalidated JSON settings object.
- [x] Material settings and rule versions remain interpretable for historical seasons.
- [x] Global players use internal IDs with separate provider IDs and mutable source-state records.
- [x] League-specific player-position corrections do not overwrite global player source data.
- [x] `player_ownerships` is the single current ownership record for a player in one league.
- [x] A unique league/player constraint prevents duplicate team ownership.
- [x] Finite Active, Bench, and Injured Reserve slots use constrained slot numbers; Prospects have no slot number.
- [x] Empty roster slots have no placeholder player rows.
- [x] Ownership and roster history is append-only in `ownership_events`.
- [x] Contracts preserve immutable original value, term, AAV, and start season.
- [x] Per-season `contract_years` rows make rollover and expiration explicit.
- [x] Retention obligations and their yearly schedules are separate records from contracts.
- [x] Buyout obligations and their yearly schedules are separate records from eliminated contracts.
- [x] Trading a retention or buyout obligation changes its responsible team without changing its schedule.
- [x] Auctions, bids, events, and resolutions use separate tables.
- [x] Active bid secrecy is enforced through authorized queries rather than omitting bid values from storage.
- [x] Trades use a stable proposal row plus typed asset rows and append-only trade events.
- [x] Trade asset rows permit exactly one valid same-league asset reference.
- [x] Future Considerations use stable outstanding-obligation records.
- [x] Entry Draft tables may be implemented during the season using the approved lottery and real-world eligibility rules.
- [x] Lottery runs preserve standings source, algorithm version, integer weights, secure-random audit inputs, draw order, final positions, and current pick owners.
- [x] Draft eligibility uses a confirmed versioned snapshot tied to the most recently completed NHL Entry Draft and approved rights-release re-entry.
- [x] Post-confirmation eligibility corrections create a new snapshot version rather than silently rewriting the confirmed pool.
- [x] Draft picks preserve original team, current owner, target season, round, position, status, and ownership history.
- [x] Draft selections are immutable and private queues are user/team/draft scoped.
- [x] Player statistics store raw integer categories and calculated FP hundredths.
- [x] Failed stat refreshes never overwrite the last valid totals.
- [x] Matchup weeks persist every approved boundary rather than recalculating historical timestamps.
- [x] A team has at most one matchup or bye assignment per week.
- [x] Matchup roster locks and locked players are immutable after creation except through versioned technical recovery.
- [x] Matchup corrections append result versions rather than overwriting prior results.
- [x] Standings are derived from official result versions and may be preserved in versioned snapshots.
- [x] Standings rows cannot be directly edited as independent league truth.
- [x] League Activity, notifications, commissioner corrections, administrator requests, freezes, and operational events use separate tables.
- [x] Listing notifications is read-only; marking one read is an explicit write.
- [x] Entry Draft League Activity contains only draft start, lottery results, and draft completion.
- [x] Idempotency requests are scoped by actor, league, operation, and client key.
- [x] Scheduled job occurrences and attempts are durable database records.
- [x] A transactional outbox records post-commit Socket.IO and notification work.
- [x] Every league-scoped query path has an index beginning with `league_id`.
- [x] Final indexes are confirmed with actual SQLite query plans.
- [x] Lifecycle statuses are explicit; there is no generic hidden soft-delete rule for every table.
- [x] Team erase uses an explicit reviewed transaction rather than an unreviewed generic cascade.
- [x] Permanent league deletion does not delete global users or players.
- [x] Account deactivation preserves historical actor identity and revokes sessions.
- [x] Migration fails on ambiguous IDs, duplicate ownership, invalid money, cross-league references, or missing required relationships rather than guessing.
- [x] Grae approved this document as the Season 2 Data Model technical specification by delegating the technical decisions to Codex.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The data-model approval phase is complete.

Schema implementation is complete only when approved DDL, constraints, migrations, repositories, integrity checks, migration reports, rollback, league-isolation tests, transaction tests, history tests, and read-only guarantees pass against disposable and copied representative data.

---

# Related Documents

```text
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/07-testing/TESTING_STRATEGY.md
docs/08-operations/BACKUP_AND_RESTORE.md
```
