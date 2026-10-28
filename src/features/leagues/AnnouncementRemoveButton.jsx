import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communicationRequest, communicationsKey } from "../commissioner/leagueCommunicationApi.js";
import { announcementKey } from "./announcementQueries.js";
import { ResponseContractError } from "../../shared/api/responseContracts.js";
import "./AnnouncementRemoveButton.css";

export function AnnouncementRemoveButton({ announcement, leagueId, httpClient }) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: async () => {
      const result = await communicationRequest(httpClient, leagueId, `/${encodeURIComponent(announcement.id)}/archive`, {
        method: "POST", body: { version: announcement.version, confirmed: true },
      }, "archived");
      if (result.id !== announcement.id) throw new ResponseContractError("The announcement removal was not confirmed.");
      return result;
    },
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: announcementKey(leagueId) }),
      queryClient.invalidateQueries({ queryKey: communicationsKey(leagueId) }),
    ]),
    onError: error => {
      if (error.code === "COMMUNICATION_PREVIEW_CHANGED") {
        void queryClient.invalidateQueries({ queryKey: announcementKey(leagueId) });
        void queryClient.invalidateQueries({ queryKey: communicationsKey(leagueId) });
      }
    },
  });
  return <>
    <button type="button" className="hl-announcement-remove" title="Remove announcement"
      aria-label={`Remove announcement: ${announcement.title || announcement.body.slice(0, 80)}`}
      disabled={remove.isPending} onClick={() => { if (!remove.isPending) remove.mutate(); }}>
      <span aria-hidden="true">×</span>
    </button>
    {remove.isError && <p className="hl-announcement-remove-error" role="alert">Could not remove this announcement. Try the X again.</p>}
  </>;
}
