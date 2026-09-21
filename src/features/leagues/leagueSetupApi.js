import { ResponseContractError } from "../../shared/api/responseContracts.js";
import { leagueKeys } from "./leagueQueries.js";

export function leagueDraftSettingsQuery(httpClient, leagueId) {
  return {
    queryKey: [...leagueKeys.detail(leagueId), "settings"],
    queryFn: async ({ signal }) => (await httpClient.request(`/api/v1/leagues/${encodeURIComponent(leagueId)}/settings`, {
      authenticated: true, dataKind: "object", signal,
      validateData: (data) => {
        if (data?.code !== "LEAGUE_SETTINGS_FOUND" || data.settings?.leagueId !== leagueId ||
            !Number.isSafeInteger(data.settings?.version) ||
            !(data.settings?.tradeDeadlineAtMs === null || Number.isSafeInteger(data.settings?.tradeDeadlineAtMs))) {
          throw new ResponseContractError("The league draft settings response is invalid.");
        }
        return true;
      },
    })).data.settings,
    meta: { private: true, leagueId },
    staleTime: 10_000,
  };
}

export async function recordSetupTradeDeadline(httpClient, leagueId, tradeDeadlineAtMs, version, idempotencyKey) {
  return (await httpClient.request(`/api/v1/leagues/${encodeURIComponent(leagueId)}/setup/trade-deadline`, {
    method: "PUT", authenticated: true, body: { tradeDeadlineAtMs }, version, idempotencyKey, dataKind: "object",
    validateData: (data) => {
      if (data?.code !== "LEAGUE_TRADE_DEADLINE_RECORDED" || data.league?.id !== leagueId ||
          data.settings?.tradeDeadlineAtMs !== tradeDeadlineAtMs || !Number.isSafeInteger(data.league?.version)) {
        throw new ResponseContractError("The saved trade deadline response is invalid.");
      }
      return true;
    },
  })).data;
}

export async function prepareLeagueDraft(httpClient, leagueId, version, idempotencyKey) {
  return (await httpClient.request(`/api/v1/leagues/${encodeURIComponent(leagueId)}/start`, {
    method: "POST", authenticated: true, body: {}, version, idempotencyKey, dataKind: "object",
    validateData: (data) => {
      if (data?.code !== "LEAGUE_STARTED" || data.league?.id !== leagueId || data.league?.status !== "active" ||
          data.league?.currentSeason?.status !== "active" || !Number.isSafeInteger(data.activatedTeamCount) || data.activatedTeamCount < 4) {
        throw new ResponseContractError("The league draft setup response is invalid.");
      }
      return true;
    },
  })).data;
}
