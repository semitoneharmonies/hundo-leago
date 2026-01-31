ROADMAP — STAGE 2 DELIVERY
Phase 0 — Stage 1 Hardening (COMPLETE ✅)

Status: Done

Purpose

Finish a live season safely

Prove persistence, auditing, and safety

Completed

Cap enforcement

Auctions

Trades

Buyouts

League persistence

Audit trail

Phase 3 matchups (shadow-tested)

No more feature work here except bug fixes.

Phase 1 — Backend Architecture & Safety Refactor

Goal: Make the codebase survivable

Why this phase exists

Everything you want next becomes painful if server.js stays a behemoth.

Scope

Split server.js into:

routes/

services/

jobs/

validators/

No behavior changes

No new features

Success criteria

App behavior is identical

Smaller files

Clear ownership of logic

This phase should feel boring. That’s good.

Phase 2 — Commissioner UX + League Configuration Foundation

Goal: Make league setup a first-class concept

Scope

Clean up Commissioner Panel UI

Separate sections:

League Setup (pre-season only)

In-Season Tools

Debug / Admin (hidden)

Add League Setup schema (even if not fully used yet)

Enforce setup locking once season starts

No features yet

Just structure, toggles, and persistence.

Success criteria

Commissioner panel feels intentional

League has a single immutable config object

You can say: “this league is configured”

Phase 3 — Scoring & Roster Model Expansion

Goal: Enable real fantasy mechanics

Scope

Expanded stat ingestion (shots, hits, blocks, etc.)

Scoring weights configurable pre-season

Inactive roster slots:

Salary threshold

No cap hit

No scoring

Weekly active/inactive lineup UI

Success criteria

Lineups matter

Cap math respects inactive players

No mid-week surprises

Phase 4 — Optional Rule Systems (Toggles You Chose)

Goal: Add flavor without destabilizing the league

All of these are:

toggled in League Setup

locked at season start

isolated systems

Features

Performance bonuses

Retained salary decay

Buyout decay

Fatigue

Late lock risk

Hot / cold streaks

Rivalries

Success criteria

Each system can be turned on/off independently

No system breaks cap, scoring, or persistence

Clear UI explanations

Phase 5 — Entry Draft & Prospect Rights

Goal: Give the league a future

Scope

Draft pick system (3 rounds, 5 years out)

Draft lottery (NHL-style weighted odds)

Draft page (annual event)

Drafted players stored as rights

ELC signing option

Success criteria

Draft order reproducible and auditable

Picks are tradeable assets

Draft feels like a league moment

Phase 5.5 — Annual Free Agent Draft System

Goal:
Establish contracts and rosters for the upcoming season through a structured, high-stakes pre-season event.

Why this phase exists
Blind in-season auctions only work if contracts are established deliberately.
This phase creates the annual contract reset moment that defines each season’s competitive landscape.

Scope

Free Agent Draft page (pre-season only)

Player eligibility rules (age 20+)

Private Player Card submission per team:

player

salary

term

Editable until Free Agent Draft start

Simultaneous lock and system-wide evaluation

Automatic assignment for uncontested players

Live (non-blind) tie-breaker auctions

Open (non-blind) auctions to complete rosters

Archive Free Agent Draft results as read-only once complete

Explicit Non-Scope

In-season free agent logic

Blind auction changes

Video generation (optional future enhancement)

Success Criteria

Contracts are reproducible and auditable

No commissioner intervention required

Managers feel the Free Agent Draft is:

fair

tense

memorable

System cleanly transitions into the regular season

Phase 6 — League Identity & Transparency

Goal: Make the league feel real

Scope

CapFriendly-style league overview

Team edit page:

name

logo

stripe system (2–3 colors)

Use team identity consistently across UI

Success criteria

Managers recognize teams instantly

League pages are browsable and informative

Contracts and assets are legible at a glance

Phase 7 — Stage 2 Validation Season

Goal: Prove the platform

Scope

Run a full season entirely inside Hundo Leago

No rule changes mid-season

Fix only bugs

Exit criteria (non-negotiable)

No data loss

No commissioner emergencies

Managers trust results

Only after this do you even think about Stage 3.
