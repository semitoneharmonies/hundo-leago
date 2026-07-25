import { ResponseContractError } from "../../shared/api/responseContracts.js";

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
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
    contract(Number.isSafeInteger(notification.createdAtMs), "A notification time is invalid.");
    contract(notification.readAtMs === null || Number.isSafeInteger(notification.readAtMs),
      "A notification read time is invalid.");
  }
  contract(data.page.nextCursor === null || typeof data.page.nextCursor === "string",
    "The notification cursor is invalid.");
  return true;
}
