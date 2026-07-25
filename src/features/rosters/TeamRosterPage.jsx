const CATEGORY_DETAILS = Object.freeze([
  { key: "Active", title: "Active roster", limit: 18 },
  { key: "Bench", title: "Bench", limit: 4 },
  { key: "Injured Reserve", title: "Injured reserve", limit: 4 },
  { key: "Prospect", title: "Prospects", limit: null },
]);

function money(cents) {
  if (cents === null) return "No contract";
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function playerStatistics(statistics) {
  if (!statistics) return "Not available";
  return `${statistics.gamesPlayed} GP · ${statistics.goals} G · ${statistics.assists} A · ${statistics.nhlPoints} P · ${(statistics.fantasyPointsHundredths / 100).toFixed(2)} FP`;
}

function CategoryTable({ category, players }) {
  const forwards = players.filter(({ normalizedPosition }) => normalizedPosition === "F").length;
  const defence = players.length - forwards;
  const capacity = category.key === "Active"
    ? `${players.length}/18 used · F ${forwards}/12 · D ${defence}/6`
    : category.limit === null
      ? `${players.length} held · unlimited eligible slots`
      : `${players.length}/${category.limit} used · ${category.limit - players.length} available`;
  const headingId = `roster-${category.key.replaceAll(" ", "-")}`;

  return (
    <section className="hl-surface hl-roster-category" aria-labelledby={headingId}>
      <div className="hl-roster-category__heading">
        <h2 id={headingId}>{category.title}</h2>
        <span>{capacity}</span>
      </div>
      {players.length === 0 ? (
        <p className="hl-roster-category__empty">No players occupy this category.</p>
      ) : (
        <div className="hl-table-scroll">
          <table className="hl-data-table hl-roster-table">
            <thead><tr>{["Position", "Player", "AAV", "Remaining years", "Age", "Season statistics"].map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.playerReference}>
                  <td><span className="hl-position-tag">{player.normalizedPosition}</span></td>
                  <th scope="row">{player.name}</th>
                  <td className="is-mono">{money(player.aavCents)}</td>
                  <td>{player.aavCents === null ? "—" : player.remainingContractYears}</td>
                  <td>{player.age ?? "Unknown"}</td>
                  <td className="is-mono">{playerStatistics(player.seasonStatistics)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function TeamRosterPage({ roster, managerName, canOperateRoster }) {
  const { cap, league, players, season, team } = roster;
  const overCap = cap.capSpaceCents < 0;
  const accent = team.primaryColour || "#60a5fa";
  return (
    <div className="hl-team-roster">
      <header className="hl-surface hl-roster-hero" style={{ borderTopColor: accent }}>
        <p className="hl-eyebrow">{league.name} · {season.label}</p>
        <h1 id="team-title">{team.name}</h1>
        <p>{managerName ? `Manager: ${managerName}` : "No manager is currently assigned."}</p>
        <p className="hl-inline-copy" role="status">Read-only authoritative roster projection. Dedicated roster command controls are not connected yet.{canOperateRoster ? " Your manager or commissioner authority is unchanged." : ""}</p>
      </header>
      <section className="hl-roster-cap" aria-labelledby="cap-summary-title">
        <div className="hl-section-title">
          <p className="hl-eyebrow">Team finances</p>
          <h2 id="cap-summary-title">Salary cap</h2>
        </div>
        <div className="hl-stat-grid">
          {[["Usage", money(cap.capUsageCents)], ["Limit", money(cap.capLimitCents)], ["Space", money(cap.capSpaceCents)], ["Retained salary", money(cap.retainedSalaryTotalCents)], ["Buyout penalties", money(cap.buyoutPenaltyTotalCents)]].map(([label, value]) => (
            <div className="hl-surface hl-stat-card" key={label}><span>{label}</span><strong>{value}</strong></div>
          ))}
        </div>
        <p className={`hl-cap-note${overCap ? " is-warning" : ""}`}>Cap status: <strong>{overCap ? "Over cap" : "Within cap"}</strong>. Structural legality is not included in the approved public projection.</p>
      </section>
      <div className="hl-roster-categories">
        {CATEGORY_DETAILS.map((category) => <CategoryTable key={category.key} category={category} players={players.filter(({ rosterCategory }) => rosterCategory === category.key)} />)}
      </div>
    </div>
  );
}
