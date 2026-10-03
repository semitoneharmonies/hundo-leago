import { createCapOutlookFixture, capOutlookId as id } from "./capOutlookFixture.js";

// Synthetic data only. The browser fixture never connects to a league server.
export function createDesktopNavigationFixture({ commissioner = false, administrator = false } = {}) {
  const roster = createCapOutlookFixture();
  const role = administrator ? "platform_administrator" : commissioner ? "commissioner" : "manager";
  const season = { id: id(4), label: "2026–27", status: "active", version: 1, nhlSeasonKey: "20262027", regularSeasonStartsAtMs: 1791172800000, regularSeasonEndsAtMs: 1806501600000, fantasyPlayoffsStartAtMs: null, fantasyPlayoffsEndAtMs: null };
  const leagues = [
    { id: id(1), name: "Hundo Hockey League", status: "active", currentSeason: season, membership: { id: id(6), permissionCategory: role, effectiveAuthority: role, status: "active", version: 1 }, version: 1 },
    { id: id(101), name: "Pacific Hockey League", status: "active", currentSeason: { ...season, id: id(104) }, membership: { id: id(106), permissionCategory: role, effectiveAuthority: role, status: "active", version: 1 }, version: 1 },
  ];
  const names = ["Northern Lights", "Pacific Royals", "Own Goal Hatty", "Coastal Wolves", "Icebreakers", "Mountain Goats"];
  const colours = [["#124b46", "#b9f6cc"], ["#462b72", "#e8c766"], ["#481329", "#f1cb16"], ["#16324f", "#f97316"], ["#ae242e", "#ffffff"], ["#425766", "#b3d5ee"]];
  const teams = leagues.flatMap((league, group) => names.map((name, index) => {
    const primaryColour = colours[index][0], secondaryColour = colours[index][1];
    const symbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="${primaryColour}"/><path d="M40 10 67 59 13 59Z" fill="${secondaryColour}"/><text x="40" y="52" text-anchor="middle" font-size="26" font-family="sans-serif" font-weight="bold" fill="${primaryColour}">${index + 1}</text></svg>`;
    return { ...roster.team, id: id(200 + group * 100 + index), leagueId: league.id, name: group ? `Pacific ${index + 1}` : name, primaryColour, secondaryColour, patternTemplate: "even-two", status: "active", logoReference: `data:image/svg+xml,${encodeURIComponent(symbol)}`,
      currentManager: { assignmentId: id(600 + group * 10 + index), userId: index === 2 ? id(3) : id(700 + index), displayName: index === 2 ? "Preview Manager" : `Manager ${index + 1}`, version: 1 } };
  }));
  const weeks = leagues.map((league, group) => ({
    id: id(800 + group), leagueId: league.id, seasonId: league.currentSeason.id, weekKey: "2026-W01", sequence: 1,
    startsAtMs: 1791172800000, baselineAtMs: 1791172800000, locksAtMs: 1791241200000, endsAtMs: 1791777600000, rollsOverAtMs: 1791781200000, version: 1, status: "live", byes: [],
    matchups: [0, 1, 2].map((index) => ({ id: id(850 + group * 10 + index), leagueId: league.id, seasonId: league.currentSeason.id, weekId: id(800 + group), homeTeam: teams[group * 6 + index * 2], awayTeam: teams[group * 6 + index * 2 + 1], status: "live", version: 1 })),
  }));
  const announcements = leagues.map((league, index) => ({ id: id(950 + index), leagueId: league.id, body: index ? "Welcome to the Pacific league." : "Welcome to the season!\nRemember to set your lineup before Monday’s lock.", authorName: "League Commissioner", createdAtMs: Date.now() - 3600000 }));
  const fixture = {
    quotes: [], failQuoteSubmit: false, failQuoteReview: false,
    leagues, teams, weeks, announcements, requests: [], failAnnouncements: false, failTeams: false, failPost: false,
    session: { status: "authenticated", user: { id: id(3), displayName: "Preview Manager" }, async signOut() {} },
    async request(path, options = {}) {
      fixture.requests.push({ path, method: options.method || "GET", body: options.body });
      const url = new URL(path, "http://fixture.local");
      const parts = url.pathname.split("/");
      const leagueId = parts[4];
      const league = leagues.find((item) => item.id === leagueId);
      const selectedTeam = teams.find((team) => team.id === parts[6] && team.leagueId === leagueId);
      const week = weeks.find((item) => item.leagueId === leagueId);
      let data;
      if (path === "/api/v1/leagues") data = { code: "LEAGUES_FOUND", leagues };
      else if (url.pathname === "/api/v1/notifications") data = { code: "NOTIFICATIONS_FOUND", notifications: [], page: { limit: 25, nextCursor: null } };
      else if (url.pathname.endsWith("/free-agent-drafts/navigation")) data = { serverNowMs: Date.now(), timeZone: "America/Vancouver", fadId: null, seasonId: null, phase: "inactive", showMainNavigation: false, candidateDeadlineAtMs: null, nextRolloverAtMs: null, frozenFadFirstMatchupStartsAtMs: null, competitionFirstMatchupStartsAtMs: null, managedCards: [], rosterLinks: [], urgencyCode: "NONE" };
      else if (url.pathname.endsWith("/quotes") || url.pathname.includes("/quote-submissions")) {
        const global = parts[3] === "admin";
        const reviewing = url.pathname.includes("/quote-submissions");
        if (reviewing && !(global ? administrator : commissioner || administrator)) throw new Error("Review not allowed");
        if (options.method === "POST" && reviewing) {
          if (fixture.failQuoteReview) throw new Error("Review unavailable");
          const item = fixture.quotes.find((item) => item.id === parts.at(-2) && (global || item.leagueId === leagueId));
          if (!item || item.version !== options.body.version) throw new Error("Review changed");
          item[global ? "globalStatus" : "leagueStatus"] = options.body.decision === "approve" ? "approved" : "rejected";
          item.scope = item.globalStatus === "approved" ? "global" : item.leagueStatus === "approved" ? "league" : "pending";
          item.version += 1;
          data = { code: "QUOTE_REVIEWED", quote: { ...item } };
        } else if (options.method === "POST") {
          if (fixture.failQuoteSubmit) throw new Error("Submission unavailable");
          const item = { id: id(2000 + fixture.quotes.length), leagueId, leagueName: league.name, text: options.body.text, author: options.body.author || "Anonymous", submittedBy: "Preview Manager", scope: "pending", leagueStatus: "pending", globalStatus: "pending", createdAtMs: Date.now(), version: 1 };
          fixture.quotes.push(item);
          data = { code: "QUOTE_SUBMITTED", quote: { ...item } };
        } else {
          const quotes = fixture.quotes.filter((item) => reviewing ? global ? item.globalStatus === "pending" : item.leagueId === leagueId && item.leagueStatus === "pending" && item.globalStatus !== "approved" : item.globalStatus === "approved" || item.leagueId === leagueId && item.leagueStatus === "approved");
          data = { code: "QUOTES_FOUND", quotes: quotes.map((item) => reviewing ? { ...item } : ({ id: item.id, text: item.text, author: item.author, scope: item.scope })), page: { limit: 100, nextCursor: null } };
        }
      }
      else if (url.pathname.endsWith("/announcements")) {
        if (options.method === "POST") {
          if (!(commissioner || administrator) || fixture.failPost) throw new Error("Posting unavailable");
          const item = { id: id(1000 + announcements.length), leagueId, body: options.body.body, authorName: "Preview Manager", createdAtMs: Date.now() };
          announcements.unshift(item);
          data = { code: "LEAGUE_ANNOUNCEMENT_POSTED", announcement: item };
        } else {
          if (fixture.failAnnouncements) throw new Error("Announcements unavailable");
          data = { code: "LEAGUE_ANNOUNCEMENTS_FOUND", announcements: announcements.filter((item) => item.leagueId === leagueId), page: { limit: 10, nextCursor: null } };
        }
      } else if (url.pathname.endsWith("/teams")) {
        if (fixture.failTeams) throw new Error("Teams unavailable");
        data = { code: "TEAMS_FOUND", teams: teams.filter((team) => team.leagueId === leagueId) };
      } else if (selectedTeam && url.pathname.endsWith("/roster")) data = { ...roster.workspace(), team: selectedTeam, league, season: league.currentSeason, canManage: selectedTeam.currentManager.userId === id(3) };
      else if (selectedTeam) data = { code: "TEAM_FOUND", team: selectedTeam };
      else if (url.pathname.endsWith("/seasons")) data = { code: "LEAGUE_SEASONS_FOUND", leagueId, seasons: [league.currentSeason] };
      else if (url.pathname.endsWith("/matchup-weeks/current")) data = { code: "CURRENT_MATCHUP_WEEK_FOUND", week, health: {} };
      else if (url.pathname.endsWith("/matchup-weeks")) data = { code: "MATCHUP_WEEKS_FOUND", weeks: [week], health: {} };
      else if (url.pathname.includes("/matchups/")) {
        const item = week.matchups.find((matchup) => matchup.id === parts.at(-1));
        const score = (team, index) => ({ teamId: team.id, legal: true, scoreHundredths: index ? 500 : 725, players: [{ playerId: id(30 + index), fullName: index ? "Cale Makar" : "Connor McDavid", positionGroup: index ? "D" : "F", slotNumber: 1, gamesPlayedDelta: 3, goalDelta: 1, assistDelta: 3, pointDelta: 4, scoreHundredths: index ? 500 : 725, dataStatus: "available" }] });
        data = { code: "MATCHUP_FOUND", matchup: { ...item, week, liveScore: null, scoring: { mode: "live", home: score(item.homeTeam, 0), away: score(item.awayTeam, 1) }, result: null, health: { scoring: { status: "fresh" } } } };
      } else if (url.pathname.includes("/matchup-weeks/")) data = { code: "MATCHUP_WEEK_FOUND", week };
      else if (league) data = { code: "LEAGUE_FOUND", league };
      else throw new Error(`Unexpected fixture request: ${path}`);
      options.validateData?.(data);
      return { data };
    },
  };
  fixture.client = { request: fixture.request, resourceUrl: (value) => value };
  fixture.session.httpClient = fixture.client;
  return fixture;
}
