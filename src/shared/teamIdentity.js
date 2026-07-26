export function teamColourStyle(team) {
  const primary = team?.primaryColour || "#16324f";
  const secondary = team?.secondaryColour || "#f7f7f7";
  return {
    "--team-primary": primary,
    "--team-secondary": secondary,
    "--team-tertiary": team?.tertiaryColour || primary,
  };
}

export function teamColourClass(baseClassName, team) {
  return `${baseClassName}${
    team?.tertiaryColour ? " has-three-colours" : ""
  }`;
}
