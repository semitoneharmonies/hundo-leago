import {
  ResponseContractError,
  assertResourceIdentity,
} from "../../shared/api/responseContracts.js";

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

function validateMembership(value) {
  assertResourceIdentity(value, { requireVersion: true });
  contract(value.status === "active", "The league membership is not active.");
  contract(
    typeof value.permissionCategory === "string" && value.permissionCategory.length > 0,
    "The league permission category is invalid."
  );
}

export function validateVisibleLeague(value) {
  assertResourceIdentity(value, { requireVersion: true });
  contract(
    typeof value.name === "string" && value.name.trim().length > 0,
    "The league name is invalid."
  );
  contract(
    typeof value.status === "string" && value.status.length > 0,
    "The league status is invalid."
  );
  validateMembership(value.membership);
  if (value.currentSeason !== null) {
    assertResourceIdentity(value.currentSeason, { requireVersion: true });
  }
  return true;
}

export function validateLeagueList(data) {
  contract(data?.code === "LEAGUES_FOUND", "The league-list code is invalid.");
  contract(Array.isArray(data.leagues), "The league list is invalid.");
  for (const league of data.leagues) validateVisibleLeague(league);
  contract(
    new Set(data.leagues.map((league) => league.id)).size === data.leagues.length,
    "The league list contains duplicate IDs."
  );
  return true;
}

export function validateLeagueDetail(data) {
  contract(data?.code === "LEAGUE_FOUND", "The league response code is invalid.");
  return validateVisibleLeague(data.league);
}

export function validateLeagueSeasonList(data, expectedLeagueId) {
  contract(
    data?.code === "LEAGUE_SEASONS_FOUND",
    "The league-season list code is invalid."
  );
  assertResourceIdentity({ id: data.leagueId });
  contract(
    expectedLeagueId === undefined || data.leagueId === expectedLeagueId,
    "The league-season list belongs to another league."
  );
  contract(Array.isArray(data.seasons), "The league-season list is invalid.");
  for (const season of data.seasons) {
    assertResourceIdentity(season, { requireVersion: true });
    contract(
      typeof season.label === "string" && season.label.trim().length > 0,
      "The season label is invalid."
    );
    contract(
      typeof season.nhlSeasonKey === "string" &&
        season.nhlSeasonKey.trim().length > 0,
      "The NHL season key is invalid."
    );
    contract(
      typeof season.status === "string" && season.status.length > 0,
      "The season status is invalid."
    );
    for (const field of [
      "regularSeasonStartsAtMs",
      "regularSeasonEndsAtMs",
      "fantasyPlayoffsStartAtMs",
      "fantasyPlayoffsEndAtMs",
    ]) {
      contract(
        season[field] === null ||
          (Number.isSafeInteger(season[field]) && season[field] >= 0),
        `The season ${field} is invalid.`
      );
    }
  }
  contract(
    new Set(data.seasons.map((season) => season.id)).size ===
      data.seasons.length,
    "The league-season list contains duplicate IDs."
  );
  return true;
}

export function validateTeam(value) {
  assertResourceIdentity(value, { requireVersion: true });
  contract(
    typeof value.leagueId === "string" && value.leagueId.length > 0,
    "The team league ID is invalid."
  );
  contract(
    typeof value.name === "string" && value.name.trim().length > 0,
    "The team name is invalid."
  );
  if (value.currentManager !== null) {
    contract(
      typeof value.currentManager === "object" &&
        typeof value.currentManager.userId === "string" &&
        typeof value.currentManager.displayName === "string" &&
        Number.isSafeInteger(value.currentManager.version),
      "The team manager is invalid."
    );
  }
  return true;
}

export function validateTeamList(data) {
  contract(data?.code === "TEAMS_FOUND", "The team-list code is invalid.");
  contract(Array.isArray(data.teams), "The team list is invalid.");
  for (const team of data.teams) validateTeam(team);
  contract(
    new Set(data.teams.map((team) => team.id)).size === data.teams.length,
    "The team list contains duplicate IDs."
  );
  return true;
}

export function validateTeamDetail(data) {
  contract(data?.code === "TEAM_FOUND", "The team response code is invalid.");
  return validateTeam(data.team);
}
