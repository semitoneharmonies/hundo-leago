import { ResponseContractError } from "../../shared/api/responseContracts.js";

const id = value => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const text = value => typeof value === "string" && value.trim().length > 0;
function requireContract(valid) {
  if (!valid) throw new ResponseContractError("The league message response could not be verified.");
}
function validate(data, leagueId, kind) {
  requireContract(data?.leagueId === leagueId);
  if (kind === "messages") requireContract(Array.isArray(data.messages) && data.messages.every(m =>
    id(m.id) && m.leagueId === leagueId && ["announcement", "reminder"].includes(m.kind) &&
    text(m.title) && m.title.length <= 120 && text(m.body) && m.body.length <= 3000 &&
    typeof m.pinned === "boolean" && integer(m.createdAtMs) && Number.isSafeInteger(m.version) && m.version > 0 &&
    (m.expiresAtMs === null || integer(m.expiresAtMs)) && (m.archivedAtMs === null || integer(m.archivedAtMs))));
  if (kind === "preview") requireContract(/^[a-f0-9]{64}$/.test(data.previewHash || "") &&
    Array.isArray(data.recipients) && integer(data.recipientCount) && data.recipientCount === data.recipients.length &&
    data.recipients.every(r => id(r.userId) && text(r.displayName)) && text(data.message?.title) && text(data.message?.body));
  if (kind === "sent") requireContract(id(data.id) && integer(data.recipientCount) && typeof data.replayed === "boolean");
  if (kind === "archived") requireContract(id(data.id) && data.archived === true);
  if (kind === "cards") requireContract(Array.isArray(data.cards) && integer(data.total) && data.total === data.cards.length &&
    integer(data.complete) && integer(data.empty) && data.complete + data.empty <= data.total &&
    data.cards.every(c => id(c.teamId) && text(c.teamName) && ["complete", "empty", "incomplete"].includes(c.status) &&
      (c.userId === null || id(c.userId)) && (c.displayName === null || text(c.displayName))));
  return true;
}
export const communicationsKey = leagueId => ["league", leagueId, "communications"];

export function communicationRequest(client, leagueId, suffix = "", options = {}, kind = "messages") {
  return client.request(`/api/v1/leagues/${encodeURIComponent(leagueId)}/communications${suffix}`, {
    ...options, authenticated: true, dataKind: "object", validateData: data => validate(data, leagueId, kind),
  }).then(response => {
    validate(response.data, leagueId, kind);
    return response.data;
  });
}

export function communicationsQuery(client, leagueId, history = false) {
  return { queryKey: [...communicationsKey(leagueId), history ? "history" : "visible"],
    queryFn: ({ signal }) => communicationRequest(client, leagueId, history ? "/history" : "", { signal }),
    meta: { private: true, leagueId }, staleTime: 10_000, refetchInterval: 30_000, retry: false };
}
