Phase 6 — League Identity & Transparency

Goal: Make the league feel real and easy to understand at a glance: a CapFriendly-style hub, consistent team branding (logo + stripes), and clean visibility into rosters, cap, contracts, picks, and rights.

Rule of Phase 6:
This phase should be mostly read-only UX + identity, with minimal new “game logic.”
You are building trust, clarity, and vibe.

Phase 6 Definition
Allowed

CapFriendly-style league pages (read-only browsing)

Team identity system (logo + stripes)

Edit Team page (manager-owned customization)

Pick/right visibility improvements

Minor API endpoints to support read-only views

Not allowed

New rules affecting scoring/cap outcomes

Entry draft changes (Phase 5 already did)

Stage 3 admin/multi-league work

1. Pre-Flight Checklist

☐ Branch

git checkout -b phase-6-league-identity


☐ Confirm Phase 5 done:

picks exist + tradeable

rights exist

ELC signing exists

draft history is stored

☐ Decide “canonical team identity fields” now (write these down):

logo image

stripe pattern choice

stripe colors (2–3)

fallback colors (if unset)

2. Team Identity Data Model (Backend Truth)
Goal

Every team has a stable identity representation used everywhere.

Checklist
☐ Extend team model to include:

team.identity = {
  displayName: "Pacino Amigo", // existing
  logoUrl: "",                // existing-ish (or stored asset path)
  stripes: {
    patternId: "threeVertical" | "twoDiagonal" | "chevron" | ...,
    colors: ["#xxxxxx", "#yyyyyy", "#zzzzzz"] // 2–3 depending on pattern
  }
}


☐ Decide where logos live:

if you already store base64 in JSON: keep for now (simple but heavier)

better: store file on disk + save path/url (recommended long-term)
For Phase 6 MVP, do whatever your current logo flow already uses.

☐ Add defaults:

if stripes unset, fall back to:

existing single team color replicated into stripes

Verification
☐ Existing leagues load fine even if identity missing
☐ Identity appears in /api/league

3. Define Stripe Patterns (Keep It Tight)
Goal

Give customization without exploding UI.

Checklist
☐ Choose 4–6 stripe patterns max for MVP:

2-vertical

3-vertical

2-horizontal

diagonal split

chevron

center stripe

☐ For each pattern define:

required number of colors (2 or 3)

how it renders in small sizes (chips, table rows)

Verification
☐ Each pattern looks good at:

24px avatar chip

48–64px medium

banner header width

4. Edit Team Page (Manager-Owned Customization)
Goal

Managers can change:

team name

team logo

stripe pattern

stripe colors

Checklist
☐ Create a new page: /team/edit (or similar)
☐ Permissions:

manager edits only their own team

commissioner override optional

☐ Inputs:

Team name (validate length, characters)

Logo upload (reuse your existing profile-image upload flow if possible)

Stripe pattern picker

Color pickers (2–3)

Preview panel showing:

small chip

banner sample

table row sample

☐ Save call:
POST /api/team/identity/update

preseason allowed, in-season allowed (identity changes shouldn’t affect fairness)

audit log entry

Verification
☐ Save persists across refresh
☐ Identity used in top bar, tables, matchups

5. CapFriendly-Style League Hub (Read-Only, High Value)
Goal

One place to browse the entire league:

rosters

cap hits

contracts

retained/buyouts

draft picks

unsigned rights players

Checklist
☐ Create a “League Hub” page:

teams list (sortable)

click into team detail

global filters (season, team)

☐ Team card (summary):

logo + stripes

cap used / cap remaining

contract years used / cap

record (if matchups active), optional

key assets:

picks owned count

unsigned rights count

☐ Team detail (CapFriendly style sections):

Active roster (scoring players)

Inactive roster

IR

Unsigned rights (drafted players)

Draft picks owned (by year and round)

Dead cap:

buyout penalties

retained salary obligations

Verification
☐ A manager can answer “what do I own?” in 15 seconds
☐ No action buttons clutter this page (read-only by default)

6. Backend “View Models” for Clean UI (Optional but Recommended)
Goal

Avoid doing complex joins in the frontend.

Checklist
☐ Add endpoints that return precomputed, UI-friendly data:

GET /api/league/hub

returns list of teams with:

computed cap summary

picks summary

identity

GET /api/team/:teamName/capfriendly

returns team detail with:

rosters split

contracts and cap hits

dead cap

picks

rights

Keep these read-only and computed from league state.

Verification
☐ Endpoints do not write
☐ Output is stable and fast

7. Make Team Identity Visible Everywhere (Consistency Pass)
Goal

Stripes become the “team language” across the site.

Checklist
☐ Update components to use identity:

Top bar team chip

Matchups page team headers

Standings rows

Trade cards

Auction winner displays

☐ Add a small “Stripe Chip” component:

renders stripes behind logo or beside team name

Verification
☐ You can recognize teams instantly on mobile
☐ No more single-color-only identity

8. UI Polish Rules (So It Actually Feels Like a Product)

Checklist
☐ Remove clutter from Commissioner panel:

link out to League Hub instead of duplicating info

☐ Ensure mobile:

horizontal scroll on CapFriendly tables

sticky team header

collapsible sections

☐ Ensure every table includes:

column labels

sort indicator

consistent alignment

9. Audit Trail Entries (Light, But Useful)

Identity changes shouldn’t spam the history, but should be visible.

Checklist
☐ Log:

team name changed (old → new)

logo changed

stripes changed

Optional:

group multiple identity changes within 60 seconds into one “updated branding” event

10. Smoke Test Checklist (Mandatory)
Identity

☐ Change stripes → visible in:

team page

matchups

standings

league hub

☐ Change logo → persists and renders correctly

League Hub

☐ Shows accurate:

cap used

dead cap

contract years used

picks owned

unsigned rights

☐ Read-only view does not allow accidental mutations

Mobile

☐ Hub is usable on phone
☐ Tables scroll without clipping

11. Phase 6 Exit Criteria (Non-Negotiable)

You are done when:

Teams have stable identity (logo + stripes)

Managers can edit identity safely

League Hub exists and answers “what does each team own?”

CapFriendly-style info is accurate and readable

Identity is used consistently across the UI
