import { queryOptions } from "@tanstack/react-query";
import { assertResourceIdentity, ResponseContractError } from "../../shared/api/responseContracts.js";

export const ACCOUNT_DIRECTORY_LIMIT = 50;
export const ACCOUNT_SORTS = Object.freeze({ username: "Username", email: "Email", createdAt: "Created", league: "Current leagues", status: "Status" });
export const ACCOUNT_STATUSES = Object.freeze({
  active: "Active",
  pending_verification: "Awaiting verification",
  pending_credential_setup: "Awaiting password setup",
  deactivated: "Deactivated",
  disabled: "Disabled",
});
function check(condition, message) { if (!condition) throw new ResponseContractError(message); }
function record(value, keys) {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "Invalid account directory record.");
  check(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)), "Unexpected account directory fields.");
}
function text(value, minimum, maximum) {
  check(typeof value === "string" && value.length >= minimum && value.length <= maximum && value.trim() === value, "Invalid account directory text.");
}
export function validateAccountDirectory(data, offset = 0, sort = "username", direction = "asc") {
  record(data, ["code", "accounts", "pagination"]);
  check(data.code === "ADMIN_ACCOUNT_DIRECTORY_FOUND", "Invalid account directory response.");
  record(data.pagination, ["limit", "offset", "total", "hasMore", "sort", "direction"]);
  const page = data.pagination;
  check(page.limit === ACCOUNT_DIRECTORY_LIMIT && page.offset === offset && page.sort === sort && page.direction === direction, "Unexpected account directory page.");
  check(Number.isSafeInteger(page.total) && page.total >= 0 && typeof page.hasMore === "boolean", "Invalid account directory pagination.");
  check(Array.isArray(data.accounts) && data.accounts.length <= ACCOUNT_DIRECTORY_LIMIT, "Invalid account directory accounts.");
  check(data.accounts.length === Math.min(page.limit, Math.max(0, page.total - offset)) &&
    page.hasMore === (offset + data.accounts.length < page.total), "Inconsistent account directory pagination.");
  const users = new Set();
  for (const account of data.accounts) {
    record(account, ["id", "username", "email", "status", "createdAtMs", "leagues"]);
    assertResourceIdentity(account);
    check(!users.has(account.id), "Duplicate account directory account.");
    users.add(account.id);
    check(Number.isSafeInteger(account.createdAtMs) && account.createdAtMs >= 0 && Number.isFinite(new Date(account.createdAtMs).getTime()), "Invalid account creation date.");
    text(account.username, 1, 100);
    text(account.email, 3, 320);
    check(Object.hasOwn(ACCOUNT_STATUSES, account.status), "Invalid account directory status.");
    check(Array.isArray(account.leagues), "Invalid account directory leagues.");
    const leagues = new Set();
    for (const league of account.leagues) {
      record(league, ["id", "name"]);
      assertResourceIdentity(league);
      text(league.name, 1, 120);
      check(!leagues.has(league.id), "Duplicate account directory league.");
      leagues.add(league.id);
    }
  }
  return true;
}
export function accountDirectoryKey(userId, offset = 0, sort = "username", direction = "asc") {
  return ["admin", "account-directory", userId, ACCOUNT_DIRECTORY_LIMIT, offset, sort, direction];
}
export function accountDirectoryQuery(httpClient, userId, offset = 0, sort = "username", direction = "asc") {
  if (typeof userId !== "string" || !userId || !Number.isSafeInteger(offset) || offset < 0 || offset % ACCOUNT_DIRECTORY_LIMIT !== 0 || !Object.hasOwn(ACCOUNT_SORTS, sort) || !["asc", "desc"].includes(direction)) throw new TypeError("Choose a valid account directory page.");
  return queryOptions({
    queryKey: accountDirectoryKey(userId, offset, sort, direction),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(`/api/v1/admin/account-directory?limit=${ACCOUNT_DIRECTORY_LIMIT}&offset=${offset}&sort=${sort}&direction=${direction}`, {
        authenticated: true, dataKind: "object", signal,
        validateData: data => validateAccountDirectory(data, offset, sort, direction),
      });
      return response.data;
    },
    meta: { private: true, suppressGlobalError: true },
    gcTime: 0,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });
}
