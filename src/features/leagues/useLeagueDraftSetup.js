import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createIdempotencyKey } from "../../shared/api/idempotency.js";
import { leagueDetailQuery, leagueKeys, leagueMembershipsQuery, leagueTeamsQuery } from "./leagueQueries.js";
import { leagueDraftSettingsQuery, prepareLeagueDraft, recordSetupTradeDeadline } from "./leagueSetupApi.js";

export function useLeagueDraftSetup({ httpClient, leagueId, league, enabled }) {
  const queryClient = useQueryClient();
  const needsPreparation = league?.status === "setup";
  const loadSetup = enabled && needsPreparation;
  const detail = useQuery({ ...leagueDetailQuery(httpClient, leagueId), enabled: loadSetup });
  const teams = useQuery({ ...leagueTeamsQuery(httpClient, leagueId), enabled: loadSetup });
  const members = useQuery({ ...leagueMembershipsQuery(httpClient, leagueId), enabled: loadSetup });
  const settings = useQuery({ ...leagueDraftSettingsQuery(httpClient, leagueId), enabled });
  const intentKeys = useRef(new Map());
  const managedTeams = teams.data?.filter((team) => team.status === "setup" && team.currentManager) || [];
  const pendingInvitations = members.data?.filter((member) => member.status === "invited").length || 0;
  const queries = loadSetup ? [detail, teams, members, settings] : [settings];
  const loading = enabled && queries.some((query) => query.isPending);
  const error = enabled ? queries.find((query) => query.isError)?.error : null;
  const canPrepare = loadSetup && !loading && !error && managedTeams.length >= 4 &&
    managedTeams.length === teams.data?.filter((team) => team.status !== "erased").length && pendingInvitations === 0;
  const keyFor = (scope, version, deadline) => {
    const identity = JSON.stringify([leagueId, scope, version, deadline]);
    if (!intentKeys.current.has(identity)) intentKeys.current.set(identity, createIdempotencyKey(scope));
    return intentKeys.current.get(identity);
  };
  const mutation = useMutation({
    async mutationFn(tradeDeadlineAtMs) {
      if (!canPrepare || !Number.isSafeInteger(tradeDeadlineAtMs)) throw new Error("Complete the league dates and manager assignments before preparing the draft.");
      let version = detail.data.version;
      if (!Number.isSafeInteger(settings.data.tradeDeadlineAtMs)) {
        const saved = await recordSetupTradeDeadline(httpClient, leagueId, tradeDeadlineAtMs, version,
          keyFor("league-trade-deadline", version, tradeDeadlineAtMs));
        version = saved.league.version;
      } else if (settings.data.tradeDeadlineAtMs !== tradeDeadlineAtMs) {
        throw new Error("The saved trade deadline changed. Review the refreshed dates before continuing.");
      }
      return prepareLeagueDraft(httpClient, leagueId, version, keyFor("league-start", version, tradeDeadlineAtMs));
    },
    async onSettled() {
      await queryClient.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) });
      await queryClient.invalidateQueries({ queryKey: leagueKeys.all });
    },
  });
  return { needsPreparation, settings: settings.data, loading, error, managedTeamCount: managedTeams.length,
    pendingInvitations, canPrepare, mutation };
}
