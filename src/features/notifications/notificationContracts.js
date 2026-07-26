import { ResponseContractError } from "../../shared/api/responseContracts.js";

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

const STABLE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function stableId(value) {
  return typeof value === "string" && STABLE_ID_PATTERN.test(value);
}

export function validateNotifications(data) {
  contract(data?.code === "NOTIFICATIONS_FOUND", "The notification code is invalid.");
  contract(Array.isArray(data.notifications), "The notification list is invalid.");
  contract(data.page && typeof data.page === "object", "The notification page is invalid.");
  for (const notification of data.notifications) {
    contract(notification && typeof notification === "object", "A notification is invalid.");
    contract(typeof notification.id === "string", "A notification ID is invalid.");
    contract(typeof notification.type === "string", "A notification type is invalid.");
    contract(notification.messageData && typeof notification.messageData === "object",
      "Notification message data is invalid.");
    if (notification.type === "league_invitation_created") {
      contract(
        stableId(notification.messageData.invitationId),
        "A league invitation notification ID is invalid."
      );
      contract(
        stableId(notification.messageData.leagueId),
        "A league invitation notification league is invalid."
      );
      contract(
        typeof notification.messageData.leagueName === "string" &&
          notification.messageData.leagueName.trim() !== "",
        "A league invitation notification name is invalid."
      );
      contract(
        ["create_team", "manage_team"].includes(notification.messageData.workflow),
        "A league invitation notification workflow is invalid."
      );
      contract(
        notification.messageData.teamId === null ||
          stableId(notification.messageData.teamId),
        "A league invitation notification team is invalid."
      );
    }
    contract(Number.isSafeInteger(notification.createdAtMs), "A notification time is invalid.");
    contract(notification.readAtMs === null || Number.isSafeInteger(notification.readAtMs),
      "A notification read time is invalid.");
  }
  contract(data.page.nextCursor === null || typeof data.page.nextCursor === "string",
    "The notification cursor is invalid.");
  return true;
}

export function validateLeagueInvitation(data) {
  contract(
    data?.code === "LEAGUE_INVITATION_FOUND" ||
      data?.code === "LEAGUE_INVITATION_ACCEPTED" ||
      data?.code === "LEAGUE_INVITATION_DECLINED",
    "The league invitation code is invalid."
  );
  contract(stableId(data.invitation?.id), "The league invitation ID is invalid.");
  contract(
    ["pending", "accepted", "declined"].includes(data.invitation.status),
    "The league invitation status is invalid."
  );
  contract(
    ["create_team", "manage_team"].includes(data.invitation.workflow),
    "The league invitation workflow is invalid."
  );
  contract(stableId(data.league?.id), "The invitation league is invalid.");
  contract(
    typeof data.league.name === "string" && data.league.name.trim() !== "",
    "The invitation league name is invalid."
  );
  contract(
    data.team === null ||
      (stableId(data.team?.id) &&
        typeof data.team.name === "string" &&
        data.team.name.trim() !== ""),
    "The invitation team is invalid."
  );
  return true;
}
