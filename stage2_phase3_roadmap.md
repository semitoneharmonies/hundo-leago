Phase 3 — Scoring & Roster Model Expansion

Goal: Make Hundo Leago capable of running a real weekly fantasy game: expanded stats + configurable scoring + active/inactive lineup system (with salary-threshold inactive) that behaves predictably with weekly locks.

Rule of Phase 3:
Implement the “core physics” (stats → FP, roster → active/inactive, cap impact) without adding the optional spice systems (fatigue, streaks, bonuses, rivalries). Those come in Phase 4.

Phase 3 Definition
Allowed

Expand stat ingestion (shots/hits/blocks/etc.)

Add scoring weights UI (pre-season config only)

Compute FP using weights

Add inactive roster slots + salary threshold rule

Lineup UI to move players active ↔ inactive (pre-lock)

Enforce weekly lineup lock behavior

Not allowed

Implement fatigue / streaks / bonuses / rivalries

Change contract system rules

New draft systems

Multi-league work

1. Pre-Flight Checklist

☐ Branch

git checkout -b phase-3-scoring-lineups


☐ Confirm Phase 2 exists:

league.config present

preseason/active lock works

commissioner setup UI exists

☐ Decide your lineup-lock semantics (write this down)
You already have:

weekStartAtMs, baselineAtMs, lockAtMs, weekEndAtMs, rolloverAtMs

For Phase 3 lineup system, define:

Managers can edit active/inactive up until lockAtMs

After lockAtMs:

lineup is frozen for that week

changes apply to next week

☐ Confirm current Phase 3 matchups engine expects a roster snapshot at baseline/lock (don’t fight it)

2. Expand Stats Ingestion (Data Layer First)
Goal

/api/stats returns additional fields per player.

Checklist
☐ Extend stats cache schema to include:

shots (SOG)

hits

blocks

pim (optional)

powerPlayPoints (optional)

shortHandedPoints (optional)

faceoffWins (optional, only if you want)

Start minimal:

shots, hits, blocks

☐ Update ingestion pipeline to populate these fields (wherever your NHL API mapping happens)

☐ Backfill defaults for players missing fields:

default 0 (never undefined)

Verification
☐ /api/stats returns:

byPlayerId[playerId].shots/hits/blocks present (0+)

lastUpdatedAt unchanged behavior

3. Add Scoring Weights to League Config (Backend Truth)
Goal

FP calculation uses league.config.scoring.weights

Checklist
☐ Expand league.config.scoring.weights defaults to include:

goals

assists

shots

hits

blocks
(optional: others later)

Example defaults:

goals: 1.25

assists: 1.0

shots: 0.1

hits: 0.2

blocks: 0.2

☐ Add commissioner preseason UI controls to edit these weights
☐ Backend endpoint validates:

preseason only

numeric

sane ranges (e.g., -5 to 10 to prevent nonsense)

Verification
☐ Changing weights updates config and persists
☐ Managers can view weights read-only

4. Implement Central FP Computation (Single Source of Truth)
Goal

One function computes FP everywhere (free agents, matchups, standings, etc.)

Checklist
☐ Create services/scoringService.js with:

computeFP(stats, weights)

computeFPG(stats, weights) (optional)

☐ Ensure it handles missing fields as 0
☐ Replace all old hardcoded FP math (A + 1.25*G) with calls to scoringService

Verification
☐ Existing pages still show same FP when weights are default
☐ If weights change, all surfaces update consistently

5. Add Inactive Roster Slots (Data Model)
Goal

Teams can hold “inactive/bench” players separate from active roster.

Key rule you want

Only players with salary ≤ threshold can be benched

Inactive players:

do not count against cap

do not contribute FP that week

Checklist
☐ Add to league.config.roster:

inactiveSize (e.g., 5)

inactiveSalaryMax (e.g., 5)

☐ Add to each team structure:

inactive: [] array of playerIds
(If you already have roster and ir, this becomes the third bucket)

☐ Update roster size validation:

activeRosterCount + inactiveCount ≤ activeSize + inactiveSize

inactiveCount ≤ inactiveSize

