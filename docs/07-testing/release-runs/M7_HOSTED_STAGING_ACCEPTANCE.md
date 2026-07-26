# M7 Hosted Staging Acceptance

## Status

`M7-13 RESIDUAL REMEDIATION PASSED / USER ACCEPTANCE READY`

Production remains `NO-GO`. This record does not authorize a production
reset, migration, deploy, traffic change, job activation, or merge to `main`.

## Original M7-09 Candidate

```text
Release ID:          HL-20260724-1
Frontend branch:     staging
Frontend commit:     3d2cc5989badd9432c312410d4306d07d6c400ce
Backend branch:      staging
Backend commit:      1b366691a3edb14eac2af68e52f74fdbe32cf089
```

## Hosted Resources

```text
Netlify project:     hundoleago-staging
Netlify site ID:     95af8aa7-0b13-4954-af6d-855762acb147
Netlify URL:         https://hundoleago-staging.netlify.app
Netlify deploy ID:   6a6406ea4958711f91ddc4f0

Render service:      hundo-leago-backend-staging
Render service ID:   srv-d9eo2turnols73ekb830
Render URL:          https://hundo-leago-backend-staging.onrender.com
Render deploy ID:    dep-d9i0t77aqgkc73c96l8g
```

The dedicated staging resources are distinct from Netlify production project
`hundoleago` and Render production service `hundo-leago-backend`.

## Publication Evidence

Netlify reported the final deploy `ready` at
`2026-07-25T00:44:50.381Z`.

* one SPA redirect rule was processed successfully;
* 295 files were secret-scanned with zero matches;
* `/` and `/sign-in` returned HTTP 200;
* the published bundle contains the exact Render staging origin and frontend
  commit;
* the published bundle contains no localhost API fallback.

Render reported the final deploy `live` at
`2026-07-25T01:19:26.422270Z`.

* public liveness returned HTTP 200 with `live`;
* public readiness returned HTTP 200 with `ready`;
* authenticated operations health reported the exact backend and frontend
  commits;
* schema version is 18;
* migration checksum-set ID is
  `02aff6b32705d53716c41d0e6e4396bd04922ba9173c979ac02d80059540982a`;
* environment ID is `test:release-qa`;
* database ID suffix is `-fixture`;
* scheduled jobs are disabled;
* maintenance/write mode is `open`;
* outbox state was two pending fixture events, zero publishing, and zero
  failed.

## Deterministic Fixture

```text
Fixture manifest checksum:
6ae04870c33a6b723a0f53c604a3c964773b8e6fb6b7f10ed4e1ac5bbfd9c98c

Database identity:
m7-release-qa-fixture

Database path:
/opt/render/project/data/hundo-staging/sqlite/hundo-leago.sqlite3
```

The fixture contains nine controlled account states and two isolated leagues.

## Verification

### Local candidate gates

Frontend:

* 95/95 automated tests passed;
* lint passed;
* M3 browser-authority verification passed;
* the production build completed with 1,746 modules.

Backend:

* syntax check passed;
* 894/894 automated tests passed after the final hosted-verifier correction;
* the Render build independently passed 893/893 tests for the preceding
  runtime-equivalent commit before the verifier-only cookie assertion changed.

### Hosted release-QA verifier

The canonical verifier completed successfully against the two public HTTPS
staging origins.

```text
Report checksum:
465980974b2fa2c9aaeb084b0f25348179ac2358341720d05e87f15e8e137c71
```

Passed checks:

* account-state rejection;
* authentication, reload, and session lifecycle;
* exact Origin enforcement;
* CSRF rejection and authorized write;
* administrator authority across two explicit memberships;
* commissioner authorization and sealed-bid privacy;
* representative league, team, roster, player, auction, trade, matchup, and
  standings reads;
* cross-league read and write denial;
* operations-health authorization;
* scheduled-job disablement.

The hosted Socket.IO check also passed:

* the exact Netlify staging origin completed an authenticated WebSocket
  handshake;
* a hostile origin was denied;
* the verification session signed out cleanly.

### Live browser smoke

The dedicated Netlify site rendered successfully in the live browser.

* the staging administrator signed in;
* both Release QA leagues were visible;
* Release QA Alpha opened successfully;
* the dashboard rendered Week 2, all six teams, one open auction, two pending
  trades, and recent activity.

## Grae Manual Hosted Staging Acceptance

Manual review was completed against the public staging site using the original
72-check browser checklist. This is user-observed evidence only; it does not
replace the automated hosted verifier or authorize a production action.

```text
Passed:      62
Failed:       4
Not tested:   6
Overall:      FAIL / BLOCKED
```

