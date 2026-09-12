export const FAD_SEASON_CLOSED_MESSAGE =
  "Free Agent Draft changes are closed during the season. They become available for next season after the Entry Draft is complete.";

export function fadCommissionerWindowClosed(reasonCode) {
  return ["FAD_SEASON_CLOSED", "FAD_ENTRY_DRAFT_REQUIRED"].includes(reasonCode);
}
