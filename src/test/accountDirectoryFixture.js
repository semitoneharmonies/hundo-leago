export function accountDirectoryFixture({ offset = 0, total = 54, sort = "username", direction = "asc" } = {}) {
  const known = [
    { username: "Alex Morgan", email: "alex.morgan@example.test", status: "active", leagues: [{ id: "league-amigo", name: "Amigo Leago" }, { id: "league-north", name: "North Shore Hockey Club" }] },
    { username: "Bailey Robertson with a deliberately long display name", email: "bailey.robertson.with.a.deliberately.long.email.address.for.layout.checking@example.test", status: "pending_verification", leagues: [] },
    { username: "Casey Lee", email: "casey@example.test", status: "pending_credential_setup", leagues: [] },
    { username: "Drew Taylor", email: "drew@example.test", status: "deactivated", leagues: [{ id: "league-amigo", name: "Amigo Leago" }] },
    { username: "Ellis Jordan", email: "ellis@example.test", status: "disabled", leagues: [{ id: "league-pacific", name: "Pacific Coast Long-Running Fantasy Hockey Championship League" }] },
  ];
  const accounts = Array.from({ length: total }, (_, index) => ({
    id: "00000000-0000-4000-8000-" + String(index + 1).padStart(12, "0"),
    createdAtMs: Date.parse("2026-10-01T07:30:00Z") + index * 86_400_000,
    ...(known[index] || { username: "Manager " + String(index - known.length + 1).padStart(3, "0"), email: "manager" + index + "@example.test", status: "active", leagues: [] }),
  })).sort((a, b) => {
    const statuses = { active: "active", pending_credential_setup: "awaiting password setup", pending_verification: "awaiting verification", deactivated: "deactivated", disabled: "disabled" };
    const key = account => sort === "createdAt" ? account.createdAtMs : sort === "league" ? account.leagues.map(league => league.name.toLowerCase()).sort()[0] ?? null : sort === "status" ? statuses[account.status] : account[sort].toLowerCase();
    const first = key(a), second = key(b);
    if (first === null && second !== null) return 1;
    if (second === null && first !== null) return -1;
    const compare = (one, two) => one < two ? -1 : one > two ? 1 : 0;
    return compare(first, second) * (direction === "desc" ? -1 : 1) || compare(a.username.toLowerCase(), b.username.toLowerCase()) || compare(a.id, b.id);
  }).slice(offset, offset + 50);
  return { code: "ADMIN_ACCOUNT_DIRECTORY_FOUND", accounts, pagination: { limit: 50, offset, sort, direction, total, hasMore: offset + accounts.length < total } };
}
