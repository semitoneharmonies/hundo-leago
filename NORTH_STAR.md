Hundo Leago — North Star (Revised)

Hundo Leago is a contract-driven fantasy hockey platform focused on realism, league integrity, and long-term decision-making.

Product development is divided into Stages (product truth) and Phases (engineering execution).
Stages are respected boundaries; leagues do not partially transition between them.

Stage 1 — Cap & League Management Platform (Live)

Status: Active

Definition

Hundo Leago operates as a companion platform alongside a third-party fantasy provider. It is the source of truth for all league rules, contracts, and roster legality.

Responsibilities

Salary cap enforcement

Multi-year contracts

Blind free-agent auctions

Trades (including retention)

Buyouts

Commissioner tools

League history & audit trail

Explicit Non-Responsibilities

Scoring

Matchups

Standings

Drafts

Playoffs

Primary Goal

Run a full live season without:

data loss

exploits

commissioner intervention

Design Priorities

Stability over features

Explicit rules over flexibility

No mid-season rule changes

No unexpected resets

Stage 2 — Standalone Fantasy Platform (26/27 Season)

Status: In Development
Note: Stage 2 begins with a full league reset.

Definition

Hundo Leago runs an entire fantasy season end-to-end with no external dependencies.

Core Systems
League Setup (Pre-Season Only)

Commissioner defines league rules before the season starts. Once the season begins, these settings are locked.

Includes:

Roster size

Salary cap

Contract year cap

Contract model:

Flat

Escalator

Front / back-loaded (with constraints)

Scoring weights

Optional rule toggles

Entry Draft

Annual, 3-round entry draft

Draft order determined by standings + lottery

Picks tradeable up to 5 seasons out

Drafted players held as rights

Optional ELC signing

Free Agent Draft (Annual, Pre-Season Only)

Definition
Before each season begins, Hundo Leago runs a structured Free Agent Draft to allocate unsigned players and establish new contracts. This process occurs after the Entry Draft and before the season start. Once completed, it becomes read-only until the following season.

Process Overview

Only players aged 20+ are eligible

Managers submit private Player Cards listing desired free agents with:

salary

contract term (1–3 years)

Player Cards remain editable until the Free Agent Draft begins

At draft start:

all Player Cards lock simultaneously

the system evaluates all bids at once

Assignment Rules

Single bidder → player assigned automatically

Multiple bidders → highest salary wins

Salary ties → resolved via live (non-blind) auction between tied teams

Follow-Up Rounds

After initial assignments, open (non-blind) auctions are held to complete rosters

Once the season begins, all free-agent auctions become blind

Purpose

Establish league contracts for the season

Reward preparation and valuation skill

Create a high-stakes annual league event

Preserve blind auctions as an in-season system only

Contracts & Cap

1–3 year contracts

League-wide cap on total contract years

Salary retention rules

Buyouts with penalties and decay

Optional performance bonuses

Rosters & Lineups

Active roster

Inactive roster (salary-limited)

Weekly lineup management

Roster locks at Monday 4:00 PM PT

Optional late lock risk

Scoring & Matchups

Daily stat ingestion

Weekly head-to-head matchups

Standings

Playoffs

Optional League Systems (Pre-Season Toggle)

Performance bonuses

Retained salary decay

Buyout decay

Fatigue

Late lock risk

Hot / cold streaks

Rivalries

UX & Identity

CapFriendly-style league overview

Team branding (logo + stripe system)

Clear commissioner vs manager permissions

Primary Goal

Run a complete fantasy season entirely inside Hundo Leago without emergency intervention.

Design Priorities

Correctness over convenience

Automation by default

Commissioner power with transparency

Fun emerges from rules, not chaos

Stage 3 — Platform Expansion (Future)

Deferred until Stage 2 proves stable

Includes:

Multi-league support

Admin UI

League creation & onboarding

Monetization

Community features

Mobile app

Guiding Principles (Unchanged, Reinforced)

Active seasons are sacred

Rules are chosen once, then enforced

Product stages are explicit

Risky work happens behind flags

No silent behavior changes

Risky work happens behind flags

No silent behavior changes
