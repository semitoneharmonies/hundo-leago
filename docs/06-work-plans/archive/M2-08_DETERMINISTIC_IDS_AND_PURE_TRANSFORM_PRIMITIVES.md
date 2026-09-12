# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M2-08
```

## Active Step

```text
SQLite Foundation and Migration Step 8 - Deterministic IDs and Pure Transform Primitives
```

Grae approved continuous technical execution through the M2 gate on 2026-07-19. M2-07 passed every gate, so this exact plan activates M2-08 without another continuation prompt.

M2-08 implements source-independent pure transformation primitives with synthetic tests. It does not inventory or interpret current source data, classify a record as Season 1, apply the reset manifest, write SQLite, or access staging or production.

---

## Objective

Provide deterministic UUID generation, exact scalar conversion, explicit status/position normalization, level yearly schedule construction, and provider-first player mapping that later import transforms can compose without nondeterminism or guessing.

---

# Part 1 - Exact Scope

Create:

```text
src/infrastructure/migration/deterministicIds.js
src/infrastructure/migration/playerMapping.js
src/infrastructure/migration/transformValues.js
test/foundation/deterministicTransformation.test.js
```

Canonical completion records:

```text
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/06-work-plans/archive/M2-08_DETERMINISTIC_IDS_AND_PURE_TRANSFORM_PRIMITIVES.md
```

No package, schema, migration, repository, manifest, source inventory, protected JSON, import command, database, bootstrap, or frontend source is in scope.

---

# Part 2 - Deterministic IDs

Use committed migration namespace:

```text
8dc8b3a0-4c15-5f91-9b6d-20ac79c24731
```

Generate lower-case RFC 4122 UUIDv5 identifiers from the canonical tuple:

```text
identity version
source-bundle type
stable source collection
stable source key
target table
```

Tuple components are non-empty bounded strings and are encoded as canonical JSON, preventing delimiter collisions. The same tuple always returns the same ID; changing any component changes the ID. The helper returns mapping metadata containing the source collection/key, target table/ID, deterministic method, and exact confidence.

---

# Part 3 - Exact Scalar Transforms

Pure helpers must:

* trim email display input and derive its case-insensitive key with Unicode-aware JavaScript lowercasing, without changing password or source-provider values;
* trim display names, preserve their user-facing case, and derive separate case-insensitive uniqueness keys;
* count Unicode code points for documented limits;
* convert non-negative decimal strings or finite numbers to integer cents or fantasy-point hundredths using exact decimal parsing and nearest-hundredth half-up rounding;
* reject exponent notation, unsafe results, negative values, and non-decimal input;
* accept timestamps only as non-negative safe Unix milliseconds or ISO timestamps with an explicit `Z`/numeric UTC offset;
* normalize `C`, `LW`, `RW`, and `F` to `F`; `LD`, `RD`, and `D` to `D`; preserve `G`; reject unknown positions;
* require statuses from an explicit caller-provided allowlist and never infer a status from absence.

Every conversion returns only new values and never mutates its input.

---

# Part 4 - Level Year Schedules

Construct contract, retention, and buyout year rows only from:

* a non-negative safe integer annual amount in cents;
* a positive safe-integer term;
* a non-negative starting season year.

Rows have sequential season years, the exact same annual amount, and a deterministic one-based sequence. The checked sum must remain safe and equal `annual amount * term`. A caller must explicitly name the schedule family.

No term, ownership, contract, or approval is inferred.

---

# Part 5 - Provider-First Player Mapping

Build an immutable in-memory index from approved target player candidates.

Mapping rules:

1. a supplied provider type and provider ID must match exactly one candidate;
2. provider identifiers are preserved exactly and never normalized as display text;
3. a missing provider match fails and does not fall back to a name;
4. name-only matching is disabled unless the caller explicitly enables the reviewed unique-name rule;
5. enabled name-only matching must resolve to exactly one normalized name;
6. zero matches fail as not found and multiple matches fail as ambiguous;
7. returned mapping metadata states `provider_exact` or `reviewed_unique_name` and its confidence.

Display names are never durable relationship keys when a stable provider identifier is present.

---

# Part 6 - Stable Errors

Public error categories:

```text
TRANSFORM_ARGUMENT_INVALID
TRANSFORM_UNREPRESENTABLE
PLAYER_MAPPING_NOT_FOUND
PLAYER_MAPPING_AMBIGUOUS
PLAYER_MAPPING_REVIEW_REQUIRED
```

Messages must not contain private source payloads.

---

# Part 7 - Verification

Focused synthetic tests must cover:

* RFC UUID version/variant bits, lower-case format, repeatability, tuple separation, and delimiter-collision resistance;
* mapping report metadata;
* email/name display preservation, case-insensitive keys, Unicode code-point limits, and immutability;
* exact half-up cent/hundredth rounding, boundary values, unsafe integers, exponents, negatives, and malformed input;
* explicit-offset timestamps and invalid/offset-free dates;
* position and explicit-status rules;
* level schedule rows, totals, boundaries, and invalid inputs;
* exact provider mapping, reviewed unique-name mapping, missing/ambiguous/review-required failures, and index immutability;
* no protected-file, repository-bundle, or database mutation.

Then run cumulative foundation, characterization, complete Node, syntax, whitespace, hash, artifact, process, and both-worktree gates.

---

# Part 8 - Safety Rules

* Use synthetic values only.
* Do not read current league, player, backup, snapshot, or statistics content.
* Do not classify Season 1 records or apply omission rules.
* Do not write SQLite or create a repository database.
* Do not invent a source relationship, term, actor, membership, or approval.
* Do not add dependencies or alter package metadata.
* Do not access staging or production.
* Preserve all prior and unrelated work.
* Do not commit, push, merge, deploy, reset, or cut over.

---

# Part 9 - Execution Sequence

1. Activate M2-08 and confirm safety baselines.
2. Add deterministic UUID and mapping metadata helpers.
3. Add exact scalar and yearly-schedule transforms.
4. Add provider-first player mapping.
5. Add focused synthetic tests.
6. Run every verification gate and reconcile safety evidence.
7. Archive M2-08 and activate M2-09 source-shape adapters and dry-run import reporting.

---

# Part 10 - Completion Checklist

M2-08 completes only when:

* deterministic IDs and reports are stable and collision-safe by construction;
* exact scalar transformations pass approved boundary tests;
* schedules reconcile without inference;
* provider-first mapping fails rather than guesses;
* every helper is pure and source-independent;
* existing suites and safety gates pass;
* completion evidence is archived;
* work transitions to M2-09 source-shape adapters and dry-run import reporting.

No current-source inventory or interpretation, reset execution, copied-data import, database write, bootstrap selection, application authority, staging, production, frontend-source, commit, push, merge, deployment, or cutover authority is included.

---

# Completion Evidence

Completed on 2026-07-19.

Implemented:

* committed UUIDv5 migration namespace and canonical source-identity tuples;
* immutable deterministic mapping-report metadata;
* separate display and case-insensitive normalized values;
* exact non-negative decimal conversion to integer cents and fantasy-point hundredths using half-up rounding;
* explicit-offset UTC timestamp conversion with calendar validation;
* approved player-position and explicit-status rules;
* reconciled level contract, retention, and buyout schedules;
* provider-first player mapping with reviewed unique-name fallback and ambiguity rejection.

Verification results:

* focused M2-08 suite: `8/8` tests passed, including the independent RFC UUIDv5 reference vector;
* cumulative M2 foundation suite: `52/52` tests passed;
* characterization suite: `164/164` tests passed;
* complete Node suite: `224/224` tests passed across `48` suites;
* syntax checks, `git diff --check`, protected JSON hashes, artifact scan, process reconciliation, and both-worktree inspection passed.

Only synthetic values were transformed. No protected JSON content was read or modified, and no source bundle, database, reset execution, copied-data import, staging, production, frontend-source, commit, push, merge, deployment, or cutover action occurred.
