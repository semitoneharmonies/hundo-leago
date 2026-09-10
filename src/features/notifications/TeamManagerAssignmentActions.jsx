import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import { ErrorBlock, LoadingBlock } from "../../components/HundoUi.jsx";
import { createIntentKey } from "../accounts/accountApi.js";
import { leagueKeys } from "../leagues/leagueQueries.js";
import { validateTeamManagerAssignment } from "./notificationContracts.js";

export function TeamManagerAssignmentActions({ notification, session }) {
  const queryClient = useQueryClient();
  const intentKeys = useRef({});
  const { assignmentId, leagueId, teamId } = notification.messageData;
  const path = `/api/v1/team-manager-assignments/${encodeURIComponent(assignmentId)}`;
  const queryKey = ["team-manager-assignment", assignmentId];
  const validateData = (data) => validateTeamManagerAssignment(data, {
    assignmentId, leagueId, teamId, userId: session.user.id,
  });
  const assignment = useQuery({
    queryKey,
    queryFn: async ({ signal }) => (await session.httpClient.request(path, {
      authenticated: true, dataKind: "object", signal, validateData,
    })).data,
    meta: { private: true, leagueId },
  });
  const action = useMutation({
    mutationFn: async (decision) => {
      intentKeys.current[decision] ||= createIntentKey(`team-manager-${decision}`);
      return (await session.httpClient.request(`${path}/${decision}`, {
        method: "POST", body: {}, authenticated: true, dataKind: "object",
        idempotencyKey: intentKeys.current[decision], validateData,
      })).data;
    },
    onSuccess: async (result) => {
      queryClient.setQueryData(queryKey, result);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leagueKeys.all }),
        queryClient.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) }),
      ]);
    },
  });

  if (assignment.isPending) return <LoadingBlock>Loading team assignment…</LoadingBlock>;
  if (assignment.isError) return <ErrorBlock error={assignment.error}
    fallback="This team assignment could not be loaded."
    recovery="Ask your commissioner to check the assignment, or refresh to try again." />;

  const data = assignment.data;
  return <div className="hl-notification-invitation">
    {data.assignment.status === "pending" ? <>
      <p>Manage {data.team.name} in {data.league.name}. Your other team assignments stay the same.</p>
      <div className="hl-notification-invitation__actions">
        <button className="hl-button hl-button--primary" type="button"
          disabled={action.isPending} onClick={() => action.mutate("accept")}>
          {action.isPending && action.variables === "accept" ? "Accepting…" : "Accept team assignment"}
        </button>
        <button className="hl-button hl-button--quiet" type="button"
          disabled={action.isPending} onClick={() => action.mutate("decline")}>
          {action.isPending && action.variables === "decline" ? "Declining…" : "Decline team assignment"}
        </button>
      </div>
    </> : data.assignment.status === "accepted" ? <>
      <p role="status">You now manage {data.team.name}. Your other team assignments stay the same.</p>
      <Link className="hl-button hl-button--primary" to={routePaths.teamRoster(leagueId, teamId)}>View team</Link>
    </> : <p role="status">{data.assignment.status === "declined"
      ? "Team assignment declined. Your existing teams stay assigned."
      : "This team assignment is no longer active. Ask your commissioner if you still need access."}</p>}
    {action.error && <ErrorBlock error={action.error}
      fallback="Your response could not be confirmed."
      recovery="Try again or refresh the assignment to check its current status." />}
  </div>;
}
