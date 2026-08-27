# Hundo Leago Documentation

## Purpose

This directory contains the canonical documentation for the Hundo Leago project.

The documentation is shared by both repositories:

* `hundo-leago` — React and Vite frontend;
* `hundo-leago-backend` — Node.js and Express backend.

The canonical documents live in the frontend repository so there is only one approved copy of each shared project rule.

Codex and contributors should use this index to find the documents relevant to a task.

Do not rely on old chat history, memory, archived files, or assumptions when an approved document exists.

---

# Quick Start

Before planning a meaningful change:

1. Read the applicable repository’s `AGENTS.md`.
2. Read this documentation index.
3. Read the project foundation documents required by the task.
4. Read the relevant league rules.
5. Read the relevant product specification.
6. Read the relevant technical specification.
7. Inspect the existing code and tests.
8. Make the smallest safe change that satisfies the approved task.
9. Run the required verification.
10. Report changed files, results, risks, and documentation effects.

Codex should not read every project document for every task.

Use the routing guidance in this file to load only the relevant context.

---

# Document Authority

When approved documents conflict, use the following authority order:

1. Production and data-safety requirements
2. Current operating mode
3. Approved league and scoring rules
4. Approved product specifications
5. Approved technical specifications
6. Current project scope
7. North Star
8. Active roadmap
9. Active work plan
10. Existing code
11. Known issues
12. Future backlog
13. Ideas and archived documents

Existing code is evidence of current implementation, but it is not automatically proof of approved behaviour.

Old or archived documents must not override active canonical documents.

When two authoritative documents contradict one another:

1. Stop before changing dependent behaviour.
2. Identify the exact documents and conflicting statements.
3. Explain how the conflict affects the task.
4. Ask Grae to approve the correct rule.
5. Update the documentation before continuing implementation.

Do not silently choose the easiest rule to implement.

---

# Project Foundation

Directory:

```text
docs/01-project/
```

These documents describe the overall product, present condition, approved scope, operating safety, and terminology.

## North Star

Path:

```text
docs/01-project/NORTH_STAR.md
```

Defines:

* what Hundo Leago is;
* the product’s identity;
* the product-season direction;
* Season 2’s broad capabilities;
* non-negotiable principles;
* long-term product direction.

Read when:

* beginning a new major feature;
* making an architectural decision;
* evaluating whether work fits the product;
* writing a new product or technical specification.

Do not use the North Star as the source for exact league formulas or implementation steps.

## Current State

Path:

```text
docs/01-project/CURRENT_STATE.md
```

Defines:

* what is currently implemented;
* current repositories and hosting;
* existing features;
* incomplete systems;
* known technical limitations;
* current development branches and risks.

Read when:

* beginning work in an unfamiliar area;
* planning a migration or refactor;
* determining whether a feature already exists;
* comparing planned behaviour with current behaviour.

Update when a major milestone materially changes the actual implementation.

## Project Scope

Path:

```text
docs/01-project/PROJECT_SCOPE.md
```

Defines:

* launch-critical Season 2 work;
* work required later during the season;
* optional work;
* explicitly deferred work;
* rules preventing uncontrolled feature expansion.

Read when:

* deciding whether work is currently approved;
* planning the active roadmap;
* considering extra features adjacent to a task;
* reviewing whether a change is required for launch.

Codex must not implement deferred or optional features merely because they seem useful.

## Operating Mode

Path:

```text
docs/01-project/OPERATING_MODE.md
```

Defines:

* whether the project is in-season or off-season;
* acceptable development risk;
* production-data preservation requirements;
* resettable records;
* protected records;
* destructive-operation authority.

Read before:

* database work;
* production deployment;
* data migration;
* reset operations;
* major refactors;
* backup or restoration work;
* any task that could modify persistent data.

Never infer the operating mode from the date.

## Glossary

Path:

```text
docs/01-project/GLOSSARY.md
```

Defines canonical project terminology.

Read when:

* designing database tables;
* defining APIs;
* writing product specifications;
* writing technical specifications;
* a task uses ambiguous project language;
* terms such as membership, season, roster, contract, lock, snapshot, or rollover affect implementation.

The Glossary does not need to be read in full for every small task.

Use it when terminology affects correctness.

---

# League Rules

Directory:

```text
docs/02-rules/
```

These documents define rules shared across several features.

The approved League Rules, Scoring Rules, and Permissions documents exist:

```text
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
```

## League Rules

The approved document defines shared rules such as:

* salary cap;
* active, bench or inactive, injured-reserve, and prospect rosters;
* forward and defence slot limits;
* contract length and value precision;
* injured reserve;
* retention limits;
* buyout rules;
* illegal-roster matchup treatment;
* tradeable asset types;
* transaction timing;
* season-wide restrictions.

Read when a task affects multiple league features.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with the relevant product and technical specifications.

## Scoring Rules

The approved document defines:

* fantasy-point formulas;
* standings points;
* matchup ties;
* position treatment;
* result calculations;
* standings sorting;
* scoring corrections and failure behaviour.

Read for statistics, matchups, standings, and playoff work.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with League Rules and the relevant product and technical specifications.

## Permissions

The approved document defines:

* platform-administrator authority;
* commissioner authority;
* manager authority;
* unauthenticated access;
* backend authorization requirements.

Read for accounts, leagues, teams, commissioner tools, and every write endpoint.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with the relevant product and technical specifications.

---

# Product Specifications

Directory:

```text
docs/03-product-specs/
```

Product specifications define **what a feature must do** from the user and league perspective.

The Leagues and Teams, User Accounts, Rosters, Contracts, Auctions, Trades, Matchups, Standings, Entry Draft, Free Agent Draft, and Commissioner Tools specifications are approved. Product-specification paths include:

```text
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/USER_ACCOUNTS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/STANDINGS.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/03-product-specs/FREE_AGENT_DRAFT.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
```

Read the matching product specification whenever changing user-visible behaviour or league rules for that feature.

A product specification should define:

* purpose;
* users and permissions;
* normal workflow;
* business rules;
* validation;
* timing;
* edge cases;
* commissioner controls;
* user-interface expectations;
* definition of done.

Product specifications should not unnecessarily dictate JavaScript function names or exact file organization.

## Leagues and Teams

The approved specification defines:

* league creation and lifecycle;
* commissioner assignment;
* team creation and administration;
* manager assignment and transfer;
* public roster access;
* league settings and setup;
* user-interface, validation, activity, and testing requirements.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with the related rule and technical specifications.

## User Accounts

The approved specification defines:

* self-service and platform-administrator account creation;
* sign-in, sign-out, and single-session behaviour;
* password change and password reset;
* account deactivation and reactivation;
* account identity, privacy, validation, audit, and testing requirements;
* approved account security and failure behaviour.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with Permissions and the related technical specifications.

## Rosters

The approved specification defines:

* active, bench, injured-reserve, and prospect roster categories;
* roster ownership, position normalization, movement, legality, and cap interaction;
* prospect signing and injured-reserve workflows;
* the separation between normal rosters and matchup snapshots;
* public display, commissioner corrections, activity, validation, and testing;
* approved product workflows and future-update boundaries.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with League Rules, Contracts, and the related technical specifications.

## Contracts

The approved specification defines:

* contract value, term, AAV, creation, transfer, and expiration;
* fantasy ELC creation;
* retained-salary records and cap treatment;
* buyout locks, penalties, and player release;
* rollover, public display, commissioner corrections, activity, validation, and testing;
* approved product workflows and future-update boundaries.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with League Rules, Rosters, and the related technical specifications.

## Auctions

The approved specification defines:

* player eligibility and weekly and seasonal auction timing;
* bid value, term, edit, blind visibility, ranking, and anti-bluff pricing;
* deterministic contract creation and roster assignment;
* commissioner controls, recovery, activity, validation, and testing;
* resolved-bid visibility through League Activity.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with League Rules, Permissions, Contracts, and the related technical specifications.

## Trades

The approved specification defines:

* tradeable assets, simultaneous proposals, expiry, and deadline behaviour;
* player, prospect, draft-pick, contract, retention, buyout-penalty, and Future Considerations transfer;
* acceptance, automatic cancellation, commissioner reversal, and correction;
* visibility, activity, validation, and testing;
* approved counter, trade-block, and two-team workflows.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with League Rules, Permissions, Contracts, Rosters, and the related technical specifications.

## Matchups

The approved specification defines:

* NHL-calendar-derived regular-season schedule generation and matchup-week states;
* the approved one-week, one-week, and two-week Hundo Leago playoff calendar;
* scoring baselines, roster locks, late legality, and snapshot immutability;
* live scoring, source-data freshness, finalization, and rollover;
* result corrections, commissioner recovery, visibility, failure handling, and testing.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with League Rules, Scoring Rules, Rosters, and the related technical specifications.

## Standings

The approved specification defines:

* authoritative finalized-result inputs and approved calculations;
* official ordering, tied-team ranks, and visual presentation;
* current and historical seasons, byes, incomplete results, and team history;
* read-only derivation, explicit rebuilds, correction propagation, failure handling, and testing;
* low-noise in-app notifications for completion, corrections, and commissioner-actionable failures.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with Matchups, Scoring Rules, and the related technical specifications.

## Entry Draft

The approved specification defines:

* inherited prospect-right, fantasy ELC, traded-pick, and trading-window rules;
* playoff-finalist placement, two weighted lottery draws, four linear rounds, and four draft classes;
* most-recent NHL Entry Draft eligibility, prior-rights re-entry, and the exclusion of goalies;
* live setup, timing, selections, automatic timeout picks, private queues, and completion;
* immutable completed selections, traded-pick clock resets, activity, notifications, validation, and testing;
* deferred development during the season before the first Season 2 Entry Draft.

The file is marked:

```text
APPROVED
```

Implementation may begin during the season under the approved deferred schedule and must be complete before the first Season 2 Entry Draft is used.

The Entry Draft requires a complete persisted player catalogue with stable
identity, display name, effective position, and draft-eligibility evidence. It
does not require current, live, or prior-season player statistics.

## Free Agent Draft

The approved specification defines:

* the annual preseason lifecycle and approved no-draft transitions, including
  the original league's initial Season 2;
* private Candidate Cards with 12 forward, 6 defence, and 4 optional Bench slots;
* locked multi-year contract carryover and summer synchronization;
* manager-requested commissioner view and edit access during the final 48 hours;
* the commissioner- or administrator-selected first-matchup start, the
  automatically derived one-week deadline with no fixed annual date,
  league-wide reveal, total-first/AAV-second allocation, and restricted
  auctions for equal totals with equal terms;
* daily rapid auctions, the one-hour creation cutoff, and transition to ordinary weekly auctions;
* navigation, history, recovery, notifications, validation, testing, and the presentation-video boundary.

The file is marked:

```text
APPROVED
```

The core Free Agent Draft is required before every season. Its dedicated
technical specification is approved at
`docs/04-technical-specs/FREE_AGENT_DRAFT.md`. Its completed M7-25
implementation sequence is preserved at
`docs/06-work-plans/archive/M7-25_FREE_AGENT_DRAFT_IMPLEMENTATION_SEQUENCE.md`,
and its exact isolated-staging closure is recorded at
`docs/07-testing/release-runs/FAD_AUCTIONS_PLAYERS_UX_2026-08-18.md`.
`FAD-01` through `FAD-18` and M7-25 are complete through isolated staging on
schema `52`; production remained untouched and unauthorized. M7-26 is now the
sole active work plan at `docs/06-work-plans/ACTIVE_WORK_PLAN.md`. Its current
candidate targets schema `54`, registers `123` runtime routes, and has a
conceptual target catalogue from `T-001` through `T-148`.

Release `HL-20260822-1` is now `BLOCKED / ABORT-RECOVERED; VERIFIED HELD RECOVERY COMPLETE`;
M7-26 remains the sole active plan. Grae requested and approved fresh release
`HL-20260823-1` at `2026-08-23T23:23:29.877Z`; it is minted under the full hold
with B-prime local verification, backend publication, held deployment/runtime,
fresh fixture preparation/replay, held postflight, helper local verification,
corrected helper publication, and controlled-unhold runtime complete. Phase one
later reached accepted/published state, but operator sequencing selected
`STRICT_STOP`; phase two never began and full re-hold now passes. Abort-v2 B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb` remains both backend HEAD and
`origin/staging`; V3 selected the verified target with exactly one provider
mutation and returned current sole newest/`LIVE` Render deploy
`dep-da7d857avr4c73bnna90` on that exact B2. Published f17b/V4 was separately
bound but never consumed; its diagnostic used the wrong opaque continuation
token and produced no provider evidence, action artifact, or capture sentinel.
Published dceb/V5 then failed its binding launch before the runner body or any
write and is exactly
`PUBLISHED_UNBOUND_BINDING_LAUNCH_FAILED_PREWRITE_UNCONSUMED_RETIRED`; it must
not be retried or rebound. O23, O23A, and O23B remain unchecked pending O23C,
and O23C remains unchecked. Only the zero-provider-mutation V6/O23C
continuation is authorized next after this exact-nine authority publication and
a separate successful V6 binding.
Exact earlier held deploy `dep-da5sh0e417fc738i254g` passed after all
`3,503/3,503` hosted tests, build/startup, zero-error, held-
health, and external read-only gates passed. Frontend build
`4dfe12d1366314e3d9df722c50771324647743c9` and sealed Netlify baseline
`6a8a3880f946cc39a2bf2bb6` pass. For the blocked predecessor, exact backend
candidate
`8e313902feefcd683b0f5edd746a9dd2a9029a18` was published on backend
`origin/staging` at its recorded boundary and passed its complete local gate.
Held Render deploy
`dep-da5l8drtqb8s73ar74sg` passed all `3,503/3,503` hosted tests while league
traffic remained blocked by the full hold. Fresh fixture preparation/replay
and helper publication passed, but a physical `.html` browser entry
immediately produced `STRICT_STOP / ORIGIN_GUARD /
EXACT_STAGING_ORIGIN_REQUIRED` before session, arming, action, API request, or
write. The tab was closed, the hold never lifted, and strict smoke never began.
Exact `prepared_only` abort plan/execute/replay materialized the clean target
with zero authoritative-database mutations; sealed-baseline deploy
`6a8b6b25126dabed39fa404d` retired the helper. Only `DATABASE_PATH` was then
changed to the clean target. Held cutover deploy
`dep-da5mmpu417fc73807ptg` was the then-newest `LIVE` deploy on exact B at the
recovery boundary after all `3,503` hosted tests and its startup/held-health
gates passed. Corrected post-cutover
verifier v2 returned `HL_POST_CUTOVER_TARGET_VERIFIED`, proving the source,
authoritative clean target, abort receipt, full hold, target identity/integrity,
zero sessions, fixture/transfer absence, and owned scratch cleanup. Fresh backup
`e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` and its separate plaintext/integrity/
foreign-key verification passed. That predecessor's evidence is
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-22.md`.

The current release ledger is
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-23.md`. It binds F
`4dfe12d1366314e3d9df722c50771324647743c9`, held starting B
`8e313902feefcd683b0f5edd746a9dd2a9029a18`, clean pre-fixture/backup boundary
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3`
at `37105664` bytes / `cf3ca07d...`, and fresh target ending in
`HL-20260823-1.sqlite3`, which was absent at mint and is now materialized and
selected at `37105664` bytes / `cf3ca07d...`. Verified backup
`e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` binds its exact manifest/storage
objects, `2026-08-23T22:56:20.203Z` creation time, encrypted hash
`e6c6269f...`, checksum `54df36b9...`, plaintext `cf3ca07d...`, and exact
incident-preservation metadata. B-prime
`234547e4d8453b7515fc081ea6ebe4c2d022dc54` passes its exact two-file,
`57/57` focused, `443`-suite / `3,503`-test complete, check, dependency, and
backend-publication gates. Its held deployment/runtime gate also passes on
exact deploy `dep-da5sh0e417fc738i254g`. The clean starting source boundary
remains `37105664` bytes / `cf3ca07d...` and backup `e735e6a4...` remains its
verified restore point. Fresh prepare/replay passed at `729` then `0` writes;
held verifier v2 then proved the pre-action fixture-bearing source at `37744640`
bytes / `b4163695...`, target family absent, authoritative source unopened,
scratch mutations `0`, and cleanup complete. Frontend helper commit
`e898e72272e5a052867832dcf9f128e5b8d5730e` passes its exact nine-file local
gate: helper digest `43cd106d...`, sealed original `2d8069ca...`, additive
overlay `c6b553c5...`, exact marker/runtime identities, syntax, both verifiers,
Vitest `14/14`, lint, and byte-identical rebuild all pass. API deploy
`6a8bfef3ac0ff74a373404d8` was rejected before browser or unhold because its
header rules were absent. Corrected CLI deploy `6a8c006abe46c8fb6269c40c` was
then current/`READY`, processed all six helper header rules, deployed no
functions, and passed exact canonical/immutable bytes and headers. Fresh tab `1600151197`
then reached `READY_NO_SESSION_REQUEST` with empty query/mutation caches and
exactly the pinned CSS and JavaScript observed; no API, session, action, or
write ran. Exact controlled-unhold deploy `dep-da60sl0jo6nc73e0cfu0` passed on
B-prime after hosted `3,503/3,503`, build/startup, zero-error, exact unheld
runtime, health, unauthenticated CORS/cache, and mounted-route gates. Frozen v2
then emitted
`HL23_UNHELD_PRE_SMOKE_SOURCE_VERIFIED` at `2026-08-24T10:42:47.380Z`,
re-proving source `37744640` / `b4163695...`, WAL `0`, SHM `32768`, target-
family absence, authoritative source unopened, and cleanup. Phase-one proposal
`e00e0512-4a20-47fd-ad74-0986dd4abd27` reached accepted state; publish event
`974342b5-94e5-42d8-af20-9e07c35bc847` and exact replay passed at
`fresh 2` / `replay 0`. Chrome was Admin rather than required Manager A during
publication, selecting `STRICT_STOP`; phase two never began and no retry is
allowed. Re-hold deploy `dep-da6cu8h42hec738f2al0` became sole newest/`LIVE` at
that boundary after hosted `3,503/3,503`, build/startup, zero-error,
health/readiness, and maintenance-blocked ordinary-route gates passed; it later
deactivated at the verified held-B2 handoff.

