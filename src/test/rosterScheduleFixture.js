import { createCapOutlookFixture, capOutlookId as id } from "./capOutlookFixture.js";

// Synthetic schedule: deliberately includes a shortened week, a break, unknown team and postponed game.
export function createRosterScheduleFixture() {
  const fixture = createCapOutlookFixture();
  const nowMs = Date.now();
  const day = 86_400_000;
  const start = Math.floor(nowMs / day) * day - day;
  const seasonId = fixture.workspace().season.id;
  const week = (index, from, to) => ({ id: id(200 + index), leagueId: fixture.league.id, seasonId, weekKey: `week-${index}`, sequence: index, startsAtMs: from, baselineAtMs: from + 3600_000, locksAtMs: from + 16 * 3600_000, endsAtMs: to, rollsOverAtMs: to, status: "scheduled", version: 1, matchups: [], byes: [] });
  const weeks = [week(1, start, start + 4 * day), week(2, start + 8 * day, start + 15 * day)];
  const teams = ["EDM", "TBL", "CGY", "COL", "MTL", "VGK", "MTL", null];
  fixture.players.forEach((player, index) => { player.nhlTeamAbbreviation = teams[index]; });
  const [mcdavid, kucherov, kadri, makar] = fixture.players;
  for (const [player, points] of [[mcdavid, 2250], [kucherov, 1250], [kadri, 2500], [makar, 4150]]) {
    player.statistics = { gamesPlayed: 10, goals: 4, assists: 6, nhlPoints: 10, fantasyPointsHundredths: points };
  }
  const injury = { status: "injured", source: "admin", observedAtMs: nowMs, stale: false, needsReview: false };
  mcdavid.onTradeBlock = true;
  Object.assign(kadri, { injury, injuredReserveEligible: true });
  Object.assign(makar, { injury, injuredReserveEligible: true, onTradeBlock: true });
  const baseRequest = fixture.request;
  const game = (number, hours, homeTeam, awayTeam, status = "scheduled") => ({ id: String(number), nhlSeasonKey: "20262027", startsAtMs: start + hours * 3600_000, homeTeam, awayTeam, status, timeTbd: false });
  const games = [
    { ...game(1, 19.5, "EDM", "VAN", "final"), playerPoints: [{ playerId: mcdavid.playerId, fantasyPointsHundredths: 350 }] },
    { ...game(2, 43, "COL", "EDM", "final"), playerPoints: [{ playerId: mcdavid.playerId, fantasyPointsHundredths: 0 }] },
    game(3, 67, "EDM", "SEA", "live"),
    game(4, 91, "CGY", "EDM"),
    game(5, 43, "TBL", "MTL", "postponed"),
    game(6, 67, "COL", "MTL"),
    game(7, 67, "TBL", "NJD"),
  ];
  Object.assign(fixture, { weeks, nowMs, scheduleFailure: false, emptyWeeks: false, games, scheduleRequests: [] });
  fixture.request = async (path, options = {}) => {
    if (!path.includes("matchup-weeks")) return baseRequest(path, options);
    fixture.requests.push({ path, ...options });
    let data;
    if (path.endsWith("nhl-schedule")) {
      fixture.scheduleRequests.push(path);
      if (fixture.scheduleFailure) throw new Error("Provider unavailable");
      const selected = weeks.find((item) => path.includes(item.id));
      if (!selected) throw new Error("Week unavailable");
      data = { code: "ROSTER_SCHEDULE_FOUND", leagueId: fixture.league.id, seasonId, weekId: selected.id, startsAtMs: selected.startsAtMs, endsAtMs: selected.endsAtMs, timeZone: "America/Vancouver", fetchedAtMs: nowMs, games: selected.id === weeks[0].id ? games : [game(20, 8 * 24 + 19, "EDM", "TOR")] };
    } else data = { code: "MATCHUP_WEEKS_FOUND", leagueId: fixture.league.id, seasonId, health: { statistics: { status: "unavailable", completedAtMs: null, ageMs: null } }, weeks: fixture.emptyWeeks ? [] : weeks };
    options.validateData?.(data);
    return { data: structuredClone(data) };
  };
  fixture.client = { request: fixture.request, resourceUrl: (value) => value };
  return fixture;
}
