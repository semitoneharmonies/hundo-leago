# Hundo Leago — Current Status

## Current Mode
Cap Tracker Mode (2025–26 test season)

This season, Hundo Leago is being used as a third-party cap tracker, auction host, and trade platform. Scoring and matchups are handled externally.

Stability and usability are the top priorities.

---

## Stable & In Use
These features are relied upon by the league and work as intended.

- Trades (including trades involving buyouts and salary retention)
- Buyouts (penalty math works as expected)
- League activity history (records actions consistently)
- Persistence (league state persists across refreshes/restarts)
- Roster panel (functional and usable for managing rosters)

---

## Working but Needs Improvement
These features function correctly but need cleanup, polish, or refinement.

### Blind Auctions
- Core auction flow works
- Auction rollover is scheduled for Sunday at 4:00 PM PT  


### Roster Panel
- Functional and usable
- Future improvements planned:
  - Show NHL team for each player
  - Improve salary visibility / layout
- No blocking issues for current season

### Commissioner Panel
- Core functionality works and is relied upon
- Snapshot creation and restore works well and is critical
- Areas needing improvement:
  - Redundant “reset league to beginning” section  
    → unnecessary given snapshot system
  - Additional commissioner controls desired so league adjustments can be made through the UI instead of editing code

---

## Experimental / Use With Caution
- Snapshot restore system  
  - Appears to work correctly
  - Has not been extensively stress-tested yet

---

## Not Live Yet (Intentional)
These features are intentionally not part of the current season.

- Player stats & scoring
- Weekly head-to-head matchups
- Standings
- Lineup locks
- Draft system
- Secure authentication
- Mobile support
- Multi-league support

---

## Known Issues


---

## Next Focus

- Improve commissioner panel usability and logging
- Minor UI polish where it improves clarity without risking stability
