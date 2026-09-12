export const PLATFORM_ADMINISTRATOR_AUTHORITY = "platform_administrator";

export function effectiveLeagueAuthority(membership) {
  return (
    membership?.effectiveAuthority ||
    membership?.permissionCategory ||
    null
  );
}

export function hasCommissionerAuthority(membership) {
  const authority = effectiveLeagueAuthority(membership);
  return (
    authority === "commissioner" ||
    authority === PLATFORM_ADMINISTRATOR_AUTHORITY
  );
}

export function leagueAuthorityLabel(membership) {
  const authority = effectiveLeagueAuthority(membership);
  if (authority === PLATFORM_ADMINISTRATOR_AUTHORITY) {
    return "Platform administrator";
  }
  if (authority === "commissioner") return "Commissioner";
  if (authority === "manager") return "Manager";
  if (authority === "member") return "Member";
  return "League member";
}