enforce salary threshold when placing into inactive

Verification
☐ League loads with teams missing inactive → defaults to []

6. Add Backend Lineup Move Endpoints (Pre-lock Only)
Goal

Manager can move player between:

active roster ↔ inactive
(with constraints and lock behavior)

Checklist
☐ Add endpoint:
POST /api/team/lineup/move
Payload:

teamName

playerId

from: "active"|"inactive"

to: "active"|"inactive"

meta.actorTeamName (or your permissions model)

Validation
☐ Permissions: managers can only edit own team (commissioner override optional)
☐ Pre-lock only:

if nowMs >= lockAtMs for current week → reject OR queue for next week (see below)
☐ Constraints:

salary threshold for inactive

capacity limits

player must exist and be owned by team

Lock behavior choice
Pick one (don’t mix):

Strict reject after lock (simplest)

Queue for next week (better UX but more state)

My recommendation: strict reject for Phase 3. Queue later if needed.

Verification
☐ Calls succeed before lock
☐ Calls fail after lock with clear error message

7. Update Cap Computation to Exclude Inactive Players
Goal

Cap shows active roster cap only (plus IR rules as you define)

Checklist
☐ Update cap service:

totalCap(team) counts:

active roster salaries

IR? (your current logic)

retained/buyout penalties

excludes inactive salaries completely

☐ Update any UI that shows:

cap used

cap remaining

Verification
☐ Moving a player to inactive reduces cap used immediately
☐ Cap cannot go negative / exploit (inactiveSize is limited + salary threshold)

8. Integrate Active Lineup with Matchups Scoring
Goal

Weekly matchup FP totals only sum active players.

Checklist
☐ Update matchup scoring computation (preview/finalize):

team scoring uses only:

active roster playerIds (not inactive, not IR)

If you have baseline snapshots:

baseline store includes stats for all players

scoring diff applies only for active players

☐ Confirm roster lock logic and lineup lock logic align:

roster lock = legality / roster changes

lineup lock = active/inactive freeze
(These can be the same lockAtMs; keep it simple.)

Verification
☐ Matchups FP totals change if you bench a player before lock
☐ After lock, benching is blocked and matchup totals remain stable

9. Frontend Lineup UI (Minimum Viable)
Goal

Managers can actually set lineups without confusion.

Checklist
☐ Add a “Lineup” section per team roster page:

Active list

Inactive list

Buttons to move between lists

Show salary and FP (current season)

Show eligibility indicator:

“Eligible to bench (≤ $5)” or “Must stay active”

☐ Add “Lock status” banner:

“Lineups lock Monday 4:00 PM PT”

Show countdown / time

☐ If move fails after lock:

show backend error clearly

Verification
☐ Mobile UX works (tap target sizes)
☐ Actions never cover stats (your existing UX pain)

10. Commissioner Setup Wiring
Goal

Commissioner can choose inactive slots + salary threshold in preseason.

Checklist
☐ In League Setup:

inactiveSize input (default 0)

inactiveSalaryMax input (default 0 / disabled if inactiveSize=0)

☐ Lock these after season start (Phase 2 lock system)

Verification
☐ Changing inactive settings persists
☐ If inactiveSize is 0, UI hides bench features

11. Smoke Test Checklist (Mandatory)
Data

☐ /api/stats includes new fields and defaults to 0
☐ League config contains weights + inactive settings

Scoring

☐ With default weights, FP matches old formula
☐ Change weights → FP changes everywhere consistently

Lineups

☐ Bench player under salary threshold → success
☐ Bench player above threshold → blocked
☐ Bench beyond inactiveSize → blocked
☐ Cap used updates correctly
☐ Matchup FP totals use only active players
☐ After lockAtMs → lineup moves blocked

12. Phase 3 Exit Criteria (Non-Negotiable)

You are done when:

Expanded stats are ingested and served reliably

Scoring is weight-driven from config

One central scoring function is used everywhere

Teams have inactive slots with salary threshold rules

Cap excludes inactive players

Matchups scoring uses active lineup only

Lineup lock behavior is enforced cleanly
