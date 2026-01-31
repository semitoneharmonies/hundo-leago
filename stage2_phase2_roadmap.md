Phase 2 — Commissioner UX + League Configuration Foundation

Goal: Make “League Setup” real: clean commissioner panel, persistent league config, and hard locking once the season starts.

Rule of Phase 2:
You may add UI + config plumbing, but no gameplay rule systems yet (no fatigue, no bonuses, etc.).
After Phase 2, the league can be “configured” and “locked,” even if most toggles don’t do anything yet.

Phase 2 Definition
Allowed

New league config object + persistence

Commissioner panel UI cleanup + structure

Pre-season vs in-season separation

“Locking” mechanics

Read-only display of settings for managers

Not allowed

Implementing performance bonus / fatigue / streak logic

Changing auction/trade/buyout behavior

Changing scoring behavior

Data migrations that rewrite existing league state in-place (avoid)

1. Pre-Flight Checklist

☐ Branch

git checkout -b phase-2-league-setup


☐ Confirm Phase 1 tags exist and main still deploys from main only
☐ Snapshot current league-state.json somewhere safe (dev and prod)

☐ Decide your season boundary condition now:

“Season starts when commissioner clicks Start Season”

or “Season starts at first matchup week start”

or “Season starts at first auction resolve”

My recommendation: explicit Start Season button (you control lock timing and avoid ambiguity).

(If you don’t want to decide yet, implement the “Start Season” flag but keep it hidden—still better than implicit locking.)

2. Define the League Config Schema (Before UI)

Create a single canonical object, something like:

league.config

exists for all leagues (even Stage 1)

defaults are filled automatically

Checklist

☐ Create config/defaultLeagueConfig.js (or similar) returning the defaults
☐ Add config/schemaNotes.md (simple doc) describing each field and when it’s editable

Suggested schema (minimum viable)
{
  version: 1,

  season: {
    status: "preseason" | "active" | "completed",
    startedAtMs: null,
  },

  roster: {
    activeSize: 15,
    inactiveSize: 0, // Phase 3 will use ~5
    irSize: 4,
    minForwards: 8,
    minDefensemen: 4,
  },

  cap: {
    capLimit: 100,
    contractMaxYears: 3,
    contractYearsCap: 35, // if roster ~20 (commissioner chosen)
  },

  contracts: {
    model: "flat" | "escalator" | "front_back",
    // model params kept but not used until later phases
    escalator: { type: "flat" | "percent", amount: 1 },
    frontBack: { maxYearToYearDiff: 2 }, // or percent band
  },

  scoring: {
    // Phase 3/4: expanded stats weights
    weights: { goals: 1.25, assists: 1.0 },
  },

  toggles: {
    performanceBonus: false,
    retainedSalaryDecay: false,
    buyoutDecay: false,
    fatigue: false,
    lateLockRisk: false,
    hotColdStreaks: false,
    rivalries: false,
  }
}


☐ Decide now: where the “truth” lives

Backend is source of truth (recommended, consistent with your current approach)

3. Persist Config in League State (No Breaking Changes)

☐ Add league.config with defaults when missing

This should happen during league load (server boot)

Must be non-destructive

☐ Ensure it writes back safely when commissioner updates settings

Verification

Existing leagues load fine

No crashes if config absent

/api/league includes config

4. Add Minimal Backend Endpoints for Config

You need exactly two:

Read

☐ GET /api/config or just use /api/league (fine)
Recommendation: keep it inside /api/league for now to minimize endpoints.

Write (commissioner only)

☐ POST /api/commissioner/config/update

payload: patch object { path, value } or nested object merge

MUST validate:

actorRole is commissioner

season.status is preseason

allowed fields only (no arbitrary writing)

MUST log to audit trail

Key rule
☐ Reject updates if season is active/completed

5. Implement “Start Season” Lock (Foundation)

☐ Add endpoint: POST /api/commissioner/season/start

sets:

config.season.status = "active"

config.season.startedAtMs = Date.now()

☐ Add endpoint: POST /api/commissioner/season/resetToPreseason

Only allowed in non-production OR behind a special env flag

Mainly for dev testing

☐ In UI: Start Season button with scary warning text

Verification

Once started: config updates rejected

Config becomes read-only everywhere

6. Commissioner Panel UI Restructure (High Impact)
Goal

Commissioner panel should feel like:

Setup section (preseason only)

Operations section (in-season tools)

Debug hidden

Checklist
☐ Create a new CommissionerPanel layout with sections:

A) League Setup (only visible in preseason)

Roster settings (read-only for now if you want)

Cap settings

Contract model selector (flat/escalator/front-back)

Scoring section placeholder (Phase 3 expands)

Feature toggles (display only / disabled behavior for now)

“Start Season” button

B) In-Season Tools

existing tools you already have (whatever is currently there)

show “Setup Locked” banner + timestamp

C) Debug

only in dev env

collapsible

Visual cleanup rules
☐ Consistent spacing and grouping
☐ Each section has a short description
☐ Keep the panel shorter (collapsible groups)

7. Implement Config Editing UX (Safe and Clear)

☐ For each editable field:

UI control

backend update call

optimistic update OR refresh after save

☐ Include “Default value” behavior:

show current

show default (optional)

reset-to-default button (preseason only)

☐ Add “Unsaved changes” guard:

if user edited fields locally and navigates away, warn or auto-save

Verification

Changing config persists across refresh

Refreshing /api/league shows changes

8. Role-Based Visibility (Small but Important)

☐ Managers can see the settings read-only somewhere:

either in Commissioner panel (hidden for non-commissioner)

or a “League Rules” / “League Settings” read-only section

This increases trust:

“We’re playing under these rules.”

9. Audit Trail Entries (Don’t Skip)

Every config change should log:

☐ Who (commissioner)
☐ What changed (field path)
☐ Old value → new value
☐ Timestamp

Same for:
☐ Start Season

Verification

history panel shows config edits

10. Smoke Test Checklist (Mandatory)
Backend

☐ Load league with no config → defaults created
☐ Update a config field in preseason → persists
☐ Start season → status flips to active
☐ Attempt config update after start → rejected
☐ Restart server → config unchanged
☐ Audit trail includes config changes

Frontend

☐ Commissioner sees Setup section in preseason
☐ Manager does not see commissioner controls
☐ Everyone can view settings read-only (wherever you put it)
☐ Start season button shows confirmation and then locks UI

11. Phase 2 Exit Criteria (Non-Negotiable)

You are done when:

League config exists and persists

Commissioner panel is tidy and structured

Preseason vs in-season is explicit

League setup can be locked permanently with a Start Season action

Config is immutable after lock

Audit trail records changes

Even if toggles don’t do anything yet, they’re now part of the league constitution.
