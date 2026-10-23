import { infiniteQueryOptions } from "@tanstack/react-query";
import { ResponseContractError } from "../../shared/api/responseContracts.js";

export const announcementKey = (leagueId) => ["league", leagueId, "announcements"];

function validateAnnouncement(item, leagueId) {
  if (!item || typeof item.id !== "string" || item.leagueId !== leagueId ||
      typeof item.body !== "string" || !item.body.trim() || item.body.length > 3000 ||
      typeof item.authorName !== "string" || !Number.isSafeInteger(item.createdAtMs)) {
    throw new ResponseContractError("The league announcement is invalid.");
  }
}

export function announcementsQuery(httpClient, leagueId) {
  return infiniteQueryOptions({
    queryKey: announcementKey(leagueId),
    initialPageParam: null,
    queryFn: async ({ signal, pageParam }) => {
      const params = new URLSearchParams({ limit: "10" });
      if (pageParam) params.set("cursor", pageParam);
      return (await httpClient.request(`/api/v1/leagues/${encodeURIComponent(leagueId)}/announcements?${params}`, {
        authenticated: true, dataKind: "object", signal,
        validateData(data) {
          if (data?.code !== "LEAGUE_ANNOUNCEMENTS_FOUND" || !Array.isArray(data.announcements) ||
              !data.page || !(data.page.nextCursor === null || typeof data.page.nextCursor === "string")) {
            throw new ResponseContractError("The league announcements could not be read.");
          }
          data.announcements.forEach((item) => validateAnnouncement(item, leagueId));
        },
      })).data;
    },
    getNextPageParam: (page) => page.page.nextCursor ?? undefined,
    meta: { private: true, leagueId },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export async function postAnnouncement(httpClient, leagueId, body, idempotencyKey) {
  return (await httpClient.request(`/api/v1/leagues/${encodeURIComponent(leagueId)}/announcements`, {
    method: "POST", authenticated: true, body: { body }, idempotencyKey, dataKind: "object",
    validateData(data) {
      if (data?.code !== "LEAGUE_ANNOUNCEMENT_POSTED") throw new ResponseContractError("The announcement was not confirmed.");
      validateAnnouncement(data.announcement, leagueId);
    },
  })).data;
}
