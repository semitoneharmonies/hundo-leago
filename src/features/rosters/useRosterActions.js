import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../shared/api/ApiError.js";
import { buyOutRosterContract, declineProspectFantasyElc, moveRosterPlayer, releaseUnsignedProspectRights, setTradeBlock, signProspectFantasyElc } from "./teamWorkspaceQueries.js";

export function useRosterActions({ httpClient, leagueId, teamId, setSaveMessage }) {
  const queryClient = useQueryClient();
  const actionMutation = useMutation({
    mutationFn: async ({ type, player }) => {
      if (type === "buyout") {
        return buyOutRosterContract(
          httpClient,
          leagueId,
          teamId,
          player
        );
      }
      const prospectDestination = {
        "prospect-sign-prospect": "Prospect",
        "prospect-sign-active": "Active",
        "prospect-sign-bench": "Bench",
        "prospect-sign-ir": "Injured Reserve",
      }[type];
      if (prospectDestination) {
        return signProspectFantasyElc(
          httpClient,
          leagueId,
          teamId,
          player.playerId,
          {
            destinationCategory: prospectDestination,
            expectedVersion: player.ownershipVersion,
          }
        );
      }
      if (type === "prospect-decline") {
        return declineProspectFantasyElc(
          httpClient,
          leagueId,
          teamId,
          player.playerId,
          player.ownershipVersion
        );
      }
      if (type === "prospect-release") {
        return releaseUnsignedProspectRights(
          httpClient,
          leagueId,
          teamId,
          player.playerId,
          player.ownershipVersion
        );
      }
      const destinationCategory = {
        active: "Active",
        bench: "Bench",
        ir: "Injured Reserve",
      }[type];
      if (destinationCategory) {
        const input = {
          confirmedIllegal: false,
          destinationCategory,
          expectedVersion: player.ownershipVersion,
        };
        try {
          return await moveRosterPlayer(
            httpClient,
            leagueId,
            teamId,
            player.ownershipId,
            input
          );
        } catch (error) {
          if (
            error?.code !== "ROSTER_ILLEGAL_CONFIRMATION_REQUIRED" ||
            !globalThis.confirm(
              `Moving ${player.name} to ${destinationCategory} will create an illegal roster. Continue and fix the highlighted roster issues afterward?`
            )
          ) {
            throw error;
          }
          return moveRosterPlayer(
            httpClient,
            leagueId,
            teamId,
            player.ownershipId,
            { ...input, confirmedIllegal: true }
          );
        }
      }
      return setTradeBlock(
        httpClient,
        leagueId,
        teamId,
        player.ownershipId,
        {
          blocked: !player.onTradeBlock,
          expectedVersion: player.ownershipVersion,
        }
      );
    },
    onSuccess: async (result, { type, player }) => {
      const actionMessage =
        type === "buyout"
          ? `${player.name} was bought out.`
          : type.startsWith("prospect-sign-")
            ? `${player.name} signed a fantasy ELC.`
            : type === "prospect-decline"
              ? `${player.name}'s fantasy ELC was declined and their rights were released.`
              : type === "prospect-release"
                ? `${player.name}'s unsigned prospect rights were released.`
          : type === "ir"
            ? `${player.name} was moved to injured reserve.`
            : type === "bench"
              ? `${player.name} was moved to the bench.`
              : type === "active"
                ? `${player.name} was moved to the active roster.`
            : `${player.name} was ${
                player.onTradeBlock ? "removed from" : "added to"
              } the trade block.`;
      const cancelledTradeCount = Array.isArray(
        result?.automaticallyCancelledTradeIds
      )
        ? result.automaticallyCancelledTradeIds.length
        : 0;
      setSaveMessage(
        cancelledTradeCount > 0
          ? `${actionMessage} ${cancelledTradeCount} pending trade ${
              cancelledTradeCount === 1 ? "proposal was" : "proposals were"
            } automatically cancelled.`
          : actionMessage
      );
      await queryClient.invalidateQueries({
        queryKey: ["league", leagueId],
      });
    },
    onError: (error, { type }) => {
      setSaveMessage(
        type === "buyout" && error?.code === "BUYOUT_LOCK_ACTIVE"
          ? "This player cannot be bought out during the 14-day window after signing."
          : error instanceof ApiError && error.status >= 400 && error.status < 500
            ? error.message
            : "The roster action could not be completed."
      );
    },
  });

  function runRosterAction(type, player) {
    if (
      type === "buyout" &&
      !globalThis.confirm(
        `Buy out ${player.name}'s contract? This creates a buyout penalty and cannot be undone here.`
      )
    ) {
      return;
    }
    if (
      type.startsWith("prospect-sign-") &&
      !globalThis.confirm(
        `Sign ${player.name} to a $3, three-season fantasy ELC? Confirm their real-life NHL entry-level contract first. Any pending trade proposals containing these unsigned rights will be automatically cancelled.`
      )
    ) {
      return;
    }
    if (
      type === "prospect-decline" &&
      !globalThis.confirm(
        `Decline ${player.name}'s fantasy ELC and release their prospect rights? This cannot be undone here, and any pending trade proposals containing the rights will be automatically cancelled.`
      )
    ) {
      return;
    }
    if (
      type === "prospect-release" &&
      !globalThis.confirm(
        `Release the unsigned prospect rights for ${player.name}? This cannot be undone here, and any pending trade proposals containing the rights will be automatically cancelled.`
      )
    ) {
      return;
    }
    setSaveMessage("");
    actionMutation.mutate({ type, player });
  }

  return { actionMutation, runRosterAction };
}
