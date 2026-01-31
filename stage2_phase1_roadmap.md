Phase 1 — Backend Architecture & Safety Refactor

Goal: Make the codebase maintainable without changing behavior.

Rule of Phase 1:
If a league behaves differently after this phase, it’s a failure.

Phase 1 Definition

No new features

No rule changes

No data migrations

No new endpoints

No frontend work (except imports if needed)

You are only reorganizing and clarifying what already exists.

1. Pre-Flight Checklist (Do This First)

☐ Create a new branch

git checkout -b phase-1-backend-refactor


☐ Tag current production commit (safety anchor)

git tag pre-phase-1


☐ Write down:

current boot flow

all active cron / interval jobs

all routes exposed

(This is your “nothing broke” comparison list.)

2. Decide the Target Folder Structure (Before Touching Code)

Create folders without moving code yet:

/src
  /routes
  /services
  /jobs
  /validators
  /utils
  server.js


☐ Do not rename files yet
☐ Do not change exports yet

This is just scaffolding.

3. Extract Routes (Biggest Win, Lowest Risk)
Goal

server.js should only:

create app

register middleware

mount routes

start server

Steps

☐ Identify all route blocks in server.js

/api/league

/api/stats

/api/matchups/*

/health

debug routes

☐ For each route group:

create a file in /routes

export a function (app) => { ... }

Example pattern:

// routes/leagueRoutes.js
module.exports = function registerLeagueRoutes(app) {
  app.get("/api/league", ...);
};


☐ Replace route definitions in server.js with:

require("./routes/leagueRoutes")(app);


☐ Verify:

all routes still respond

URLs unchanged

request/response payloads identical

4. Extract Long Logic Blocks into Services
Goal

Routes should orchestrate, not compute.

What qualifies as a “service”

cap calculations

trade validation

auction resolution

matchup logic

buyout math

Steps

☐ Identify any function longer than ~30–40 lines

☐ Move it to /services

// services/capService.js
function computeTeamCap(team) { ... }
module.exports = { computeTeamCap };


☐ Update routes to call the service

☐ Ensure:

function inputs are explicit

no hidden globals introduced

behavior identical

☐ Do not refactor logic yet — only relocate it

5. Extract Background Jobs / Timers
Goal

Make background work visible and intentional.

Steps

☐ Identify:

setInterval

scheduled jobs

stat refresh loops

matchup auto-jobs

☐ Move each job into /jobs

// jobs/matchupJobs.js
function startMatchupJobs({ leagueStore }) { ... }
module.exports = { startMatchupJobs };


☐ In server.js, call jobs explicitly:

if (MATCHUPS_ENABLED) {
  startMatchupJobs({ leagueStore });
}


☐ Verify:

jobs still start at boot

gating flags still work

logging unchanged

6. Centralize Validation Logic
Goal

Rules should not live inside routes.

Steps

☐ Identify validation logic:

roster legality

trade legality

auction bid validity

buyout eligibility

☐ Move into /validators

// validators/tradeValidator.js
function validateTrade(trade, league) { ... }


☐ Routes should:

call validators

return errors

not re-implement rules

☐ Do not merge or simplify rules yet

7. Reduce server.js to a Coordinator

At the end of this phase, server.js should:

☐ Configure middleware
☐ Load leagueStore
☐ Register routes
☐ Start jobs
☐ Start server

Red flag: if server.js is still >300 lines, you missed something.

8. Smoke Test Checklist (Mandatory)

Run every one of these manually:

☐ /health
☐ /api/league
☐ /api/stats
☐ /api/matchups/current
☐ /api/matchups/standings

☐ Place an auction bid
☐ Resolve auctions
☐ Execute a trade
☐ Trigger a buyout
☐ Verify cap math unchanged

If any output differs → stop and fix.

9. Diff Review (Critical)

☐ Compare pre-phase and post-phase behavior:

same routes

same payloads

same logs (or strictly more informative)

☐ Ensure:

no new state fields

no renamed JSON keys

no changed timing

10. Commit & Tag

☐ Commit with message:

Phase 1: Backend architecture refactor (no behavior change)


☐ Tag:

phase-1-complete


☐ Merge only after one full manual test pass

Phase 1 Exit Criteria (Non-Negotiable)

You may not start Phase 2 unless:

server.js is slim and readable

routes, services, jobs are separated

league behaves exactly the same

you feel confident adding new systems without fear
