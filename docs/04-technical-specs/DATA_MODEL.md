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

The FAD product approval on 2026-07-27, including the Candidate Card ranking and
tie amendment on 2026-07-28, supersedes conflicting lifecycle language, but the
dedicated FAD tables, constraints, and migrations are defined by the approved
amendment at `docs/04-technical-specs/FREE_AGENT_DRAFT.md`.

The consolidated FAD lifecycle package approved on 2026-07-29 adds scheduled
Entry Draft-start rollover, automatic all-or-none Candidate Card opening,
adaptive help timing, whole-card legality, strict-improvement restricted
ties and fallback, private final-hour nomination queues, FAD-only equal-chance
draws, binding no-reservation wins, and atomic whole-Monday Week 1 recovery.
The shared relationships and lifecycle gates below adopt those decisions;
the dedicated FAD specification remains authoritative for its exact tables,
columns, constraints, canonical hashes, and migration order.

The current additive SQLite target is schema version `49`. Schema 39 adds the
immutable FAD recovery-action and allocation-correction command-result evidence
plus its recovery, queue-acceptance, and guard support. Schema 40 adds no table
or repository-catalog entry; it narrows the exact transaction-bound overlap
needed to replace one resolving restricted auction with its open fallback.
Schema 41 admits the exact correction-required allocation resume for a
receipt-backed failed-auction retry, schema 42 evaluates the restricted
participant floor against current rounded AAV, and schema 43 preserves one
causal recovery across repeated resolution failures while binding resume and
automatic settlement to the latest matching failure and retry receipt. Schema
44 admits an immediate open-rapid starter, schema 45 makes queued-nomination
activation restart-safe, schema 46 binds the nominated starter edit allowance
to immutable start evidence, and schema 47 admits only the exact rollover-
finalization recovery transition and retry identity. Schema 48 is the
preserved intermediate FAD-14 checkpoint that requires canonical automatic-
award and Candidate Card opening realtime evidence. Schema 49 requires the
exact setup-exemption Activity, current-commissioner notification, destination,
and three metadata-only publications without changing structural inventory.

The explicit final-standings amendment approved on 2026-07-29 requires one
canonical, provenance-complete regular-season final snapshot before later
season rollover. The implementation migration must satisfy the logical
constraints below without treating legacy snapshot rows as equivalent
evidence.

Grae's 2026-08-11 statistics clarification requires every new season to
initialize every player's current-season games played, goals, assists, NHL
points, and fantasy-point hundredths to exactly zero. Prior-season rows remain
season-scoped history or migration/source evidence only. FAD and Entry Draft
records depend on catalogue identity, position, and eligibility state, never on
statistics-provider capability.

The preseason FAD-only staging candidate composes no automatic
`matchup_occurrences` runner. Statistics-refresh, baseline, normal-lock,
finalization, and matchup-week rollover occurrences therefore remain persisted as applicable
but are not claimed or executed by that candidate. FAD, Entry Draft, auction,
trade, and outbox job state remains available subject to each subsystem's own
gates. The later provider-neutral matchup/statistics slice must restore or split
the shared runner without rewriting historical occurrence evidence.

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
* exact indexes chosen from measured query plans, except the approved
  schema-34 Candidate-eligibility indexes recorded under Indexing;
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

Creating or activating a new season establishes the semantic all-zero baseline
for every persisted player. This document does not claim that current code
materializes zero rows or already projects that baseline. The provider-neutral
statistics follow-up must choose and verify the physical representation. Exact-
season reads must never fall back from missing current-season data to a prior-
season total; once a completed game is due for refresh, missing data is
unavailable rather than an earned zero.

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
* current matchup-schedule generation or version used by due-job gates;
* `created_at`;
* `updated_at`;
* `version`.

One league may have only one current active season.

The competition season ending does not advance contract, retention, or buyout
years. Those rows remain on the completed competition season and are presented
as `Pending Rollover` until the persisted scheduled start of the next Entry
Draft. The successful scheduled transition changes the source season to
completed, activates the already-planned target season, and changes the
league's current-season pointer in the same transaction as every contract,
ownership, obligation, and affected-trade effect.

Before Candidate Cards open, automatic readiness may advance Week 1 by whole
league-local Mondays and replace the future schedule generation atomically.
After opening, only FAD completion may make another approved whole-Monday
recovery. A matchup-start or scoring-baseline job is valid only when the
season's FAD completion marker exists and the job references the current
schedule generation. League-local Monday selection and validation belong to the
Node domain policy using the league's persisted IANA timezone. Database
constraints must not infer a whole-Monday move from divisibility by
`604800000`; a valid pair of consecutive local Mondays can be 167 or 169
elapsed hours apart across DST.

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

An ownership ID identifies one uninterrupted team tenure. A team-to-team
player or prospect-right transfer deletes the source tenure and creates a new
destination ownership ID at version `1`; it does not update one ownership row
across teams. The player and contract IDs remain stable. Trade, reversal, and
commissioner-transfer evidence stores the exact old-to-new ownership-ID
mapping. A reversal creates another new tenure and never resurrects a deleted
ownership row.

The trade-block flag has no transaction, approval, slot, cap, contract, or
roster-legality effect. Its command changes only `trade_blocked`,
`updated_at_ms`, and the ownership's optimistic `version`, so it is not an
authoritative roster-legality writer and does not invoke the post-commit
late-lock coordinator. It clears automatically when the ownership moves to
another team.

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

The post-commit late-lock coordinator receives a transient committed-mutation
batch grouped by league, season, and affected team. Each group contains the
stable ownership IDs and committed versions that witnessed the mutation. When
a successful writer deletes an ownership, the witness is that row's last
committed pre-delete version preserved by the writer result and ownership
history. This batch adds no table, request ID, or idempotency record and is
never used to repeat or compensate the authoritative mutation.

The batch's mutation kind is accepted only when it is an exact member of the
canonical writer registry. A team group may contain an empty ownership-witness
array only when the writer's durable committed result identifies an
authoritative-legality change with no ownership-tenure mutation, including a
cap-only or contract-only effect, an effective-position correction, or a truly
empty roster. No unchanged or synthetic ownership row may be used as a
substitute witness. Every non-empty witness remains subject to the exact current
or durably deleted identity-and-version checks.

For a team transfer, the source group uses the deleted source tenure's last
version and the destination group uses the distinct present tenure's version
`1`. The two globally unique witnesses let both teams be evaluated without
treating a still-present destination ownership as deleted from the league.

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
* free-agent acquisition buyout-lock expiry;
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

The schedule makes current-year inclusion and scheduled Entry Draft-start
rollover explicit. Reaching the competition-season end does not change a
`current` row or expire its parent contract. The rollover transaction marks
the source year completed or expired, activates the exact target-season year
when one exists, and applies the matching retention, buyout, ownership, and
trade consequences together.

