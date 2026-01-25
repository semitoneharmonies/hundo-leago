Phase 3 — Matchups, Standings, and Commissioner-Controlled Week Windows
Core Principle (New, Canonical)

A matchup “week” is not a fixed calendar week.
A matchup week is an explicit time window defined and persisted in the backend.

Every matchup week has:

A start time (when scoring begins and baseline is captured)

A roster lock time (when eligibility rules apply)

An end time (when scoring stops)

A rollover time (when results finalize and the next week begins)

Defaults match traditional fantasy hockey, but the commissioner may override them for future weeks to accommodate NHL scheduling irregularities (season start, holidays, season end).

Default Week Behavior (Baseline Rules)

Unless overridden by the commissioner:

Week start: Monday 00:00 PT

Baseline snapshot: Monday 00:00 AM PT

Roster lock: Monday 4:00 PM PT

Week end: Sunday 23:59 PT

Rollover: Monday 1:00 AM PT

All timing is derived from the week’s configured boundaries, not hard-coded weekdays.

Commissioner-Controlled Week Windows (New Capability)

For each matchup week, the commissioner may define:

weekStartAtMs

weekEndAtMs

lockAtMs

rolloverAtMs

Derived Rules (Canonical)

Baseline snapshot is always taken at:

weekStartAtMs + 1 hour (default)

Time of day may be commissioner-adjustable if needed

Roster lock:

Occurs on the first day of the matchup

Time of day is commissioner-configurable per week

Rollover:

Occurs at or immediately after weekEndAtMs

Finalizes results and advances the schedule

Changing a week’s start or end automatically shifts:

Baseline capture

Lock timing

Rollover timing

Scoring window

Guardrails (Important)

Commissioner may edit future weeks only

Optionally: current week may be edited only before any team is locked

Past or finalized weeks are immutable unless using explicit commissioner override tools

Weeks may not overlap

Gaps between weeks are allowed (but discouraged)

Phase 3 Roadmap (Updated)
Session 0 — Lock Matchup & Week Rules (No Code)

Goal: remove all ambiguity before implementation.

Document:

Week is an explicit time window

Baseline is taken at week start (default +1h)

Lock occurs on first day of week at commissioner-defined time

End of week controls when scoring stops

Rollover finalizes results and advances schedule

Defaults remain Monday→Sunday unless overridden

This document becomes canonical.

Session 1 — Backend Matchup Data Model (State Only)

Goal: backend can persist matchup weeks with custom boundaries.

Add to league state:

matchups: {
  scheduleWeeks: [
    {
      weekIndex,
      weekId,
      weekStartAtMs,
      weekEndAtMs,
      lockAtMs,
      rolloverAtMs,
      pairs: [[teamA, teamB]]
    }
  ],
  currentWeekIndex,
  locksByTeam: {},
  baselineByPlayerId: {},
  resultsByWeek: {}
}


Ship criteria:

No breakage to /api/league

Matchup weeks persist across reloads

Defaults generated correctly

Session 2 — Schedule Generation with Default Week Windows

Goal: schedule is created once and stored as source of truth.

Backend:

Generate round-robin pairs for 6 teams

Generate default week windows (Mon→Sun)

Store full schedule in scheduleWeeks

UI:

Matchups page reads current week from backend

Ship criteria:

Backend owns schedule and timing

UI never computes weeks

Session 2.5 — Commissioner Week Window Editor (No Scoring Yet)

Goal: commissioner can adjust week boundaries safely.

Commissioner Panel:

Select a future week

Edit:

Start date/time

End date/time

Lock time (time of day)

Backend validates:

No overlap

Chronological order

Week not finalized

Ship criteria:

Edited weeks persist

Matchups page reflects new windows

Session 3 — Roster Locking with Grace Period (Core Logic)

Goal: lock behavior respects custom week timing.

Rules:

At lockAtMs:

Legal teams lock

Illegal teams remain unlocked and ineligible

After lock time:

First moment a team becomes legal → lock immediately

Lock uses active roster snapshot at that moment

Eligibility:

Unlocked → 0 FP

Locked → eligible from baseline

Ship criteria:

Manual testing via roster edits works

Lock timing changes with week start

Session 4 — Weekly Scoring via Baseline Delta

Goal: correct scoring regardless of week length.

At baseline time:

Snapshot cumulative stats per player

Weekly FP:

currentFP − baselineFP

Rules:

Same baseline applies even if team locks late

Short weeks and long weeks work identically

Ship criteria:

Weekly FP resets correctly

Grace behavior preserved

Session 5 — Rollover & Results Finalization

Goal: close week and advance schedule safely.

At rolloverAtMs:

Compute final eligible FP

Determine winner/tie

Write immutable results

Advance currentWeekIndex

Capture new baseline for next week

Rollover is idempotent.

Ship criteria:

No double advances

Results persist correctly

Custom week lengths respected

Session 6 — Standings (Read-Only)

Goal: boring, correct standings.

Backend:

Update standings at rollover

Or aggregate from resultsByWeek

UI:

Read-only standings table

Ship criteria:

Stable standings

No manager writes

Session 7 — Hardening & Commissioner Safeties

Add:

/api/health includes:

currentWeekId

lock counts

last rollover time

Snapshot before rollover

Commissioner tools:

Recompute weekly scoring (read-only)

Emergency freeze before edits

Why This Is the Right Design

Handles Christmas breaks, season start/end, and NHL weirdness

Preserves your Stage 1 “no surprises” rule

Keeps commissioner power explicit and guarded

Avoids retroactive chaos

Scales cleanly into playoffs later