The 2026-08-23 run record is the sole current recovery authority. The original
`18060`-byte / `9c323005...` main-only abort verifier ran and safely failed its
bundled family fence on the nonempty authoritative source WAL/SHM; the target,
target WAL/SHM, receipt, and work area were absent. That verifier did not bind
source/target rollback-journal absence; the new B2 derivative must. It did not
authorize checkpointing, sidecar removal, abort-v1, or a main-only copy.

Replacement B-prime diagnostic
`wal-aware-abort-source-verifier.sh` is `24132` bytes / `685` LF lines /
SHA-256 `c036a2b847fe97c8ff8eade5a633d2d6815404344e2f683e241edce4f596e51e`;
its `2747`-byte result has SHA-256
`deda5da68dabed9225b25165727e9c36d6cf46875947596e2b0f1b61afec1a9a`
and code `HL23_ABORT_WAL_PREFLIGHT_SOURCE_VERIFIED`. It binds main
`37744640` / `b4163695...`, WAL `568592` / `0dde02d1...`, and SHM `32768` /
`e03d9ff8...`, zero holders, exact `to_b_accepted` / `published` / `none`,
private copied-family recovery, target-family absence, and cleanup. That
diagnostic raw-read and copied the source SHM byte-for-byte into owned scratch;
SQLite opened only the private scratch family, whose main/WAL stayed unchanged
while its SHM changed. SQLite never opened the authoritative source paths.

Abort-v2 is now minted and published as exact backend commit B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb`, direct child of B-prime
`234547e4d8453b7515fc081ea6ebe4c2d022dc54`, with exact tree
`0a6a928d8f6308aa5aadd2031c71769164c1cfb7`. It changes only the implementation
(`369` insertions / `18` deletions, Git blob
`4a198c71554b7e7c5fc8ee481cd79b51c1ef799f`, SHA-256
`d49c870bdf300983a0b57577ce68e0647ba6ff318ccf55fe11a5596016671889`)
and foundation test (`830` insertions / `2` deletions, Git blob
`53ce37cd04e48eb42323bab914d71ef3933c2c63`, SHA-256
`3d9714ca93efa573593d983c992032fc4c473f2df23fd85395c9ed6d2873155c`).
The `57541`-byte canonical raw diff has SHA-256
`eb963d6b95311eeacc282ce9f8f743a83d4eae32f28922e2668ddcbfcbe84dc0`.
Diff/syntax checks, focused `72/72` before the final narrow wrapper, and exact-
final affected `5/5` pass;
backend HEAD and `origin/staging` equal B2 and the backend worktree is clean.
The approved one-key merge produced then-sole newest/`LIVE` exact-B2 deploy
`dep-da6ghj67bikc738hbbv0`. Hosted `443` suites / `3,519` tests all passed;
build/startup, zero-error, bare-maintenance HTTP, exact runtime/source-family,
and zero-holder gates passed. At that gate Netlify remained unchanged on then-
current/`READY` `6a8c006abe46c8fb6269c40c`.

Post-live shell proof returned `HL23_B2_POST_LIVE_HELD_FAMILY_VERIFIED` at
`2026-08-25T04:11:28.902Z`, binding `20` runtime keys, nine absent provider
fields, three stable snapshots, two zero-holder scans, downstream absence, and
current namespace-local device `66313` with every other source-family field
unchanged. Historical device `66332` belongs only to the earlier B-prime
container namespace.

Fresh verifier `post-b2-abort-v2-source-verifier.sh` is `35494` bytes / SHA-256
`6d5cfe50ecee26199c3f0a2c922c99a84d3f97e2fe98b6256b36583e6e98b70c`;
its one-shot `6032`-byte result SHA-256
`80c7cadec0664625b0c4fc6eb86fd49f5e58842534fdebbc1aead63f5fe65976`
returned `HL23_ABORT_B2_V2_SOURCE_PREFLIGHT_VERIFIED`. Local syntax/static/cold
audit passed. It proves six stable source boundaries, two eight-process/`85`-
descriptor zero-holder scans, main+WAL-only scratch and private SHM creation,
unchanged source and scratch main/WAL, exact integrity/schema/semantic state,
zero changes, journal/downstream absence, and cleanup.

One exact abort-v2 plan ran once after the fresh-shell guards and passed at
`0/0`. Its accepted plan ID is
`release-qa-strict-restore-abort-v2-03f37c3c16ee7cc632c49a6b87f23819b398146fd8a0fe1c6aff5cbdcca47456`.
Ignored stdout is `4777` bytes / SHA-256 `cef33b8f...`; the canonical result is
`4146` bytes / SHA-256 `30441740...`; final cleanup-aware capture metadata is
`1809` bytes / SHA-256 `ec338025...`; stderr was empty. Contract `2`,
`main-wal`, exact classifier/WAL/family binding, absent target, the unchanged
`.strict-restore-work-v1` literal and exact six-field temporary-work object,
and both mutation counts `0` pass. Verified remote mode-`0600` captures were
removed only after local verification.

Published execute-only authority
`fd31b1f41b7c16521cf0eceb2c4af4a33a242636` was followed exactly once. Fresh
action-time preflight passed, and the sole `969`-byte command has SHA-256
`bad1c78f0867977c65d457684ee3440c3707a48977694364470038a9cad4f275`.
Its complete capture envelope is `7318` bytes / `14733405...`; stdout is `4902`
bytes / `74610bcc...`; stderr is empty / `e3b0c442...`; canonical result is
`3896` bytes / `3d67f676...`. The result returned
`RELEASE_QA_STRICT_RESTORE_ABORT_MATERIALIZED`, contract `2`,
`replayed: false`, `0/2`, source preserved, and target verified at
`cf3ca07d...` with canonical receipt `24adf2d...`. The auxiliary status file's
sealed three-byte literal `0\n` / `101770a4...` is a serialization defect, not
execution ambiguity: native wrapper status was numeric `0`, no signal/error,
and exact postflight passed. The status artifact was not repaired.

Postflight `2059` bytes / `fdd169d5...`, held probes `1136` bytes /
`2d634d0d...`, remote-capture cleanup `928` bytes / `299496df...`, and final
metadata `5566` bytes / `59cb7e89...` bind unchanged source family, regular
mode-`0600` target/receipt, absent source journal and target sidecars/journal/
work, zero holders, full hold, unchanged Render/Netlify, and verified remote
capture removal. First-execute authority is consumed and cannot be rerun.

The one authorized byte-identical replay is now `PASS / AUTHORITY CONSUMED /
NO RERUN`. Fresh action-preflight script/result are `9561` / `2837` bytes with
SHA-256 `7f9f378a...` / `b454c5a6...`; exact B2, `20` runtime keys, nine absent
providers, three snapshots, and two ten-process/`92`-descriptor zero-denied/
zero-holder scans passed. The exact `969`-byte / `bad1c78f...` command
dispatched once with native status `0`. Wrapper/envelope are `4098` / `7349`
bytes (`95cf1aa5...` / `63e4e662...`); stdout is `4905` / `65431c4c...`,
stderr `0` / `e3b0c442...`, corrected replay status `2` / one LF / hex `30 0a`
/ `9a271f2a...`, and canonical result `3899` / `8b21edc8...`. Contract `2`,
`replayed: true`, `0/0`, the exact no-work object, unchanged source family, and
byte-identical target/receipt pass. The first-execute three-byte literal `0\n`
wart remains sealed and unrepaired.

Postflight script/result are `12559` / `3047` bytes (`c2e034de...` /
`07ad847d...`); three snapshots, five absences, and two ten-process/`92`-
descriptor zero-denied/zero-holder scans passed. Probe result `995` /
`a31a8877...` returned live/ready `200`, session/leagues/current-FAD `503
SERVICE_MAINTENANCE`, `no-store`, and no `Set-Cookie`. Render remained sole-
newest/`LIVE` exact-B2 `dep-da6ghj67bikc738hbbv0`, no newer/pending deploy,
auto-deploy off, and zero error/`5xx` logs; Netlify stayed unchanged ready
`6a8c006abe46c8fb6269c40c`, six headers/two redirects/zero functions. Cleanup
script/result `11629` / `4023` (`9a908635...` / `67b1adbe...`) removed exactly
the three remote captures and preserved protected files. Final metadata `6012`
/ `b2f706da...` records `HL23_ABORT_V2_REPLAY_EVIDENCE_COMPLETE`.

The now-consumed helper-retirement-only dispatch authority was published in
exact commit `7dd9075f18a001d85fb5783b5b4dfae4a3fb19fb`, based on replay-evidence
commit `296cd690382b87a1cd4647ca98a24f14e98ee8ff`. It authorized exactly one
staging Netlify CLI publication. That dispatch ran once and must not be retried.
The consumed contract bound site `95af8aa7-0b13-4954-af6d-855762acb147` and
authorized replacement of then-current/ready helper deploy
`6a8c006abe46c8fb6269c40c` only with title
`HL-20260823-1-abort-v2-retire-helper-baseline`, using the immutable `33`-file /
`1932120`-byte / `2d8069ca1aa61e02b5be14b09b97ded73b8363ae5e699c0e712f32026903ae6c`
original-dist and exact `1664`-byte /
`7720d21350b54735e11c86fd6fd4282887c7ce6e92b7d33ce9fdf788f66db422`
five-header baseline config. Tracked `netlify.toml` remains untouched.

The pre-dispatch requirements below are retained solely as the consumed
dispatch contract; their imperative wording grants no new action authority.
A new ignored, local-only preflight must be authored, frozen, and cold-audited
before dispatch. It must independently verify original-dist and frozen ignored
source config
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-control\netlify.toml`
at the exact baseline seal above. It must prove `E:\Codex` is an existing plain,
non-reparse real directory and `E:\Codex\temp` is absent. The tracked helper-era
retired-baseline verifier is not authority for this no-tracked-edit path.

The wrapper must exclusively create owned `E:\Codex\temp`, external runtime
control `E:\Codex\temp\HL-20260823-1-helper-retirement-control-v1`, and separate
profile `E:\Codex\temp\HL-20260823-1-helper-retirement-profile-v1`. Owner SID on
each created directory and copied file must equal the wrapper process token's
user SID. The control receives only a byte-for-byte copy of the frozen source
as `netlify.toml`; at CLI start its entire inventory must be that one regular,
non-reparse file at `1664` bytes / `37` LF / zero CR / five headers /
`7720d21350b54735e11c86fd6fd4282887c7ce6e92b7d33ce9fdf788f66db422`.
All six CLI-scanned function/edge directories under it must be absent.

The action route is pinned to portable Node `24.14.1` at
`E:\hundo-leago\.tools\node-v24.14.1-win-x64\node.exe` (`91426304` bytes /
`58e74bf02fc5bbacc41dcb8bef089961cd5bddd37830b87784e4fc624d145d1f`), directly
executing global Netlify CLI `27.0.0`
`C:\Users\graem\AppData\Roaming\npm\node_modules\netlify-cli\bin\run.js`;
`package.json` is `7358` bytes /
`b5f0e60f06b774e0d087c735557e19f47ec25c56e9d5695b045f28a188e56156`
and `bin/run.js` is `2800` bytes /
`e39432e46703049b6769e17c0a7a8f1748c345100a1f934d8a6c7076001d426c`.
No npm, npx, shell, PATH-based CLI resolution, alternate runtime, `--cwd`, or
empty `.git` sentinel is allowed. Netlify CLI `27.0.0` deploy exposes no
`--config` option; the child physical/logical cwd is the exact external control,
so CLI config and repository-root discovery must resolve there, outside the repo.

The child must use the fresh external profile
`E:\Codex\temp\HL-20260823-1-helper-retirement-profile-v1`
for `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `TEMP`, `TMP`,
`XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, `XDG_DATA_HOME`, `XDG_STATE_HOME`, and
`XDG_RUNTIME_DIR`, and set `CI=1`.
`NETLIFY_AUTH_TOKEN` may exist only in the child environment in memory and must
never enter argv, captures, or persistent files. The shell-free argv is exactly
`deploy --site 95af8aa7-0b13-4954-af6d-855762acb147 --dir E:\hundo-leago\.netlify\strict-release-HL-20260823-1\original-dist --no-build --skip-functions-cache --prod --message HL-20260823-1-abort-v2-retire-helper-baseline --json`.
Repo-ignored capture/dispatch root
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-captures`
must be absent and then acquired by exclusive creation as the one-shot lock;
any dispatch or residue consumes the authority and forbids retry.

The helper-retirement action preflight process environment has exactly the eight
keys `SystemRoot,WINDIR,ComSpec,PATHEXT,PATH,CI,NO_COLOR,NO_UPDATE_NOTIFIER`.
`SystemRoot`, `WINDIR`, `ComSpec`, and `PATHEXT` are copied exactly from the
wrapper process, with respective fallbacks `C:\Windows`, `C:\Windows`,
`C:\Windows\System32\cmd.exe`, and `.COM;.EXE;.BAT;.CMD`; `PATH` is exactly
`C:\Program Files\Git\cmd;C:\Windows\System32;C:\Windows`, and the constants are
`CI=1`, `NO_COLOR=1`, and `NO_UPDATE_NOTIFIER=1`. The deploy child environment
has exactly the 22 keys
`SystemRoot,WINDIR,ComSpec,PATHEXT,PATH,CI,NO_COLOR,TERM,NETLIFY_TELEMETRY_DISABLED,NO_UPDATE_NOTIFIER,NETLIFY_AUTH_TOKEN,HOME,USERPROFILE,APPDATA,LOCALAPPDATA,TEMP,TMP,XDG_CONFIG_HOME,XDG_CACHE_HOME,XDG_DATA_HOME,XDG_STATE_HOME,XDG_RUNTIME_DIR`.
Its five system/path values are byte-identical to preflight; its constants are
`CI=1`, `NO_COLOR=1`, `TERM=dumb`, `NETLIFY_TELEMETRY_DISABLED=1`, and
`NO_UPDATE_NOTIFIER=1`. All eleven of `HOME`, `USERPROFILE`, `APPDATA`,
`LOCALAPPDATA`, `TEMP`, `TMP`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`,
`XDG_DATA_HOME`, `XDG_STATE_HOME`, and `XDG_RUNTIME_DIR` equal exact external
profile `E:\Codex\temp\HL-20260823-1-helper-retirement-profile-v1`.
`NETLIFY_AUTH_TOKEN` is memory-only in that exact child environment; every
unlisted variable is absent.

Persisted provider evidence is an allowlisted projection only; persisting raw
`getSite` or any other raw provider payload is forbidden. Both phases have
the exact top-level key set
`code,observedAt,releaseId,frontendAuthorityCommit,netlify,render,safety`.
PRE `netlify` keys are exactly
`siteId,siteName,canonicalOrigin,netlifyOrigin,currentDeployId,currentDeployTitle,currentDeployState,currentDeployPublishedAt,currentDeployOrigin,currentIsNewest,noPendingDeploy,headers,redirects,functions,edgeFunctions,buildSettings,automaticPublishFence,retirementTitleAbsent,activeDeployCount,inspectedDeployCount,newestFirst`;
POST `netlify` keys are exactly
`siteId,siteName,canonicalOrigin,netlifyOrigin,currentDeployId,currentDeployTitle,currentDeployState,currentDeployPublishedAt,currentDeployOrigin,currentIsNewest,noPendingDeploy,previousHelperDeployId,previousHelperNoLongerCurrent,retirementTitleMatchCount,activeDeployCount,headers,redirects,functions,edgeFunctions,buildSettings,automaticPublishFence,deployMethod,inspectedDeployCount,newestFirst`.
Both `render` projections have exactly
`workspaceId,serviceId,deployId,commit,state,soleNewestLive,noNewerOrPendingDeploy,autoDeploy,autoDeployTrigger,maintenanceHold,databasePath,targetInactive,applicationErrorLogs,request5xxLogs`.
PRE `safety` keys are exactly
`fullHold,replayAuthorityConsumed,replayRerunAuthorized,normalRestoreAuthorized,activationAuthorized,backupAuthorized,stagingReopenAuthorized,productionAuthorized`;
POST `safety` keys are exactly
`fullHold,helperRetirementComplete,replayAuthorityConsumed,replayRerunAuthorized,normalRestoreAuthorized,activationAuthorized,backupAuthorized,stagingReopenAuthorized,productionAuthorized`.
PRE must prove `currentIsNewest=true`, `noPendingDeploy=true`,
`retirementTitleAbsent=true`, `activeDeployCount=0`, `inspectedDeployCount=50`,
and `newestFirst=true`. POST must prove `currentIsNewest=true`,
`noPendingDeploy=true`, `previousHelperDeployId=6a8c006abe46c8fb6269c40c`,
`previousHelperNoLongerCurrent=true`, `retirementTitleMatchCount=1`,
`activeDeployCount=0`, `inspectedDeployCount=50`, `newestFirst=true`, and
`deployMethod=manual-cli`. PRE safety has `fullHold=true` and
`replayAuthorityConsumed=true`; every authorization field is false. POST adds
`helperRetirementComplete=true` and leaves those safety values unchanged.