### Passed

* A01-A06; B01-B15; C01-C03, C05-C08, C11-C13; D01-D04, D06-D10;
  E01-E02, E04-E07; F01-F12; and G01-G03, G05.

### Failed

* C04 — player names were readable, but there was no player-detail page.
* C09 — matchups did not show player lists.
* C10 — team fantasy totals were readable, but player statistics could not be
  reviewed because no players were listed.
* G04 — after reconnecting, the user had to click a link to reload.

### Not tested

* A07 — the application navigation uses the root URL, so direct protected
  nested-URL behavior could not be exercised.
* D05 — the Players page did not show team ownership.
* E03 — no Beta commissioner test account was available.
* E08-E10 — not tested during the interactive review.

The failures and untested gates mean the candidate is not release-ready.
Production remains blocked. Grae must decide whether to authorize a scoped
staging defect-fix plan, supply the missing test coverage/accounts, or close
the acceptance review with these gates explicitly deferred.

## Backup and Restore

The staging backup configuration validates with:

* environment `staging`;
* prefix `hundo-leago/staging/`;
* local staging directory under the staging persistent root;
* HTTPS object-storage endpoint;
* configured staging credentials;
* scheduled backups disabled.

The encrypted offsite upload was attempted and failed safely with
`BACKUP_OFFSITE_OPERATION_FAILED`. No offsite manifest was available for an
offsite restore. The provider/credential target must be reviewed before this
gate can pass; no production storage value may be substituted.

A hosted online SQLite backup and clean-path restore were then verified on the
staging disk:

```text
Backup ID:
backup-v1-c5ab2c75353274af89c3207fb89ba3ba0f9e51dd81dd4bc2414ac3a35e4f3d47

Plaintext SHA-256:
c5ab2c75353274af89c3207fb89ba3ba0f9e51dd81dd4bc2414ac3a35e4f3d47

Manifest checksum:
29eef03b34aba68766a745b86f60de2e645d2473ab7a0d985520948905d8cb66

Integrity:
ok

Foreign-key violations:
0

Restored schema version:
18
```

The clean restore used a new path and did not replace the live staging
database.

## Original M7-09 Provider Evidence

The hosted verifier intentionally did not trigger an NHL refresh. Operations
health reported a last-valid 2026-27 statistics refresh. Provider failure
containment and last-valid preservation remain covered by the full automated
suite. A focused live NHL refresh is still a manual/provider gate.

Email remains capture-only. Scheduled jobs remain disabled.

## Rollback Evidence

* current accepted Netlify staging deploy:
  `6a6406ea4958711f91ddc4f0`;
* prior Render staging deploy that passed the hosted application checks:
  `dep-d9i0pajtqb8s73ad57hg` at backend commit
  `311cf268cc4c486e12b1941a22f365ad88b0468a`;
* current accepted Render staging deploy:
  `dep-d9i0t77aqgkc73c96l8g` at backend commit
  `1b366691a3edb14eac2af68e52f74fdbe32cf089`.

Rollback must select only one of these staging identities. Code rollback does
not roll back or restore SQLite state.

## M7-10 Remediation Retest

The staging-only remediation was published and retested on `2026-07-25`.

```text
Frontend application commit: 84bb957ff75c351e2c55238bacb982f8dcf8b46b
Frontend Netlify deploy:      6a64b810e7798072d13f104e
Backend commit:               0e97b056a3946bcbaeb782d23d849bb2b508a125
Backend Render deploy:        dep-d9ib71l8nd3s739k1v60
Fixture build:                m7-release-qa-fixture-v6
```

Local publication gates passed:

* backend provider-contract focus: `32/32`;
* complete backend: `962/962`;
* complete frontend: `106/106`;
* frontend lint, production build, and browser-authority verification.

The explicit staging import ran only while writes were closed. SportsDataIO
Discovery Lab returned `3,154` catalog players and `1,091` mapped 2025-26
regular-season statistics rows. The adapter derives provider season
`2026REG`, rejects non-regular-season totals, and exposes no subscription key.
After reopening writes, provider health retained the successful import and a
real Connor McDavid detail page displayed 82 games, 48 goals, 90 assists, and
138 points with a visible last-season label.

The accepted M7-09 failures and untested authority cases were retested:

* league-scoped player details show ownership, contract, and statistics;
* current matchups show player lists plus G, A, PTS, and FP values;
* a Render staging restart preserved the selected matchup route and all 20
  table rows without a manual refresh;
* direct protected commissioner URLs deny the Alpha manager;
* the Beta commissioner cannot address the Alpha league; and
* the platform administrator can inspect both deliberately different fixture
  leagues.

