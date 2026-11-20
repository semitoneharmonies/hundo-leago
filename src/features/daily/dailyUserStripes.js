import { isTeamPatternTemplate, teamPatternPaint, teamPatternTemplate } from "../../shared/teamPatternCatalog.js";

const hexColour = value => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

export function dailyUserStripeStyle(appearance) {
  if (!appearance || !isTeamPatternTemplate(appearance.patternTemplate) ||
      !hexColour(appearance.primaryColour) || !hexColour(appearance.secondaryColour)) return {};
  const template = teamPatternTemplate(appearance.patternTemplate);
  if (template.colourCount === 3 && !hexColour(appearance.tertiaryColour)) return {};
  const paint = teamPatternPaint(template.id, appearance);
  return {
    "--daily-stripe-image": paint.image,
    "--daily-stripe-size": paint.entry.size,
    "--daily-stripe-repeat": paint.entry.repeat,
  };
}