Shared `season_rollover_attempts` retain each scheduled or commissioner-retry
attempt and its safe blocker evidence. A blocked attempt creates no successful
rollover and leaves every contract, ownership, obligation, season pointer,
draft-selection gate, and trading gate unchanged. A successful transaction
creates exactly one `season_rollovers` root plus immutable
`season_rollover_items` for every affected contract, ownership, retention,
buyout, and cancelled trade. The root binds the source and target seasons,
scheduled Entry Draft, immutable start occurrence, canonical final-standings
lineage, completed source FAD, execution authority, before/after versions,
activity/audit/outbox evidence, and a canonical effect-manifest hash. The exact
field and constraint contract is defined in the dedicated FAD specification.

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
| `auction_contexts` | Required one-to-one ordinary-weekly, FAD open-rapid, or FAD-restricted context |
| `auction_administration_command_results` | Immutable original T-080 through T-083 success representation and idempotency-replay evidence |
| `free_agent_draft_recovery_action_command_results` | Immutable original T-142 recovery-action status, representation, and replay evidence |
| `free_agent_draft_allocation_correction_command_results` | Immutable original T-144 correction status, representation, and replay evidence |
| `auction_bids` | One team's private active or resolved bid |
| `auction_events` | Start, edit, removal, resolution, and recovery history |
| `auction_resolutions` | Durable authoritative outcome |
| `free_agent_draft_nomination_queue` | Private binding final-hour nomination awaiting its fair opening boundary |
| `free_agent_draft_auction_participants` | Restricted team allowlist and immutable Candidate minimum with nullable active-improvement bid |
| `free_agent_draft_draws` | Private nonce, public commitment, terminal reveal, and optional FAD-only exact-tie selection evidence |

`auction_administration_command_results` added one logical schema table, and
the later FAD-05 player-game coverage amendment added
`stat_refresh_player_game_coverage_entries`. At the FAD-05 local closure,
migration `0030` contains `124` application tables, `125`
tables including `schema_migrations`, `124` matching repository-catalog
entries, `42` post-reset require-empty tables, `82` signed-reset-policy tables,
and `60` immutable-delete guards. After the pre-staging T-145 current-
generation compatibility correction, migration `0030` is frozen locally at
`636,077` bytes and lowercase SHA-256
`6f46b7a8c52108adfc0b51dc1eb9cdcab0ed274482ca396a31f7d45e42c07184`.
Fresh-schema and `22 -> 30` upgrade assertions reproduce this inventory; any
byte change invalidates the freeze and requires the complete migration gate
before shared staging.

At FAD-11 local closure, additive migration
`0039_add_fad_recovery_correction_evidence.sql` is pinned at `201,713` bytes
with lowercase SHA-256
`a176479f3eb3fc1183c595a68026a2e5b73d6b975b66b6bcab5de4954945ae6f`.
Additive migration `0040_allow_atomic_fad_restricted_fallback_overlap.sql` is
pinned at `9,449` bytes with lowercase SHA-256
`cff71c33b628504d38b53cfe1621363740791c119c5b214d7d11e10f216a5a92`.
Schema 40 contains `131` application tables, `132` tables including
`schema_migrations`, and `131` repository-catalog entries. Migration 40 replaces
the combined active-auction index with separate one-open and one-resolving
indexes and guards the exact complete-window restricted fallback handoff.

Migration `0041_allow_fad_auction_resolution_recovery_resume.sql` is pinned at
`35,525` bytes with lowercase SHA-256
`00d6926934d46089df6581a8c3edc296394ce57958155e36da7d15b2be61111b`.
Migration `0042_use_current_aav_for_restricted_participant_floor.sql` is pinned
at `9,326` bytes with lowercase SHA-256
`4269c4a0c320364b65d20c01b167ff8738f1a67c7e4d52160e6e2245e201e537`.
Migration `0043_allow_repeat_fad_auction_resolution_recovery.sql` is pinned at
`92,011` bytes with lowercase SHA-256
`1623d40ffaa477e3ba0be6bdd7c831f3d16489b53e4befc03eb7aa0e6efa6ae3`.
Schema 43 remained at `131` application tables, `132` tables including
`schema_migrations`, and `131` repository-catalog entries at the FAD-12 local
checkpoint.

FAD-13 adds migration `0044_allow_immediate_fad_open_rapid_starts.sql`, pinned
at `32,654` bytes with lowercase SHA-256
`79f759030c01281f4a21aeba0584a3681d0ae84982d2b7a48dfcd7a5bf0274ee`;
migration
`0045_allow_restart_safe_fad_queued_nomination_activation.sql`, pinned at
`74,289` bytes with lowercase SHA-256
`cd2a7d3059b6ab0f484267b6999cbadd6db1a86114fcdb67e4220296dca9ae37`;
migration `0046_bind_fad_open_rapid_starter_edit_limit.sql`, pinned at `18,329`
bytes with lowercase SHA-256
`78626350a1efa3e76b09f3ba2dc812b135b1e2d19dd2c01d2e973a57a6a884bb`;
and migration
`0047_allow_restart_safe_fad_rollover_finalization.sql`, pinned at `14,129`
bytes with lowercase SHA-256
`bdabbcff52cd87c932c3f2e067d825786fd6dac6354ea4a3a90396ec972b0b2b`.
Schema 47 was the FAD-13 local target at `131` application tables, `132` tables
including `schema_migrations`, and `131` repository-catalog entries.

FAD-14 migration `0048_require_canonical_fad_realtime_evidence.sql` is pinned
at `73,524` bytes, `1,490` lines, and lowercase SHA-256
`c08445d1b3833343f9c276dff3cd9400ebce6e282665179b992f47919feceb21`.
It replaces only two live head-47 triggers and preserves schema `48` as the
intermediate realtime-evidence checkpoint. Migration
`0049_require_canonical_fad_setup_exemption_publications.sql` is pinned at
`29,571` bytes, `748` lines, and lowercase SHA-256
`5109baabaeed39e06498c7c26274a41a48edfbbdee958e7dd6b278021a29ebc6`.
It replaces only the live head-48 setup-exemption insert trigger. Schema `49`
is current locally with the same `131` application tables, `132` including
`schema_migrations`, and `131` repository-catalog entries. None of migrations
`0023` through `0049` has reached shared staging or production.

The scheduled FAD resolver now composes exact Candidate-tie restricted,
allocation-linked restricted-no-improvement fallback, direct open-rapid, and
queued open-rapid resolution. Immediate starts, private queued starts, queued
activation, contiguous rollover extensions, restart-safe finalization and
recovery, atomic completion, and the ordinary-auction handoff are represented
through the historical schema-47 checkpoint without changing the structural
inventory. The FAD-14 schema-48 and schema-49 trigger replacements preserve
that same inventory.

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

Only one independently active auction may exist for a player in one league.
Schema 40 permits one exact open fallback shell beside its one resolving
restricted source only inside the caller-owned atomic no-improvement handoff;
all unrelated open/resolving overlap remains rejected.

---

## Auction Context and FAD Extensions

Every auction has exactly one `auction_contexts` row. Existing rows are
explicitly migrated as `ordinary_weekly`; an absent context is invalid and is
never inferred. FAD contexts bind the exact FAD and rollover, and a restricted
auction or its no-improvement fallback also binds the allocation. Origin
distinguishes manager nomination, queued nomination, Candidate restricted tie,
and restricted no-improvement fallback.

