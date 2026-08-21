# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`ACTIVE - M7-26 FULL-SITE UI REVIEW`

## Work Plan ID

```text
M7-26
```

## Work Item

```text
Full-site UI review, plain-language workflow correction, permission hardening,
and isolated staging release
```

## Authority and Boundary

Grae supplied a complete site-review report on `2026-08-20`, asked Codex to
weight the whole update before coding, and authorized implementation through
the normal documented workflow until the verified deployment is complete.

This plan permits coordinated frontend and backend changes, focused additive
SQLite migrations when required, canonical documentation updates, disposable
local testing, separate repository commits, publication to the existing
dedicated staging services, and hosted role-based acceptance after every local
gate passes.

The approved deployment target for this plan is isolated staging. This plan
does not authorize a production branch merge, production deployment,
production data correction, environment-variable change, reset, restore, or
migration. Production remains a later explicit release decision.

The review is authoritative for the requested user experience. Where it
changes an older approved product or technical rule, the affected canonical
specification must be reconciled before dependent code is implemented.

## Progress Weighting

| Review section | Weight |
| --- | ---: |
| Site-wide language, errors, identity, and shared UI | 5% |
| League dashboard | 6% |
| Teams page | 2% |
| Team roster pages and hockey-lines Bench | 6% |
| Future collectible player card | 0% - deferred |
| Drafts and Free Agent Draft results/privacy | 5% |
| Players catalog and autocomplete | 4% |
| Auctions | 2% |
| Trades and Future Considerations | 8% |
| Matchups | 3% |
| Standings and contextual result correction | 10% |
| League Activity | 5% |
| Notifications | 5% |
| League Rules display audit | 4% |
| Account-menu cleanup | 1% |
| Commissioner competition tools | 8% |
| Commissioner roster tools | 2% |
| Commissioner and administrator permissions | 11% |
| Administrator-only surfaces | 3% |
| Documentation, automated/browser verification, deployment, and hosted smoke test | 10% |
| **Total** | **100%** |

Progress is earned only when the applicable implementation and proportional
verification pass. The cumulative checkpoints are `17%`, `34%`, `52%`,
`72%`, `90%`, and `100%`.

## Approved Scope and Checkpoints

### Checkpoint 1 - 17%

Implement the shared plain-language/error and team-identity presentation,
dashboard, Teams, shared matchup-card treatment, Matchups copy, and account
menu cleanup. Preserve approved recent activity, team-directory behavior,
matchup data, notification bell, and main navigation.

### Checkpoint 2 - 34%

Implement roster and Hockey Lines presentation, verify IR and Prospect moves,
complete server-side Players filters before pagination, fix autocomplete
overflow/results, simplify the Drafts results presentation and privacy, and
correct Auctions total-value and phase labels. Preserve Favorites, active-line
cards, Trade and Request trade actions, and working player-detail navigation.

### Checkpoint 3 - 52%

Implement the simplified trade asset model, manager acceptance followed by
commissioner approval for Future Considerations, the shared detailed Trade
block, plain-language League Activity, and the unread-first Notifications
workflow with a separate Previous notifications view.

### Checkpoint 4 - 72%

Implement compact branded Standings, contextual commissioner result
correction with preview and automatic recalculation, and the audited
commissioner competition and roster surfaces. Remove the normal standalone
Result correction and Standings rebuild panels only after the contextual
replacement works. Retain the backend rebuild endpoint as an explicit recovery
capability. Retain Correct roster because implementation review confirms it
uniquely supports team-transfer, category, position, and slot/re-slot
corrections not covered by Add player, Remove player, or Correct contract;
present that purpose plainly.

### Checkpoint 5 - 90%

Audit the displayed League Rules against canonical behavior, protect platform
administrators from commissioner membership or team-access changes, guarantee
administrator access to every league through protected persisted membership,
enforce one current commissioner and an atomic transfer workflow, and verify
administrator league creation and membership/team-access surfaces.

The existing Beta League duplicate-commissioner presentation must be repaired
only through the canonical commissioner pointer and an explicit reversible
staging data operation. No production data repair is authorized by this plan.

### Checkpoint 6 - 100%

Finish canonical documentation, complete focused and full backend/frontend
tests, lint, production build, desktop/mobile/keyboard/accessibility browser
checks, dependency and whitespace gates, exact staging builds, verified backup
and restore when a migration is required, isolated Render and Netlify staging
deployment, health checks, and authenticated hosted smoke tests.

## Reconciled Product Decisions

1. The dynamic season label comes from the league's authoritative persisted
   current-season display value; it is never advanced from the browser clock.
2. Uploaded team logos are preferred. The fallback is the shared team-pattern
   colour mark with no initials. Missing colours use the existing safe default
   pattern and accessible contrast treatment.
3. The collectible hockey-card interaction and removal of the standalone
   player-detail experience remain post-launch. Existing detail links remain
   until the replacement is implemented.
4. Published Free Agent Draft results expose player identity and Signed, Not
   won, or Tied status to league members. Offer amount and term are returned
   only to a current manager of the selected team. Commissioner or platform-
   administrator authority alone does not reveal those private offer details.
   Historical Candidate Card deep links redirect to the selected-team results
   view and do not bypass that projection.
