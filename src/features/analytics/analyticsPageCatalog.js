// Fixed page types only. Route instances, names and query strings are never catalog entries.
export const ANALYTICS_PAGE_CATALOG = Object.freeze([
  {
    "product": "leago",
    "category": "dashboard",
    "label": "League dashboard",
    "kind": "old"
  },
  {
    "product": "leago",
    "category": "rosters",
    "label": "Rosters (legacy combined)",
    "kind": "legacy"
  },
  {
    "product": "leago",
    "category": "players",
    "label": "Players (legacy combined)",
    "kind": "legacy"
  },
  {
    "product": "leago",
    "category": "matchups",
    "label": "Matchups",
    "kind": "old"
  },
  {
    "product": "leago",
    "category": "standings",
    "label": "Standings",
    "kind": "old"
  },
  {
    "product": "leago",
    "category": "auctions",
    "label": "Auctions (legacy combined)",
    "kind": "legacy"
  },
  {
    "product": "leago",
    "category": "trades",
    "label": "Trades (legacy combined)",
    "kind": "legacy"
  },
  {
    "product": "leago",
    "category": "drafts",
    "label": "Drafts (legacy combined)",
    "kind": "legacy"
  },
  {
    "product": "leago",
    "category": "activity",
    "label": "League activity",
    "kind": "old"
  },
  {
    "product": "leago",
    "category": "commissioner",
    "label": "Commissioner tools (legacy combined)",
    "kind": "legacy"
  },
  {
    "product": "leago",
    "category": "teams",
    "label": "Teams",
    "kind": "old"
  },
  {
    "product": "leago",
    "category": "team_roster",
    "label": "Team roster",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "public_roster",
    "label": "Public roster",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "players_list",
    "label": "Players list",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "player_detail",
    "label": "Player details",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "auctions_list",
    "label": "Auctions list",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "auction_detail",
    "label": "Auction details",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "trades_list",
    "label": "Trades list",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "trade_detail",
    "label": "Trade details",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "drafts_free_agent",
    "label": "Free Agent Draft overview",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "drafts_entry",
    "label": "Entry Draft",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "draft_current",
    "label": "Current Free Agent Draft",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "draft_room",
    "label": "Free Agent Draft room",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "draft_allocation_results",
    "label": "Draft allocation results",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "draft_results",
    "label": "Free Agent Draft results",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "draft_card",
    "label": "Draft candidate card",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_overview",
    "label": "Commissioner overview",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_calendar",
    "label": "Commissioner: league calendar",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_scoring",
    "label": "Commissioner: scoring values",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_auctions",
    "label": "Commissioner: auction schedule",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_rosters",
    "label": "Commissioner: roster operations",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_fad",
    "label": "Commissioner: Free Agent Draft",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_communications",
    "label": "Commissioner: announcements and reminders",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_readiness",
    "label": "Commissioner: league readiness",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_history",
    "label": "Commissioner: change history",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_help",
    "label": "Commissioner: manager help",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_recovery",
    "label": "Commissioner: recovery and corrections",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_pause",
    "label": "Commissioner: pause or resume",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_season",
    "label": "Commissioner: next season",
    "kind": "refined"
  },
  {
    "product": "leago",
    "category": "commissioner_export",
    "label": "Commissioner: export data",
    "kind": "refined"
  },
  {
    "product": "daily",
    "category": "lobby",
    "label": "Daily lobby",
    "kind": "old"
  },
  {
    "product": "daily",
    "category": "room",
    "label": "Daily room",
    "kind": "old"
  },
  {
    "product": "daily",
    "category": "history",
    "label": "Daily history",
    "kind": "old"
  },
  {
    "product": "daily",
    "category": "profile",
    "label": "Daily profile",
    "kind": "old"
  },
  {
    "product": "daily",
    "category": "notifications",
    "label": "Notifications",
    "kind": "old"
  },
  {
    "product": "daily",
    "category": "create",
    "label": "Create Daily room",
    "kind": "old"
  },
  {
    "product": "daily",
    "category": "practice",
    "label": "Daily practice",
    "kind": "old"
  },
  {
    "product": "shared",
    "category": "home",
    "label": "Home",
    "kind": "old"
  },
  {
    "product": "shared",
    "category": "account",
    "label": "Account settings",
    "kind": "old"
  },
  {
    "product": "shared",
    "category": "notifications",
    "label": "Notifications",
    "kind": "old"
  },
  {
    "product": "shared",
    "category": "install",
    "label": "Install",
    "kind": "old"
  },
  {
    "product": "shared",
    "category": "games",
    "label": "Mini games (legacy combined)",
    "kind": "legacy"
  },
  {
    "product": "shared",
    "category": "leagues",
    "label": "League selection",
    "kind": "old"
  },
  {
    "product": "shared",
    "category": "tip_jar",
    "label": "Tip Jar",
    "kind": "refined"
  },
  {
    "product": "shared",
    "category": "mr_boni",
    "label": "Mr. Boni",
    "kind": "refined"
  }
].map(Object.freeze));

export const ANALYTICS_EXCLUDED_PAGES = Object.freeze([
  "Admin analytics", "Email verification", "Account setup", "Password reset", "Account reactivation", "Unknown pages and redirect-only routes",
]);