A valid open-rapid nomination accepted during the final hour creates only a
private `free_agent_draft_nomination_queue` row, including the binding starter
bid and future opening/resolution rollover identities. It does not create an
early auction or reveal player interest to other managers. Activation creates
the auction and bid atomically at the next fair boundary; a later boundary is
added contiguously when required.

Each restricted participant row preserves the original Candidate snapshot
entry and minimum total, term, and AAV. A participant becomes a contender only
through one valid current active bid strictly above its own minimum. Removal is
permanent. If no eligible improvement remains at resolution, the restricted
auction closes without a draw and one fresh league-wide open-rapid fallback is
created while quarantine remains. Its cross-term floor accepts a total above
the tied total or the same total with AAV at least the tied AAV.

Every FAD auction has one draw commitment backed by a private persisted nonce.
The terminal transaction reveals it and stores exact draw evidence; random
selection is used only when eligible terminal FAD offers remain exactly tied.
Ordinary weekly auctions have no FAD draw row and retain their deterministic
tie rule.

---

## Auction Administration Command Results

`auction_administration_command_results` stores one immutable row for every
successful commissioner HTTP command `T-080` through `T-083`.

Each row contains:

* stable ID, league, season, auction, and nullable bid;
* one required and unique same-league idempotency-request link;
* action `edit_bid`, `remove_bid`, `cancel_auction`, or
  `request_resolution`;
* the actor user, active league membership, and actual authority
  `commissioner` or `platform_administrator_as_commissioner`;
* the lowercase SHA-256 request hash, equal to the linked idempotency request's
  request hash;
* precondition kind `bid` or `auction`, positive
  `expected_resource_version` equal to the `If-Match` version, and positive
  `resulting_resource_version`;
* original HTTP status, exactly `200` for edit, removal, or cancellation and
  `202` for a resolution request;
* the exact success `data` value stored as `canonical-json-v1` plus its
  lowercase SHA-256;
* nullable `job_run_id`, required only for `request_resolution` and required
  null for every other action; the referenced durable job is exactly operation
  `auction.resolve.target` with occurrence key
  `auction:<auctionId>:<resolvesAtMs>`;
* created timestamp; and
* version exactly `1`.

The exact idempotency-operation map is `edit_bid` -> `auction.bid.put`,
`remove_bid` -> `auction.bid.remove`, `cancel_auction` -> `auction.cancel`, and
`request_resolution` -> `auction.resolve.request`. Within league isolation,
exact replay is scoped by operation, actor user, and client key, then resolved
through the request's one immutable command-result link. The bid link and
`bid` precondition are required only for `edit_bid` and `remove_bid`; the other
actions require no bid link and use the auction precondition. The
`request_resolution` response `operationId` and `occurrenceKey` come from its
bound durable job. The canonical request-hash preimage, response encoding, and
action matrix are normative in
`docs/04-technical-specs/FREE_AGENT_DRAFT.md`.

The version relationship is constrained by action:

| Action | Expected resource | Resulting version |
| --- | --- | --- |
| `edit_bid` | bid | `expected_resource_version + 1` |
| `remove_bid` | bid | `expected_resource_version + 1` |
| `cancel_auction` | auction | strictly greater than `expected_resource_version` |
| `request_resolution` | auction | equal to `expected_resource_version` |

Cancellation permits a greater-than relation because one atomic cancellation
may perform approved internal state progression. Resolution request creation
does not mutate the auction aggregate. Exact replay returns the stored
representation while retaining these stored expected/resulting versions as
its immutable version evidence; it never substitutes current resource state.

The row, its hashes, and its completed idempotency back-link are immutable.
Fresh success writes all auction effects and history, the command result, and
the completed idempotency relationship in one immediate transaction.
Idempotency completion is last. Exact replay reads the stored HTTP status and
canonical response data before consulting mutable auction state, versions,
clock, or new identifiers, so later auction or job changes cannot alter the
original result. The transport creates a fresh request ID and does not store it
in this table.

A failed request creates neither a new idempotency row nor a command-result
row. Scheduled auction resolution has no commissioner HTTP request and creates
no command-result row.

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

A manager FAD start, queued nomination, join, or permitted edit is binding but
does not reserve cap, position capacity, player ownership, or a roster slot.
Its persisted confirmation acknowledges that later or concurrent league
changes may make the resulting roster illegal. Resolution requests no second
confirmation: every otherwise-valid win creates the contract, ownership, and
roster assignment in the same transaction and records the approved general-
illegality warning when required.

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

Like `ownership_events`, `auction_resolutions.ownership_id` is a stable
historical ownership UUID rather than a foreign key to the one live
`player_ownerships` row. A later contract expiration can therefore remove the
current ownership without erasing or nulling the authoritative auction result.
The FAD allocation and allocation-event ownership fields follow the same
historical rule; their exact lifecycle and rollover evidence contract is in
`docs/04-technical-specs/FREE_AGENT_DRAFT.md`.

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

For FAD contexts the same resolver also updates the linked allocation,
participant, rollover, draw, queue, and recovery records. An empty restricted
current-improvement set creates the mandatory fallback rather than a generic
no-winner result. Any winner, no-winner, fallback creation, or correction
commits with all of its linked FAD state or leaves every related row unchanged.

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
opens trading only from the persisted successful scheduled Entry Draft-start
rollover and trading-window state, and treats the configured league trade
deadline as closed at the exact stored instant. Draft setup or a merely
scheduled start never opens trading. A generated preview identity is explicitly
non-persisted and does not create a `trades`, `trade_assets`, or
`trade_events` row.

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
| `entry_draft_schedule_operations` | Immutable schedule/reschedule command, setup-confirmation, and exact replay result |
| `entry_draft_rollover_bindings` | Stable draft-level scheduled-rollover aggregate, current occurrence, gates, and successful-rollover link |
| `season_rollover_occurrences` | Immutable scheduled-start and reschedule history with exact target-schedule evidence |
| `entry_draft_pick_clocks` | Prepared and running pick-clock generations with exact owning team, bound to a successful rollover |
| `entry_draft_on_clock_trades` | Immutable one-use on-clock trade and prior/fresh clock linkage |
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

## Scheduled Start and Rollover Binding

`entry_drafts` stores the draft identity, league and target-season identity,
lifecycle status, and optimistic version. Its lifecycle remains `Ready` while
the scheduled-start rollover is pending or blocked; a blocked rollover attempt
does not place a synthetic failure status on the base draft.

`entry_draft_rollover_bindings` stores the stable draft-level binding ID,
source and target seasons, current occurrence ID, frozen target schedule
ID/version and Week 1 identity/start, scheduling-time source-season,
target-season and draft versions, scheduled/blocked/succeeded status, selection
and trading gates, nullable successful season-rollover link, and optimistic
version.

`entry_draft_schedule_operations` stores one immutable row for every initial
schedule or reschedule command. It binds the exact idempotency request, actor,
nullable bounded reschedule reason, draft and binding versions before/after,
new occurrence/job/start, and any superseded occurrence/job. The initial
operation is the atomic setup
confirmation after normalized order, eligibility, pick-owner, calendar, and
schedule-generation validation. Both fresh success and replay project the
same nine-field result from this row; replay never derives an old result from
the binding's current mutable occurrence.

