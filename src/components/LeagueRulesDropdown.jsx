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
          <p className="hl-eyebrow">Approved Season 2 baseline</p>
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
            <li>Only the persisted active-roster snapshot can score.</li>
            <li>Bench, injured reserve and prospects do not score.</li>
            <li>
              An illegal team scores nothing until a new legal
              team-specific snapshot and baseline exist.
            </li>
            <li>Regular-season results are wins, losses or ties.</li>
            <li>Wins award 2 standings points; ties 1; losses 0.</li>
          </ul>
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
              approval after the receiving manager accepts it.
            </li>
            <li>
              Retained salary lasts for every remaining contract year and
              remains a cap obligation.
            </li>
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
      </div>
    </section>
  );
}

export default LeagueRulesDropdown;