The commissioner smoke added a real imported free agent to Alpha Foxes,
moved the player through Bench, Active, Injured Reserve, Prospect, and back to
Bench, corrected total salary and term, then removed the player. Every apply
followed a read-only preview, returned an activity identifier, updated the cap
projection, and appeared in League Activity. The exceptional IR and Prospect
warnings required confirmation. The player returned to free agency and Alpha
Foxes returned to its fixture cap.

The seeded trade view restored three pending, one accepted, and one rejected
record. The invalid-cap acceptance preview displayed
`SALARY_CAP_EXCEEDED`, projected usage of `$102.00` against the `$100.00`
limit, and the approved general-illegality warning. The trade was not accepted
during smoke testing. This matches `TRADES.md`, which allows completion only
after explicit warning confirmation; the manual guide now tests the warning
instead of incorrectly requiring a hard block.

The final staging-only reset:

* created and verified backup
  `backup-v1-14c101189ceadd0de55d7cffd6b0727ddb2e43af820968804b525f9756fe4215`;
* invalidated all fixture sessions;
* restored six Alpha and six Beta teams;
* restored Fixture Player 19 to Alpha Owls Bench and Beta Vipers Bench;
* restored all five seeded trade states and populated matchup statistics; and
* preserved the `3,154`-player catalog and `1,091`-player successful import.

The final Render staging runtime has writes open and scheduled jobs disabled.
The final Netlify staging deploy is healthy. No production service, data,
configuration, branch, job, provider, or traffic setting was changed.

## M7-11 Usability Remediation

The second staging-only remediation was published and verified on
`2026-07-26`.

```text
Release ID:                    HL-20260726-2
Frontend application commit:   1233c3c6185d4f7edfa8dcedc8d59dcedce0f0a5
Frontend Netlify deploy:        6a6638fa90a1d936d7ab5426
Frontend Netlify build:         6a6638fa90a1d936d7ab5424
Backend application commit:     e7f089ecc81ca9fa17b8b0143949b760668f66d1
Backend Render deploy:          dep-d9j3ghhba33s73821490
Preflight report checksum:      8dcdd49eb3903fb658815cd9460f3dd1fbb04d10736e56b16d526f36a129299a
Fixture build:                  m7-release-qa-fixture-v7
```

The release preflight returned `ready-for-freeze-review`. The frontend
application commit is the exact source used for the prebuilt Netlify artifact;
the later documentation commit does not alter the application bundle.
Netlify reported the deploy `ready`, processed two redirect rules, scanned
`341` files with zero secret matches, and published a bundle containing the
exact frontend commit and Render staging origin with no configured localhost
origin.

Render reported the deploy `live`. Public liveness returned `live`, public
readiness returned `ready`, scheduled jobs remained disabled, and writes
remained open. The final runtime reports the exact frontend and backend
application commits.

### Schema 19 migration

The first deploy attempts failed closed with `MIGRATION_DATABASE_BEHIND`; the
previous runtime remained live. Before migration, the staging database was
schema `18`, `integrity_check=ok`, and had zero foreign-key violations.

The verified persistent pre-migration backup is:

```text
Backup ID and plaintext SHA-256:
backup-v1-81b3ca0f587fc64b24c2dba445e04db156e27f19055de0736f9582536560d7dd

Manifest checksum:
11e22b8db32572a413bb2ddc428ecc72cb026cd047c23a3a17260ab035b46d0d
```

Migration `19` ran once from the exact backend candidate. The final database
has schema `19`, nineteen migration-ledger rows, the exact migration checksum,
both new tables, `integrity_check=ok`, and zero foreign-key violations.

### Final fixture reset

The protected staging-only reset:

* created and verified backup
  `backup-v1-4605c937816ac2469b3e62f3a804d236a5c53df6bc7dddcbfaef5bd3c3d353a6`;
* invalidated all fixture sessions;
* installed fixture build `m7-release-qa-fixture-v7`;
* preserved the `3,154`-player catalog and `1,091`-row successful statistics
  import; and
* restored both isolated six-team leagues, their controlled accounts, seeded
  trades, matchups, rosters, and authoritative activity.

### Hosted browser acceptance

The administrator and Alpha-manager workflows confirmed:

* the dashboard and Alpha Ravens roster use provider-backed NHL player names;
* Alpha Ravens reports `$7.25` usage, `$6.50` active salary, `$0.75`
  retained salary, `$0.00` buyout penalties, `1/3` retention slots, and
  `$92.75` available against a `$100.00` limit;
* the roster exposes sixteen owned picks across four chronological years,
  switches between league teams, supports table and hockey-line views, and
  persists keyboard display ordering;
