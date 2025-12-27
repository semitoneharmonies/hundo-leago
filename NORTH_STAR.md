Hundo Leago — North Star
Purpose (What this app is)

Hundo Leago is a fantasy hockey league website designed to support leagues with a custom, salary-cap–driven rule set. It combines salary-cap management, blind auctions, trades, and (eventually) scoring and matchups into a single platform that makes the league possible within the structure it defines.

Long-Term Vision (Where this ends up)

By the start of the 2026–27 NHL season, Hundo Leago will function as a stand-alone fantasy league platform, rather than a third-party cap tracker, auction host, and trade tool.

Final Vision Includes
Player & Stats System

Centralized player database

Daily stat updates

Commissioner-configurable scoring

Which stats are tracked

How much each stat is worth

Player stats only count for the period in which a player is on a team’s active lineup

Competition Structure

Weekly head-to-head matchups

League standings

Playoffs

Roster, Contracts & Player States (Future Seasons)

Hundo Leago supports multiple player states, each with explicit rules and cap implications.

Active Roster

15 active players

Must fit under the salary cap

Only active players accumulate weekly stats

Players earning more than $5 must always remain active

Inactive Roster

Up to 6 inactive players

Players retain their salary, but do not count against the cap

Used for weekly matchup management

Players may be moved between active and inactive before lineup lock

Players earning more than $5 cannot be made inactive

Injured Reserve (IR)

For injured players only

IR players do not count against the salary cap

IR functionality exists in both operating modes

Prospects

Prospects are unsigned players

Do not count toward roster size or salary cap

No limit on number of prospects per team

Acquired through the end-of-season entry draft

May remain unsigned for up to 2 seasons

If unsigned after 2 seasons, the prospect becomes a free agent

When signed, prospects receive an Entry Level Contract (ELC):

$1 salary

3-year duration

Contracts & Cap Structure

Multi-year contracts (1–3 years)

Cap on total contract years held by a team

Buyouts with fixed penalties

Salary retention rules enforced on trades

Draft & League Lifecycle

End-of-season entry draft

3 rounds per draft (1st, 2nd, 3rd round picks)

Draft picks are tradable

Lottery for non-playoff teams, weighted by finish

Lottery and draft run directly through the site

Platform & UX

Secure login

Mobile support

Operating Modes (Important)
Mode A — Cap Tracker Mode (Current Season)

Used for the current test season.

Purpose

Track salary-cap compliance

Host blind auctions

Host trades and buyouts

Provide commissioner tools

Maintain league activity history

Scoring and matchups are handled externally (e.g. Fantrax).

Priority

Stability

Simplicity

Reliability

Mode B — Full Fantasy Mode (Future Seasons)

Used starting with the 2026–27 season, following a full league reset.

Purpose

Full fantasy league experience

Internal scoring, matchups, standings, drafts, and playoffs

Weekly lineup management using active/inactive rosters

Automation by default, with commissioner override tools

Core League Rules (Stable)

Salary cap limit: 100

Max active roster size: 15

Inactive roster size: 6

Minimum forwards: 8

Minimum defensemen: 4

Buyout penalty: 25%

Trades allowed: anytime

Auctions resolve: Sunday (time TBD)

Lineups lock: Monday, 4:00 PM PT

If a rule changes, it should be updated here.

Definitions (Canonical Meanings)

Roster: All players owned by a team (active, inactive, IR, prospects)

Active Lineup: Players accumulating points in a given week

Week: Monday 00:00 PT → Sunday 23:59 PT

Lineup Lock: Time after which lineup changes do not affect that week’s scoring

Data & Source of Truth

The backend is the single source of truth

The frontend reflects backend state

League state must persist across restarts

League data may reset only at season boundaries

Non-Goals (For Now)

No multi-league support

No public sign-ups

No monetization

No playoffs until Full Fantasy Mode

No mobile app until core fantasy features are stable

Roadmap (High Level)

Phase 0: Cap tracker, auctions, trades (current)

Phase 1: Persistent database & cleanup

Phase 2: Player database & stat ingestion

Phase 3: Matchups, lineup locks, standings

Phase 4: Playoffs, secure authentication, mobile support

Guiding Principles

Stability over features during active seasons

Risky features are developed behind flags or in staging

Rules are explicit and documented

Production leagues should never reset unexpectedly

Long-Term Expansion (Future Vision)

Beyond the initial single-league implementation, Hundo Leago may evolve into a multi-league platform.

This will only be considered after:

Full Fantasy Mode is stable

Core features are proven in real league use

Reliability, performance, and usability meet production standards

Why this works

Your weekly matchup logic is now crystal clear

Cap strategy becomes interesting without breaking realism

Prospects + ELCs create long-term planning and dynasty feel

Nothing here conflicts with your current Phase 0 build

If you want, next we can:

Turn this into a rules page UI spec

Map these concepts directly to backend data models

Define illegal states (e.g. cap violations, invalid lineup swaps)
