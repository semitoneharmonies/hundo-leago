const QUICK_RULES = Object.freeze([
  ["Salary cap", "$100"],
  ["Active roster", "18 · 12 F / 6 D"],
  ["Bench", "4 · maximum $4 AAV"],
  ["Injured reserve", "4 players"],
  ["Prospects", "Unlimited eligible slots"],
  ["Contracts", "1–3 years · no extensions"],
  ["Retention", "50% cumulative · 3 slots"],
  ["Weekly roster lock", "Monday · 4:00 PM Pacific"],
]);

function RuleSection({ title, children, open = false }) {
  return (
    <details className="hl-rules-section" open={open}>
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}

function LeagueRulesDropdown({ onClose }) {
  return (
    <section
      className="hl-rules-panel"
      aria-labelledby="league-rules-title"
    >
      <header>
        <div>
          <p className="hl-eyebrow">League guide</p>
          <h2 id="league-rules-title">League rules</h2>
        </div>
        <button
          className="hl-rules-panel__close"
          type="button"
          onClick={onClose}
          aria-label="Close League Rules"
        >
          ×
        </button>
      </header>

      <dl className="hl-rules-quick">
        {QUICK_RULES.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="hl-rules-sections">
        <RuleSection title="Rosters, cap and scoring" open>
          <ul>
            <li>The active roster has 12 Forwards and 6 Defence. Bench and Injured Reserve each hold up to four players; a Bench player may have at most $4 AAV. There are no goalie slots.</li>
            <li>The $100 salary cap includes active-player AAV after retention, retained-salary obligations and buyout penalties. Bench, Injured Reserve and Prospects salaries do not count against the cap.</li>
            <li>Your active lineup locks for each matchup week on Monday at 4:00 PM Pacific. Only players in that saved lineup can score for that week. Later moves do not change earlier weeks.</li>
            <li>Bench, injured reserve and prospects do not score.</li>
            <li>Goals earn 1.25 fantasy points and assists earn 1.00. Matchup points count only the games included in that matchup period.</li>
            <li>
              A team with an illegal roster or cap position scores nothing until the team is legal and a new scoring baseline is recorded. Points are not awarded retroactively for the illegal period.
            </li>
            <li>Regular-season results are wins, losses or ties.</li>
            <li>Wins award 2 standings points; ties 1; losses 0.</li>
          </ul>
        </RuleSection>

        <RuleSection title="Matchups and standings">
          <p>Historical matchup weeks show the saved players and points for that week. Bench players at lock do not score, even if moved to Active later.</p>
          <p>Standings update from recorded matchup results. GP = wins + losses + ties. PTS = 2 × wins + ties. PCT = PTS ÷ (2 × GP), or zero before any games. PF is points for, PA is points against, and DIFF = PF − PA. Byes do not count as games.</p>
          <p>Official order uses standings points, then point differential, then points for. Teams still equal share a rank. Click a statistical heading to sort the view; sorting never changes official standings. Commissioners correct source matchup results instead of editing standings rows.</p>
        </RuleSection>

        <RuleSection title="Contracts and roster moves">
          <p>Contracts last one to three years and cannot be extended. AAV is the annual salary; total contract value is AAV × term. Check the salary-cap preview before signing or trading.</p>
          <p>Managers may move their own players between eligible roster categories. Injured Reserve is for players unavailable through injury or illness. A roster move does not change a player's Forward or Defence position. Hockey-line dragging swaps the exact selected slots.</p>
        </RuleSection>

        <RuleSection title="Prospects and fantasy entry-level contracts">
          <p>Entry Draft picks and traded prospect rights belong in Prospects. Before signing a prospect, confirm that the player has signed their real-life NHL entry-level contract.</p>
          <p>A fantasy entry-level contract (ELC) totals $3 over three seasons: $1 AAV. Signing cannot be undone from your roster. A signed prospect may stay in Prospects without counting against the cap. Once moved to Active, Bench or Injured Reserve, they cannot return to Prospects.</p>
          <p>Prospects do not score. Empty categories show no players until you add an eligible player through the appropriate draft, trade or roster action.</p>
        </RuleSection>

        <RuleSection title="Free Agent Draft">
          <ul>
            <li>
              When Candidate Cards open, use your team&apos;s private card to
              choose eligible free agents for open Forward, Defence and optional
              Bench spots. Enter each player&apos;s annual salary (AAV) and a
              one-, two- or three-year term.
            </li>
            <li>
              Use Save to keep your changes. There is no final Submit button:
              you may add, remove or change free-agent choices, salary and term
              until the displayed deadline. Every card locks automatically at
              that deadline.
            </li>
            <li>
              Before the deadline, only managers assigned to your team can see
              its card. A commissioner who does not manage your team can see or
              edit it only after your team asks for help during the help window.
            </li>
            <li>
              The card checks roster fit and the $100 active salary cap. Offers
              must be at least $1 AAV in $0.25 steps, contracts last one to three
              years, and a Bench player may not exceed $4 AAV. Valid offers on
              an incomplete but otherwise legal card still take part; new offers
              on an over-cap or structurally conflicted card are excluded.
            </li>
            <li>
              At the deadline, each player goes to the valid offer with the
              highest total contract value (AAV × years). If totals match, the
              higher AAV wins. For example, $3 AAV for three years totals $9 and
              beats $4 AAV for two years, which totals $8.
            </li>
            <li>
              If the best offers have the same total and term, only those tied
              teams enter a restricted blind auction. A team must improve its
              original offer to contend. If no team improves, the player moves
              into a new league-wide rapid auction.
            </li>
            <li>
              Restricted and league-wide rapid auctions also rank total contract
              value first, then AAV. An exact top tie is settled by an auditable
              equal-chance draw. Rapid auctions resolve at daily rollovers during
              the preseason period.
            </li>
            <li>
              After the deadline, league members can see each selected team&apos;s
              requested players and the result status they are allowed to see.
              Only managers of that team can see its salary, term and any tied
              result that needs action. A Candidate Card win creates the offered
              contract and places the player in the requested roster spot.
            </li>
            <li>
              Rapid-auction bids do not reserve cap or roster space. Winning
              several auctions may leave your team illegal, so you must fix any
              resulting roster or cap problem before the team can score.
            </li>
          </ul>
        </RuleSection>

        <RuleSection title="Auctions">
          <ul>
            <li>
              New auctions open Monday at 12:00 AM and may start through
              Thursday at 11:59 PM Pacific.
            </li>
            <li>Existing-auction bidding closes Sunday at 4:00 PM Pacific.</li>
            <li>
              Active bids are blind. You see only your own value and term;
              commissioners cannot reveal competitors.
            </li>
            <li>
              Starting bids require at least $1 AAV. Joining bids require at
              least $1.50 AAV for one or two years, or $1.75 AAV for three
              years. AAV uses $0.25 increments.
            </li>
            <li>
              The starter receives two edits, later bidders one, with a
              75-minute cooldown after each submission or edit.
            </li>
            <li>
              Bids rank by total contract value, then AAV. Ordinary auction
              ties use the original timestamp; exact Free Agent Draft ties use
              an auditable equal-chance draw.
            </li>
          </ul>
        </RuleSection>

        <RuleSection title="Trades, retention and buyouts">
          <ul>
            <li>Trading opens with the Entry Draft, or when the Free Agent Draft opens in an approved inaugural league without an Entry Draft. Trading closes at the league trade deadline.</li>
            <li>
              A trade proposal expires after 7 days or at the league trade
              deadline, whichever arrives first.
            </li>
            <li>
              Proposals do not reserve assets; acceptance revalidates every
              asset and completes atomically.
            </li>
            <li>
              A trade containing Future considerations needs commissioner
              approval after the receiving manager accepts it. No assets move while it is Awaiting Commissioner Approval; every asset and permission is checked again at approval.
            </li>
            <li>Managers can propose trades using assets they currently control. Trade-block listings show interest in a trade and do not reserve the player. Multiple proposals can involve the same asset; unavailable assets are checked again when a trade is accepted.</li>
            <li>
              Retained salary lasts for every remaining contract year and
              remains a cap obligation.
            </li>
            <li>Retention is limited to 50% of a contract's original AAV cumulatively, with three retention slots per team. Review retained obligations in the cap preview.</li>
            <li>
              The standard annual buyout penalty is 25% of AAV for each
              remaining contract year.
            </li>
            <li>
              Auction signings have a 14-day buyout lock that follows the
              player if traded.
            </li>
          </ul>
        </RuleSection>

        <RuleSection title="Entry Draft and draft archives">
          <p>Entry Draft selections award prospect rights to the team that owns the pick. Those rights can be traded and follow the prospect-signing rules above. The complete Entry Draft experience is planned for a later release.</p>
          <p>Free Agent Draft results are read-only. Choose a draft year to view that year's teams, players and results. Draft years such as 2026 are distinct from seasons such as 2026–2027. Completed Entry Drafts will use the same year-by-year archive.</p>
        </RuleSection>

        <RuleSection title="League access, notifications and commissioner tools">
          <p>Your league lists your memberships and pending invitations. Accept a league invitation or commissioner assignment to receive its access. Managing one league never grants access to another league.</p>
          <p>Notifications can be filtered by type. Reading a notification moves it to Previous notifications; it does not accept an invitation, trade or commissioner role. Open the relevant item to review and take that action.</p>
          <p>Commissioners can preview and confirm schedule creation, manage matchup weeks, and correct rosters and contracts. Add Player and Correct Contract use AAV and term, with the total shown for review. Move / re-slot changes the roster category and slot while preserving the player's position.</p>
          <p>Seasonal draft tools show the actions currently available to the commissioner. A preview does not apply a change; review its effects before confirming. Managers cannot use commissioner controls or access another team's private bids.</p>
        </RuleSection>
      </div>
    </section>
  );
}

export default LeagueRulesDropdown;