`season_rollover_occurrences` stores one immutable occurrence identity for
every initial schedule or reschedule, including the binding, draft, source and
target seasons, scheduled start, canonical occurrence key, exact target
schedule/Week 1 evidence, scheduling-time versions, scheduling actor and
authority, pending job, status, and nullable superseding occurrence. A
commissioner reschedule may mark only a still-scheduled, unexecuted occurrence
`superseded`, mark its untouched pending job safely skipped, insert the new
occurrence, and point the binding at it in one transaction. It cannot replace
a due, leased, running, blocked, or succeeded occurrence or create a second
rollover for either season.

`season_rollover_attempts` stores every scheduled-job or commissioner-retry
attempt against both the stable binding and exact immutable occurrence,
including attempt number, execution authority, blocker evidence, observed
versions, and nullable successful rollover link. The latest attempt is derived
from the maximum attempt number for that occurrence and is not copied into a
drift-prone mutable pointer. Safe readiness failures persist a blocked attempt,
occurrence, and binding without applying rollover effects. Unexpected
technical failures do not fabricate domain blockers and remain retryable
through the leased job/recovery path.

At the scheduled occurrence, one outer immediate transaction validates and
creates the successful season-rollover evidence, opens trading, changes the
draft to `Live`, and prepares the first unused pick clock. The binding may move
to `succeeded`, and its selection and trading gates may open, only when it
references the successful rollover root and exactly one first-pick clock is
prepared in that same transaction. A database transition guard starts that
prepared clock when the draft becomes `Live`.

If validation or any late write fails, no successful rollover row exists, the
base draft remains `Ready`, and selections and trading remain locked.
Commissioner retry binds the same draft and failed occurrence rather than
supplying a new season, calendar, or rollover time.

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

`entry_draft_pick_clocks` stores each pick's prepared, running, or completed
clock generation, start and deadline, completion evidence, and the successful
rollover attempt/root that authorized the first clock. Later clock generations
preserve the same pick identity and record the fresh full clock granted after
the one permitted completed on-clock trade.

`entry_draft_on_clock_trades` stores exactly one optional immutable row per
pick. It binds the completed trade, pick ownership event, prior running clock
generation, new owner, and fresh prepared/running full-clock generation under
the same league, draft, and pick. Its unique pick constraint is the durable
one-completed-on-clock-trade limit. Insert requires the ownership transfer,
prior-clock completion and fresh-clock creation to have committed in the same
transaction; no later update or delete is allowed.

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

A `rights_release_reentry` row is an event-specific approval, not a permanent
player exemption. It must be in the same league as the referenced
`ownership_events` row and player, bind that exact release through
`rights_release_event_id`, belong to a confirmed same-league eligibility
snapshot, and have a snapshot confirmation time strictly later than the
release event. Each `fantasy_elc_declined` or
`unsigned_prospect_rights_released` event requires its own later confirmed
approval; an earlier approval does not clear a newer release. Candidate search,
preview, and authoritative save all use that one predicate.

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

Manager selection, attributable commissioner selection, automatic timeout,
and acceptance of a trade containing the on-clock pick all compare-and-swap
the same pick, owner, draft, and clock generation. A selection cancels every
still-pending proposal containing the used pick. A winning on-clock trade
persists its one-trade use, transfers ownership, cancels stale competing
proposals, and starts a fresh full clock for the new owner. The first
transaction to commit wins; every loser revalidates and leaves no partial
selection, trade, ownership, proposal, queue, or clock effect.

The final T-108 selection or confirmed-forfeiture transaction that makes the
last pick terminal changes the Entry Draft to `Complete` and invokes the
internal `entry_draft_completed` readiness-handoff writer before the same
transaction commits. Ordinary-inaugural T-036 owns the inaugural no-draft
call, while reset-origin T-036 activates without a readiness handoff and T-037
owns the initial-Season-2 no-draft call. Each actual handoff validates
authoritative source state and creates or idempotently reuses exactly one
operation plus its canonical pending job; caller rollback removes both. It
does not execute readiness, has no route, and cannot be invoked by a
standalone manual Entry Draft completion command.

The later readiness worker either creates the complete FAD, all participating-
team snapshots and cards, locked carryovers, seven initial rollover rows,
jobs, reminders, and any required pre-opening whole-Monday schedule rewrite in
one transaction, or creates none of them and persists the safe blocker/retry
state. No commissioner-authored setup row or opening parameter is part of this
model. If T-095 supplies the missing confirmed schedule after the genuine-
inaugural occurrence blocks, it may evidence and requeue only that same failed
job/blocked operation; it never creates another trigger.

Readiness trigger identity is exact: completed Entry Draft ID for the draft
path, target season ID for an inaugural no-draft path, and persisted exemption
ID for the one initial Season 2 path. Each commissioner retry advances the
blocked readiness operation and requeues its canonical job in the same
transaction as one immutable idempotency-bound retry receipt. Later readiness
progress never rewrites that accepted receipt.

---

## Free Agent Draft Shared Relationships

The dedicated FAD model extends this shared schema with
`free_agent_draft_setup_exemptions`,
`free_agent_draft_readiness_operations`, immutable readiness-retry receipts,
immutable T-095 readiness corrective-requeue evidence,
`free_agent_drafts`, immutable
`free_agent_draft_teams`, `candidate_cards`, current entries and revisions,
scoped help requests, immutable deadline snapshots, per-player allocations and
events, rapid rollover rows, private nomination queues, recoveries, and the FAD
auction sidecars listed above.

Each initial-Season-2 setup-exemption row links its exact commissioner-visible
`fad_setup_exemption_authorized` Activity, Security Audit row, current-
commissioner `fad_setup_exemption_authorized` notification, and canonical
outbox evidence. The Activity metadata contains exactly `exemptionId`,
`seasonId`, and `migrationReportId`, with no private reason or operational
value. The notification message data contains exactly `leagueId`, `seasonId`,
`exemptionId`, and destination
`{kind: commissioner_fad, leagueId, seasonId}`; its deduplication identity is
`fad_setup_exemption_authorized:<leagueId>:<seasonId>:<exemptionId>:<userId>`.
The committing transaction contains exactly league-audience
`league.changed/league_changed`, league-audience
`activity.created/setup_exemption_authorized`, and exact-recipient user-
audience `notification.created/setup_exemption_authorized`, with `related`
exactly `fadId`, `teamId`, `cardId`, `allocationId`, `auctionId`, `recoveryId`,
`nominationQueueId`, and `scheduleRecoveryOperationId`, all null.

There is at most one FAD per league-season. Its root binds the system-owned
readiness occurrence, completed Entry Draft or approved no-draft evidence,
prior-season rollover when applicable, opened/help/deadline timestamps, the
frozen historical first-matchup instant, nullable recovered competition Week
1, every completion milestone, and an optimistic version. Help opens at the
later of FAD opening and 48 hours before the deadline, so a shortened
late-draft preparation period makes help available immediately.

