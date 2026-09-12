const RELEASE_QA_T132_PARAMETER = "releaseQaT132";

export function isReleaseQaT132DiagnosticRequested(appEnv, searchParams) {
  if (
    appEnv !== "staging" ||
    !searchParams ||
    typeof searchParams.getAll !== "function"
  ) {
    return false;
  }

  const values = searchParams.getAll(RELEASE_QA_T132_PARAMETER);
  return values.length === 1 && values[0] === "1";
}

export function classifyReleaseQaT132Offers(card) {
  if (!card || !Array.isArray(card.results)) return "unavailable";
  if (card.results.length === 0) return "empty";
  if (card.results.every((result) => result.offer === null)) return "null";
  if (card.results.every((result) => result.offer !== null)) return "complete";
  return "inconsistent";
}