5. New trades present Player, Draft pick, Buyout obligation, and Future
   considerations. Requested retained salary is nested on its outgoing Player.
   A standalone existing retention obligation cannot be added to a new trade;
   persisted historical proposals/assets remain readable and remain executable
   or reversible where their recorded state permits. An exact idempotent
   proposal-creation retry replays its original result without applying the new
   standalone-retention grammar as a fresh request.
6. Only the current proposing-team manager may create or cancel a proposal, and
   only the current receiving-team manager may accept or reject it. A receiving
   manager's acceptance of a trade containing Future considerations persists
   the acceptance snapshot and projects `Awaiting Commissioner Approval`
   without transferring assets. Commissioner or inherited platform-
   administrator authority permits safe inspection, that approval after
   current-state revalidation, and separate recovery only; it grants no manager
   write.
   No counter endpoint or service is implemented in M7-26.
7. Notification `GET` requests remain read-only. After the unread batch is
   successfully rendered, the page sends one explicit authenticated,
   idempotent batch acknowledgement for exactly the displayed notification
   IDs, retains that snapshot for the mounted visit, and surfaces any failure.
   A separate query displays previously read notifications. This is the sole
   approved automatic-on-view write in the normal interface.
8. Routine Active/Bench moves and lineup/position warnings are filtered from
   the normal League Activity projection; their underlying audit or operational
   evidence is not deleted.
9. Result-correction preview identifies the matchup by week and team names and
   includes projected standings impact. Confirmation stores the correction and
   rebuilt standings atomically or fails without partial state.
10. Platform administrators receive and retain a protected active membership
    in every league. League creation provisions it, existing leagues are
    reconciled additively, and commissioners cannot alter or remove it. All
    non-administrator league isolation remains unchanged.
11. Raw request IDs, internal codes, operation versions, database identifiers,
    and JSON remain available to server logs and protected technical evidence
    but are not shown in the normal user or commissioner interface.

## Data and Migration Safety

UI-only work must not write league state. Read-only previews remain read-only.
Every new state-changing workflow uses an explicit unsafe HTTP method,
authenticated server authority, optimistic or aggregate version checks,
idempotency, transaction boundaries, audit evidence, and focused
cross-league/role tests.

Any schema change is additive and forward-only. Before applying it to shared
staging, the operator must positively identify the staging Render service,
disk, database identity, source and target schema, create and verify an
encrypted backup, prove a clean restore to a distinct inactive path, and keep
production untouched. After a shared post-migration write, correction is
forward-only unless a separately authorized restore is selected.

The M7-26 staging authority repair must use the reviewed package command; ad
hoc SQL is not an approved substitute:

```text
npm run db:reconcile:m7-26:staging -- --database '<absolute database path>' --environment staging --persistent-root '<absolute persistent root>' --release-id '<HL release ID>' --confirmation 'M7-26:<release ID>:staging:<environment ID>:<database ID>'
```

Run the read-only authority preview before the backup and again immediately
before this command. The command is permitted only while the exact staging
service is under the full maintenance hold with writes, scheduled jobs, FAD
routes, delivery email, debug routes, and scheduled backups disabled. It must
preserve the pointer-backed commissioner, fail closed on an ambiguous or
unsafe authority record, reconcile only the reported administrator membership
and surplus-commissioner rows in one transaction, write its deterministic
audit receipt, and return an exact zero-write replay for the same release.
Afterward, the preview must report no mutation required before migrations
`0053` and `0054` are applied.

No script or migration in this plan may open, repair, reset, or otherwise
modify production data. The user must be warned again before any later
production correction of Beta League or another protected membership record.

## Required Verification

Frontend:

```text
npm run lint
npm test
npm run build
npm run verify:m3-browser-authority
npm ls --all
git diff --check
```

Backend:

```text
npm run check
npm test
git diff --check
```

Focused tests must cover every changed response contract, role boundary,
league-isolation case, hidden/internal-field rule, automatic acknowledgement,
trade approval transition, result correction/rebuild transaction, protected
administrator membership, commissioner transfer, legacy-history read, and the
approved focused prospect sign/decline/release movement.

Browser acceptance must cover manager, commissioner, and platform-
administrator roles at desktop and narrow mobile widths. Hosted smoke tests
avoid real auction, trade, roster, result, notification, membership, or data-
repair writes unless the exact staging fixture action is separately planned,
reversible, and recorded.

## Stop Conditions

Stop before production. Stop if an exact staging target, database identity,
backup, restore, migration boundary, release identity, or rollback point cannot
be proven. Stop rather than weakening authorization, exposing private offer or
bid data, inventing frontend league calculations, deleting audit evidence, or
removing a recovery path before its replacement is verified.

## Completion Conditions

M7-26 is complete only when:

1. all weighted checkpoints are implemented and verified;
2. both repositories pass their focused and complete gates;
3. required canonical specifications reflect the implemented behavior;
4. exact frontend and backend commits are published separately to staging;
5. any staging migration has verified backup, clean-restore, integrity,
   foreign-key, and rollback evidence;
6. Render and Netlify deployments identify the exact tested builds;
7. public health and authenticated desktop/mobile role smoke tests pass;
8. protected staging data changed only through recorded approved workflows;
9. no production branch, service, data, configuration, job, or traffic changed;
   and
10. the release evidence records exact commands, results, deploy IDs, risks,
    and remaining production decision.
