import { useId } from "react";

import { money } from "../shared/hundoFormat.js";

function capValue(cents) {
  return Number.isSafeInteger(cents) ? money(cents) : "Unavailable";
}

function capChange(cents) {
  if (!Number.isSafeInteger(cents)) return "Unavailable";
  if (cents === 0) return money(0);
  return cents > 0 ? `+${money(cents)}` : `−${money(Math.abs(cents))}`;
}

export function CapImpactSummary({
  description,
  pendingText = null,
  teams,
  title = "Salary cap impact",
}) {
  const titleId = useId();

  return (
    <section className="hl-cap-impact" aria-labelledby={titleId}>
      <header>
        <h3 id={titleId}>{title}</h3>
        {description && <p>{description}</p>}
      </header>
      <div className="hl-cap-impact__teams">
        {teams.map((team) => (
          <article className="hl-cap-impact__team" key={team.id}>
            <strong>{team.name}</strong>
            <dl>
              <div>
                <dt>Current cap</dt>
                <dd>{capValue(team.currentCents)}</dd>
              </div>
              <div>
                <dt>Change</dt>
                <dd
                  className={
                    Number.isSafeInteger(team.changeCents)
                      ? team.changeCents > 0
                        ? "is-increase"
                        : team.changeCents < 0
                          ? "is-decrease"
                          : undefined
                      : undefined
                  }
                >
                  {capChange(team.changeCents)}
                </dd>
              </div>
              <div>
                <dt>Projected cap</dt>
                <dd>{capValue(team.projectedCents)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      {pendingText && (
        <p className="hl-cap-impact__status" role="status">
          {pendingText}
        </p>
      )}
    </section>
  );
}
