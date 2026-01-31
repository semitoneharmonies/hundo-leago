Phase 4 — Optional Rule Systems

Goal: Implement your chosen “fun toggles” as independent, preseason-configurable systems that are locked at season start and cannot compromise league integrity.

Your list (exactly):

Performance bonus

Retained salary decay / buyout decay

Fatigue

Late lock risk

Hot / cold streaks

Rivalries

Rule of Phase 4:
Every system must be:

togglable pre-season

deterministic or bounded RNG (auditable)

isolated (can be removed without breaking core gameplay)

explainable in UI (“why did I get this score?”)

Phase 4 Definition
Allowed

Implement effects of toggles on scoring/cap/week outcomes

Add UI to configure parameters (optional, minimal)

Add UI to display effects (badges, breakdowns, recaps)

Add audit logging

Not allowed

Entry draft system

Team identity stripes system

Multi-league/admin

Big scoring model rewrites (Phase 3 already did that)

1. Pre-Flight Checklist

☐ Branch

git checkout -b phase-4-optional-systems


☐ Confirm Phase 2 + 3 done:

league config exists + locking works

scoring weights exist

active/inactive lineup exists

matchups engine exists (even if shadow mode)

☐ Add a “Feature Toggles” table in your docs listing:

toggle name

where it affects the system (cap / scoring / lineup / trades)

required data additions

(This becomes your sanity map.)

2. Establish a Standard “Rule Engine” Pattern (Do This First)
Goal

Avoid spaghetti. Every optional rule should plug into the same architecture.

Checklist
☐ Create services/rules/ folder with a consistent interface:

Example pattern:

// services/rules/index.js
function applyRules({ league, weekContext, teamContext, scoringContext }) {
  // returns { adjustments, logs }
}


But keep it simple: you want these hooks:

adjustCap(team) (optional)

adjustTeamWeekFP(teamWeekFPBreakdown) (optional)

validateLineupMove(move) (optional)

getUiBadges(team/week/player) (optional)

☐ Create a standard “explainability payload”:

each rule returns:

ruleId

label

delta (FP change or cap change)

reason

scope ("team-week" | "player-week" | "contract" etc.)

Verification
☐ You can run scoring with all rules off and it behaves exactly like Phase 3.

3. Implement Each Toggle One at a Time (In This Order)

Order matters: start with low-risk deterministic systems, finish with bounded RNG.

3A. Rivalries (LOW RISK, HIGH FUN)

Toggle: rivalries

Definition (Phase 4 MVP)

Commissioner defines rival pairs of teams pre-season

UI highlights rivalry matchups

Optional effects later, but Phase 4 MVP can be “cosmetic + history”

Checklist
☐ Add config structure:

config.rivalries.enabled

config.rivalries.pairs = [[teamA, teamB], ...]

☐ Add commissioner UI to set pairs (pre-season only)
☐ Add matchups UI badge “RIVALRY”
☐ Add league history entry when rivalry game happens (optional)

Verification
☐ Rivalry status persists and is visible
☐ No scoring changes yet (unless you explicitly add one)

3B. Late Lock Risk (DETERMINISTIC)

Toggle: lateLockRisk

This is about what happens if a team is illegal at lock / fixes after lock.

You already have an “illegal teams don’t lock, then lock when legal” behavior. Late lock risk is making that explicit and configurable.

MVP Definition Options (pick one, don’t mix)

Mode 1: Illegal at lock → score 0 until fixed; once fixed, points count from week start (your current behavior)

Mode 2: Illegal at lock → score 0 until fixed; once fixed, points count only from fix time forward (stricter)

Mode 3: Illegal at lock → full week points, but FAAB fine / penalty (less punitive)

Checklist
☐ Add config:

config.lateLockRisk.enabled

config.lateLockRisk.mode = "retroactive" | "fromFixTime" | "fineOnly"

optional fineAmount

☐ Update roster lock job/scoring computation:

if enabled and illegal-at-lock tracked:

apply chosen mode
☐ Add explainability message in matchup breakdown

Verification
☐ Simulate illegal team at lock then fix:

behavior matches selected mode

audit trail shows “illegal at lock” event

3C. Retained Salary Decay + Buyout Decay (DETERMINISTIC)

Toggles: retainedSalaryDecay, buyoutDecay

MVP Definition

Each retained salary entry decays each season:

e.g., 50% → 25% → 0

Each buyout penalty decays each season similarly:

or over a fixed number of seasons

Checklist
☐ Define decay schedule in config:

config.retainedSalaryDecay.enabled

config.retainedSalaryDecay.schedule = [1.0, 0.5, 0.25, 0] (example)
(or yearsToZero)

Same for buyouts.

☐ Decide when decay is applied:

recommended: at season rollover (end-of-season action)
Not weekly.

☐ Implement a season transition routine (even if Stage 2 reset does this later):

a function that applies decay when you increment seasonId

☐ Ensure audit entries:

“Retention decayed: X → Y”

“Buyout penalty decayed: X → Y”

Verification
☐ Run “advance season” in dev mode and confirm:

numbers decay exactly

no negative/NaN

cap math reflects decay

3D. Performance Bonuses (DETERMINISTIC)

Toggle: performanceBonus

This should be predictable and not require complex stat history.

MVP Definition (good and simple)

At the end of each matchup week:

If a team’s weekly FP exceeds a threshold → award:

FAAB bonus, OR

“cap rebate” next week, OR

small standings point bonus (risky), OR

“bonus FP” next week (also risky)

My recommendation for MVP: award FAAB.
It’s fun, visible, and doesn’t corrupt standings integrity.

Checklist
☐ Add config:

enabled

threshold type:

absolute FP (e.g. 120)

or percentile (top team each week)

reward amount:

FAAB +5

or “bonus token” (if you had currencies; you don’t)

☐ Implement bonus issuance:

at week finalization (your resultsByWeek write)

write to league history

☐ Add “Bonuses Earned” view:

per team, season totals

Verification
☐ Finalize a week with high FP → bonus awarded
☐ Finalize again (idempotency) → bonus not duplicated

3E. Fatigue (LOW RNG OR DETERMINISTIC)

Toggle: fatigue

Fatigue can get messy fast. Keep it simple and tied to your lineup system.

MVP Definition (simple + fair)

If a player is kept active for N consecutive weeks → slight FP penalty starts

Or if a team plays too many “cheap bench” swaps → fatigue increases (but you don’t want that)

My recommendation: player streak-based fatigue:

activeWeeksInARow counter per player per team

After 3 weeks active → apply -X% FP to that player until rested (benched 1 week)

Checklist
☐ Add per-team per-player usage state:

fatigueState[playerId] = { activeStreak: n }

☐ Update at rollover:

if player active this week → streak++

else → streak resets (or decreases)

☐ Apply fatigue during scoring:

adjust FP for those players

include explainability

☐ Add UI:

fatigue badge next to player

shows “fatigued: -5%”

Verification
☐ Player active 4 weeks → penalty applies
☐ Bench for a week → resets and penalty disappears
☐ No double counting across finalize/preview

3F. Hot / Cold Streaks (BOUNDED RNG, AUDITABLE)

Toggle: hotColdStreaks

This is the most “gamey” one. You must make it auditable.

MVP Definition (bounded + transparent)

At week start (baseline), some players are assigned:

HOT: +X% FP for the week

COLD: -X% FP for the week

Odds are low and configurable.

Assignment is deterministic given a seed:

seed = leagueId + weekId (or a stored random seed)

Checklist
☐ Add config:

enabled

hotChance (e.g. 3%)

coldChance (e.g. 3%)

magnitudePct (e.g. 5%)

☐ Implement streak assignment:

run once per week (idempotent)

store results:

matchups.weekModifiersByWeekId[weekId] = { hot: [playerIds], cold: [playerIds], seed }

☐ Apply modifier during scoring with explainability

☐ UI:

HOT/COLD badge on affected players

show the exact modifier

Verification
☐ Same week always produces same assignments
☐ Assignments persist across restart
☐ Finalize is idempotent

4. Add Commissioner UI for These Toggles + Minimal Params
Goal

Commissioners configure them pre-season; then they lock.

Checklist
☐ In League Setup:

toggle switches for each feature

for each feature, show a collapsible “Advanced” with 1–3 parameters max

default values sane and safe

☐ After season start:

controls disabled

show “Locked for season” note

5. Explainability Everywhere (Don’t Skip)

If rules affect FP/cap, user must be able to answer:

“Why did my score change?”

Checklist
☐ In matchup breakdown UI, add an “Adjustments” section:

list each rule adjustment with delta and reason

☐ In team page, add a “Rules Active” panel showing enabled toggles

6. Audit Trail + Idempotency Requirements (Critical)

Anything that writes must be idempotent:

performance bonus award

weekly hot/cold assignments

fatigue state updates

late lock penalties/fines

Checklist
☐ Store a “processed” marker per week per rule
☐ Always re-runnable jobs do not duplicate writes
☐ Log rule-triggered writes in league history

7. Smoke Test Checklist (Mandatory)

For each feature, test ON and OFF:

Rivalries

☐ Pair shows badge in matchups
☐ No scoring changes

Late lock risk

☐ Simulate illegal at lock → verify chosen mode
☐ Fix later → verify scoring changes and explainability

Retention / buyout decay

☐ Run end-of-season routine in dev → verify decay schedule

Performance bonus

☐ Finalize week → bonus issued once
☐ Re-finalize → no duplicate

Fatigue

☐ Player active streak triggers penalty
☐ Rest clears penalty
☐ Explainability shows delta

Hot/cold streaks

☐ Weekly assignment happens once
☐ Stored and deterministic
☐ FP adjusted and shown

8. Phase 4 Exit Criteria (Non-Negotiable)

You are done when:

All six toggles exist in league config

All six can be enabled/disabled pre-season

All six are locked after season start

Each system is isolated and auditable

Any scoring/cap effect is clearly explained in UI

All weekly jobs remain idempotent