The exact ordered HTTP `8/8` matrix is the canonical origin
`https://staging.hundoleago.com` followed by the new immutable origin
`https://<deployId>--hundoleago-staging.netlify.app`, each in path order `/`,
`/index.html`, `/assets/index-BFtuYVmF.js`, and
`/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e`. Every response is `200` and
has no `Set-Cookie`; `/`, `/index.html`, and the league path have exact
`Cache-Control: no-store`, while the asset has exact
`Cache-Control: public, max-age=31536000, immutable`. Every response must carry
the exact seven-header map whose canonical SHA-256 is
`a1ade439bda16fafea1afdd1360bb9ec906e598fc48ca989b7b5ffc6c3af0245`:
`content-security-policy=default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://api-staging.hundoleago.com https://hundo-leago-backend-staging.onrender.com https://api.hundoleago.com https://hundo-leago-backend.onrender.com; media-src 'self' data: blob:; connect-src 'self' https://api-staging.hundoleago.com wss://api-staging.hundoleago.com https://hundo-leago-backend-staging.onrender.com wss://hundo-leago-backend-staging.onrender.com https://api.hundoleago.com wss://api.hundoleago.com https://hundo-leago-backend.onrender.com wss://hundo-leago-backend.onrender.com; worker-src 'self' blob:; upgrade-insecure-requests`,
`cross-origin-opener-policy=same-origin`,
`cross-origin-resource-policy=same-origin`,
`permissions-policy=camera=(), display-capture=(), geolocation=(), microphone=(), payment=(), usb=()`,
`referrer-policy=strict-origin-when-cross-origin`,
`x-content-type-options=nosniff`, and `x-frame-options=DENY`.

The action gate also binds a fresh held-probe matrix under
`https://api-staging.hundoleago.com`: `/api/v1/health/live` and
`/api/v1/health/ready` each return `200` with exact body `{"status":"ok"}`;
`/api/v1/session`, `/api/v1/leagues`, and
`/api/v1/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e/free-agent-draft/f47032fd-57a2-443b-89a6-ce32894f2fc1`
each return `503` with exact body
`{"error":{"code":"SERVICE_MAINTENANCE","message":"Service is temporarily unavailable."}}`.
All five have a `Content-Type` whose media type begins `application/json`, exact
`Cache-Control: no-store`, and no `Set-Cookie`.

Preflight and postflight must retain exact empty Netlify `build_settings: {}`;
repo URL/branch, build command, publish directory, and `stop_builds` absent or
null; full Render hold; source `DATABASE_PATH`; and inactive target/receipt.
The deploy is one-shot with no blind retry. Success requires exactly one new
current/ready CLI deploy, five headers/two redirects/zero functions/zero edge
functions, `64/64` baseline bytes, `8/8` baseline headers, and `10/10` retired
helper paths across canonical and immutable origins, then mandatory stop.
Only after provider, HTTP, capture, and postflight evidence is accepted may
cleanup remove the exact external control and profile, then the owned exact
`E:\Codex\temp` parent only if empty. Cleanup must preserve frozen source config,
original-dist, captures, and provider/HTTP evidence; no broad cleanup or empty
`.git` sentinel is permitted.
Render/environment/database changes, helper-source/original-dist changes,
rebuild, activation, verifier/backup, reopening/final review, closeout, browser,
and production remain unauthorized. Historical `HL-20260822-1` abort-v1
evidence is preserved and cannot be reused.

### 2026-08-25 Helper-Retirement Post-Dispatch HTTP-Verifier Amendment

Published dispatch authority `7dd9075f18a001d85fb5783b5b4dfae4a3fb19fb` is
consumed: exactly one Netlify CLI spawn ran, and no retry/redeploy is authorized.
Its `1902`-byte envelope SHA-256
`b5cd9f492e41b392ec854e05a9fa91480b2e4ebc592ac80ab52b99d0e8295204`
records the expected completion code, one command, no retry, and status `0`.
The `1862`-byte provider-postflight SHA-256
`642b5fac4989c9440ed6fe2015e84de943824ca5e4b95673b15a45cb94f1350d`
proves `6a8e6c8fae36273a816a7539` current/newest/`ready`, exact title,
five headers/two redirects/zero functions/zero edge functions, empty
`build_settings: {}`, no Git link, and unchanged B2 full hold/source path/
inactive target.

The initial official read-only HTTP verifier ran twice and rejected solely with
`CACHE_CONTROL_HEADER_MISMATCH`: Node `24.14.1` exposed the immutable list
without optional comma whitespace. An independent eight-path diagnostic proved
all `200`, exact global headers and `Cache-Control: no-store`, the exact
ordered immutable directives, and no `Set-Cookie`; it made no hosted mutation,
provider write, deploy, or redeploy, but is not official acceptance. The original
pre-dispatch manifest (`3358` bytes / `99` LF / zero CR / final LF /
`6234451ab4ad6af0910fa7c13b38b21cc613509b23e7cae63e5f426b7d63a305`)
was overwritten after dispatch and not continuously retained; its later labeled
reconstruction must never be called the retained original.
The exact reconstructed-manifest path is
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-support-manifest-pre-dispatch-reconstructed.json`;
the exact provenance-note path/name is
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-support-manifest-pre-dispatch-reconstruction-note.json`
(`657` bytes / `18` LF / zero CR / final LF / SHA-256
`3754bcd54f7bde37081d69e5c95e667355021bd9693356430f6911da1fd8a6ef`),
and the note binds exact `reconstructedAfterDispatch=true` /
`continuouslyRetained=false`.

Corrected ignored pins (bytes/LF/SHA-256) are manifest `3358/99/7aab6845725ae90a0d245222529c91a9177b002f516ca6708d37470fdb4d7a4e`;
HTTP verifier `20991/522/26ca6f493f82999eae029c907f3bc666b460362b464b6dd97302b7e390196830`;
contract `30211/854/b3ae7da8019870dead3caa863316f6d7e05d530386ccfcf67afee7b54297a77c`;
and wrapper `21343/628/8bb2a13142fb913b6f13b836ca47b28caed28e1fd064563808451d74e713c605`;
all have zero CR/final LF. `no-store` and global headers remain exact. The
immutable comparator only splits on commas, trims edge SP/HTAB, rejects empty
directives, rejoins, and compares exactly—no reorder, case fold, addition,
removal, or change is accepted.

Only after this nine-document amendment is published may the release obtain a
fresh provider projection, exactly one corrected network-read-only HTTP-verifier result capture,
local postflight, and conditional exact cleanup, in order. Failure/ambiguity
grants no retry. Under that N23 continuation authority, activation, backup,
reopening/review, browser, closeout, and production were forbidden; Chrome
disk/FD reproof remained pending.

### 2026-08-26 Helper-Retirement Completion

Published incident amendment `0498fd4fd400e8aad16c4cf9c405165d420bd489`
permitted only the evidence-only continuation; exact action authority
`7dd9075f18a001d85fb5783b5b4dfae4a3fb19fb` remains consumed by one dispatch
with no retry. Refreshed provider postflight is `1862` bytes / SHA-256
`68cd773b3e2f104d71f8c96ce299eea7d89f542d8e5f449f33da4327100f9acd`;
the corrected official HTTP result is `23014` bytes / SHA-256
`d0ef4d2ed2cf848fbec5959012c929c36a2ea3d74f684d836a6d809fe6d76d46`
at `2026-08-26T05:25:45.785Z` and passes exact `64/64` baseline bytes, `8/8`
headers, `10/10` retired paths, and `5/5` held backend probes with no cookies
sent and no writes attempted. Local postflight is `4837` bytes / SHA-256
`6941c238289713ee3012a2abe868380dd240c46a8a44ff06e5a7a36c7c7ed4a8`
at `2026-08-26T05:26:25.700Z`. Exact cleanup is `1211` bytes / `1` LF / zero
CR / final LF / SHA-256
`b49aca2fa65c2039c5b6e4661e9cf981dd9f29b9a1fdfaddac779609bca00c78`
at `2026-08-26T05:33:33.808Z`; it removed only the exact external profile,
runtime control, and empty owned temp parent while preserving original-dist,
repo-ignored baseline control, captures, and evidence. The earlier two
comma-OWS false negatives, non-official diagnostic, reconstructed-manifest
label, and current corrected kit pins remain part of the canonical chronology.
Helper retirement is `PASS / AUTHORITY CONSUMED / NO RETRY`. At the N23
completion boundary, mandatory stop forbade activation, backup, reopening/
review, browser action, closeout, and production. V1 and V2 were later rejected
at their recorded boundaries. V3 later completed its one provider mutation and
consumed its authority. Bound V4 later failed its diagnostic-only opaque-cursor
read, remained unconsumed, and was retired. Published V5 later failed its
binding launch prewrite, remained unconsumed, and was retired with no retry or
rebind. O23, O23A, and O23B acceptance now awaits the separately authorized
V6/O23C continuation below; O23C is unchecked. Chrome disk/FD reproof remains
pending.

### 2026-08-26 RC-STG-006O23 V1 Held Target-Handoff Authority - Rejected / Unconsumed Historical Evidence