Each participating team has one Candidate Card aggregate with exactly the
canonical slot keys `F01..F12`, `D01..D06`, and `B01..B04`. Carryovers are
server-derived immutable occupants. Candidate edits append one private
revision for each resulting card version. The card stores total-conflict and
carried-roster-conflict counts separately, plus maximum-possible-cap and whole-
card allocation eligibility. An unresolved
carried-roster structural conflict excludes every non-carryover candidate with
`candidate_card_structural_conflict`; otherwise an over-cap projection excludes
every non-carryover candidate with `candidate_card_over_cap`. Structural
conflict is the deterministic reason when both exist, while cap status still
reports the overage. The deadline never deletes a preferred candidate or
carryover to manufacture legality.

The total conflict count covers every unplaced current entry and must equal the
snapshot conflict-row count. The carried-roster conflict count is the subset
whose entry kind is `carryover`; only that subset invokes the whole-card
structural exclusion. A Candidate made invalid or unplaced by later
authoritative player-state synchronization is excluded individually and cannot
silently disqualify the card's other valid offers.

Deadline locking writes one immutable card snapshot and a row for each of the
22 slots plus every conflict. Allocation rows rank only valid snapshot offers,
by total contract value first and AAV second; an exact total-and-term tie
creates the restricted path. Current allocation, auction, queue, rollover, and
recovery state can advance only through their shared transaction, while
append-only allocation events preserve the original decision.

Automatic readiness creates seven contiguous rapid rollover rows. Extension
rows are allowed only for durable queued, restricted, fallback, or recovery
work requiring another fair 24-hour window. FAD completion requires every
allocation, queue, rollover, linked auction, draw, and recovery to satisfy the
dedicated terminal matrix. The completion marker and any required server-owned
Week 1 schedule regeneration commit in one transaction; marking only the FAD
or season row complete can never release player quarantine or unblock matchup
jobs.

`free_agent_draft_schedule_recoveries` is the immutable root for either a
`pre_open` or `completion` recovery. It binds the old and new schedule
generation operations/versions, old and new Week 1 rows/instants, the causal
readiness or completion operation, completion time, and canonical evidence
digest. Its immutable children are:

* `free_agent_draft_schedule_recovery_weeks`, one row per removed week;
* `free_agent_draft_schedule_recovery_matchups`, one row per removed matchup;
  and
* `free_agent_draft_schedule_recovery_jobs`, one row per affected unexecuted
  job with disposition `replaced` or `cancelled`.

A `replaced` job row contains both old and new job/generation identities. A
`cancelled` row contains only the old job/generation identity because an
unexecuted job owned by a removed week has no successor. A valid replacement
may retain the same scheduled instant; generation identity, not
`replacement.scheduled_for_ms > old.scheduled_for_ms`, distinguishes it.
Service validation proves league-local Monday membership, removed-child
completeness, schedule fairness, and the canonical
`evidence_sha256` immediately before commit. The normative
`canonical-json-v1` preimage, child fields, and array ordering are defined in
`FREE_AGENT_DRAFT.md`.

---

# Part 10 - Player Statistics

## Statistics Tables

| Table | Purpose |
| --- | --- |
| `stat_sources` | External-provider identity |
| `stat_refreshes` | Import attempt and freshness history |
| `player_stat_totals` | Latest or source-season normalized totals |
| `stat_refresh_player_game_sets` | Root that atomically seals independent player/game coverage and observation manifests for one live-scoring refresh |
| `stat_refresh_player_game_coverage_entries` | Immutable required-player coverage disposition and expected-game identity evidence for one live-scoring refresh |
| `player_game_stat_observations` | Immutable player statistics for one NHL game as observed by one refresh |
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

The current season's semantic counters begin at exactly zero for games played,
goals, assists, NHL points, and fantasy-point hundredths. The current
implementation does not yet create a zero row per player or provide the final
season-explicit projection contract. A prior-season total may remain stored,
backed up, restored, migrated, or exposed by a future explicit historical-
statistics view, but it cannot satisfy a current-season roster, matchup, or
standings projection. FAD and Entry Draft do not consume statistics at all.

Failed refreshes do not overwrite the last valid totals.

---

## Deferred Player-Game Coverage Requirement Snapshot

The player-game live-provider model below is retained as unshipped historical
design evidence. It is not a FAD-18 gate and must remain uncomposed while the
provider-neutral post-game matchup/statistics follow-up is pending. Any later
implementation must be reconciled with the approved four-evening completed-
game refresh cadence before these tables or contracts become authoritative.

The live-refresh requirement snapshot is a derived immutable command value,
not a new authoritative table. Its still-local schema version `1` contains:

* NHL season key and player-identity provider;
* sorted exact `requiredPlayers[]` entries containing `playerId` and
  `providerPlayerId`;
* sorted exact `requiredPlayerGames[]` entries containing `playerId`,
  `providerPlayerId`, `providerTeamId`, `nhlGameId`, and
  `nhlGameScheduledStartsAtMs`; and
* `requirementsSha256` over the normative schema-version-1 preimage in
  `FREE_AGENT_DRAFT.md`.

Every required game has one exact parent identity in `requiredPlayers`, and a
`(playerId, nhlGameId)` pair is unique. Required games are derived only from
sealed baseline `expected_game` coverage linked by whole-game exclusions in a
matchup week whose current status is `live`, `awaiting_data`, or
`correction_required`. A `final` week contributes no required game. Moving it
to `correction_required` makes the same sealed historical binding required
again. The parent player stays required even if current ownership or provider
team changed.

The service sends both arrays to the provider and persistence boundary. The
completion transaction rebuilds the snapshot and compares the exact arrays and
digest before any refresh becomes authoritative. A roster, mapping, exclusion,
baseline-coverage, game/team/start, or matchup-week status race rejects the
completion and preserves the previous successful refresh.

---

## Player-Game Observation Sets

Every statistics refresh eligible for live matchup scoring has exactly one
sealed `stat_refresh_player_game_sets` row. Totals-only discovery or historical
imports may omit the set, but a refresh without it cannot drive a matchup
baseline, live score, late lock, or final result.

The root binds its statistics source, successful refresh, NHL season, provider,
source version, and capture time. It also stores exact required-player,
coverage-entry, expected-player/game, and observation counts, coverage schema
version and canonical SHA-256, and the existing observation evidence schema
version and canonical SHA-256. The coverage and observation digests use the
independent normative preimages in `FREE_AGENT_DRAFT.md`; the observation
schema-version-1 preimage is unchanged.

`stat_refresh_player_game_coverage_entries` records the adapter's affirmative
coverage result for the exact server-required player set. Each required player
has exactly one disposition shape:

* one or more `expected_game` rows, each with provider player/team identity,
  NHL game identity, and scheduled start;
* one `no_due_game` row with provider player/team identity and no game; or
* one `no_team` row with provider player identity and no team or game.

A player cannot mix shapes. The distinct covered-player identity set must
equal the server-required set exactly. The expected `(player_id, nhl_game_id)`
set must equal the observation set exactly. Neither an omitted provider row nor
an unresolved local mapping is an authoritative terminal disposition.

Current membership is separately affirmed from Players or FreeAgents. The
provider response parent carries that current team or null, while every
expected-game item carries its own provider team. A required historical game
therefore retains its old team after a trade or current team change. One player
may have old-team and current-team expected games in the same refresh, and a
currently free-agent player may still have historical expected games. In both
cases the disposition is `expected_game`; terminal `no_due_game` or `no_team`
is valid only when neither a required historical game nor a current due game
exists.

