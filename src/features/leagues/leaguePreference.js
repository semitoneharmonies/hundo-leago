const PREFERENCE_KEY = "hundo:league-preference:v1";
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function readLeaguePreference(storage = globalThis.localStorage) {
  try {
    const value = storage.getItem(PREFERENCE_KEY);
    return SAFE_ID.test(value || "") ? value : null;
  } catch {
    return null;
  }
}

export function writeLeaguePreference(leagueId, storage = globalThis.localStorage) {
  if (!SAFE_ID.test(leagueId || "")) return false;
  try {
    storage.setItem(PREFERENCE_KEY, leagueId);
    return true;
  } catch {
    return false;
  }
}

export function clearUnauthorizedLeaguePreference(
  authorizedIds,
  storage = globalThis.localStorage
) {
  const remembered = readLeaguePreference(storage);
  if (!remembered || authorizedIds.includes(remembered)) return false;
  try {
    storage.removeItem(PREFERENCE_KEY);
    return true;
  } catch {
    return false;
  }
}