Published commit `e855be9e1a4d92cd6428175965ecf934653ae965` recorded this V1
design on frontend evidence base
`a0da13a5a6a1c1edb352aa1b606d0d3b97aec020` and exact held backend B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb`, but action control rejected it
before PRE with `AUTHORITY_DOCS_DO_NOT_PIN_FROZEN_KIT`. It omitted exact frozen
artifact paths, never armed, made no provider call, and left O23 unchecked and
unconsumed. Every V1 pin/procedure below is immutable historical evidence only
and cannot authorize action. Helper retirement remains
`PASS / AUTHORITY CONSUMED / NO RETRY`.

The frozen ignored pre-publication kit is pinned by manifest `7290` bytes /
`203` LF / zero CR / final LF / SHA-256
`0d3c5f2e1500b239efcf086818f6446ed31ab25f830ea951bacb4a5f8fc582af`
and canonical artifact-set SHA-256
`0ef3f7d87792727d321f938efd41ef5bf637f61fe155e64770a9b4e7bf556ee0`.
Every manifest row is exact (bytes/LF/SHA-256; all zero CR/final LF): contract
`39951/818/c9a4d008777eff6e0a270347f8eaa0508b97b6001f71c979dbbbc5aba2895fd1`;
held verifier
`26170/636/4b72a3eb494a52b1de8628571f6b1fc65355dbeb5f554f2f313bc847fa44ecad`;
shell envelope
`14882/330/f12d6952e79f0251e1de5858d207353c451ec0ab6db2ea9fd83bf1826d6baeaa`;
held probes
`4878/145/bd9e57a973987ccd4a660730fd61927cbab58beb9e6fa9cccac41113fabf7a58`;
action control
`27138/611/5e36b6eb699ac4e2beb711808a1c144cd904e1fa6c0ec1ab9e3b21a4ec3c1e50`;
postflight
`12157/279/61c277ba79e2f58601f437862066fee39c96ae1167bde6b1739a79a113915c23`;
cleanup
`9035/192/8819988c5254699280327cb9658c0a89b5adeb249d3794758a401a705c63c4fb`;
self-test
`22738/594/af04ef693784b9a9fc9164455ba6c240b4678080c88fc3305aa60524d3ba6fe8`;
freeze verifier
`15243/315/c808cb33199957df8cef5bb966da4dd7789694930ca66f1d13e78fcf8f388a78`;
binding template
`1718/46/bb505cb585e7cce1728fa6c90f10be26673d45febee018f318ae65f20f01b5bf`;
and runbook
`9000/148/e398b0299cf20fc8058dfdabbb13e5c978ff170aba7d6946c097e6229fbb8355`.
Independent cold audit passed all 11 pins, eight JavaScript syntax files,
`bash -n`, `10+` positive and `15` negative fixtures, 19 required guards, and
18 forbidden-operation absences. Manifest false activity fields are scoped to
support-kit authoring/local tests and do not rewrite release-wide history.
Its pre-publication runtime, critical-delta, semantic, and backup fields say
required/currently false or deferred, not already verified.
The pinned `26170`-byte held verifier is the required new abort-v2/main-WAL-
aware boundary verifier; no predecessor verifier may be reused.

After publication, create and audit the separate ignored immutable authority
binding without changing any frozen byte. It binds the full authority commit,
kit and invocation/result hashes, exact phases/tool/arguments, and permanent
tombstone
`target-activation-captures/hl-20260823-1-<authority16>-464f2e4805c79aef/`.
Both raw phases are shell-boundary proof only. In each new Chrome-attached
Render shell, first set `HISTFILE=/dev/null`, disable history, and clear in-
memory history; then stream the pinned payload through stdin only as
`bash -s -- pre-boundary dep-da6ghj67bikc738hbbv0` or
`bash -s -- activation-post dep-<new>`. No remote verifier/payload file,
SQLite/project database module, database open, copy, checkpoint, sidecar
removal, scratch path, or write is allowed. Every raw result must state
`externalAuthorityBindingRequired=true`,
`externalAuthorityBindingVerifiedByVerifier=false`,
`standaloneAcceptanceAuthorized=false`, and
`verifierGrantsMutationAuthority=false`; only the external binding-aware local
envelope may authorize the phase.

Fresh PRE must prove exact B2 and hardened clean Git state; source
`DATABASE_PATH`; the critical 20-key/nine-absent runtime matrix; source
main/WAL/SHM, target main, and canonical receipt v2 at their durable identity/
stat/hash pins; source journal, target WAL/SHM/journal, and deterministic work
path absent; four stable boundaries; two complete zero-denied/zero-holder
scans; and full hold. Device identity is namespace-local: the five protected
files share the current container device, but PRE and POST device numbers are
never compared. Receipt historical device fields remain byte-bound. Five fresh
anonymous no-cookie/no-write probes separately prove two health `200` and three
exact held `503 SERVICE_MAINTENANCE` responses.

Immediately before arm, capture a complete paginated cursor-closed deploy-ID
edge set no more than two minutes old. Exclusive creation/fsync/re-read of the
authority root, attempt, and separate tombstone seal permanently consumes the
one-shot authority before dispatch. The only mutation is exactly one call to
`mcp__render__update_environment_variables` with canonical arguments
`{"envVars":[{"key":"DATABASE_PATH","value":"/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3"}],"replace":false,"serviceId":"srv-d9eo2turnols73ekb830","workspaceId":"tea-d4prbj7diees738tmg90"}`,
exactly `247` bytes / SHA-256
`464f2e4805c79aef21a2e66dad0a4c46afc364c11b0bebb7d3e889d5575b373f`.
The target/source values are each `103` bytes with SHA-256
`4f07a7d35f7bb2787a57e718bbadfc6917087f67144977a5ed6f7244d859f645`
and `50eb4aaf0c007b3722c81d78ad1527ab32f9bbd116b19e3044c9397079db03a3`.
Do not call `trigger_deploy`, persist raw connector output, retry after error/
timeout/disconnect/ambiguity, or perform an automatic inverse rollback.

Provider evidence cannot prove source/target `DATABASE_PATH`, target inactivity,
or maintenance hold. It records only the exact requested target call plus unique
deploy/build/service/log facts and says
`providerEnvironmentReadAvailable:false`. POST requires a complete cursor-
closed deploy-set difference of exactly one new ID; any second ID, incomplete
pagination, returned-ID mismatch, or contradiction is ambiguity and stops with
no retry. The new deploy must be sole newest/`LIVE`, API-triggered on B2, with
the old deploy deactivated, no competitor, observed Node `24.14.1`, npm
`11.11.0`, all `443` suites / `3519` tests passing, and complete clean build and
runtime log-source windows.

The fresh POST shell and probes prove actual target `DATABASE_PATH`, full hold,
only that one critical runtime-binding change, and unchanged source family/
target/receipt durable identities and hashes except namespace-local device. The
target remains selected but unopened; target WAL, SHM, journal, deterministic
work, and source journal remain absent; four stable boundaries and both zero-
holder scans pass; and no SQLite/scratch/write work occurs. Combined local
acceptance—not raw shell or provider evidence alone—must record
`runtimeDatabasePathVerified=true`,
`criticalRuntimeBindingDeltaExact=true`,
`semanticTargetVerificationDeferred=true`, `backupAuthorized=false`, and
`globalProviderEnvironmentDeltaProven=false`. Cleanup revalidates everything
and deletes nothing. Then mandatory stop.

`RC-STG-006P23` remains unauthorized. It must later separately authorize a
private-copy semantic target verifier plus fresh backup, including integrity
`ok`, zero foreign keys, schema/data/migrations `54/54/54`, exact migration
checksum and credential-rotation receipt, zero active sessions, and zeros for
current/predecessor/older fixture receipts, receipt events/fixture league,
manager assignments/activity/idempotency/notifications, and outbox events/
audiences. O23 cannot satisfy those checks. Reopening/final review, normal
restore, rollback, closeout, browser workflow, production, and any second
provider update remain forbidden.

### 2026-08-26 RC-STG-006O23 V2 Correction Authority - Rejected During Local Arm / Unconsumed / No Retry

> Historical boundary: every conditional execution statement in this V2 section
> describes the now-rejected frozen design only. It grants no present authority,
> must not be resumed, and is superseded only by the separately pinned V3
> correction below.

The published V2 correction was not a V1 retry because V1 never armed. Preserve the V1 kit
and immutable rejected binding unchanged at
`.netlify/strict-release-HL-20260823-1/target-activation-authority-binding.json`,
exactly `1747` bytes / `46` LF / zero CR / final LF / SHA-256
`a939aaac0770e53cb16c2fd69eea61ef5818d361fbc9a3fa57b64f556d939954`.
They remain historical evidence and permanently non-authorizing.

The rejected V2 authority was published as one literal non-merge docs-only child of
`e855be9e1a4d92cd6428175965ecf934653ae965` changing exactly the standard nine
documents. Its former contract would have activated only after publication as frontend HEAD/
`origin/staging`, confirmation that backend HEAD/`origin/staging` remain clean
at B2 `6359ec9997f90dddf17ba2c9b07481746ae171bb`, and exclusive creation/audit
of the distinct ignored post-publication
`target-activation-v2-authority-binding.json`. O23 remains unchecked. Each line
below is exact, standalone, and unique; the `15` lines joined in this order with
LF and no trailing LF have SHA-256
`4e8cfdd4ffb8f2d80fc7676e3d71358790952ad74dfb7e2848d4b4a563b1fbe5`.

HL23-V2-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-support-manifest.json|bytes=9510|lf=246|cr=0|finalLf=true|sha256=991cb21b885cccb5aebf32af2f0665abe7a5566ce39c3c68f12615a318c81e33
HL23-V2-FROZEN-ARTIFACT-SET|sha256=8d55d858e55c5b3d2edb246df2ffa4cf54175f5c4740292e830680b473010089
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-contract.cjs|bytes=51401|lf=1064|cr=0|finalLf=true|sha256=cfeebad02ed06f93212c7e20e6c4ed2287e15a1f84f86650b2cfea18613cbfad
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-held-verifier.sh|bytes=26189|lf=637|cr=0|finalLf=true|sha256=dccac0c4603a595fd9297900a8d77ddbf25b123632506deeb0d4021b816e32b6
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-shell-envelope.cjs|bytes=14925|lf=331|cr=0|finalLf=true|sha256=c897c0840bcbba97e4ea2cdc2b976a2fac5767cfa88c416fa706d551342d023a
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-held-probes.cjs|bytes=4891|lf=146|cr=0|finalLf=true|sha256=1a056371074d2abce8af289432f6cbf1755be05c03e04ea33a97aecd1592de90
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-action-control.cjs|bytes=34487|lf=773|cr=0|finalLf=true|sha256=10135f961270955c3d488fef0b80eeb86a81722f191eee5f96d61e30e92e4544
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-postflight.cjs|bytes=12226|lf=280|cr=0|finalLf=true|sha256=599499f1371281248ef8911dc5487476e0e91cef4a365e7b832aa629f5ad3fed
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-cleanup.cjs|bytes=9057|lf=193|cr=0|finalLf=true|sha256=018ea28d97d4501e7db890f7409f9afc813ab3b053f6c59e4fba03276c6badb9
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-support-self-test.cjs|bytes=26333|lf=657|cr=0|finalLf=true|sha256=2abc6bd7b01eb51a3ce6b4749700dee776b24bf7e35b837dc3a87cd2930b3cb8
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-verify-freeze.cjs|bytes=20961|lf=418|cr=0|finalLf=true|sha256=5cea7a8fe8b6aa473952714dcb61cd5d8feb382ed4c02851823ff17a01884ca2
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-authority-binding.template.json|bytes=2886|lf=72|cr=0|finalLf=true|sha256=49cb9ca31efe68fccf8981fca527726f04447dcc8a87dfae90ff39010c3bad01
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-RUNBOOK.md|bytes=10982|lf=182|cr=0|finalLf=true|sha256=8619674e891574f7093be684c8c8faceb2170081ca1456a57fd296b3e5f8eb39
HL23-V2-REJECTED-AUTHORITY|commit=e855be9e1a4d92cd6428175965ecf934653ae965|bindingPath=.netlify/strict-release-HL-20260823-1/target-activation-authority-binding.json|bindingBytes=1747|bindingSha256=a939aaac0770e53cb16c2fd69eea61ef5818d361fbc9a3fa57b64f556d939954|failureCode=AUTHORITY_DOCS_DO_NOT_PIN_FROZEN_KIT|authorizing=false|rejectedBeforeAction=true
HL23-V2-REJECTED-SESSION-ACTIVITY|source=root-coordinator-record|providerDispatchOccurred=false|browserShellInputOccurred=false|shellVerifierInvocationOccurred=false|captureArmOccurred=false|rootActivationMutationOccurred=false

The frozen V2 runbook described only the bounded O23 shell-boundary sequence recorded
above under the new filenames, binding, and distinct permanent tombstone
`target-activation-v2-captures/hl-20260823-1-v2-<authority16>-df755011d0e4d4b1/`.
PRE and POST use the pinned new abort-v2/main-WAL-aware verifier through stdin in
fresh no-history shells. They perform no SQLite/scratch/copy/write work, prove
the exact source-to-target runtime-path-only delta, full protected family and
receipt, absences, full hold, and two complete zero-holder scans, and treat
device IDs as namespace-local. Provider evidence must say
`providerEnvironmentReadAvailable:false`; shell/probes prove runtime path/hold.

After a fresh complete deploy-ID edge set and durable tombstone, exactly one
`mcp__render__update_environment_variables` call is allowed with only
`DATABASE_PATH`, `replace:false`, canonical `247`-byte arguments SHA-256
`464f2e4805c79aef21a2e66dad0a4c46afc364c11b0bebb7d3e889d5575b373f`,
source/target value hashes `50eb4aaf0c007b3722c81d78ad1527ab32f9bbd116b19e3044c9397079db03a3` /
`4f07a7d35f7bb2787a57e718bbadfc6917087f67144977a5ed6f7244d859f645`.
No trigger, retry, automatic inverse, or second provider update is authorized.
POST requires a complete one-ID B2 deploy-set difference, target selected but
unopened, unchanged source/target/receipt identities and hashes except namespace-
local device, absent target WAL/SHM/journal/work, zero holders, and full hold.
Combined acceptance alone records `runtimeDatabasePathVerified=true`,
`criticalRuntimeBindingDeltaExact=true`,
`semanticTargetVerificationDeferred=true`, `backupAuthorized=false`, and
`globalProviderEnvironmentDeltaProven=false`; cleanup deletes nothing, then
mandatory stop. P23 semantic verification/backup, reopening/review, normal
restore, rollback, browser workflow, closeout, production, and all later gates
remain forbidden.

### 2026-08-26 RC-STG-006O23 V3 Correction Authority - Action Succeeded / Consumed; Acceptance Pending O23A; Old POST Path Blocked

> Historical boundary: this section preserves the V3 authorization design and
> its exact pin block. V3 later consumed its authority and completed exactly one
> successful provider mutation. Its imperative PRE/POST wording grants no present
> authority, and its old POST path must never be resumed or populated.

Published V2 commit `3f0bc2a9c8bf5aaae86a4e0cbb875dbccd211323`
collected its immutable binding and seven PRE evidence files, including fresh
provider, shell, and held-probe evidence, and then invoked local `--arm`. Arm
failed closed with `CAPTURE_DIRECTORY_OWNER_OR_MODE_INVALID` before provider
dispatch. The verified V2 binding plus all `21` frozen/PRE/failure files remain
immutable. The binding is
`.netlify/strict-release-HL-20260823-1/target-activation-v2-authority-binding.json`
at `2915` bytes / SHA-256
`d30f9e25c080060e74797b8aed2e831f06507555194058cdecde5ebc12bb1e3a`,
failure JSON at `165` bytes / SHA-256
`1c0faa5e7cf8d1cf12410bd5ca424e59f3e6bd83e3adac1b14ce0d6b28950ea7`,
and residue JSON at `1026` bytes / SHA-256
`b9fe005c8dd35d943fdf534a3406917a95194abe2bd50e935d88131baed598ee`.
Only the empty, ACL-identical Windows parent
`.netlify/strict-release-HL-20260823-1/target-activation-v2-captures` exists and
reports mode `0666`; no authority-specific root, attempt, seal, dispatch, provider
response, or POST evidence exists. V2 made zero provider mutations and zero
`DATABASE_PATH` updates. It is unconsumed but permanently rejected and cannot be
retried or used to authorize V3. Preserve all V1/V2 kit, bindings, PRE, failure,
residue, and empty-parent evidence unchanged.

The root-coordinator reconciliation at `2026-08-26T10:11:44.827Z` recorded sole
live B2, zero new deploys, and auto deploy disabled after the V2 failure. That is
an external attestation, not global provider state proved by local absence. Fresh
V3 provider, shell, probe, and complete cursor-closed deploy-edge PRE evidence
must reconfirm B2 and topology before V3 arm. V3 is a new authority and namespace,
not a retry of V2.

The only eligible V3 correction is one literal non-merge docs-only child of
`3f0bc2a9c8bf5aaae86a4e0cbb875dbccd211323`, changing exactly the same standard
nine authority documents. That commit must be published as frontend HEAD and
`origin/staging`; backend HEAD and `origin/staging` must remain clean at B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb`. Only then may the distinct ignored
immutable `target-activation-v3-authority-binding.json` be exclusively created
from its frozen template and audited. The binding is post-publication evidence,
is excluded from the frozen kit, and cannot alter these pins. O23 remains
unchecked and conditional until every V3 step passes.

Each line below is an exact, unique, standalone V3 pin using its full
repo-relative path. Joined in this order with LF after every line, including the
last, the `15`-line block is `3261` bytes and has SHA-256
`12da4b1f0d5ad78e0b4c6ae8d922397b3a4e26780949e800d1e9b009f81bde95`.

HL23-V3-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-support-manifest.json|bytes=12378|lf=312|cr=0|finalLf=true|sha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f
HL23-V3-FROZEN-ARTIFACT-SET|sha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-contract.cjs|bytes=88806|lf=1812|cr=0|finalLf=true|sha256=f5500a62f243b0a5743ffc4b31e279da6f493a93358b415535bc63d9bbfd9aba
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-held-verifier.sh|bytes=26190|lf=638|cr=0|finalLf=true|sha256=9d0c02916e8eff54f98d3b3121774f7740b0af3bd30d9d5d588c768f674812ac
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-shell-envelope.cjs|bytes=14926|lf=332|cr=0|finalLf=true|sha256=61a5f62e07e41787ff7b70d7e487ed5481346bb5c12a5b7b43e4ec60cbf85529
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-held-probes.cjs|bytes=4892|lf=147|cr=0|finalLf=true|sha256=6012eee2b69c744e3779354e8a2d82edba71597b502bca3e08ae299469ed13ba
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-action-control.cjs|bytes=48066|lf=1078|cr=0|finalLf=true|sha256=b67b14e3f8b5a6e325b9c595255df72450c25cccb0e4181c1f864b80105640af
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-postflight.cjs|bytes=18441|lf=420|cr=0|finalLf=true|sha256=167cb32e107815dc3ebec1e89abc148529922df15b2d0d3d66597cc09fa37f42
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-cleanup.cjs|bytes=9786|lf=205|cr=0|finalLf=true|sha256=b91ac81fc981e620740933c25571eefc94a55deee6e656b0603aa905356bdfc3
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-support-self-test.cjs|bytes=29733|lf=727|cr=0|finalLf=true|sha256=0a16e984f34f7752721f482700798f7f71d22af86a86da03c2cb6df259336575
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-verify-freeze.cjs|bytes=25017|lf=492|cr=0|finalLf=true|sha256=9a167a73f12e38e301679a4d6f155942c6a04aa42b4d716a0e34d228032a8046
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-authority-binding.template.json|bytes=4818|lf=124|cr=0|finalLf=true|sha256=411b7ccd099a2c26481a69c7c7d149252b8572361d771f8c57bfb21d4be107e6
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-RUNBOOK.md|bytes=13751|lf=218|cr=0|finalLf=true|sha256=a7d46231cce61a7b309c77d23d25a6482f97fb99c7c2c907db39d4bcac8c2473
HL23-V3-REJECTED-AUTHORITY|commit=3f0bc2a9c8bf5aaae86a4e0cbb875dbccd211323|bindingPath=.netlify/strict-release-HL-20260823-1/target-activation-v2-authority-binding.json|bindingBytes=2915|bindingSha256=d30f9e25c080060e74797b8aed2e831f06507555194058cdecde5ebc12bb1e3a|failureCode=CAPTURE_DIRECTORY_OWNER_OR_MODE_INVALID|authorizing=false|rejectedBeforeProviderDispatch=true
HL23-V3-REJECTED-SESSION-ACTIVITY|source=root-coordinator-record|providerDispatchOccurred=false|databasePathUpdateOccurred=false|captureArmSucceeded=false|v2PreEvidenceAuthorizing=false|freshV3PreRequired=true

The frozen V3 manifest is exactly `12378` bytes / `312` LF / zero CR / final LF
with SHA-256 `07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f`;
its `11` artifacts total `284426` bytes and have canonical artifact-set SHA-256
`1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03`.
Only the pinned V3 abort-v2/main-WAL-aware held verifier may run, and only for
raw phases `pre-boundary` and `activation-post`. In a fresh attached shell,
disable and clear history with `HISTFILE=/dev/null`, then stream it through stdin
as `bash -s -- pre-boundary dep-da6ghj67bikc738hbbv0` and later
`bash -s -- activation-post dep-<new>`; persist no remote verifier or scratch
file. Both phases are shell-boundary proof only: no
SQLite/project database module, database open, copy, checkpoint, sidecar removal,
scratch creation, or write is reachable.

Fresh PRE must prove the exact source path and full source main/WAL/SHM family,
target main and canonical receipt, five required absences, the critical `20`-key
runtime matrix plus nine absent provider fields, four stable boundaries, two
complete zero-denied/zero-holder `/proc/*/fd` scans, and the full hold. Device IDs
are namespace-local: internal identity consistency is required, historical
receipt device values remain bound, and PRE/POST container devices are never
compared. Raw results remain non-authorizing and state
`externalAuthorityBindingRequired=true`,
`externalAuthorityBindingVerifiedByVerifier=false`,
`standaloneAcceptanceAuthorized=false`, and
`verifierGrantsMutationAuthority=false`.

Provider evidence may record only the exact requested target call and unique
deploy/build/service/log facts; it cannot prove configured/runtime path or the
hold and must record `providerEnvironmentReadAvailable:false`; never persist raw
provider payload or secrets. Provider PRE, shell envelope, and probes must precede
a fresh, complete, paginated, cursor-closed deploy-ID edge set captured within two
minutes of arm, with held B2 still sole newest/`LIVE` and no active/pending
competitor. V3 arm creates
the single authority-specific permanent sentinel directly under the trusted
release root:
`target-activation-v3-capture-hl-20260823-1-v3-<authority16>-9ea94bc779a0ce54/`.
It creates no shared parent. On Windows, exact inherited owner/SID/SDDL/ACE,
non-reparse realpath, atomic exclusivity, stable rereads, and expected mode `0666`
apply; no POSIX `0700` equivalent, confidentiality, or hostile-authorized-principal
tamper resistance is claimed. POSIX uses directory/file modes `0700`/`0600`.
Durable root, attempt, separate tombstone seal, fsyncs, and stable exact entry-set
proof must finish before dispatch; root presence permanently consumes V3.

The sole mutation is exactly one
`mcp__render__update_environment_variables` call with canonical `247`-byte
arguments SHA-256
`464f2e4805c79aef21a2e66dad0a4c46afc364c11b0bebb7d3e889d5575b373f`:
`{"envVars":[{"key":"DATABASE_PATH","value":"/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3"}],"replace":false,"serviceId":"srv-d9eo2turnols73ekb830","workspaceId":"tea-d4prbj7diees738tmg90"}`.
Source/target value hashes remain
`50eb4aaf0c007b3722c81d78ad1527ab32f9bbd116b19e3044c9397079db03a3` /
`4f07a7d35f7bb2787a57e718bbadfc6917087f67144977a5ed6f7244d859f645`.
No trigger, retry, automatic inverse, or second provider update is authorized;
error, timeout, disconnect, or ambiguity requires read-only reconciliation.

POST must prove a complete deploy-ID set difference of exactly one new
API-triggered B2 deploy, sole newest/`LIVE`, with the prior deploy deactivated,
no competitor, exact Node `24.14.1` / npm `11.11.0`, all `443` suites / `3519`
tests passing, and complete clean build/runtime log windows. Fresh activation-POST
shell evidence and five held probes must prove only `DATABASE_PATH` changed,
target selected but unopened, source/target/receipt durable identities and hashes
unchanged except namespace-local device, target WAL/SHM/journal/work and source
journal absent, two zero-holder scans, and full hold. Combined local acceptance
alone may record `runtimeDatabasePathVerified=true`,
`criticalRuntimeBindingDeltaExact=true`,
`semanticTargetVerificationDeferred=true`, `backupAuthorized=false`, and
`globalProviderEnvironmentDeltaProven=false`. Cleanup revalidates and deletes
nothing; then stop. `RC-STG-006P23` alone may later authorize private-copy
semantic verification and backup. P23, reopening/review, normal restore,
rollback, browser workflow, closeout, production, and every second provider
update remain forbidden.

### 2026-08-26 RC-STG-006O23A V4 Read-Only Evidence Continuation Authority - Published / Bound / Diagnostic Failed / Unconsumed / Retired

