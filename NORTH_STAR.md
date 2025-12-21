Hundo Leago — North Star
1. Purpose (What this app is)
Hundo Leago is a fantasy hockey league website designed to support leagues with a custom, salary-cap–driven rule set. It combines salary-cap management, blind auctions, trades, and (eventually) scoring and matchups into a single platform that makes the league possible within the structure it defines.

2. Long-Term Vision (Where this ends up)
By the start of the 2026–27 NHL season, Hundo Leago will function as a stand-alone fantasy league platform, rather than a third-party cap tracker, auction host, and trade tool.
The final vision includes:
Player & Stats System
Centralized player database
Daily stat updates
Commissioner-configurable scoring:
which stats are tracked
how much each stat is worth
Player stats only count for the period in which a player is on a team’s active lineup


Competition Structure
Weekly head-to-head matchups
League standings
Playoffs
Roster & Contract System
Weekly roster lock (Monday → Sunday)
Lineup editor for future weeks
Multi-year player contracts (1–3 years)
Cap on total contract years held by a team (to prevent all 3-year contracts)


Draft & League Lifecycle
End-of-season entry draft
3 rounds per draft (1st, 2nd, 3rd round picks)
Draft picks are tradable
Lottery for non-playoff teams, with odds weighted by finish
Lottery and draft run directly through the site
Platform & UX
Secure login
Mobile support



3. Operating Modes (Important)
Hundo Leago operates in two distinct modes.
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
Scoring, matchups, standings, drafts, and playoffs handled internally
Automation by default, with commissioner intervention when necessary



4. Core Features (Final State)
League and team management
Salary cap, contracts, buyouts, and retention
Blind free-agent auctions
Trades (with retention rules)
Player database
Automated stat ingestion
Weekly head-to-head matchups
Standings and playoffs
Commissioner override tools
League activity log



5. Core League Rules (Stable)
Salary cap limit: 100
Max roster size: 15
Minimum forwards: 8
Minimum defensemen: 4
Buyout penalty: 25%
Trades allowed: anytime
Auctions resolve: Sunday (time TBD)
Lineups lock: Monday, 4:00 PM PT
If a rule changes, it should be updated here.

6. Definitions (Canonical Meanings)
Roster: All players owned by a team
Lineup: Subset of a roster that accumulates points in a given week
Week: Monday 00:00 PT → Sunday 23:59 PT
Lineup Lock: Time after which lineup changes do not affect that week’s scoring



7. Data & Source of Truth
The backend is the single source of truth
The frontend reflects backend state
League state must persist across restarts
League data may reset at season boundaries



8. Non-Goals (For Now)
No multi-league support
No public sign-ups
No monetization
No playoffs until Full Fantasy Mode
No mobile app until core fantasy features are stable



9. Roadmap (High Level)
Phase 0: Cap tracker, auctions, trades (current)
Phase 1: Persistent database & cleanup
Phase 2: Player database & stat ingestion
Phase 3: Matchups, lineup locks, standings
Phase 4: Playoffs, secure authentication, mobile support



10. Guiding Principles
Stability over features during active seasons
Risky features are developed behind flags or in staging
Rules are explicit and documented
Production leagues should never reset unexpectedly



11. Long-Term Expansion (Future Vision)
Beyond the initial single-league implementation, Hundo Leago may evolve into a platform capable of hosting multiple independent leagues simultaneously.
Potential long-term goals include:
Support for multiple leagues with separate settings and data
League creation and management tools
Secure user accounts associated with one or more leagues
Optional monetization (subscriptions, hosting fees, or premium features)
This phase is not part of the current roadmap and will only be considered after:
Full Fantasy Mode is stable
Core features are proven in real league use
Reliability, performance, and usability meet production standards



Notes
This document defines what Hundo Leago is and must remain consistent with.
 Implementation details live in code, not here.
