import { ResponseContractError } from "../../shared/api/responseContracts.js";

const ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

function object(value, message) {
  contract(value !== null && typeof value === "object" && !Array.isArray(value), message);
  return value;
}

function id(value, message) {
  contract(ID.test(value || ""), message);
  return value;
}

function integer(value, message, { nullable = false } = {}) {
  if (nullable && value === null) return value;
  contract(Number.isSafeInteger(value) && value >= 0, message);
  return value;
}

function signedInteger(value, message) {
  contract(Number.isSafeInteger(value), message);
  return value;
}

function validateTeam(team) {
  object(team, "A matchup team is invalid.");
  id(team.id, "A matchup team ID is invalid.");
  contract(typeof team.name === "string" && team.name.trim(), "A matchup team name is invalid.");
}

function validatePlayerScore(player, side) {
  object(player, `A ${side} player score is invalid.`);
  id(player.playerId, `A ${side} player ID is invalid.`);
  contract(
    typeof player.fullName === "string" && player.fullName.trim().length > 0,
    `A ${side} player name is invalid.`
  );
  contract(
    ["F", "D"].includes(player.positionGroup),
    `A ${side} player position is invalid.`
  );
  contract(
    Number.isSafeInteger(player.slotNumber) &&
      player.slotNumber > 0 &&
      player.slotNumber <= (player.positionGroup === "F" ? 12 : 6),
    `A ${side} player slot is invalid.`
  );
  for (const field of [
    "gamesPlayedDelta",
    "goalDelta",
    "assistDelta",
    "pointDelta",
    "scoreHundredths",
  ]) {
    integer(player[field], `A ${side} player ${field} is invalid.`);
  }
  contract(
    player.pointDelta === player.goalDelta + player.assistDelta,
    `A ${side} player point total is inconsistent.`
  );
  contract(
    ["available", "missing"].includes(player.dataStatus),
    `A ${side} player data status is invalid.`
  );
}

function validateTeamScore(teamScore, side, expectedTeamId) {
  object(teamScore, `The ${side} team score is invalid.`);
  id(teamScore.teamId, `The ${side} score team is invalid.`);
  contract(
    teamScore.teamId === expectedTeamId,
    `The ${side} score belongs to another team.`
  );
  contract(
    typeof teamScore.legal === "boolean",
    `The ${side} roster legality is invalid.`
  );
  integer(teamScore.scoreHundredths, `The ${side} team score is invalid.`);
  contract(
    Array.isArray(teamScore.players),
    `The ${side} player scores are invalid.`
  );
  for (const player of teamScore.players) validatePlayerScore(player, side);
  contract(
    new Set(teamScore.players.map((player) => player.playerId)).size ===
      teamScore.players.length,
    `The ${side} player scores contain duplicate IDs.`
  );
  contract(
    new Set(
      teamScore.players.map(
        (player) => `${player.positionGroup}:${player.slotNumber}`
      )
    ).size === teamScore.players.length,
    `The ${side} player scores contain duplicate roster slots.`
  );
  contract(
    teamScore.legal ||
      (teamScore.scoreHundredths === 0 && teamScore.players.length === 0),
    `The ${side} illegal roster score is invalid.`
  );
  contract(
    !teamScore.legal ||
      teamScore.scoreHundredths ===
        teamScore.players.reduce(
          (total, player) => total + player.scoreHundredths,
          0
        ),
    `The ${side} team score is inconsistent with its players.`
  );
}

export function validateMatchup(matchup) {
  object(matchup, "The matchup is invalid.");
  id(matchup.id, "The matchup ID is invalid.");
  id(matchup.leagueId, "The matchup league ID is invalid.");
  id(matchup.seasonId, "The matchup season ID is invalid.");
  id(matchup.weekId, "The matchup week ID is invalid.");
  validateTeam(matchup.homeTeam);
  validateTeam(matchup.awayTeam);
  contract(typeof matchup.status === "string" && matchup.status.length > 0, "The matchup status is invalid.");
  integer(matchup.version, "The matchup version is invalid.");
}

export function validateWeek(week) {
  object(week, "The matchup week is invalid.");
  id(week.id, "The matchup week ID is invalid.");
  id(week.leagueId, "The matchup-week league ID is invalid.");
  id(week.seasonId, "The matchup-week season ID is invalid.");
  contract(typeof week.weekKey === "string" && week.weekKey.length > 0, "The week key is invalid.");
  for (const field of [
    "sequence", "startsAtMs", "baselineAtMs", "locksAtMs", "endsAtMs", "rollsOverAtMs", "version",
  ]) integer(week[field], `The matchup-week ${field} is invalid.`);
  contract(typeof week.status === "string" && week.status.length > 0, "The week status is invalid.");
  contract(Array.isArray(week.matchups), "The week matchups are invalid.");
  for (const matchup of week.matchups) validateMatchup(matchup);
  contract(Array.isArray(week.byes), "The week byes are invalid.");
  for (const bye of week.byes) {
    object(bye, "A matchup bye is invalid.");
    id(bye.id, "A matchup bye ID is invalid.");
    validateTeam(bye.team);
  }
}