> Historical boundary: V4 was published and separately bound, but its action
> path was never consumed. Its diagnostic used the wrong continuation token,
> produced no provider evidence/action artifact/capture sentinel, and is now
> `BOUND_UNCONSUMED_RETIRED`. Every imperative V4 statement below is retired;
> only its exact inherited pin rows remain authoritative historical evidence.

Consumed V3 authority `43e99e686214a2f36f52ee7c426db2015d709bee`
completed exactly one successful provider `DATABASE_PATH` mutation and returned
sole newest/`LIVE` exact-B2 deploy `dep-da7d857avr4c73bnna90`. Its old POST path
is permanently blocked solely because exhaustive hosted logs lacked an explicit
npm `11.11.0` observation; all eight named V3 POST artifacts must remain absent
forever. V3 must not be retried or backfilled. O23 remains unchecked with its
acceptance pending O23A.

V4/O23A must be one literal non-merge exact-nine documentation child of
`43e99e686214a2f36f52ee7c426db2015d709bee`, published as frontend `HEAD` and
`origin/staging`, while backend `HEAD`/`origin/staging` remain clean at exact B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb`. Only then may the separate ignored
immutable V4 binding be exclusively generated and audited. These are the exact
`21` runner-emitted authority rows; final-row success fields define the future
accepted state and do not claim the two currently unchecked gates passed.

HL23-V4-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-support-manifest.json|bytes=11358|lf=286|cr=0|finalLf=true|sha256=63f49736b8f172704dee441a89e7ab66a5051b2463bb534f419c18e79b9cc428
HL23-V4-FROZEN-ARTIFACT-SET|sha256=8da9a6219f2a311cff5385cda178b37422795e85526b6467dec4d312eb375422
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-contract.cjs|bytes=75803|lf=1499|cr=0|finalLf=true|sha256=9868b381d735b109519be63cddd62869e72cb3037489046a5ff8b7b037a31f57
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-npm-verifier.sh|bytes=17958|lf=414|cr=0|finalLf=true|sha256=af911c11d71dba90ab1a068475622bcab67d3dbe1897b25e0bd95f943ef1686b
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-shell-envelope.cjs|bytes=35536|lf=770|cr=0|finalLf=true|sha256=5359876b097d8cb05f07a9befd5d7d4e5e3612f363cb66700d09b18ae22679b1
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-held-probes.cjs|bytes=4597|lf=131|cr=0|finalLf=true|sha256=adbf73addb943d9c7f7d6d4c3b75d4e9b42cac06358100cf03a0673e70d4792f
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-action-control.cjs|bytes=42066|lf=910|cr=0|finalLf=true|sha256=7b67d758468aabd11a6594d25aab0cdc6c77cd80c32144036265ae28408bdfa7
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-provider-projection.cjs|bytes=67106|lf=1525|cr=0|finalLf=true|sha256=c825826c3651369f94aff0bfb75de63a115b301077db8feb84aa88ad1364b358
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-authority-ops.cjs|bytes=11363|lf=262|cr=0|finalLf=true|sha256=89d2d34604f5a3df03f5161d6d024eba793fbf5b7145d26a3b9fe4e3f3d6102e
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-local-runner.ps1|bytes=51440|lf=1087|cr=0|finalLf=true|sha256=89c6887fa3e31b6885c3ec62e7d8c0796541f5292c387f12999473e963d90f02
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-postflight.cjs|bytes=17194|lf=398|cr=0|finalLf=true|sha256=b907741e922295012bc66cd54ed6c0d01cdc9e39982cec50acba352285295f08
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-cleanup.cjs|bytes=5313|lf=141|cr=0|finalLf=true|sha256=91e9d7ecbf5df1da46d2122a341a10c726974b7e7a25faed4a2a917e8b1f8294
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-support-self-test.cjs|bytes=40052|lf=843|cr=0|finalLf=true|sha256=3eb5499c80fd92b0f199f6d83083b7577ee257f36a0157fc1f3c20e39bd41862
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-verify-freeze.cjs|bytes=31193|lf=591|cr=0|finalLf=true|sha256=54e6711c8fa38cd95182d290bbf1f01a8d10ba0f1d23a6b8453548e3a8c34399
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-authority-binding.template.json|bytes=7134|lf=176|cr=0|finalLf=true|sha256=b0c64c20901ed5d67498d392e023475e480c6a1817b5755262a6339a027f6962
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-RUNBOOK.md|bytes=18634|lf=320|cr=0|finalLf=true|sha256=e26ba353e79a1fe07244211f17226ab6fde8d0dc22c48fa66475ba396b5a8886
HL23-V4-INHERITED-V3-AUTHORITY|commit=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=12378|manifestSha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f|artifactSetSha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03|bindingBytes=4848|bindingSha256=5755f87382ea07de2b04ebdba1b11cc25e5efb19c143d74a0c91f02d2ce71ddb|consumed=true|authorizingV4ProviderMutation=false
HL23-V4-INHERITED-V3-DISPATCH|candidateSha256=f8a8520f03ca769b6d884acba26ec130817a5ac3ac06f4ff1d5184ed9808bc4a|attemptSha256=203d85cf3378498f57fd7111793ad8b523a77cd9ba1aa7df655a55aef4517387|sealSha256=13ec2b61aae067260993eb38417d0b88a68317aab8a0fe2bf2cd316ff2f8eeb0|dispatchSha256=5daf9939eef4ff402bc7e8560cf4d5bf1db4651f3987aba2bb8639e772e925b5|outcome=returned|deployId=dep-da7d857avr4c73bnna90|totalProviderMutationCount=1|retryAuthorized=false|rollbackAuthorized=false
HL23-V4-FORBIDDEN-V3-POST|count=8|paths=target-activation-v3-provider-postflight.json,target-activation-v3-shell-postflight-plan.json,target-activation-v3-shell-postflight-stdin.txt,target-activation-v3-shell-postflight.json,target-activation-v3-shell-postflight-envelope.json,target-activation-v3-held-probes-postflight.json,target-activation-v3-postflight-result.json,target-activation-v3-cleanup-result.json|mustRemainAbsent=true
HL23-V4-CONTINUATION-AUTHORITY|parent=43e99e686214a2f36f52ee7c426db2015d709bee|checklistId=RC-STG-006O23A|providerMutationAuthorizedCount=0|totalProviderMutationCountRemains=1|npmObservationAuthorizedCount=1|activationPostAuthorizedCount=1|providerFinalReadRequired=true|actualExportedRuntimeSamplingRequired=true|expectedRuntimeValueInjection=false|genericRequest5xxZeroClaimed=false|shellRetryAuthorized=false|backupAuthorized=false|reopenAuthorized=false|rollbackAuthorized=false|productionAuthorized=false
HL23-V4-STATUS|authorityO23=UNCHECKED_PENDING_O23A|authorityO23A=UNCHECKED|v3PostPathPermanentlyBlocked=true|o23AcceptancePendingO23A=true|successfulO23=PASS_CONSUMED|successfulO23A=PASS_CONSUMED|mandatoryStopBefore=RC-STG-006P23

After publication/binding, execute only this order: provider PRE; five held PRE
probes; preflight and durable one-shot O23A arm; one sealed live-runtime npm
`11.11.0` observation; provider POST; one sealed byte-exact inherited V3
`activation-post` observation; five held POST probes; provider FINAL topology
bracket; aggregate postflight; zero-delete cleanup; mandatory stop before P23.
The npm sample uses actual exported runtime values with no expected-value
injection and is not build-time proof. Provider request evidence accounts for
expected held `503` tuples rather than claiming generic zero 5xx. V4 authorizes
zero provider mutations; the combined total remains one. O23 and O23A stay
unchecked until completion and must then be checked together. P23, backup,
reopen, rollback, production, and later gates remain forbidden.

### 2026-08-26 RC-STG-006O23B V5 Opaque-Cursor Authority - Published / Binding Launch Failed Prewrite / Unconsumed Retired

Published V5 authority
`dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10`, literal non-merge child of
`f17b2278542ef6836550a556abd97d82c9bf79db`, never produced its required
authority binding. The exact RUNBOOK launch carried authority
`dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10` and committed-at
`2026-08-26T22:09:21.000Z`; its created-at value was generated immediately
before the call but was not printed or captured, so the exact value is
unavailable and must not be reconstructed.

Windows PowerShell 5.1 rejected the array-over-`-File` transport during outer
parameter binding, before the runner body, runner self-pin, Node, binding-
candidate generation, or any write began, and returned native exit code `1`.
The sanitized operator-observed safe text was exactly
`target-activation-v5-local-runner.ps1 : A positional parameter cannot be found that accepts argument '2026-08-26T22:09:21.000Z'.`
(128 UTF-8 bytes; SHA-256
`bb1498b816e09c94654563f7b251068e8529f2d3d952eda097ddbb1fade5df22`).
The category was `InvalidArgument` / `ParentContainsErrorRecordException`; the
fully qualified ID was
`PositionalParameterNotFound,target-activation-v5-local-runner.ps1`. The
just-before wall sample was `2026-08-26T22:10:25.643Z`. No canonical stdout
existed, and the transport did not preserve raw stdout/stderr separately, so
the raw transport digest is unavailable. These are operator-attested
diagnostic facts, not an invented failure receipt or continuation-attempt
evidence.

The V5 binding was absent before and after the failed launch, with zero bytes;
all 20 binding/action paths and every V5 capture sentinel remain absent.
Provider reads, provider mutations, browser actions, and network requests were
all zero. V5 is exactly
`PUBLISHED_UNBOUND_BINDING_LAUNCH_FAILED_PREWRITE_UNCONSUMED_RETIRED`; it must
never be resumed, rebound, retried, repaired in place, or repurposed.

V6/O23C is the only eligible continuation. It corrects the local PowerShell-
to-Node transport to explicit named scalar arguments with mandatory
`ArgCount`, and adds the frozen pre-Node support closure and hardened Git read
boundary while preserving V5's response-driven, zero-provider-mutation
evidence semantics. V6 authorizes no provider mutation, deployment, retry,
rollback, database open, backup, reopen, semantic verification, or production
action. The release-wide provider-mutation count remains exactly one, inherited
from V3. Any partial or ambiguous one-shot result consumes and retires V6 with
no retry.

O23, O23A, and O23B are `UNCHECKED_PENDING_O23C`; O23C is `UNCHECKED`.
Only a successful V6 aggregate plus zero-delete cleanup may make all four
eligible for a separate completion-evidence documentation commit marking them
`PASS_CONSUMED` together. This authority publication checks none of them.

V6/O23C must be one literal non-merge exact-nine documentation child of
`dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10`, published as frontend `HEAD` and
`origin/staging`, while backend `HEAD` and `origin/staging` remain clean at exact
B2 `6359ec9997f90dddf17ba2c9b07481746ae171bb`. Only after publication may the
separate ignored immutable `target-activation-v6-authority-binding.json` be
exclusively created from the frozen template and independently audited. Until
both publication and binding pass, no V6 evidence action may begin.

The 26 published standalone V5 rows below remain byte-for-byte and in total
order. Immediately after the final V5 row, the frozen scalar runner and
authority generator append the exact 30 standalone V6 rows. Joined in generated
order with LF after every V6 row, that block is 11,502 UTF-8 bytes / 30 LF /
zero CR / final LF with SHA-256
`412912ed380883fcb5739f7a77ea4cf1cdf8537f97f6abed4a748b8ae48f8ea9`.
Prospective success fields define only the future accepted completion state;
they do not claim that any currently unchecked gate has passed.
HL23-V5-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-support-manifest.json|bytes=20229|lf=474|cr=0|finalLf=true|sha256=47f98ab16da1d858508a0b0abf2686e51e7af3132b3abacb7efa5b2b640574ff
HL23-V5-FROZEN-ARTIFACT-SET|sha256=894fc3cdcd88ea21ca7a373a7349dd326f03fae07537a650670ac49abd8b67da
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-contract.cjs|bytes=141708|lf=2828|cr=0|finalLf=true|sha256=cf83a4d73cd3e3b9367872491cddeff1f05ea7ccc8ab79eb1e51d41cb9874836
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-npm-verifier.sh|bytes=17958|lf=414|cr=0|finalLf=true|sha256=42b723446feb04089b452571ad25dfb292c3bb05f5f3787cbc19120e95bf9c5e
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-shell-envelope.cjs|bytes=36179|lf=782|cr=0|finalLf=true|sha256=f319720cf01ed3eb4b3a1ea7a76f0d3ff96ce79c27700aa70bb1dfb22b6a86f2
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-held-probes.cjs|bytes=4597|lf=131|cr=0|finalLf=true|sha256=8e550c9ca59c19495919c22dd261cb33889bca43855017d27378bbaeb90387c3
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-action-control.cjs|bytes=58108|lf=1232|cr=0|finalLf=true|sha256=c7070f220b48f6e9d0275bdec38dbdf2fcbda640985cba76c62a50a4f441bc5e
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-provider-projection.cjs|bytes=230685|lf=4892|cr=0|finalLf=true|sha256=2f7a1f7b123b99e43dcd59d6481739b23e8aaa9e77507470799c16aafa0704a1
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-authority-ops.cjs|bytes=12451|lf=284|cr=0|finalLf=true|sha256=fcacde2ba10da408cf5ab18abdb796787d6bf1a637b90476344caf91a9467b8b
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-local-runner.ps1|bytes=102644|lf=2033|cr=0|finalLf=true|sha256=5eec1777e3d815686ea9d94b7fce55d8e397093bfb17be7a226a3df06b820c45
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-postflight.cjs|bytes=18583|lf=423|cr=0|finalLf=true|sha256=8a8ca65197132b166837ce117949e17e696cd094bf4cacad3a0ff48eb9e2a6e7
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-cleanup.cjs|bytes=5313|lf=141|cr=0|finalLf=true|sha256=a4abad2902ed2899e195b44d52bdc4ede54a40e266995ff45ea95f2d092b38f2
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-support-self-test.cjs|bytes=36803|lf=771|cr=0|finalLf=true|sha256=eed8801d5e504799008be0021749439c8b3cd989f63d66e1d62768123be7e9e3
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-verify-freeze.cjs|bytes=44938|lf=874|cr=0|finalLf=true|sha256=81cac116b97f9bd3f0e28b2f565a4c7998bfb25005278e5355e2a2fa9caebb2b
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-authority-binding.template.json|bytes=14951|lf=349|cr=0|finalLf=true|sha256=b23339b72fc15cdfd55276a37ff1049f6b663694988c95f7c4c164e14f8ffebe
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-RUNBOOK.md|bytes=22764|lf=431|cr=0|finalLf=true|sha256=b02a5640e2080f04672e5543619b0d9a4fe6906997d34da98ca390ffce5ade91
HL23-V5-PROVIDER-EXECUTABLE-SOURCE|kind=full-phase-orchestrator|artifact=target-activation-v5-provider-projection.cjs|command=--orchestrator-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V5_FULL_PHASE_PROVIDER_ORCHESTRATOR_SOURCE|bytes=38331|lf=821|cr=0|finalLf=true|sha256=df769cf53c405dbb4c9bd1f591c981ef31b777247b2e9d90d5f25f3dc777ac09|loadedOnlyByExactBootstrap=true
HL23-V5-PROVIDER-EXECUTABLE-SOURCE|kind=functions-exec-bootstrap|artifact=target-activation-v5-provider-projection.cjs|command=--bootstrap-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V5_FUNCTIONS_EXEC_BOOTSTRAP_SOURCE|bytes=32412|lf=664|cr=0|finalLf=true|sha256=574c24062ee5c0dbbb91b21bea09d18e3daa1c66fe05699c08daab9e4246c3d2|functionsExecEntireInput=true|prefixSuffixAllowed=false|platformSubmittedSourceAttested=false|operatorAuditedExactWholeCellRequired=true
HL23-V5-INHERITED-V3-AUTHORITY|commit=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=12378|manifestSha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f|artifactSetSha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03|bindingBytes=4848|bindingSha256=5755f87382ea07de2b04ebdba1b11cc25e5efb19c143d74a0c91f02d2ce71ddb|consumed=true|authorizingV5ProviderMutation=false
HL23-V5-INHERITED-V3-DISPATCH|candidateSha256=f8a8520f03ca769b6d884acba26ec130817a5ac3ac06f4ff1d5184ed9808bc4a|attemptSha256=203d85cf3378498f57fd7111793ad8b523a77cd9ba1aa7df655a55aef4517387|sealSha256=13ec2b61aae067260993eb38417d0b88a68317aab8a0fe2bf2cd316ff2f8eeb0|dispatchSha256=5daf9939eef4ff402bc7e8560cf4d5bf1db4651f3987aba2bb8639e772e925b5|outcome=returned|deployId=dep-da7d857avr4c73bnna90|totalProviderMutationCount=1|retryAuthorized=false|rollbackAuthorized=false
HL23-V5-FORBIDDEN-V3-POST|count=8|paths=target-activation-v3-provider-postflight.json,target-activation-v3-shell-postflight-plan.json,target-activation-v3-shell-postflight-stdin.txt,target-activation-v3-shell-postflight.json,target-activation-v3-shell-postflight-envelope.json,target-activation-v3-held-probes-postflight.json,target-activation-v3-postflight-result.json,target-activation-v3-cleanup-result.json|mustRemainAbsent=true
HL23-V5-INHERITED-V4-AUTHORITY|commit=f17b2278542ef6836550a556abd97d82c9bf79db|parent=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=11358|manifestSha256=63f49736b8f172704dee441a89e7ab66a5051b2463bb534f419c18e79b9cc428|artifactSetSha256=8da9a6219f2a311cff5385cda178b37422795e85526b6467dec4d312eb375422|artifactCount=14|bindingBytes=6067|bindingSha256=2c6c4876a50bc5b40476d50e70e27f4eba5214de6d3dd9f2d8acbbdb4b3905df|state=BOUND_UNCONSUMED_RETIRED|authorizingV5ProviderMutation=false
HL23-V5-FORBIDDEN-V4-ACTION|count=16|paths=target-activation-v4-provider-preflight.json,target-activation-v4-held-probes-preflight.json,target-activation-v4-npm-observation-plan.json,target-activation-v4-npm-observation-stdin.txt,target-activation-v4-npm-observation.json,target-activation-v4-npm-observation-envelope.json,target-activation-v4-provider-postflight.json,target-activation-v4-shell-postflight-plan.json,target-activation-v4-shell-postflight-stdin.txt,target-activation-v4-shell-postflight.json,target-activation-v4-shell-postflight-envelope.json,target-activation-v4-held-probes-postflight.json,target-activation-v4-provider-final.json,target-activation-v4-postflight-result.json,target-activation-v4-cleanup-result.json,target-activation-v4-arm-failure.json|mustRemainAbsent=true|captureSentinelCount=0|providerMutationCount=0|totalProviderMutationCountRemains=1
HL23-V5-INHERITED-V4-DIAGNOSTIC|canonicalSha256=a86a897e5652e6c8c40bf6a5aae7a6349e6afe9c827429ff2de25c285a15743f|evidenceStatus=diagnostic-only-no-provider-evidence-file|firstPageEntryCount=100|rejectionStatus=400|outputPersisted=false|captureSentinelCreated=false|providerMutationCount=0|diagnosticOnly=true|requiredExecutionShape=false|authorizing=false
HL23-V5-CONTINUATION-AUTHORITY|parent=f17b2278542ef6836550a556abd97d82c9bf79db|checklistId=RC-STG-006O23B|providerMutationAuthorizedCount=0|totalProviderMutationCountRemains=1|npmObservationAuthorizedCount=1|activationPostAuthorizedCount=1|providerFinalReadRequired=true|actualExportedRuntimeSamplingRequired=true|expectedRuntimeValueInjection=false|genericRequest5xxZeroClaimed=false|shellRetryAuthorized=false|backupAuthorized=false|reopenAuthorized=false|rollbackAuthorized=false|productionAuthorized=false
HL23-V5-STATUS|authorityO23=UNCHECKED_PENDING_O23B|authorityO23A=UNCHECKED_PENDING_O23B|authorityO23B=UNCHECKED|v3PostPathPermanentlyBlocked=true|v4ActionPathRetiredUnconsumed=true|o23AcceptancePendingO23B=true|o23AAcceptancePendingO23B=true|o23BAcceptancePending=true|successfulO23=PASS_CONSUMED|successfulO23A=PASS_CONSUMED|successfulO23B=PASS_CONSUMED|prospectiveSuccessOnlyTogether=true|mandatoryStopBefore=RC-STG-006P23
HL23-V6-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-support-manifest.json|bytes=30664|lf=698|cr=0|finalLf=true|sha256=d2d27f03eea8904d4d20124a7a76772ef5d97c9249bbb942d9cb882fb5cb4fa0
HL23-V6-FROZEN-ARTIFACT-SET|sha256=91bd4b8e69d55903342b4391c4383fed5a19d3afe2d2a8f64a289950466cc63b
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-contract.cjs|bytes=157028|lf=3174|cr=0|finalLf=true|sha256=2b5f2d059c7c6ffd83b0cb782f5cf45b9920548e84d46d287114b3c45194b9b7
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-npm-verifier.sh|bytes=17958|lf=414|cr=0|finalLf=true|sha256=c17d661f4033e54df10961e60759126126579eb881829f46379aaf287462fd26
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-shell-envelope.cjs|bytes=36179|lf=782|cr=0|finalLf=true|sha256=6075cf98cc9bbeb23af0a14dcda60b7eade19f7235e836e2cff614aa8694dbcf
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-held-probes.cjs|bytes=4597|lf=131|cr=0|finalLf=true|sha256=987f22caf039d3dee7943abadaa865a7f9215e16b3e76a052c3da6deee6988d8
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-action-control.cjs|bytes=74515|lf=1591|cr=0|finalLf=true|sha256=38c734370ad91436cc9d39e29ecb48ee09affb225234d8b399ac968fe538186f
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-provider-projection.cjs|bytes=232623|lf=4918|cr=0|finalLf=true|sha256=2f2b6ae371b9f719c2dc3a772719bc19078eedd3c38323901e67321abaa1394e
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-authority-ops.cjs|bytes=12595|lf=287|cr=0|finalLf=true|sha256=2d6a56a59dacafb44018a40b5e61ba2228e72c775229e131a166d0ab9253a14f
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-local-runner.ps1|bytes=142487|lf=2901|cr=0|finalLf=true|sha256=521acba6595dcb90c2cee62fdf6ea4bd46e9b01cf90a2cb04da4ab075dcd63fc
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-pre-node-dependency-lock.json|bytes=7308|lf=227|cr=0|finalLf=true|sha256=4a2dfecf604e8da2a9204a5ee7f30e38dabe9145a453c4f6845924b285265612
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-postflight.cjs|bytes=19509|lf=450|cr=0|finalLf=true|sha256=ec9883231346b0caad63dd85e2b03df51068e2c6b711b74108e709fb01af2894
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-cleanup.cjs|bytes=6929|lf=180|cr=0|finalLf=true|sha256=97735125f8f02bc52232c2b057f95dd3cfeb2eacf9005fb8f5f35121ffb739ad
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-support-self-test.cjs|bytes=63034|lf=1266|cr=0|finalLf=true|sha256=bda4670291421fd4c4c5b3f5cb4cdad39d1ba21656b378e4b6852bc276b41c3d
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-verify-freeze.cjs|bytes=65136|lf=1232|cr=0|finalLf=true|sha256=92c820cf1b5b72671ab7db73a7d3d3ee382862c200c285daec9142e760d07881
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-authority-binding.template.json|bytes=23107|lf=532|cr=0|finalLf=true|sha256=cf3cf5d84154e1cf35093cacd2c38dde17ec0102c2aa99eba84f4661f04e0228
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-RUNBOOK.md|bytes=36233|lf=623|cr=0|finalLf=true|sha256=034ed0b0ac0f6c2d50414bdb756d7fded4992c5ef263c66b193e37fd35556f15
HL23-V6-PROVIDER-EXECUTABLE-SOURCE|kind=full-phase-orchestrator|artifact=target-activation-v6-provider-projection.cjs|command=--orchestrator-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V6_FULL_PHASE_PROVIDER_ORCHESTRATOR_SOURCE|bytes=38331|lf=821|cr=0|finalLf=true|sha256=b081ec740cf7444569ce2b857fff6f512b34a0e74eaf5bb2af418646d500b52b|loadedOnlyByExactBootstrap=true
HL23-V6-PROVIDER-EXECUTABLE-SOURCE|kind=functions-exec-bootstrap|artifact=target-activation-v6-provider-projection.cjs|command=--bootstrap-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V6_FUNCTIONS_EXEC_BOOTSTRAP_SOURCE|bytes=32416|lf=664|cr=0|finalLf=true|sha256=fdc88fcf0c46d5dab434dc133d26b8c08ee63945429507737b9d41864eb388e8|functionsExecEntireInput=true|prefixSuffixAllowed=false|platformSubmittedSourceAttested=false|operatorAuditedExactWholeCellRequired=true
HL23-V6-INHERITED-V3-AUTHORITY|commit=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=12378|manifestSha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f|artifactSetSha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03|bindingBytes=4848|bindingSha256=5755f87382ea07de2b04ebdba1b11cc25e5efb19c143d74a0c91f02d2ce71ddb|consumed=true|authorizingV6ProviderMutation=false
HL23-V6-INHERITED-V3-DISPATCH|candidateSha256=f8a8520f03ca769b6d884acba26ec130817a5ac3ac06f4ff1d5184ed9808bc4a|attemptSha256=203d85cf3378498f57fd7111793ad8b523a77cd9ba1aa7df655a55aef4517387|sealSha256=13ec2b61aae067260993eb38417d0b88a68317aab8a0fe2bf2cd316ff2f8eeb0|dispatchSha256=5daf9939eef4ff402bc7e8560cf4d5bf1db4651f3987aba2bb8639e772e925b5|outcome=returned|deployId=dep-da7d857avr4c73bnna90|totalProviderMutationCount=1|retryAuthorized=false|rollbackAuthorized=false
HL23-V6-FORBIDDEN-V3-POST|count=8|paths=target-activation-v3-provider-postflight.json,target-activation-v3-shell-postflight-plan.json,target-activation-v3-shell-postflight-stdin.txt,target-activation-v3-shell-postflight.json,target-activation-v3-shell-postflight-envelope.json,target-activation-v3-held-probes-postflight.json,target-activation-v3-postflight-result.json,target-activation-v3-cleanup-result.json|mustRemainAbsent=true
HL23-V6-INHERITED-V4-AUTHORITY|commit=f17b2278542ef6836550a556abd97d82c9bf79db|parent=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=11358|manifestSha256=63f49736b8f172704dee441a89e7ab66a5051b2463bb534f419c18e79b9cc428|artifactSetSha256=8da9a6219f2a311cff5385cda178b37422795e85526b6467dec4d312eb375422|artifactCount=14|bindingBytes=6067|bindingSha256=2c6c4876a50bc5b40476d50e70e27f4eba5214de6d3dd9f2d8acbbdb4b3905df|state=BOUND_UNCONSUMED_RETIRED|authorizingV6ProviderMutation=false
HL23-V6-FORBIDDEN-V4-ACTION|count=16|paths=target-activation-v4-provider-preflight.json,target-activation-v4-held-probes-preflight.json,target-activation-v4-npm-observation-plan.json,target-activation-v4-npm-observation-stdin.txt,target-activation-v4-npm-observation.json,target-activation-v4-npm-observation-envelope.json,target-activation-v4-provider-postflight.json,target-activation-v4-shell-postflight-plan.json,target-activation-v4-shell-postflight-stdin.txt,target-activation-v4-shell-postflight.json,target-activation-v4-shell-postflight-envelope.json,target-activation-v4-held-probes-postflight.json,target-activation-v4-provider-final.json,target-activation-v4-postflight-result.json,target-activation-v4-cleanup-result.json,target-activation-v4-arm-failure.json|mustRemainAbsent=true|captureSentinelCount=0|providerMutationCount=0|totalProviderMutationCountRemains=1
HL23-V6-INHERITED-V4-DIAGNOSTIC|canonicalSha256=a86a897e5652e6c8c40bf6a5aae7a6349e6afe9c827429ff2de25c285a15743f|evidenceStatus=diagnostic-only-no-provider-evidence-file|firstPageEntryCount=100|rejectionStatus=400|outputPersisted=false|captureSentinelCreated=false|providerMutationCount=0|diagnosticOnly=true|requiredExecutionShape=false|authorizing=false
HL23-V6-INHERITED-V5-AUTHORITY|commit=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|parent=f17b2278542ef6836550a556abd97d82c9bf79db|committedAt=2026-08-26T22:09:21.000Z|manifestBytes=20229|manifestLf=474|manifestCr=0|manifestFinalLf=true|manifestSha256=47f98ab16da1d858508a0b0abf2686e51e7af3132b3abacb7efa5b2b640574ff|artifactSetSha256=894fc3cdcd88ea21ca7a373a7349dd326f03fae07537a650670ac49abd8b67da|artifactCount=14|artifactBytes=747682|bindingRequired=true|bindingPresent=false|bindingBytes=0|state=PUBLISHED_UNBOUND_BINDING_LAUNCH_FAILED_PREWRITE_UNCONSUMED_RETIRED|authorizingV6ProviderMutation=false
HL23-V6-FORBIDDEN-V5-BINDING-AND-ACTION|count=20|paths=target-activation-v5-authority-binding.json,target-activation-v5-provider-preflight.json,target-activation-v5-provider-preflight.commit.json,target-activation-v5-held-probes-preflight.json,target-activation-v5-npm-observation-plan.json,target-activation-v5-npm-observation-stdin.txt,target-activation-v5-npm-observation.json,target-activation-v5-npm-observation-envelope.json,target-activation-v5-provider-postflight.json,target-activation-v5-provider-postflight.commit.json,target-activation-v5-shell-postflight-plan.json,target-activation-v5-shell-postflight-stdin.txt,target-activation-v5-shell-postflight.json,target-activation-v5-shell-postflight-envelope.json,target-activation-v5-held-probes-postflight.json,target-activation-v5-provider-final.json,target-activation-v5-provider-final.commit.json,target-activation-v5-postflight-result.json,target-activation-v5-cleanup-result.json,target-activation-v5-arm-failure.json|mustRemainAbsent=true|prefixInventoryCount=15|captureSentinelCount=0|providerMutationCount=0|totalProviderMutationCountRemains=1
HL23-V6-INHERITED-V5-BINDING-LAUNCH-FAILURE|authorityCommit=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|committedAt=2026-08-26T22:09:21.000Z|justBeforeWallSample=2026-08-26T22:10:25.643Z|nativeExitCode=1|failureStage=outer-powershell-parameter-binding-pre-runner-body|safeTextUtf8Bytes=128|safeTextSha256=bb1498b816e09c94654563f7b251068e8529f2d3d952eda097ddbb1fade5df22|category=InvalidArgument|exceptionType=ParentContainsErrorRecordException|fullyQualifiedErrorId=PositionalParameterNotFound,target-activation-v5-local-runner.ps1|invocationMatchedRunbookBindingBlock=true|createdAtGeneratedImmediatelyPreCall=true|exactCreatedAtUnavailable=true|runnerBodyEntered=false|runnerSelfPinRan=false|pinnedNodeStarted=false|bindingCandidateGenerationStarted=false|captureWriteAttempted=false|canonicalStdoutPresent=false|rawTransportDigestUnavailable=true|bindingAbsentBeforeAndAfter=true|failureReceiptCreated=false|operatorAttestedDiagnostic=true|authoritativeActionEvidence=false|continuationAttemptEvidence=false|providerReadCount=0|providerMutationCount=0|browserActionCount=0|networkRequestCount=0
HL23-V6-CONTINUATION-AUTHORITY|parent=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|checklistId=RC-STG-006O23C|providerMutationAuthorizedCount=0|totalProviderMutationCountRemains=1|npmObservationAuthorizedCount=1|activationPostAuthorizedCount=1|providerFinalReadRequired=true|actualExportedRuntimeSamplingRequired=true|expectedRuntimeValueInjection=false|genericRequest5xxZeroClaimed=false|v5BindingRetryAuthorized=false|v5ResumptionAuthorized=false|shellRetryAuthorized=false|backupAuthorized=false|reopenAuthorized=false|rollbackAuthorized=false|productionAuthorized=false
HL23-V6-STATUS|authorityO23=UNCHECKED_PENDING_O23C|authorityO23A=UNCHECKED_PENDING_O23C|authorityO23B=UNCHECKED_PENDING_O23C|authorityO23C=UNCHECKED|v3PostPathPermanentlyBlocked=true|v4ActionPathRetiredUnconsumed=true|v5ActionPathRetiredUnconsumed=true|v5BindingRetryAuthorized=false|o23AcceptancePendingO23C=true|o23AAcceptancePendingO23C=true|o23BAcceptancePendingO23C=true|o23CAcceptancePending=true|successfulO23=PASS_CONSUMED|successfulO23A=PASS_CONSUMED|successfulO23B=PASS_CONSUMED|successfulO23C=PASS_CONSUMED|prospectiveSuccessOnlyTogether=true|mandatoryStopBefore=RC-STG-006P23

### 2026-08-26 RC-STG-006O23C V6 Scalar-Transport Read-Only Evidence Continuation Authority - Authorized Next / Pending Publication and Binding
After exact-nine publication and one successful, separately audited V6 binding,
execute only this frozen order: ProviderCaptureHost PRE once, followed by one
read-only committed-pair reconciliation; five held PRE probes; V6 preflight and
one-shot O23C arm; one sealed live-runtime npm observation; after the required
61-second boundary, ProviderCaptureHost POST once and one reconciliation; one
sealed byte-exact inherited V3 `activation-post` observation; five held POST
probes; after the next required 61-second boundary, ProviderCaptureHost FINAL
once and one reconciliation; aggregate postflight; zero-delete cleanup; mandatory
stop before `RC-STG-006P23`.

Provider reads remain response-driven and read-only; raw connector responses and
opaque cursors remain inside the narrowed connector isolate, and a provider phase
succeeds only with its canonical output/final-receipt pair. O23, O23A, O23B, and
O23C remain unchecked until the complete V6 aggregate and zero-delete cleanup
pass, and may then be marked `PASS_CONSUMED` only together in a separate
completion-evidence documentation commit. P23, backup, reopen, rollback,
production, and every later gate remain forbidden.

The rejected `HL-20260821-3` phase-one run, helper removal, abort recovery,
held target cutover, and verified backup
`2044fcae-24e8-4392-a1ac-4064d9cd2807` remain immutable historical evidence
in the 2026-08-21 record. They do not satisfy the fresh strict run. Production
remains untouched and unauthorized. A paid
SportsDataIO key, provider probe manifest, live observation, and signed
capability artifact were not FAD-18 requirements. The FAD uses the persisted player
catalogue for identity, name, position, and eligibility; player statistics do
not participate in Candidate Card or allocation decisions. For the historical
FAD-18 staging release, the shared automatic matchup-occurrence runner was
disabled in full: statistics refresh, baseline, normal lock, finalization, and
matchup-week rollover did not run. FAD, Entry Draft, auction, trade, and outbox
jobs remained available subject to their own gates.
Its short league-specific AI-generated video is optional for Season 2 and a
required capability beginning in Season 3.

## Commissioner Tools

The approved specification defines:

* inherited league-scoped commissioner and platform-administrator authority;
* approved feature-specific commissioner actions;
* workspace, preview, confirmation, correction, freeze, health, recovery, backup, and restoration workflows;
* activity, notification, safety, validation, and testing requirements;
* explicit read-only boundaries and actor attribution.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with Permissions and the applicable feature specifications.

---

# Technical Specifications

Directory:

```text
docs/04-technical-specs/
```

Technical specifications define **how the system is built or changed**.

Technical-specification paths include:

```text
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/BACKEND_REFACTOR.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/04-technical-specs/FREE_AGENT_DRAFT.md
docs/04-technical-specs/DEPLOYMENT.md
docs/04-technical-specs/ENVIRONMENT_SETUP.md
```

## Architecture

The approved specification defines:

* frontend and backend responsibilities;
* separate-repository and modular-monolith boundaries;
* frontend HTTP, server-state, and Socket.IO responsibilities;
* backend routes, services, domain, repositories, jobs, and adapter layers;
* SQLite authority, transactions, legacy JSON, and migration sequencing;
* external data, environments, hosting, observability, backup, and recovery;
* approved technical boundaries delegated to and resolved by Codex.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with the approved Data Model and later specialized technical specifications.

The dedicated approved Free Agent Draft technical specification supplies the
feature-specific architecture amendment.

## Data Model

The approved specification defines:

* global ID, league, season, time, money, FP, version, status, and JSON conventions;
* accounts, leagues, memberships, teams, players, ownership, rosters, and contracts;
* auctions, trades, Entry Draft, statistics, matchups, standings, activity, and notifications;
* reliability, idempotency, jobs, outbox, constraints, indexing, deletion, and migration verification;
* approved technical decisions delegated to and resolved by Codex.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with Architecture, SQLite Migration, and the applicable feature specifications.

The dedicated approved Free Agent Draft technical specification defines the
Candidate Card, offer, help, allocation, recovery, rapid-auction, restricted
participant, draw, and completion additions. Implementation must use its
additive migration boundary.

## API Contracts

The approved specification defines:

* the complete 34-endpoint compatibility inventory reviewed on the backend `stage2` branch;
* the `/api/v1` target namespace and league-scoped resource paths;
* success, error, validation, time, money, pagination, caching, concurrency, and idempotency conventions;
* secure session-derived authorization and cross-league isolation;
* target endpoint families for the Season 2 features approved as of its
  2026-07-18 design;
* Socket.IO invalidation, compatibility migration, retirement, and contract-test requirements;
* approved technical decisions delegated to and resolved by Codex.

The file is marked:

```text
APPROVED
```

Implementation must preserve the documented compatibility behavior during extraction and follow the target contract when each feature moves to `/api/v1`.

The dedicated FAD technical specification adds target routes `T-126` through
`T-144` and extends the existing auction routes for ordinary, open-rapid, and
restricted context.

## Free Agent Draft Technical Specification

The approved specification defines:

* the dedicated FAD and Candidate Card module boundary;
* exact lifecycle, clock, SQLite, status, API, event, frontend, and privacy
  contracts;
* transactionally synchronized carryovers and immutable deadline snapshots;
* total-first/AAV-second per-player allocation;
* one context-aware auction engine for weekly, open rapid, and restricted
  auctions;
* participant seeds, edit rules, original-total floors, and auditable
  equal-chance draws;
* durable deadline, allocation, rollover, recovery, and completion jobs;
* migration, compatibility, staging, and test requirements.

The file is marked:

```text
APPROVED
```

Its completed M7-25 implementation sequence is archived at
`docs/06-work-plans/archive/M7-25_FREE_AGENT_DRAFT_IMPLEMENTATION_SEQUENCE.md`.
The historical local checkpoints remain: FAD-11 recovery, correction,
FAD-linked auction administration, and shared restricted fallback; FAD-12
restricted/fallback bidding through schema `43`; FAD-13 rapid-auction and
handoff work through schema `47`; and FAD-14 activity, notifications, realtime
privacy, and publication contracts through schema `49`. FAD-15 through FAD-17
then closed locally, and FAD-18 reached `STAGING VERIFIED` on schema `52` on
2026-08-18. Its exact hosted evidence remains at
`docs/07-testing/release-runs/FAD_AUCTIONS_PLAYERS_UX_2026-08-18.md`.
M7-26 is the sole active plan. Release `HL-20260822-1` attempted the exact
schema-`54` hosted privacy comparator from the recovered clean boundary. Its
frontend/Netlify baseline and exact local backend candidate
`8e313902feefcd683b0f5edd746a9dd2a9029a18` passed, and backend
`origin/staging` resolved to that exact commit at the predecessor's recorded
boundary. Held backend deploy
`dep-da5l8drtqb8s73ar74sg` and the fresh fixture/zero-write replay passed on the
same commit. The helper overlay passed its hosted byte/header gates, but an
inert physical `.html` entry triggered the mandatory origin-guard strict stop
before any request or action. Exact `prepared_only` abort/replay and
sealed-baseline helper retirement passed. The full hold never lifted; held
target cutover deploy `dep-da5mmpu417fc73807ptg`, corrected post-cutover
verification, and fresh backup passed. At that recovery boundary the clean
target became the authoritative held source and no replacement release was authorized;
fresh `HL-20260823-1` was later separately authorized. Render now uses exact
abort-v2 B2 `6359ec9997f90dddf17ba2c9b07481746ae171bb` in sole newest/`LIVE`
activated deploy `dep-da7d857avr4c73bnna90`; backend HEAD and `origin/staging`
equal the same B2. Its current record is the
2026-08-23 file; the blocked/
recovered predecessors remain separate 2026-08-22 and 2026-08-21 files under
`release-runs/`.
The 2026-08-11 product clarification separates FAD deployment from all live-
statistics-provider capability work. Provider-neutral post-game matchup-stat
refresh is a later statistics/matchup follow-up, not a FAD technical gate.

## Security

The approved specification defines:

* Node `scrypt` password storage, exact password-input handling, and credential verification;
* opaque backend-managed sessions, secure cookies, expiry, replacement, revocation, and Socket.IO authentication;
* one-time verification, setup, reset, and reactivation tokens;
* exact credentialed CORS, Origin enforcement, CSRF, browser headers, and Content Security Policy;
* durable authentication rate limits and anti-enumeration behaviour;
* backend-derived authorization, league isolation, validation, injection defence, secrets, email, audit, and logging controls;
* staged implementation and comprehensive security tests;
* approved technical decisions delegated to and resolved by Codex.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with User Accounts, Permissions, API Contracts, Data Model, and SQLite Migration. Writing the specification did not enable authentication or change production state.

## Backend Refactor

The approved specification defines:

* the observed backend structure and current risk boundaries;
* the modular-monolith folder and dependency structure;
* bootstrap, route, service, domain, repository, job, adapter, event, configuration, and logging responsibilities;
* the Node built-in test foundation and read-only file-hash proof;
* a 14-stage sequence from the Step 0 safety harness through the Step 13 completion gate;
* focused treatment of the current Socket.IO compatibility defect;
* exact verification, rollback, stop conditions, and completion criteria;
* approved technical decisions delegated to and resolved by Codex.

The file is marked:

```text
APPROVED
```

The numbered sequence must be executed one small, verified work-plan step at a time. It does not authorize SQLite migration or production deployment.

## SQLite Migration

The approved specification defines:

* the pinned Node and SQLite driver foundation;
* database paths, WAL, durability, foreign-key, strict-table, and process rules;
* immutable ordered migrations and checksum validation;
* copied-JSON inventory, deterministic transformation, reset manifests, and stable ID mapping;
* reconciliation reports, integrity checks, transaction boundaries, and repository behaviour;
* database-safe backup, verified restore, staging, production cutover, and first-write rollback boundaries;
* a small staged implementation sequence with no dual-write period;
* approved technical decisions delegated to and resolved by Codex.

The file is marked:

```text
APPROVED
```

This specification does not itself authorize a production migration or reset. Implementation must proceed through the active work plan and current operating-mode safeguards.

## Frontend Structure

The approved specification defines:

* the target React and Vite application, provider, route, layout, shared, and feature structure;
* JavaScript and JSX continuity without a launch-blocking TypeScript migration;
* TanStack Query server-state ownership and URL-derived league context;
* one shared credentialed HTTP client and one authenticated Socket.IO lifecycle;
* session bootstrap, in-memory CSRF, query-key isolation, versions, and idempotency;
* forms, errors, local-storage boundaries, CSS Modules, accessibility, responsive behavior, and testing;
* an incremental `FE-00` through `FE-11` migration from the current large `App.jsx`;
* approved technical decisions delegated to and resolved by Codex.

The file is marked:

```text
APPROVED
```

Implementation must preserve frontend/backend deployment compatibility and must not treat frontend state as identity, permission, or league truth.

## Environment Setup

The approved specification defines:

* four explicit environment classes: local, automated test, staging, and production;
* separate Netlify, Render, disk, SQLite, secret, user, email, job, and backup resources;
* Node `24.14.1`, exact backend SQLite-driver compatibility, and reproducible package installation;
* authoritative frontend and backend environment-variable contracts;
* fail-closed configuration, filesystem, and database-environment identity checks;
* exact origin, cookie, preview, debug-route, scheduled-job, email, and NHL-adapter boundaries;
* local, staging, and future production setup sequences without changing live configuration.

The file is marked:

```text
APPROVED
```

Implementation must follow it together with Security, SQLite Migration, Frontend Structure, Backup and Restore, and Deployment. Writing it did not create staging or change Netlify, Render, secrets, disks, databases, or production.

## Deployment

The approved specification defines:

* manual production publication of exact approved frontend and backend commits;
* staging deployment after CI, with separate Netlify, Render, disk, database, and secret resources;
* reproducible frontend and backend builds using Node `24.14.1`, lockfiles, and `npm ci`;
* compatibility-first backend expansion, frontend cutover, observation, and later contract retirement;
* explicit maintenance and migration procedures with no automatic migration during build or startup;
* release records, read-only production smoke, first-write boundaries, monitoring, and rollback;
* Netlify atomic publication and Render code rollback without falsely treating either as a database rollback.

The file is marked:

```text
APPROVED
```

Writing it did not publish Netlify or Render, change configuration, run a migration, or grant production authority.

---

# Roadmap

Directory:

```text
docs/05-roadmap/
```

Current roadmap files:

```text
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/05-roadmap/FUTURE_BACKLOG.md
```

Historical roadmaps belong in:

```text
docs/05-roadmap/archive/
```

## Active Roadmap

The approved active roadmap defines:

* the dependency order from the backend safety harness through launch;
* milestone gates for refactor, SQLite, security, multi-league conversion, league features, staging, migration, and release;
* launch-critical, in-season, optional, and deferred boundaries;
* just-in-time documentation requirements;
* the rule that only one contained work-plan step is active at a time.

The file is marked:

```text
APPROVED
ACTIVE
```

M7-25 and `FAD-01` through `FAD-18` are complete through isolated staging.
FAD-18 reached `STAGING VERIFIED` on schema `52` on 2026-08-18; the archived
plan and exact release record preserve that historical evidence. M7-26 is the
sole active full-site UI-review plan. Blocked release `HL-20260822-1` used exact
frontend build `4dfe12d...`, Netlify baseline `6a8a3880f946cc39a2bf2bb6`, the
pinned schema-`54` source (clean at the recorded pre-fixture boundary and now
preserved fixture-bearing), release-specific target, and verified backup
`2044fcae-24e8-4392-a1ac-4064d9cd2807`. Exact backend commit
`8e313902feefcd683b0f5edd746a9dd2a9029a18` was published on `origin/staging`
at that release boundary and passed its focused, complete local, and held-
hosted gates. Deploy
`dep-da5l8drtqb8s73ar74sg` and fresh fixture preparation/replay passed. Helper
deploy `6a8b678ddbcf0b4ea8ba623c` passed hosted artifact/header checks, then a
physical `.html` entry hit the mandatory origin guard before the full hold,
session, or database changed. Exact `prepared_only` abort/replay and helper
retirement passed; held clean-target cutover deploy
`dep-da5mmpu417fc73807ptg`, corrected post-cutover verification, and fresh
backup `e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` passed under the unchanged full
hold. Fresh `HL-20260823-1` is now authorized and minted. Its B-prime local
verification, backend publication, held deployment/runtime, fresh fixture
prepare/replay, held postflight proof, helper construction/local verification,
corrected helper publication/hosted proof, controlled-unhold deployment/runtime,
and unheld v2 pre-smoke verification passed. Phase one reached accepted/
published state with `fresh 2` / `replay 0`, but operator sequencing selected
`STRICT_STOP`; phase two never began and full re-hold passes. Exact abort-v2 B2
mint/publication, held deployment/runtime, fresh post-B2 verification, and the
exact abort-v2 plan pass. The matching first execute and one byte-identical
replay passed; both authorities are consumed and neither may be rerun.
The exact one-shot staging Netlify helper-retirement dispatch also ran and is
consumed. Published incident amendment `0498fd4...`, refreshed provider
postflight, corrected official HTTP verification, local postflight, and exact
cleanup pass; helper retirement is complete with no retry. Published e855/V1
O23 was rejected before PRE. Published 3f0bc/V2 gathered PRE evidence but its
local arm failed before provider dispatch; it is unconsumed, permanently
non-authorizing, and cannot be retried. Published 43e99/V3 completed the target
handoff with exactly one provider mutation and consumed its authority; its old
POST path is blocked solely by the absent explicit hosted npm observation.
Published f17b/V4 was separately bound but never consumed; its diagnostic used
the wrong opaque continuation token and created no provider evidence, action
artifact, or capture sentinel, so V4 is retired. Published dceb/V5 is
`PUBLISHED_UNBOUND_BINDING_LAUNCH_FAILED_PREWRITE_UNCONSUMED_RETIRED`; its
pre-runner binding-launch failure produced no binding or action evidence and
permits no retry or rebind. O23, O23A, and O23B remain unchecked pending O23C,
and O23C is unchecked. Only the literal non-merge exact-nine V6 authority child
of dceb plus a separate successful V6 binding may authorize the zero-provider-
mutation continuation.
Normal recovery, P23 semantic verification/backup, reopening/review, browser
workflow, closeout, and production remain forbidden.
The failed/recovered 2026-08-21 attempt remains historical; production remains
untouched and unauthorized.

The roadmap does not define every feature rule or implementation detail and does not authorize production migration or deployment.

## Future Backlog

Stores possible future work that is not currently approved, plus any explicitly
identified high-level boundary promoted into active scope.

Items in the future backlog must not be implemented unless Grae deliberately moves them into the current scope and active roadmap.

## Archived Roadmaps

Archived roadmaps are historical records.

They may explain why old code exists, but they are not current instructions.

---

# Work Plans

Directory:

```text
docs/06-work-plans/
```

Active execution plan:

```text
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Completed plans belong in:

```text
docs/06-work-plans/archive/
```

The plan recorded in the active-plan file is:

```text
M7-26 - Full-site UI review, plain-language workflow correction,
permission hardening, and isolated staging release
Status: ACTIVE - HL-20260823-1 PHASE ONE PUBLISHED; OPERATOR-SEQUENCING STRICT STOP; FULL RE-HOLD PASS; ABORT-V2 B2 HELD DEPLOY/RUNTIME PASS; FRESH VERIFIER PASS; ABORT-V2 PLAN PASS; FIRST EXECUTE PASS + AUTHORITY CONSUMED; REPLAY PASS + AUTHORITY CONSUMED; HELPER RETIREMENT PASS + AUTHORITY CONSUMED + NO RETRY; E855 V1 O23 REJECTED BEFORE PRE + UNCONSUMED + ZERO PROVIDER CALL; 3F0BC V2 O23 ARM REJECTED + UNCONSUMED + NO RETRY + ZERO PROVIDER MUTATION; 43E99 V3 O23 ACTION SUCCEEDED + AUTHORITY CONSUMED + EXACTLY ONE PROVIDER MUTATION; OLD V3 POST PERMANENTLY BLOCKED SOLELY BY ABSENT HOSTED NPM 11.11.0 OBSERVATION; F17B V4 BOUND + UNCONSUMED + RETIRED AFTER DIAGNOSTIC-ONLY OPAQUE-CURSOR FAILURE + ZERO V4 PROVIDER MUTATIONS; DCEB V5 PUBLISHED_UNBOUND_BINDING_LAUNCH_FAILED_PREWRITE_UNCONSUMED_RETIRED + ZERO V5 PROVIDER MUTATIONS; O23 + O23A + O23B UNCHECKED PENDING O23C; O23C UNCHECKED; RC-STG-006O23C V6 SCALAR-TRANSPORT READ-ONLY CONTINUATION AUTHORIZED NEXT AFTER EXACT-NINE DIRECT-CHILD PUBLICATION+BINDING + ZERO V6 PROVIDER MUTATIONS; RC-STG-006P23 AND LATER GATES NOT AUTHORIZED; CHROME DISK/FD REPROOF PENDING
```