* the Players page loads `3,154` available records, excludes unavailable
  records, defaults to descending fantasy points, sorts columns, filters,
  compares selected players, and sends a stable player selection to Auctions;
* Connor McDavid was prefilled in the auction form while the single eligible
  team appeared as implicit `Starting for Alpha Ravens` context;
* the trade composer exposes only Contract, Prospect, Draft pick, Buyout
  penalty, Retention, and Future Considerations, and contract selection shows
  named authoritative players instead of stable identifiers;
* pending trade panels show player names and contract terms instead of raw
  JSON;
* League Activity defaults to readable summaries, times, and team names;
* Account settings expose display name, immutable email, password change, and
  the authorized Alpha Ravens name, logo, and two-colour profile controls; and
* a direct Alpha-manager request for the Beta Vipers roster was denied with a
  user-facing team-access message.

Dashboard, roster, Players, Trades, Activity, and Account had document width
equal to viewport width at `390 × 844`, with no visible whole-page overflow.

The connected browser cannot synthesize a native HTML pointer drag. Focused
frontend coverage proves the DOM drag handler and saved-order payload, and the
hosted browser proves equivalent keyboard ordering persists after reload.
Manual native pointer drag remains an explicit user-acceptance check.

No production service, branch, deploy, data, schema, configuration, job,
provider state, domain, or traffic setting was changed.

## M7-12 Acceptance-Fix Remediation

The third staging-only remediation was published and verified on
`2026-07-26`.

```text
Release ID:                    HL-20260726-3
Frontend application commit:   7146bd042fd86f11dd4f1226c61d879f4956f358
Frontend Netlify deploy:        6a66610577aa69f808ad00a9
Frontend Netlify build:         6a66610477aa69f808ad00a7
Backend application commit:     a821a95a267a370d7f3fe3ef0b8cfdacea83aea5
Backend Render deploy:          dep-d9j5vnt8nd3s73asjkn0
Preflight report checksum:      d92192498d533c90ea160867c7b1c5378324c2c1c2b1d40aec47b2a309d68d06
Fixture build:                  m7-release-qa-fixture-v8
```

The preflight returned `ready-for-freeze-review`. The complete frontend gate
passed `115/115` tests across 23 files, lint, production build, and
browser-authority verification across 15 compatibility files and 98 shipped
source files. The complete backend gate passed `968/968` tests across 232
suites under Node `24.14.1`, plus the repository check.

Render reported deploy `dep-d9j5vnt8nd3s73asjkn0` `live`. Public liveness
returned `live` and public readiness returned `ready`. Netlify reported deploy
`6a66610577aa69f808ad00a9` `ready`, processed two redirect rules, scanned
`343` files, and found no secret matches. The frontend application commit is
the exact source used for the uploaded Netlify artifact; the later
documentation-only commit does not alter that bundle.

### Fixture v8 reset

The protected staging-only reset:

* created and verified backup
  `backup-v1-d90df160904d8d36441233bffc6037207fa4bb666677798557f82a4a07412ca1`;
* invalidated all prior staging sessions;
* installed fixture build `m7-release-qa-fixture-v8`;
* preserved the complete `3,154`-player provider catalog; and
* restored both isolated release-QA leagues with the commissioner account
  separate from team-manager assignments and all 22 regular-season weeks.

### Hosted browser acceptance

The platform-administrator and Alpha Ravens manager sessions confirmed:

* a commissioner-only dashboard has no implicit managed team, while the
  Alpha Ravens manager dashboard retains its team context;
* Commissioner Roster Operations has the cleaner operation guide and no
  Import health or raw-JSON pane;
* team-directory cards render team-specific two-colour stripe backgrounds;
* Alpha Ravens reports `$7.25` usage, `$92.75` space, `$6.50` active salary,
  `$0.75` retained salary, `1/3` retention slots, and `$0.00` buyouts in five
  finance cards;
* the roster defaults to forwards before defence, exposes sortable GP, G, A,
  P, FP, and FPG columns, switches teams from one control, shows sixteen
  owned picks over four years, switches to hockey lines, and persists and
  restores keyboard ordering;
* the Players page exposes All Players, Free Agents, Favourites, every team,
  and Prospects, includes FPG, loads `3,154` visible provider records, defaults
  to descending FP, and filters a selected favourite;
* Connor McDavid handed off to Auctions by stable ID and appeared prefilled
  while the team was implicit as `Starting for Alpha Ravens`;
* contract selection exposes optional retained AAV, Future Considerations
  exposes only a notes field, and Alpha Foxes' selectable buyout reads
  `Adam Klapka · $92.50 penalty · 1y`;
