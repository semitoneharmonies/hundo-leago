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
  - Rollover was triggered manually last week; automatic rollover still needs confirmation
- Issues to address:
  - Teams can currently place multiple bids on the same free agent  
    → new bids should replace the previous bid
  - Bids from completed auctions are still visible to teams  
    → these should be deleted after auction rollover

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
  - Auction bid viewer:
    - Shows bids from completed auctions (should be cleaned up automatically)
    - Bids are not grouped by auction, making them hard to read
  - Edit player section:
    - Player name input only accepts one character at a time (bug)
  - Commissioner edits appear in League History as raw data instead of readable messages
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
- Auction rollover automation needs confirmation
- Commissioner edit logs need human-readable formatting
- Commissioner edit player input bug (single-character input)

---

## Next Focus
- Confirm and stabilize auction rollover
- Clean up blind auction behavior (bid replacement, post-rollover cleanup)
- Improve commissioner panel usability and logging
- Minor UI polish where it improves clarity without risking stability