The completed M7-24 and M7-25 plans are preserved at
`docs/06-work-plans/archive/M7-24_TEAM_IDENTITY_TEMPLATE_CATALOG_AND_MANAGER_SETTINGS.md`
and
`docs/06-work-plans/archive/M7-25_FREE_AGENT_DRAFT_IMPLEMENTATION_SEQUENCE.md`.
M7-25's isolated-staging completion evidence remains at
`docs/07-testing/release-runs/FAD_AUCTIONS_PLAYERS_UX_2026-08-18.md`. M7-26 is
active under Grae's continue-through-isolated-staging instruction. Its current
runbook is the 2026-08-23 authorized/minted ledger for `HL-20260823-1`; the
2026-08-22 and 2026-08-21 records are immutable blocked/recovered history.
At the `HL-20260822-1` boundary, exact held backend build
`8e313902feefcd683b0f5edd746a9dd2a9029a18` was published and locally verified;
held deploy `dep-da5l8drtqb8s73ar74sg`, fixture preparation/replay, helper
publication, exact `prepared_only` abort/replay, and helper retirement are
verified. Strict smoke never began. Held target cutover
`dep-da5mmpu417fc73807ptg`, corrected post-cutover verification, and fresh
backup now pass. Selection of any new authorized release, its final staging
matrix, and M7-26 closeout remained pending at the `HL-20260822-1` recovery
boundary. Fresh `HL-20260823-1` is now selected and minted; exact B-prime
`234547e4d8453b7515fc081ea6ebe4c2d022dc54` passes local verification and
backend publication. Held deploy `dep-da5sh0e417fc738i254g` passed on exact
B-prime. Fresh fixture
prepare/replay, held postflight, helper local verification, and corrected helper
publication/hosted proof passed. Controlled-unhold deploy
`dep-da60sl0jo6nc73e0cfu0` and unheld v2 pre-smoke gates passed. Phase one then
reached accepted/published state, but operator sequencing selected
`STRICT_STOP`; phase two never began. Re-hold deploy
`dep-da6cu8h42hec738f2al0` passed its complete hosted/maintenance gate and later
deactivated at safe handoff to exact-B2 deploy `dep-da6ghj67bikc738hbbv0`.
Exact abort-v2 B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb` is minted, published, deployed, and
verified under full hold; the fresh B2-pinned verifier also passes. The exact
abort-v2 plan, its one authorized first execute, and its one authorized
byte-identical `0/0` replay pass. First-execute and replay authorities are
consumed; neither may be rerun. Normal recovery and phase two are forbidden.
The exact one-shot staging Netlify helper-retirement dispatch also ran and is
consumed. Published incident amendment `0498fd4...`, refreshed provider
postflight, corrected official HTTP verification, local postflight, and exact
cleanup pass. Helper retirement is complete with no retry authority. V3 later
selected the verified target, returned current sole newest/`LIVE` exact-B2 deploy
`dep-da7d857avr4c73bnna90`, and consumed its one-mutation authority. Published
f17b/V4 was bound but never consumed and is retired after its wrong-token
diagnostic produced no provider evidence, action artifact, or capture sentinel.
Published dceb/V5 is
`PUBLISHED_UNBOUND_BINDING_LAUNCH_FAILED_PREWRITE_UNCONSUMED_RETIRED`; its
binding remains absent and it cannot be retried, rebound, resumed, or
repurposed. O23, O23A, and O23B remain unchecked pending O23C; O23C is
unchecked. Only V6/O23C is authorized next after exact-nine direct-child
publication and a separate successful immutable V6 binding. Chrome disk/FD
reproof remains pending.
Production remains untouched and unauthorized.

A work plan is used for a contained current task such as:

* completing one backend-refactor step;
* migrating one data area;
* introducing authentication;
* converting one feature to league-scoped storage.

A work plan should contain:

* objective;
* prerequisites;
* affected files;
* exact steps;
* risks;
* rollback;
* verification;
* completion checklist.

A work plan cannot override product rules or safety requirements.

---

# Testing

Directory:

```text
docs/07-testing/
```

Testing-document paths include:

```text
docs/07-testing/TESTING_STRATEGY.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/07-testing/MANUAL_QA_CHECKLIST.md
docs/07-testing/M7_MANUAL_WEBSITE_TEST_GUIDE.md
docs/07-testing/MATCHUP_FIGMA_HANDOFF.md
docs/07-testing/SITE_FIGMA_HANDOFF.md
docs/07-testing/RELEASE_CHECKLIST.md
docs/07-testing/release-runs/
```

Testing documents define how approved behaviour is verified.

## Testing Strategy

The approved strategy defines:

* Node's built-in backend test foundation;
* Vitest and Testing Library frontend tests;
* Playwright critical browser workflows;
* synthetic fixtures, fixed time, randomness, money, concurrency, and two-league isolation;
* characterization, domain, repository, service, contract, component, browser, security, job, migration, and recovery layers;
* local, work-plan, staging, release, and read-only production-smoke gates;
* coverage, flaky-test, evidence, and artifact policies.

The file is marked:

```text
APPROVED
```

## Backend Endpoint Checklist

The approved active checklist defines:

* all 34 current compatibility route registrations, including the six conditional debug routes;
* the historical 125 pre-FAD `/api/v1` target endpoints approved in the
  2026-07-18 catalogue;
* 19 dedicated FAD routes `T-126` through `T-144`, which established the
  historical 144-route target catalogue;
* later amendments `T-145` through `T-148`, for the current conceptual target
  catalogue `T-001` through `T-148`;
* the current schema-`54` local runtime inventory of `123` registered routes,
  which is distinct from the conceptual catalogue count;
* permanent compatibility and target endpoint IDs;
* characterization, contract, frontend, staging, production, and retirement statuses;
* authentication, permission, two-league isolation, validation, concurrency, transaction, read-only, privacy, outbox, and Socket.IO proof;
* the evidence required before an endpoint can advance.

The file is marked:

```text
APPROVED
ACTIVE
```

## Manual QA Checklist

The approved active checklist defines:

* focused, milestone, release, and in-season manual-QA levels;
* exact run, build, environment, browser/device, fixture, result, defect, and artifact records;
* a synthetic two-league staging fixture with overlapping names and player pools;
* launch-critical account, league, roster, contract, Free Agent Draft, auction,
  trade, matchup, standings, commissioner, activity, notification, and recovery
  workflows;
* desktop, Firefox, mobile Chromium, WebKit/iOS, physical-mobile, zoom, keyboard, and screen-reader spot checks;
* failure, concurrency, reconnect, provider, job, backup/restore, retest, and exit gates.

The file is marked:

```text
APPROVED
ACTIVE
```

Manual QA is release evidence, not production authority.

## Local Website Testing and Figma Handoffs

The M7 manual website guide is the short operator path for starting the
disposable two-league site, selecting synthetic accounts, and repeating the
highest-value navigation, isolation, authority, responsive, keyboard, and
reconnect tours.

The matchup and site-wide Figma handoffs define the canonical routes, screen
inventory, data states, responsive frames, interaction requirements,
accessibility contract, and backend-authoritative boundaries that a visual
redesign must preserve.

These guides make implementation and testing easier. They do not replace the
approved Manual QA or Release checklists and grant no staging, provider,
deployment, or production authority.

## Release Checklist

The approved active template defines:

* `D0` through `D5` release-type applicability;
* source, documentation, automated-test, endpoint, manual-QA, security, environment, database, backup, staging, deployment, and rollback gates;
* release records, hard blockers, defect disposition, and exact go/no-go states;
* separate production, reset, migration, restore, secret, disk, and domain authority;
* read-only production smoke, controlled reopening, first-write tracking, monitoring, rollback, and closeout;
* Grae's explicit production-approval boundary.

The file is marked:

```text
APPROVED
ACTIVE
HL-20260822-1 BLOCKED / ABORT-RECOVERED; VERIFIED HELD RECOVERY COMPLETE; PRODUCTION NOT EVALUATED
```

Approval of the template does not mark a release ready.

Completed release and staging-verification records belong under
`docs/07-testing/release-runs/`. `STAGING VERIFIED` records truthful isolated-
staging evidence only; they do not grant production authority or imply a
production release.

Read when:

* adding or changing behaviour;
* performing a migration;
* preparing staging;
* preparing a release;
* correcting a production problem.

Every coding task must include an appropriate verification command, request, or manual check.

---

# Operations

Directory:

```text
docs/08-operations/
```

Operations document paths include:

```text
docs/08-operations/PRODUCTION_RUNBOOK.md
docs/08-operations/BACKUP_AND_RESTORE.md
docs/08-operations/STAGING_ENVIRONMENT.md
docs/08-operations/INCIDENT_RECOVERY.md
```

Operations documents cover running the real application.

## Backup and Restore

The approved specification defines:

* application-consistent SQLite backups through the database driver;
* verified, compressed, AES-256-GCM-encrypted offsite artifacts and an external catalog;
* hourly, daily, pre-change, season-end, incident, and migration retention classes;
* recovery-point and recovery-time targets;
* commissioner backup requests and platform-administrator-only restore execution;
* maintenance, candidate verification, atomic activation, session and token revocation, job and outbox reconciliation, and reopening gates;
* mandatory staging restore drills and explicit data-loss reconciliation.

The file is marked:

```text
APPROVED
```

Render disk snapshots remain secondary protection. The primary recovery artifact is the verified application-created encrypted offsite backup.

The M7-26 exception for release `HL-20260822-1` used the fixture-bearing
schema-`54` source, release-specific target, and verified backup
`2044fcae-24e8-4392-a1ac-4064d9cd2807`. Its exact `prepared_only` abort
materialized the clean target and replayed with zero mutations. Only
`DATABASE_PATH` was changed afterward; held cutover deploy
`dep-da5mmpu417fc73807ptg`, corrected post-cutover verifier v2, and fresh backup
`e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` now pass. The clean target is the
verified authoritative held source. The exception grants no new release or
restore authority by itself. Grae's separate `2026-08-23T23:23:29.877Z`
approval authorizes only fresh `HL-20260823-1`; its new restore contract,
B-prime local/publication/held-deployment gates, fresh fixture prepare/replay,
held postflight, helper construction/local verification, corrected helper
publication/hosted proof, controlled-unhold deployment/runtime, and unheld v2
pre-smoke verification passed. Phase one is published partial evidence;
operator sequencing strict-stopped the attempt, phase two never began, and full
re-hold now passes. Exact abort-v2 B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb` is minted, published, held-deployed,
and runtime-verified; the fresh B2-pinned verifier passes. Only one exact
evidence-bound abort-v2 plan ran and passed. Its published-authority first
execute also ran once and passed at `replayed: false` / `0/2`; its authority is
consumed. The one byte-identical replay passed at `replayed: true` / `0/0` and
its authority is also consumed. The bounded staging Netlify helper-retirement
dispatch also ran once and is consumed. Published incident amendment
`0498fd4...`, refreshed provider postflight, corrected official HTTP proof,
local postflight, and exact cleanup pass. Helper retirement is complete with no
retry; downstream data gates remain blocked. The earlier
`HL-20260821-3` abort
recovery remains immutable historical evidence.

