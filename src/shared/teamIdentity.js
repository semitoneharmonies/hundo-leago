import {
  teamPatternPaint,
  teamPatternTemplate,
} from "./teamPatternCatalog.js";

export function teamColourStyle(team) {
  const primary = team?.primaryColour || "#16324f";
  const secondary = team?.secondaryColour || "#f7f7f7";
  const tertiary = team?.tertiaryColour || "#f97316";
  const pattern = teamPatternTemplate(
    team?.patternTemplate,
    team?.tertiaryColour
  );
  const paint = teamPatternPaint(pattern.id, {
    primaryColour: primary,
    secondaryColour: secondary,
    tertiaryColour: tertiary,
  });
  return {
    "--team-primary": primary,
    "--team-secondary": secondary,
    "--team-tertiary": tertiary,
    "--team-pattern-image": paint.image,
    "--team-pattern-repeat": paint.entry.repeat,
    "--team-pattern-size": paint.entry.size,
  };
}

export function teamColourClass(baseClassName) {
  return `${baseClassName} has-team-pattern`;
}
