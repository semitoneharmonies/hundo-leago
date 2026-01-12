# Hundo Leago — North Star

## Overview

Hundo Leago is a custom **fantasy hockey league platform** built in deliberate stages.

* **Stages** define *what the product is* at a given point in its life
* **Phases** define the *engineering work required to move between stages*

This document defines the stages (product truth). The roadmap documents define the phases (engineering execution).

---

## Stage 1 — Cap Tracker Platform (Live Season)

**What Hundo Leago IS today**

### Definition

Stage 1 is a **third-party companion tool** that supports a real, active fantasy league while relying on an external fantasy provider (e.g. Fantrax) for scoring and matchups.

Hundo Leago is the **source of truth** for all league management outside of scoring.

### Responsibilities

* Salary-cap enforcement
* Team rosters
* Blind free-agent auctions
* Trades (including salary retention)
* Buyouts
* Commissioner tools
* League activity history and audit trail

### Explicit Non-Responsibilities

* Player stat tracking
* Matchups
* Standings
* Playoffs
* Draft logic

### Primary Goal

> Finish a real season without data loss, exploits, or commissioner firefighting.

### Design Priorities

* Stability over new features
* Explicit rules over flexibility
* No unexpected resets

Stage 1 rules are considered **frozen** during an active season.

---

## Stage 2 — Full Fantasy Platform (26/27 Season)

**What Hundo Leago BECOMES after a reset**

Stage 2 begins with a **full league reset** and marks the transition to a standalone fantasy hockey platform.

### Definition

Hundo Leago runs an entire fantasy season **end-to-end**, without reliance on external fantasy sites.

### Core Capabilities

* Centralized NHL player database
* Daily stat ingestion
* Commissioner-configurable scoring rules
* Weekly head-to-head matchups
* League standings
* Playoffs
* Entry draft and lottery

### Site Structure & Navigation

* Multi-page site (not a single-page tool)
* Clear navigation between:

  * Home
  * Rosters
  * Matchups
  * Standings
  * Draft
  * Free Agents

### Roster & Weekly Matchup Model

* Matchup week runs **Monday → Sunday**
* **Weekly roster lock at Monday, 4:00 PM PT**
* Roster changes during the week are allowed
* Changes apply to the **next** matchup week only

### Contracts & Cap (Expanded)

* Multi-year contracts (1–3 years)
* League-wide cap on **total contract years** per team

  * Prevents signing all players to max term
* Salary retention rules enforced on trades
* Buyouts with fixed penalties (25%)

### Free Agents & Player Visibility

* Dedicated **Free Agents page**
* Displays:

  * All available free agents
  * Current season stats
  * Historical stats (as available)

### Primary Goal

> Successfully run a complete fantasy season entirely inside Hundo Leago.

### Design Priorities

* Correctness over convenience
* Automation by default
* Commissioner override tools when needed

---

## Stage 3 — Platform Expansion & Commercialization (Future)

**What Hundo Leago COULD become**

Stage 3 is optional and only considered after Stage 2 is proven in real league use.

### Potential Capabilities

* Multi-league support
* League creation and onboarding flows
* Role-based permissions

### Monetization

* Transition to a revenue-generating product
* Possible models:

  * League subscriptions
  * Commissioner licenses
  * Tiered feature access

### Mobile App

* Full mobile-first experience
* Dedicated app:

  * Downloadable via the App Store (and equivalent platforms)
  * Optimized for phone usage, not just responsive web

### Stage 3 Preconditions

Stage 3 work begins only after:

* Stage 2 is stable
* A full season runs without emergency intervention
* Reliability, performance, and UX meet production standards

---

## Engineering Roadmap — Phases (Bridges Between Stages)

Phases describe **how the system evolves**, not what the product is.

### Phase 0 — Stage 1 Completion (Current)

* Cap tracker
* Auctions
* Trades
* Buyouts
* Commissioner tools
* Live-season safety

### Phase 1 — Persistence & Safety

* Durable backend persistence
* Single source of truth enforcement
* Removal of auto-seeding / accidental resets
* Versioning and migrations

### Phase 2 — Player Database & Stats

* Player identity system
* Stat ingestion pipeline
* Historical stat storage

### Phase 3 — Matchups & Standings

* Weekly matchup engine
* Lineup locks
* Standings and rankings

### Phase 4 — Full Fantasy Polish

* Playoffs
* Secure authentication
* Mobile-friendly UX

---

## Core League Rules (Canonical)

If a rule changes, it must be updated here.

* Salary cap limit: **100**
* Max active roster size: **15**
* Inactive roster size: **6**
* Minimum forwards: **8**
* Minimum defensemen: **4**
* Buyout penalty: **25%**
* Trades allowed: **Anytime**
* Auctions resolve: **Sunday (time TBD)**
* Lineups lock: **Monday, 4:00 PM PT**

---

## Definitions (Canonical Meanings)

* **Roster:** All players owned by a team (active, inactive, IR, prospects)
* **Active Lineup:** Players accumulating points in a given week
* **Week:** Monday 00:00 PT → Sunday 23:59 PT
* **Lineup Lock:** Time after which lineup changes do not affect that week’s scoring

---

## Data & Source of Truth

* Backend is the **single source of truth**
* Frontend reflects backend state
* League data persists across restarts
* Data resets occur **only at stage boundaries**

---

## Non-Goals (For Now)

* No public sign-ups
* No monetization before Stage 3
* No multi-league support before Stage 3
* No mobile app before core fantasy features are stable

---

## Guiding Principles

* Stability over features during active seasons
* Product stages are explicit and respected
* Risky work happens behind flags or in staging
* Production leagues should never reset unexpectedly