function validateHealth(health) {
  object(health, "The competition health is invalid.");
  if (health.statistics) {
    object(health.statistics, "The statistics health is invalid.");
    contract(
      ["fresh", "stale", "degraded", "unavailable"].includes(health.statistics.status),
      "The statistics health status is invalid."
    );
    integer(health.statistics.completedAtMs, "The statistics completion time is invalid.", { nullable: true });
    integer(health.statistics.ageMs, "The statistics age is invalid.", { nullable: true });
  }
}

export function validateWeekList(data) {
  contract(data?.code === "MATCHUP_WEEKS_FOUND", "The matchup-week list code is invalid.");
  validateHealth(data.health);
  contract(Array.isArray(data.weeks), "The matchup-week list is invalid.");
  for (const week of data.weeks) validateWeek(week);
  return true;
}

export function validateCurrentWeek(data) {
  contract(data?.code === "CURRENT_MATCHUP_WEEK_FOUND", "The current-week code is invalid.");
  validateHealth(data.health);
  if (data.week !== null) validateWeek(data.week);
  return true;
}

export function validateWeekDetail(data) {
  contract(data?.code === "MATCHUP_WEEK_FOUND", "The matchup-week detail code is invalid.");
  validateWeek(data.week);
  return true;
}

export function validateMatchupDetail(data) {
  contract(data?.code === "MATCHUP_FOUND", "The matchup detail code is invalid.");
  validateMatchup(data.matchup);
  object(data.matchup.health, "The matchup health is invalid.");
  if (data.matchup.health.scoring) {
    object(data.matchup.health.scoring, "The scoring health is invalid.");
    contract(
      ["fresh", "stale", "degraded", "unavailable", "not_live"].includes(
        data.matchup.health.scoring.status
      ),
      "The scoring health status is invalid."
    );
  }
  if (data.matchup.liveScore !== null) {
    object(data.matchup.liveScore, "The live score is invalid.");
    for (const side of ["home", "away"]) {
      validateTeamScore(
        data.matchup.liveScore[side],
        side,
        data.matchup[`${side}Team`].id
      );
    }
  }
  contract(
    Object.prototype.hasOwnProperty.call(data.matchup, "scoring"),
    "The canonical matchup scoring is missing."
  );
  if (data.matchup.scoring !== null) {
    object(data.matchup.scoring, "The canonical matchup scoring is invalid.");
    contract(
      ["live", "final"].includes(data.matchup.scoring.mode),
      "The canonical matchup scoring mode is invalid."
    );
    for (const side of ["home", "away"]) {
      validateTeamScore(
        data.matchup.scoring[side],
        side,
        data.matchup[`${side}Team`].id
      );
    }
  }
  if (data.matchup.result !== null) {
    object(data.matchup.result, "The official result is invalid.");
    id(data.matchup.result.id, "The official result ID is invalid.");
    integer(data.matchup.result.version, "The official result version is invalid.");
    object(data.matchup.result.currentVersion, "The current result version is invalid.");
  }
  return true;
}

export function validateStandings(data) {
  contract(data?.code === "MATCHUP_STANDINGS_FOUND", "The standings code is invalid.");
  validateHealth(data.health);
  integer(data.finalizedResultCount, "The finalized-result count is invalid.");
  integer(data.sourceResultVersion, "The standings source version is invalid.");
  contract(Array.isArray(data.results), "The official result list is invalid.");
  for (const result of data.results) {
    object(result, "An official result is invalid.");
    id(result.id, "An official result ID is invalid.");
    integer(result.version, "An official result version is invalid.");
    integer(result.versionNumber, "An official result history version is invalid.");
    contract(
      ["official", "corrected"].includes(result.status),
      "An official result status is invalid."
    );
    object(result.week, "An official result week is invalid.");
    id(result.week.id, "An official result week ID is invalid.");
    integer(result.week.sequence, "An official result week number is invalid.");
    integer(result.week.startsAtMs, "An official result week start is invalid.");
    integer(result.week.endsAtMs, "An official result week end is invalid.");
    object(result.matchup, "An official result matchup is invalid.");
    id(result.matchup.id, "An official result matchup ID is invalid.");
    validateTeam(result.matchup.homeTeam);
    validateTeam(result.matchup.awayTeam);
    integer(result.homeScoreHundredths, "An official home score is invalid.");
    integer(result.awayScoreHundredths, "An official away score is invalid.");
    contract(
      ["home_win", "away_win", "tie"].includes(result.outcome),
      "An official result outcome is invalid."
    );
  }
  contract(Array.isArray(data.rows), "The standings rows are invalid.");
  for (const row of data.rows) {
    object(row, "A standings row is invalid.");
    id(row.teamId, "A standings team ID is invalid.");
    contract(typeof row.teamDisplayName === "string" && row.teamDisplayName.trim(), "A standings team name is invalid.");
    for (const field of [
      "rank", "gamesPlayed", "wins", "losses", "ties", "standingsPoints",
      "pointsPercentageHundredths", "fantasyPointsForHundredths",
      "fantasyPointsAgainstHundredths",
    ]) integer(row[field], `The standings ${field} is invalid.`);
    signedInteger(
      row.fantasyPointsDifferentialHundredths,
      "The standings fantasyPointsDifferentialHundredths is invalid."
    );
  }
  return true;
}