Normalization keeps one `provider_team_id` on each flat expected coverage
entry. Every `requiredPlayerGames` binding must be present in flat
`expected_game` coverage with exact player, provider-player/team, game, and
scheduled-start values. Those historical entries are a subset; current due
games may add entries, and the complete flat expected set still equals the
complete observation identity set.

The root's `player_game_stat_observations` children store:

* stable player and NHL game identity;
* the authoritative scheduled game start and observed game state;
* goals, assists, NHL points, and fantasy-point hundredths for that player in
  that game as of the refresh;
* provider source-update time; and
* immutable creation/version evidence.

The provider contract must produce an explicit zero-valued observation when an
`expected_game` player/game pair has no scoring events. Absence is never
interpreted as zero. Coverage and observation children are staged before the
root; all counts, both digests, required-player equality, expected-pair
equality, provider, capture identity, and `source_version` reconcile before
the root seals in the same transaction. The root and both child sets are then
immutable and cannot be inserted into, updated, or deleted piecemeal.

For an excluded player/game, the late-lock transaction binds the exact
baseline `player_game_stat_observations` row from the same source refresh as
the team's baseline snapshot. A later scoring refresh supplies the current
observation for that same player/game. The excluded post-baseline amount is
the non-negative current-minus-baseline player/game delta. Missing, stale,
regressed, cross-provider, source-version-unbound, or unsealed evidence leaves
scoring `awaiting_data`; it is never treated as zero. Late-lock game-state
requirements are derived from `expected_game` coverage for every selected
player rather than from available observation rows. Scoring and finalization
require the exact current row for every excluded pair with compatible source
lineage and non-regressed source-update time; missing current evidence prevents
an official matchup result and any dependent final standings snapshot.

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
| `season_matchup_schedule_generations` | Immutable generated-schedule identity and current/superseded state |
| `matchup_schedule_command_results` | Immutable confirmed T-095/T-096 request/result and replay evidence |
| `matchup_schedule_job_bindings` | Exact schedule generation owning each dependent job occurrence |
| `matchup_roster_locks` | One team's normal or late lock |
| `matchup_roster_players` | Immutable scoring-eligible players |
| `nhl_game_state_observation_snapshots` | Immutable authoritative provider snapshot used by late-lock legality |
| `nhl_game_state_observations` | Exact NHL game states consulted within one observation snapshot |
| `matchup_roster_game_exclusion_sets` | Sealed late-lock exclusion root, count, and digest |
| `matchup_roster_game_exclusions` | Immutable whole-game exclusions captured for a late lock |
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

Every confirmed T-095 generation and T-096 shift has one
`matchup_schedule_command_results` row. It binds the exact idempotency request,
actor/authority, request hash, matchup operation, old/new schedule generation,
before/after season and Week 1 versions, and every field of the original HTTP
result. The row and completed idempotency back-link are immutable. Exact replay
reads this row even after a later shift or server-owned recovery; it never
reconstructs the old result from current weeks.

`season_matchup_schedule_generations` supplies the immutable generation
operation/version and current-or-superseded state. Each dependent `job_runs`
row has exactly one `matchup_schedule_job_bindings` row containing its league,
season, schedule operation/version, owning week, job type, and optional
matchup. Schedule generation is part of occurrence identity, so replacing a
job at the same scheduled instant remains unambiguous. A worker revalidates the
binding against the current generation inside the same transaction as any
matchup write.

Every newly generated matchup occurrence uses this exact internal key:

```text
<jobType>:<leagueId>:<seasonId>:<weekId>:<scheduleOperationId>:<scheduleVersion>:<scheduledForMs>
```

The operation ID and positive schedule version make a valid repeated
pre-opening shift such as `A -> B -> A` distinct from the immutable skipped
occurrences owned by the first generation. The parser continues to accept the
pre-generation format
`<jobType>:<leagueId>:<seasonId>:<weekId>:<scheduledForMs>` only for migrated
historical rows. No new schedule writer may create that legacy form.

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

`nhl_game_state_observation_snapshots` stores one immutable authoritative
provider/source version, observed-at instant, freshness decision, and canonical
digest. Its `nhl_game_state_observations` children store every NHL game ID,
scheduled start, and state consulted for the selected roster, not only games
that ultimately produce exclusions.

`matchup_roster_game_exclusion_sets` stores one immutable root for the exact
late roster lock, baseline, and game-state observation snapshot. It contains
the late-snapshot instant, expected child count, evidence schema version, and
canonical digest. The root is sealed in the late-lock transaction: its complete
child count and digest must agree at commit, and no exclusion child may be
inserted, updated, or deleted afterward. A sealed zero-child set is valid when
fresh authoritative evidence proves no selected player's game was underway.

`matchup_roster_game_exclusions` stores:

* league, season, week, matchup, team, late roster-lock, and selected-player
  identity;
* the authoritative NHL game ID and scheduled start;
* the late-snapshot timestamp;
* the durable observation snapshot and exact observed-game child used to
  determine that the game was underway;
* the exact baseline player/game stat observation used to calculate the
  excluded post-baseline delta;
* immutable creation and integrity evidence.

Each row must reference a player in that exact late roster lock. A unique
constraint permits at most one row per roster-lock/player/NHL-game tuple.
Late-lock creation persists the roster lock, player rows, baseline, and every
required observation, sealed-root, and exclusion row in one transaction;
replay or racing eligibility attempts converge on the same set. The rows are
immutable and cannot be added after that late-lock transaction. If
authoritative game state is not fresh enough, scoring remains `awaiting_data`
and no partial observation/lock/baseline/exclusion set commits.

The normative `canonical-json-v1` preimages and array ordering for the
observation and sealed exclusion digests are defined in
`FREE_AGENT_DRAFT.md`. Their lowercase SHA-256 values are recomputed from the
durable rows inside the write transaction and by integrity/recovery tooling.

Scoring queries calculate the ordinary current-minus-baseline player total and
then subtract the current-minus-baseline player/game delta for every excluded
tuple. This removes post-baseline events from the underway game while the
ordinary baseline already removes its pre-baseline events. Queries require
sealed per-game observation sets and exact provider/refresh lineage. They must
not approximate this rule by subtracting only the pre-snapshot portion,
excluding the player for the rest of the fantasy week, or treating missing
per-game data as zero.

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

Every correction version is paired one-to-one with an immutable succeeded
`matchup_operations.operation_type = result_correct` record. League, season,
week, matchup, actor, reason, completion timestamp, result ID, and
result-version ID must match the appended version exactly. A structurally
valid-looking version chain without this operation evidence is not approved
correction history.

---

## Standings

Current standings are derived from official finalized regular-season matchup result versions.

Standings persistence uses:

| Table | Purpose |
| --- | --- |
| `standings_snapshots` | Versioned derived calculation or immutable canonical final snapshot |
| `standings_rows` | Team values and official rank in one snapshot |
| `standings_operations` | Finalization, rebuild, and correction-propagation history |

Standings tables do not become an independently editable source of wins, points, or rank.

### Canonical Final-Snapshot Provenance

