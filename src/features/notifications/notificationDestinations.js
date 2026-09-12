import { routePaths } from "../../app/routePaths.js";
import {
  leagueKeys,
  visibleLeaguesQuery,
} from "../leagues/leagueQueries.js";

const DESTINATION_LABELS = Object.freeze({
  private_card: "Open the Candidate Card",
  commissioner_fad: "Open commissioner Free Agent Draft tools",
  fad_results: "Open Free Agent Draft results",
  auction: "Open the Free Agent Draft auction",
  fad_recovery: "Open Free Agent Draft recovery",
  fad_overview: "Open the Free Agent Draft overview",
});

export class NotificationDestinationUnavailableError extends Error {
  constructor() {
    super("This notification destination is no longer available to your account.");
    this.name = "NotificationDestinationUnavailableError";
    this.code = "NOTIFICATION_DESTINATION_UNAVAILABLE";
  }
}

function unavailable() {
  throw new NotificationDestinationUnavailableError();
}

function privateLeagueQuery(query, leagueId) {
  const queryKey = query?.queryKey;
  return (
    (
      Array.isArray(queryKey) &&
      queryKey[0] === "league" &&
      queryKey[1] === leagueId
    ) ||
    (
      query?.meta?.private === true &&
      query?.meta?.leagueId === leagueId
    )
  );
}

export function freeAgentDraftDestinationPath(destination) {
  switch (destination.kind) {
    case "private_card":
      return routePaths.freeAgentDraftCard(
        destination.leagueId,
        destination.fadId,
        destination.teamId
      );
    case "commissioner_fad":
      return routePaths.leagueCommissioner(destination.leagueId);
    case "fad_results":
      return routePaths.freeAgentDraftResults(
        destination.leagueId,
        destination.fadId
      );
    case "auction":
      return routePaths.auctionDetail(
        destination.leagueId,
        destination.auctionId
      );
    case "fad_recovery":
      return routePaths.commissionerFadRecovery(
        destination.leagueId,
        destination.fadId,
        destination.recoveryId
      );
    case "fad_overview":
      return routePaths.freeAgentDraft(
        destination.leagueId,
        destination.fadId
      );
    default:
      return unavailable();
  }
}

export function freeAgentDraftDestinationLabel(destination) {
  return DESTINATION_LABELS[destination.kind] || unavailable();
}

export async function prepareFreeAgentDraftDestination({
  destination,
  httpClient,
  queryClient,
}) {
  if (
    !queryClient ||
    typeof queryClient.cancelQueries !== "function" ||
    typeof queryClient.removeQueries !== "function" ||
    typeof queryClient.invalidateQueries !== "function" ||
    typeof queryClient.fetchQuery !== "function"
  ) {
    throw new TypeError(
      "Notification destination preparation requires a Query Client."
    );
  }

  const path = freeAgentDraftDestinationPath(destination);
  const predicate = (query) => privateLeagueQuery(query, destination.leagueId);

  try {
    await queryClient.cancelQueries({ predicate });
    queryClient.removeQueries({ predicate });
    await queryClient.invalidateQueries({
      queryKey: leagueKeys.all,
      exact: true,
      refetchType: "none",
    });
    const leagues = await queryClient.fetchQuery({
      ...visibleLeaguesQuery(httpClient),
      staleTime: 0,
    });
    if (!leagues.some(({ id }) => id === destination.leagueId)) unavailable();
  } catch (error) {
    if (error instanceof NotificationDestinationUnavailableError) throw error;
    unavailable();
  }

  return path;
}
