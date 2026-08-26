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
`6359ec9997f90dddf17ba2c9b07481746ae171bb` is both the backend HEAD/
`origin/staging` identity and the current sole newest/`LIVE` Render identity in
deploy `dep-da6ghj67bikc738hbbv0`; its held deployment/runtime and fresh B2-
pinned verifier gates pass. Exact earlier held deploy `dep-da5sh0e417fc738i254g` passed after all
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
at `37105664` bytes / `cf3ca07d...`, and absent fresh target ending in
`HL-20260823-1.sqlite3`. Verified backup
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
header rules were absent. Corrected CLI deploy `6a8c006abe46c8fb6269c40c` is
current/`READY`, processed all six helper header rules, deployed no functions,
and passed exact canonical/immutable bytes and headers. Fresh tab `1600151197`
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
The approved one-key merge produced sole newest/`LIVE` exact-B2 deploy
`dep-da6ghj67bikc738hbbv0`. Hosted `443` suites / `3,519` tests all passed;
build/startup, zero-error, bare-maintenance HTTP, exact runtime/source-family,
and zero-holder gates passed. Netlify remains unchanged on current/`READY`
`6a8c006abe46c8fb6269c40c`.

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
grants no retry. Activation, backup, reopening/review, browser, closeout, and
production remain forbidden; Chrome disk/FD reproof remains pending.

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
held deploy `dep-da6ghj67bikc738hbbv0`; backend HEAD and `origin/staging` equal
the same B2. Its current record is the
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
consumed. Provider postflight passes; only the amended corrected read-only
provider/HTTP proof, local postflight, and conditional exact cleanup remain
authorized. Normal recovery, activation, and every later action remain
forbidden. The failed/recovered
2026-08-21 attempt remains historical; production remains untouched and
unauthorized.

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
Status: ACTIVE - HL-20260823-1 PHASE ONE PUBLISHED; OPERATOR-SEQUENCING STRICT STOP; FULL RE-HOLD PASS; ABORT-V2 B2 HELD DEPLOY/RUNTIME PASS; FRESH VERIFIER PASS; ABORT-V2 PLAN PASS; FIRST EXECUTE PASS + AUTHORITY CONSUMED; REPLAY PASS + AUTHORITY CONSUMED; HELPER RETIREMENT DISPATCH CONSUMED + PROVIDER POSTFLIGHT PASS; HTTP VERIFIER OWS INCIDENT; CORRECTED READ-ONLY VERIFICATION AUTHORIZED NEXT; ACTIVATION AND LATER GATES NOT AUTHORIZED
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
deactivated at safe handoff to sole newest/`LIVE` exact-B2 deploy
`dep-da6ghj67bikc738hbbv0`. Exact abort-v2 B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb` is minted, published, deployed, and
verified under full hold; the fresh B2-pinned verifier also passes. The exact
abort-v2 plan, its one authorized first execute, and its one authorized
byte-identical `0/0` replay pass. First-execute and replay authorities are
consumed; neither may be rerun. Normal recovery and phase two are forbidden.
The exact one-shot staging Netlify helper-retirement dispatch also ran and is
consumed. Provider postflight passes; only the amended corrected read-only
provider/HTTP proof, local postflight, and conditional exact cleanup remain
authorized. Activation and later gates remain blocked.
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
dispatch also ran once and is consumed. Provider postflight passes; only the
amended corrected read-only provider/HTTP proof, local postflight, and
conditional exact cleanup remain authorized. Downstream data gates remain
blocked. The earlier
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