The finalization-capable schema must preserve, through same-league and
same-season constrained records:

* whether a snapshot is ordinary derived output or an explicitly finalized
  canonical regular-season snapshot;
* the standings-rule version;
* a provenance-schema version;
* the lowercase SHA-256 hash of the canonical official result-version set;
* expected matchup, included result, and participant counts;
* the finalization operation and timestamp;
* one exact link from the snapshot to each included matchup result and current
  result version;
* the immutable calculated row and official rank for every season
  participant.

The canonical hash input is the following JSON object, with object properties
emitted in the shown order, no insignificant whitespace, every ID and rule
version emitted as a JSON string, and each result version emitted as a
base-10 JSON integer:

```json
{"leagueId":"league-id","seasonId":"season-id","standingsRuleVersion":"rule-version","results":[{"matchupId":"matchup-id","matchupResultId":"result-id","resultVersionId":"version-id","resultVersion":1}]}
```

The `results` array is ordered by stable matchup ID and then stable
matchup-result ID. The lowercase `resultSetHash` is the SHA-256 digest of the
UTF-8 bytes of that exact serialization. Byes create no result item.

Exactly one `season_matchup_schedule_generations` row is `current` for the
league-season. That row identifies the canonical immutable succeeded
`matchup_operations.operation_type = schedule_generate` root that T-145 must
validate. Superseded generation rows and their succeeded immutable operations
remain historical evidence and do not create ambiguity.

The current root qualifies through exactly one provenance branch: the initial
T-095 generation's strict sorted `participantTeamIds` plus participant, week,
and matchup counts; an exact T-096 `matchup_schedule_command_results` lineage;
or an exact server-owned `free_agent_draft_schedule_recoveries` pre-open or
completion-recovery lineage. T-096 and FAD recovery retain the original root,
bind the new current generation to its immutable predecessor, and must not be
forced into the initial-generation actor or metadata shape. T-145 compares the
current generation's effective team set and counts with the terminal schedule
and fails closed on a missing, split, cross-scope, noncontiguous, or malformed
lineage. Count-only evidence remains insufficient because a different team set
can have the same cardinality.

A single scalar source-version value is not complete provenance. A legacy
snapshot that lacks any required link, hash, count, rule version, or explicit
succeeded finalization operation does not qualify as the canonical final
snapshot and cannot satisfy season-rollover readiness. A migration may
preserve such a row as historical derived output, but it must not guess or
backfill missing source evidence.

At most one canonical final snapshot is designated current for one
league-season. Snapshot content, standings rows, and result-version links are
immutable after commit. Controlled replacement changes only the canonical
designation and inserts a complete new snapshot; it never rewrites the prior
snapshot or its children.

### Finalization Transaction

`T-145` owns one immediate transaction that:

1. reauthorizes the current commissioner or inherited platform administrator
   with active membership;
2. validates the season aggregate version and complete terminal
   regular-season schedule;
3. selects exactly one current official or corrected version for every
   expected non-bye matchup and verifies all same-league, same-season, team,
   total, outcome, and rule relationships;
4. compares the submitted result-set hash with the recalculated canonical
   hash;
5. inserts the immutable snapshot, every row, and every result-version link;
6. records one succeeded standings-finalization operation and one Security
   Audit event;
7. inserts one deduplicated in-app notification for every active league
   member and one league-scoped metadata-only standings invalidation;
8. advances the season aggregate version and completes idempotency as the
   final write.

The transaction creates no League Activity, email, push message, matchup
result, season rollover, contract rollover, or repair. Exact idempotency replay
resolves through immutable finalization evidence rather than current mutable
season state.

### Post-Finalization Result Correction

Once a canonical final snapshot exists, `T-097` may not commit a new official
matchup-result version by itself. Its one immediate transaction must also
calculate and insert a complete replacement canonical snapshot, rows,
result-version links, hash and counts; preserve the prior snapshot; advance
the canonical designation; write matchup and standings operational evidence,
Security Audit, required deduplicated member notifications, and scoped outbox
invalidation; and complete idempotency last.

A correction that changes only provenance still creates a replacement
snapshot. It notifies all active league members only when an official
standings row or rank changes. Any failure rolls back the result version and
every standings effect together, leaving the prior official result and final
snapshot authoritative.

After rollover, the same transaction may correct the exact completed
non-current season. It preserves the replaced generation's rule and count
basis, advances that historical season's own version, and never changes the
league's current-season pointer or borrows the new current season's settings.
Initial canonical finalization remains restricted to the active current
season.

The completed T-097 idempotency record always points to the newly appended
`matchup_result_versions` row, whether the correction occurs before or after
canonical finalization. That immutable row determines the league and season.
When no canonical finalization history exists for that season, completion
requires the row to be the current official version and forbids linked
correction-propagation finalization evidence. Once any canonical finalization
history exists, completion instead requires exactly one active
`result_correction` replacement finalization owned by the same idempotency
request, with the replacement snapshot linked to the new version and the
season aggregate advanced in the same transaction. A caller cannot bypass
post-final coupling by omitting a standings operation.

The replacement snapshot changes exactly one result-version link from the
prior canonical snapshot. That link preserves the week, matchup, and stable
result IDs, advances the version number by one, and points to a version whose
`supersedes_version_id` is the prior linked version. All other link tuples are
identical. Re-linking an older correction, skipping a version, or drifting an
unrelated matchup cannot satisfy replacement provenance.

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

For `T-080` through `T-083`, a completed request points to exactly one
immutable `auction_administration_command_results` row. Replay returns that
row's stored HTTP status and canonical response data rather than projecting
the current auction or job. Within league isolation, the replay lookup is
scoped by exact operation, actor user, and client key; the operation is
`auction.bid.put`, `auction.bid.remove`, `auction.cancel`, or
`auction.resolve.request` according to the command mapping above. An
unsuccessful fresh request creates neither record.

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

Scheduled Entry Draft start, automatic FAD readiness, Candidate eligibility
revalidation, reminders, deadline lock, allocation, auction resolution,
restricted/fallback/queued activation, rapid rollover finalization, FAD
completion, schedule recovery, matchup start, and scoring baseline each use a
stable occurrence identity. At a shared timestamp, execution is ordered so
Entry Draft rollover precedes draft opening, readiness precedes Candidate
work, auction resolution precedes dependent activation/fallback/queue work,
FAD completion precedes matchup work, and statistics refresh precedes a
baseline that consumes it.

Every worker revalidates the owning aggregate version and exact schedule
generation inside its write transaction. A stale replaced occurrence may be
recorded as safely skipped but may not mutate current state. Matchup-start and
baseline occurrences additionally require the FAD completion gate; a race
with FAD completion or schedule recovery has one committing transaction and
one loser that revalidates without partial state. The durable
`matchup_schedule_job_bindings` row, rather than a timestamp or free-form job
payload, supplies the generation identity used by that check.

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
* one successful season rollover per source season, target season, and
  scheduled Entry Draft occurrence;
* one active auction per league and player;
* exactly one context per auction;
* one current bid per team and auction;
* one FAD per league-season, one participating-team/card row per team, one
  current card occupant per player, and one placed occupant per canonical slot;