Read for:

* Render;
* Netlify;
* deployment;
* persistent storage;
* environment variables;
* backups;
* restoration;
* scheduled jobs;
* outages;
* staging;
* production recovery.

Do not place secrets in these documents.

---

# Team Workflow

Directory:

```text
docs/09-team/
```

Planned documents include:

```text
docs/09-team/DEVELOPMENT_WORKFLOW.md
docs/09-team/GRAE_ROLE.md
docs/09-team/MARTY_ROLE.md
docs/09-team/PARKER_ROLE.md
```

These documents will explain:

* branch workflow;
* commits;
* pull requests;
* testing handoffs;
* role responsibilities;
* review expectations;
* deployment authority.

---

# Decisions

Directory:

```text
docs/10-decisions/
```

Canonical file:

```text
docs/10-decisions/DECISION_LOG.md
```

The decision log records important approved choices and why they were made.

Examples:

* only administrators may create leagues initially;
* SQLite will replace JSON for mutable league data;
* shared documentation lives in the frontend repository;
* product development uses product seasons rather than stages.

Read when a current task may revisit an earlier architectural or product choice.

---

# Notes and Issues

Directory:

```text
docs/11-notes/
```

Planned files include:

```text
docs/11-notes/IDEAS_INBOX.md
docs/11-notes/KNOWN_ISSUES.md
```

## Ideas Inbox

Contains incomplete or unapproved ideas.

Ideas are not requirements.

## Known Issues

Contains confirmed current problems with:

* symptoms;
* reproduction steps;
* severity;
* affected area;
* current status.

Known issues describe problems. They do not automatically authorize large redesigns.

---

# Archive

General archive directory:

```text
docs/archive/
```

Use the archive for replaced documents that do not belong in a more specific archive folder.

An archived document should clearly state:

```text
ARCHIVED — Not an active source of current requirements.
```

Do not delete historical documents until:

1. their useful content has been moved into canonical documents;
2. the replacement documents have been reviewed;
3. the archive move is committed;
4. recovery through Git history has been verified.

---

# Task Routing Examples

## Backend refactor

Read:

```text
AGENTS.md
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/OPERATING_MODE.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/BACKEND_REFACTOR.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Then inspect the affected backend code and verification commands.

## Auction change

Read:

```text
AGENTS.md
docs/README.md
docs/01-project/PROJECT_SCOPE.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/AUCTIONS.md
docs/04-technical-specs/API_CONTRACTS.md
```

Read contract and data-model specifications when the change affects salaries or contract creation.

## Matchup bug

Read:

```text
AGENTS.md
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/02-rules/SCORING_RULES.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/STANDINGS.md
docs/04-technical-specs/API_CONTRACTS.md
docs/11-notes/KNOWN_ISSUES.md
```

Reproduce the problem before changing code.

## Database migration

Read:

```text
AGENTS.md
docs/README.md
docs/01-project/OPERATING_MODE.md
docs/01-project/CURRENT_STATE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/08-operations/BACKUP_AND_RESTORE.md
docs/07-testing/TESTING_STRATEGY.md
```

Never use production data as disposable test data.

## Frontend display change

Read:

```text
AGENTS.md
docs/README.md
relevant product specification
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
```

Confirm that the frontend is displaying authoritative backend values rather than recreating business calculations.

---

# Documentation Update Rules

Update documentation when:

* approved feature behaviour changes;
* a technical design changes;
* a milestone is completed;
* the operating mode changes;
* project scope changes;
* a material decision is approved;
* an endpoint contract changes;
* a migration changes stored data;
* a known issue is confirmed or resolved.

Do not update canonical rules merely to match an accidental code change.

When code and approved documentation disagree:

1. determine whether the code is wrong or the documentation is outdated;
2. obtain Grae’s approval when behaviour is ambiguous;
3. correct both as part of an intentional change.

---

# Current Canonical Foundation Documents

The following foundation documents currently exist:

```text
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
```

Document status is recorded below. Paths without an approved file remain planned until they are created through the documentation workflow.

The following rule documents also exist:

```text
docs/02-rules/LEAGUE_RULES.md       — APPROVED
docs/02-rules/SCORING_RULES.md      — APPROVED
docs/02-rules/PERMISSIONS.md        — APPROVED
docs/03-product-specs/LEAGUES_AND_TEAMS.md — APPROVED
docs/03-product-specs/USER_ACCOUNTS.md — APPROVED
docs/03-product-specs/ROSTERS.md — APPROVED
docs/03-product-specs/CONTRACTS.md — APPROVED
docs/03-product-specs/AUCTIONS.md — APPROVED
docs/03-product-specs/TRADES.md — APPROVED
docs/03-product-specs/MATCHUPS.md — APPROVED
docs/03-product-specs/STANDINGS.md — APPROVED
docs/03-product-specs/ENTRY_DRAFT.md — APPROVED
docs/03-product-specs/FREE_AGENT_DRAFT.md — APPROVED
docs/03-product-specs/COMMISSIONER_TOOLS.md — APPROVED
docs/04-technical-specs/ARCHITECTURE.md — APPROVED
docs/04-technical-specs/DATA_MODEL.md — APPROVED
docs/04-technical-specs/API_CONTRACTS.md — APPROVED
docs/04-technical-specs/FREE_AGENT_DRAFT.md — APPROVED
docs/04-technical-specs/BACKEND_REFACTOR.md — APPROVED
docs/04-technical-specs/SQLITE_MIGRATION.md — APPROVED
docs/04-technical-specs/SECURITY.md — APPROVED
docs/04-technical-specs/FRONTEND_STRUCTURE.md — APPROVED
docs/04-technical-specs/ENVIRONMENT_SETUP.md — APPROVED
docs/04-technical-specs/DEPLOYMENT.md — APPROVED
docs/05-roadmap/ACTIVE_ROADMAP.md — APPROVED / ACTIVE
docs/06-work-plans/ACTIVE_WORK_PLAN.md — APPROVED / ACTIVE - M7-26
docs/07-testing/TESTING_STRATEGY.md — APPROVED
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md — APPROVED / ACTIVE
docs/07-testing/MANUAL_QA_CHECKLIST.md — APPROVED / ACTIVE
docs/07-testing/RELEASE_CHECKLIST.md — APPROVED / ACTIVE / NOT EVALUATED
docs/08-operations/BACKUP_AND_RESTORE.md — APPROVED
```

Do not assume a planned document exists without checking the repository.
