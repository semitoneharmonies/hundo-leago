Phase 7 — Stage 2 Validation Season

Goal: Prove Hundo Leago can run a full season end-to-end inside the platform with high trust: no data loss, no commissioner emergencies, and no mid-season rule changes.

This phase is not “build more.” It’s operate + stabilize.

Rule of Phase 7:
Once the season starts: no new features. Only bug fixes, observability, and small UX clarity improvements that don’t change rules.

Phase 7 Definition
Allowed

Bug fixes

Performance/reliability improvements

Monitoring / logging / admin safety tools

UX clarification (“this locks at…”, error messages, read-only pages)

Emergency commissioner tools (if they don’t alter rules)

Not allowed

New gameplay systems

Rule tweaks mid-season

Data migrations without a rollback plan

Any changes that re-interpret previously recorded results

1. Pre-Season Launch Checklist (Before Clicking “Start Season”)
A) Lock the Constitution

☐ Commissioner verifies league config:

roster sizes

cap size

contract model

contract years cap

scoring weights

optional toggles

☐ Confirm “League Setup” is accurate
☐ Click Start Season (Phase 2)
☐ Verify config becomes immutable

B) Full Reset & Initialization

If Stage 2 begins with a reset:

☐ Empty rosters created correctly
☐ Draft picks generated (if Phase 5 included)
☐ Rights lists empty or carried intentionally
☐ SeasonId correct (e.g., 2026–27)

C) Final Pre-Launch Verification

☐ /health OK
☐ /api/league returns valid config + teams
☐ /api/stats ingest is current
☐ Matchups week windows correct (Start/Baseline/Lock/End/Rollover)
☐ Standings endpoint stable
☐ Any shadow-mode behavior clearly labeled in UI (no confusion)

2. Observability & Safety Systems (You Need These)
A) Logging (Minimum)

☐ Log every critical write:

trades

auction resolves

lineup moves

draft picks used

ELC signing

matchup finalize

season state changes

☐ Log includes:

actor

timestamp

before/after summary

weekId where relevant

B) Automated Backups (Non-negotiable)

☐ Verify league-state backup rotation works
☐ Confirm backups are on persistent disk
☐ Confirm restore procedure exists and has been tested once

Restore drill
☐ In dev: restore from backup and boot successfully

C) “Read-only Mode” Kill Switch

If something goes wrong, you need a safe brake.

☐ Add env flag:

READ_ONLY_MODE=true
When enabled:

all POST/PUT/DELETE routes reject

GET routes still work

Verification
☐ Flip flag → site becomes view-only

3. Operational Runbook (Write This Once)

Create a simple RUNBOOK.md:

☐ How to:

check service health

inspect latest backups

restore from backup

disable jobs safely

toggle read-only mode

identify last mutation in audit trail

This is what prevents 3am panic.

4. Validation Plan (How You Know It’s Working)
A) “Week Lifecycle” Acceptance Test

Run this for Week 1, then periodically:

☐ Week starts
☐ Baseline captured once (idempotent)
☐ Lock happens at lockAtMs
☐ No lineup changes affect the week after lock
☐ Week finalizes once
☐ Standings update correctly
☐ Rollover advances weekIndex and weekId correctly

B) Feature-by-Feature Validation (Only What’s Enabled)

For each enabled optional toggle:

test one obvious case early season

confirm it’s explained in UI

confirm it is deterministic / auditable

☐ Performance bonuses (if enabled)
☐ Late lock risk (if enabled)
☐ Fatigue (if enabled)
☐ Hot/cold (if enabled)
☐ Rivalries (if enabled)
☐ Retention/buyout decay (usually offseason only)

5. Freeze Policy (Avoid Death by Tweaks)

Once the season starts:

☐ No config changes
☐ No scoring weight changes
☐ No contract rule changes
☐ No “just this once” commissioner edits unless it’s a documented emergency tool

If a change is needed:

record it as “Next Season” issue

ship it after season ends

6. Bug Fix Policy (So You Don’t Accidentally Change Rules)

Classify bugs into:

Allowed mid-season

UI display issues

wrong formatting

incorrect labeling

crashes

performance issues

incorrect implementation of already-agreed rules

Not allowed mid-season

any change that alters match outcomes retroactively

rule reinterpretation

tweaks to balance “because it feels off”

If a scoring bug is found:
☐ Fix it
☐ Do not retroactively recompute prior weeks unless you have unanimous league agreement and a one-time migration plan

7. Manager Trust Features (Small but Huge)

These don’t change rules but massively reduce complaints:

☐ “Why is my score X?” breakdown on matchups
☐ “Locks at:” countdown and status indicators
☐ Clear display of:

active lineup

inactive lineup

cap used / cap remaining

contract years used / remaining

☐ Standings tie-breakers clearly defined

8. Performance & Cost Guardrails (Don’t Let It Get Slow)

☐ Confirm stat ingest and matchup jobs are cheap
☐ Add basic rate limiting if needed
☐ Cache computed views where appropriate (standings, league hub)
☐ Monitor memory usage / file writes

9. End-of-Season Checklist (Completing Phase 7)

When season ends:

☐ Mark season as completed
☐ Freeze results
☐ Generate end-of-season export snapshot
☐ Apply offseason transitions (if enabled):

retention decay

buyout decay

fatigue reset (if you want)

clear weekly modifiers

☐ Determine draft order + run lottery
☐ Hold entry draft event
☐ Transition to preseason for next season setup

10. Phase 7 Exit Criteria (Stage 2 is proven)

You “pass” Phase 7 only if:

A full season completes inside Hundo Leago

No data loss

No emergency commissioner firefighting

Managers trust results

Stability and UX are good enough that you’d run it again without fear

Only then do you consider Stage 3.