* one allocation per FAD and player, contiguous FAD rollover sequences, one
  restricted participant per auction/team, and one draw row per FAD auction;
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
* FADs, cards, allocations, nomination queues, rollovers, recoveries, auction
  contexts, participants, and draws by league and due boundary;
* pending trades by team and expiry;
* season rollover attempts and successful manifests by league, Entry Draft,
  source season, target season, and occurrence;
* draft picks by draft and owner;
* matchup weeks and results by season;
* unread notifications by user;
* activity by league and timestamp;
* due jobs by status and scheduled time.

Final indexes must be verified against actual query plans.

Schema version `34` pins the measured Candidate-eligibility indexes as:

| Index | Exact columns and predicate | Query purpose |
| --- | --- | --- |
| `free_agent_draft_recoveries_league_player_status` | Non-partial `(league_id ASC, player_id ASC, status ASC)` | League/player-scoped active-recovery quarantine probe |
| `ownership_events_candidate_release_by_player` | Partial `(league_id ASC, player_id ASC, occurred_at_ms DESC, id DESC)` where `event_type IN ('fantasy_elc_declined', 'unsigned_prospect_rights_released')` | Candidate-blocking release probe; descending event time and ID provide stable newest-first order without a temporary sort B-tree |
| `draft_eligible_players_rights_release_reentry` | Partial `(league_id ASC, player_id ASC, rights_release_event_id ASC, eligibility_snapshot_id ASC)` where `eligibility_reason = 'rights_release_reentry'` | Correlated exact-release approval lookup and confirmed-snapshot join |

Additive migration `0034_add_candidate_eligibility_search_indexes.sql` is
`1,158` bytes with lowercase SHA-256
`9347331419ada113707a4e71ef87c578ddd3cd0bd4ddb9578164f08b3307bb36`.
It adds only those indexes and advances
`application_metadata.data_model_version` from `33` to `34`; it adds no table
or trigger and changes no existing row. Therefore the schema-33 inventory is
unchanged at `127` application tables, `128` tables including
`schema_migrations`, `127` repository-catalog entries, `45` post-reset
require-empty tables, `82` signed-reset-policy tables, and `63` installed
`BEFORE DELETE` guards. Fresh `1 -> 34` and exact `33 -> 34` tests must prove
the index definitions and measured plans as well as database integrity and
foreign-key health.

---

# Part 15 - Lifecycle and Deletion

## Normal Lifecycle

Users, memberships, leagues, seasons, contracts, transactions, and operations use explicit statuses rather than generic hidden soft-delete flags.

Completed historical records remain queryable unless an approved destructive product workflow says they are erased.

---

## Team Erase

The approved team erase:

* is allowed only after Entry Draft completion, or an approved no-draft
  transition, and before automatic FAD readiness opens Candidate Cards;
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
* canonical final-standings hash, counts, exact result-version links,
  single-current designation, immutable rows, and legacy non-qualification;
* atomic `T-097` result correction plus replacement final snapshot, including
  every late-failure rollback seam;
* scheduled Entry Draft-start rollover blockers, exact retry occurrence,
  successful manifest evidence, and proof that competition-season end alone
  changes no contract year;
* first-commit-wins on-clock trade, manual selection, and timeout races;
* automatic all-card-or-no-card FAD readiness, adaptive help timing,
  carryover synchronization, and whole-card structural/cap exclusion;
* private final-hour nomination queue activation and extension-boundary
  creation;
* restricted current-improvement eligibility, permanent removal, mandatory
  fallback, fallback floor, and FAD-only draw commitment/reveal;
* FAD completion plus Week 1 schedule recovery atomicity and stale schedule-job
  rejection, including removed week/matchup evidence, replaced-versus-cancelled
  job effects, and DST-safe local-Monday movement;
* immutable T-095/T-096 schedule command results and exact replay after later
  schedule generations;
* canonical schedule-recovery and late-lock observation/exclusion hashes with
  fixed vectors and sealed-child integrity;
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
- [x] Competition-season end leaves current contract and obligation years
  unchanged as Pending Rollover; only scheduled Entry Draft-start rollover
  advances or expires them.
- [x] Successful season rollover has one immutable root and complete
  per-effect manifest; blocked attempts preserve diagnostics but no partial
  season, contract, ownership, obligation, trade, draft, or trading effect.
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
- [x] Entry Draft scheduling binds one planned target season, target calendar,
  start occurrence, and rollover; draft and trading open only after that
  transition succeeds.
- [x] On-clock trade acceptance, manual selection, and timeout share one
  compare-and-swap boundary and leave no partial loser effect.
- [x] Automatic FAD readiness creates every card and job together or none,
  and a retry cannot author opening or schedule parameters.
- [x] Candidate Card legality is whole-card state; an unresolved carried-roster
  structural conflict or an over-cap projection excludes every new candidate
  without deleting or reordering stored carryovers or offers.
- [x] Final-hour FAD nominations are private durable queues, restricted
  no-improvement creates a fresh fallback, and equal-chance draws exist only
  for FAD auctions.
- [x] FAD completion and any required whole-Monday Week 1 recovery are one
  transaction, preserve removed week/matchup and replaced/cancelled-job
  evidence, and gate generation-bound matchup and baseline jobs. That gate is
  necessary but not sufficient: the preseason FAD-only staging candidate keeps
  the shared automatic matchup-occurrence runner disabled.
- [x] Player statistics store raw integer categories and calculated FP hundredths.
- [x] Failed stat refreshes never overwrite the last valid totals.
- [x] Matchup weeks persist every approved boundary rather than recalculating historical timestamps.
- [x] A team has at most one matchup or bye assignment per week.
- [x] Matchup roster locks and locked players are immutable after creation except through versioned technical recovery.
- [x] Late locks use a durable fresh NHL game-state observation and one sealed,
  canonical-hashed exclusion root whose children cannot be appended later.
- [x] Matchup corrections append result versions rather than overwriting prior results.
- [x] Standings are derived from official result versions and regular-season
  completion requires an explicitly finalized canonical versioned snapshot.
- [x] A canonical final snapshot preserves deterministic result-set hash,
  exact result-version links, standings-rule version, completeness counts,
  participant count, and succeeded finalization evidence.
- [x] Legacy snapshots without complete finalization provenance do not qualify
  for season rollover.
- [x] Final snapshot content and children are immutable; controlled correction
  preserves the prior snapshot and inserts a complete replacement.
- [x] After finalization, a matchup-result correction and replacement
  canonical standings snapshot commit atomically or not at all.
- [x] Standings rows cannot be directly edited as independent league truth.
- [x] League Activity, notifications, commissioner corrections, administrator requests, freezes, and operational events use separate tables.
- [x] Listing notifications is read-only; marking one read is an explicit write.
- [x] Entry Draft League Activity contains only draft start, lottery results, and draft completion.
- [x] Idempotency requests are scoped by actor, league, operation, and client key.
- [x] Every successful T-080 through T-083 request has one immutable
  command-result row whose stored status and canonical hashed response drive
  exact replay; failed requests have none.
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
docs/04-technical-specs/FREE_AGENT_DRAFT.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/07-testing/TESTING_STRATEGY.md
docs/08-operations/BACKUP_AND_RESTORE.md
```
