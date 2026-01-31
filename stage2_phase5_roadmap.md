Phase 5 — Entry Draft, Picks, and Prospect Rights

Goal: Give the league a future. Add a real NHL-style entry draft with tradeable picks, lottery logic, and drafted-player rights—without destabilizing contracts, cap, or the active season.

Rule of Phase 5:
Draft assets and rights must exist independently of rosters and cap until a manager explicitly converts them (by signing an ELC).

Phase 5 Definition
Allowed

Draft picks as first-class tradeable assets

Draft order + lottery logic

Online draft room (annual event)

Drafted player “rights” (not rostered)

ELC signing flow

Not allowed

Changes to scoring, matchups, or optional rule toggles

Mid-season draft

Multi-league or admin UI

Prospect gameplay mechanics (no scouting, fog of war, etc.)

1. Pre-Flight Checklist

☐ Branch

git checkout -b phase-5-entry-draft


☐ Confirm prerequisites:

Phase 2 league setup + locking exists

Phase 3 rosters/cap/lineups stable

Phase 4 optional systems isolated (on/off)

☐ Decide when the entry draft happens

Recommendation: after season completion, before next season setup

Draft is a distinct “offseason state”

☐ Add a new season status (even if internal):

season.status = "completed" | "offseason" | "preseason" | "active"

2. Draft Pick Data Model (Foundation)
Goal

Draft picks are durable, tradeable assets up to 5 years out.

Checklist
☐ Define a canonical draft pick object:

{
  pickId: "2027-R1-T03",
  seasonId: 2027,
  round: 1,
  originalOwnerTeamId,
  currentOwnerTeamId
}


☐ At league creation or season rollover:

Generate 3 rounds of picks per team

Generate picks for:

current season + next 5 seasons

☐ Persist picks in league state:

league.draftPicks[]

☐ Ensure picks:

are immutable in identity

only ownership changes

Verification
☐ Picks survive restarts
☐ Picks appear in /api/league
☐ No duplicate pickIds

3. Enable Pick Trading (Minimal Integration)
Goal

Draft picks behave like other trade assets.

Checklist
☐ Update trade schema to allow:

including draft pickIds

☐ Update trade validator:

pick exists

team owns the pick

no duplicate inclusion

future-year picks allowed up to 5 years out

☐ Update trade execution:

ownership swaps correctly

audit trail logs pick movement

Verification
☐ Trade involving picks executes cleanly
☐ Pick ownership updates correctly
☐ Pick history is traceable via audit

4. Draft Order & Lottery Logic (NHL-Style)
Goal

Draft order is fair, reproducible, and auditable.

Rules (as you defined)

Bottom half of league → lottery

Top half → reverse standings

Weighted odds (like NHL)

Checklist
☐ Decide standings cutoff logic:

bottom floor(N/2) teams enter lottery

☐ Define odds table (example for 6-team league):

Worst team: 30%

2nd worst: 25%

3rd worst: 20%
(Adjust as desired; keep documented)

☐ Implement lottery draw:

deterministic seed stored (e.g., draftLotterySeed)

draw once per draft

store results:

league.draft.lotteryResults = {
  seed,
  order: [teamIds...]
}


☐ Fill remaining picks in reverse standings order

Verification
☐ Same seed → same result
☐ Lottery results persist across restart
☐ Order clearly displayed in UI

5. Draft Room (Online Annual Event)
Goal

A simple, fun, controlled environment to make picks.

Checklist
☐ Create Draft Page:

shows draft order

current pick highlight

countdown timer (optional but nice)

drafted players list

☐ Draft flow:

only team on the clock can draft

commissioner override allowed

auto-pick / skip logic (optional for MVP)

☐ Draft action:
POST /api/draft/pick
Payload:

pickId

playerId

actor validation

☐ On draft:

pick is consumed

playerId added to team’s draftedRights

audit trail entry written

Verification
☐ Pick can only be used once
☐ Draft order advances correctly
☐ Draft can resume after refresh/restart

6. Drafted Player Rights (Not Rostered)
Goal

Drafted players are owned but not rostered or counted.

Checklist
☐ Add per-team structure:

draftRights: [playerId]

☐ Drafted players:

do NOT count toward roster size

do NOT count toward cap

cannot score

cannot be traded unless you explicitly allow rights-trading (optional, later)

☐ Add UI section:

“Unsigned Drafted Players”

Verification
☐ Drafted player appears only in rights list
☐ Cap and roster unaffected

7. Entry-Level Contract (ELC) Signing Flow
Goal

Allow teams to convert rights → rostered contract.

Checklist
☐ Define ELC rules (simple MVP):

fixed term (e.g., 2 years)

fixed salary (e.g., $1–$2)

counts toward contract years cap

☐ Add endpoint:
POST /api/team/signELC
Payload:

playerId

validation:

team owns rights

roster space exists

contract years cap allows

season state allows signing (preseason/offseason)

☐ On success:

remove from draftRights

add to roster

attach contract object

audit entry written

Verification
☐ Signing updates roster + contract
☐ Cannot sign twice
☐ Cannot sign without rights

8. Commissioner Controls & Visibility
Goal

Commissioner can manage the event without breaking rules.

Checklist
☐ Commissioner-only actions:

pause/resume draft

skip a team (with audit log)

manually assign a pick (emergency)

☐ Visibility:

managers can see:

upcoming picks

owned picks

draft results history

9. UI Surfaces to Update

☐ Team page:

Draft picks owned (by year/round)

Unsigned drafted players

☐ League page:

Draft order

Lottery results

Draft history

☐ Trade UI:

Ability to include picks

10. Audit Trail & Idempotency (Critical)

Checklist
☐ Every draft pick usage logs:

team

pickId

playerId

timestamp

☐ Draft actions are idempotent:

re-submitting same pick → rejected

refresh during draft → state intact

☐ Lottery draw logged and immutable

11. Smoke Test Checklist (Mandatory)
Picks

☐ Picks generated correctly for 5 years
☐ Pick ownership persists
☐ Pick trading works

Lottery

☐ Bottom-half teams included
☐ Odds applied correctly
☐ Results reproducible via seed

Draft

☐ Draft order respected
☐ Picks consumed once
☐ Draft resumes after refresh

Rights & ELC

☐ Drafted players stored as rights
☐ ELC signing moves player to roster
☐ Cap + contract years update correctly

12. Phase 5 Exit Criteria (Non-Negotiable)

You are done when:

Draft picks exist as tradeable assets

Draft order and lottery are fair, reproducible, and auditable

Online draft can be completed end-to-end

Drafted players are held as rights

ELC signing works cleanly

No draft action affects active-season scoring or cap unexpectedly