* the selected buyout detail identifies Adam Klapka's buyout as `$92.50 AAV`
  with `1 season remaining` and states that the complete remaining obligation
  transfers;
* pending trade panels use player names and contract terms instead of JSON;
* Matchups exposes all 22 regular-season weeks, Week 1 loads without a
  response-shape error, Week 10 shows future opponents, and live fixture team
  totals differ; and
* League Activity remains summary-first and Account settings remains
  reachable.

No auction, trade, roster correction, account change, or team-profile change
was submitted during acceptance. The temporary roster keyboard reordering was
restored.

At the connected browser's narrow `667`-pixel viewport, the tested document
width equalled the viewport width with no whole-page horizontal overflow. The
connected browser cannot synthesize a native HTML pointer drag. Focused
frontend coverage proves the DOM drag handler and saved-order payload, and the
hosted browser proves equivalent keyboard ordering. Manual native pointer
drag remains an explicit user-acceptance check.

No production service, branch, deploy, data, schema, configuration, job,
provider state, domain, or traffic setting was changed.

## M7-13 Residual-Review Remediation

The fourth staging-only remediation was published and verified on
`2026-07-26`.

```text
Release ID:                    HL-20260726-4
Frontend application commit:   51f9c22c8127dcc992ca35ffcb9bdd10c14d3634
Frontend Netlify deploy:        6a666d6791675949811e06c9
Frontend Netlify build:         6a666d6791675949811e06c7
Backend application commit:     a821a95a267a370d7f3fe3ef0b8cfdacea83aea5 (unchanged)
Backend Render deploy:          dep-d9j5vnt8nd3s73asjkn0 (unchanged)
Fixture build:                  m7-release-qa-fixture-v8 (unchanged)
```

The exact frontend commit was pushed to `origin/staging` before artifact
publication. Netlify reported the final deploy `ready`, processed both redirect
rules, scanned `344` files, and found no secret matches.

The complete frontend gate passed `115/115` tests across 23 files, lint,
production build, browser-authority verification across 15 compatibility
files and 98 shipped source files, and `git diff --check`.

### Hosted browser acceptance

The platform-administrator session confirmed:

* the dashboard represents the administrator as league-wide, with All teams,
  no assigned team, and no managed roster;
* Commissioner Roster Operations shows one selected workflow at a time, has
  no Import health pane, collapses the cap and staging-reset support panels,
  and has corrected narrow-layout spacing;
* team-directory cards show strong horizontal primary/secondary colour bands;
* all 22 matchup weeks and completed Week 1 load; and
* League Activity remains summary-first without raw activity or user IDs.

The Alpha Ravens manager session confirmed:

* the dashboard and auction composer use the assigned Alpha Ravens context;
* the roster shows `$7.25` usage, `$92.75` space, `$6.50` active salary,
  `$0.75` retained salary, `1/3` retention slots and `$0.00` buyouts in five
  cards, plus sixteen picks over four years;
* active players default to forwards then defence by descending AAV and render
  larger GP, G, A, P, FP and FPG values in both table and hockey-line views;
* keyboard ordering saves authoritatively and was restored, while explicit
  mouse/touch drag handles are present in both views;
* provider-backed player names replace fixtures; FP is the default sort; FPG,
  Favourites, Free Agents, every team and Prospects are available; and a
  selected Connor McDavid handed off to Auctions prefilled with the manager's
  team implicit;
* Trades exposes optional contract retention, notes-only Future
  Considerations, and the named `Adam Klapka · $92.50 penalty · 1y` buyout
  obligation instead of an arbitrary amount;
* all 22 matchup weeks, completed Week 1 and scheduled Week 22 are selectable;
  and
* a temporary team rename appeared immediately in Matchups and the dashboard
  quick view, then the original Alpha Ravens name was restored.

The tested narrow browser document width equalled the viewport width with no
whole-page horizontal overflow. No auction, trade, commissioner correction or
fixture reset was submitted. The temporary roster display-order and team-name
changes were restored.

The connected browser's raw drag synthesis did not activate the application
gesture. Focused tests pass the desktop-native handle path, mouse/touch pointer
drop-target path, keyboard fallback, and saved-order payload. Manual native
pointer dragging remains the explicit Grae acceptance check.

No production service, branch, deploy, data, schema, configuration, job,
provider state, domain, or traffic setting was changed.

## Remaining Gates

* Grae's independent browser retest, including native pointer drag, and
  staging acceptance;
* staging offsite object-storage upload and encrypted clean restore after the
  staging-only provider target is reviewed; and
* separate explicit production authorization and release execution.

Production remains blocked pending those separate gates.
