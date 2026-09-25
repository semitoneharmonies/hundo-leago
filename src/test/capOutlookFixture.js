// Synthetic roster and API responses for local component and browser checks.
export const capOutlookId = (n) => `11111111-1111-4111-8111-${String(n).padStart(12, "0")}`;
export function createCapOutlookFixture() {
  const league = { id: capOutlookId(1), name: "Preview League" };
  const team = { id: capOutlookId(2), name: "Own Goal Hatty", primaryColour: "#481329", secondaryColour: "#f1cb16", logoReference: null, version: 1, currentManager: { userId: capOutlookId(3) } };
  const definitions = [
    ["Connor McDavid", "F", "Active", 2300, 3, 200],
    ["Nikita Kucherov", "F", "Active", 350, 2, 0],
    ["Nazem Kadri", "F", "Active", 250, 1, 0],
    ["Cale Makar", "D", "Active", 1975, 3, 0],
    ["Nick Suzuki", "F", "Bench", 500, 2, 0],
    ["Mark Stone", "F", "Injured Reserve", 100, 1, 0],
    ["Ivan Demidov", "F", "Prospect", 100, 3, 0],
    ["Unsigned Prospect", "D", "Prospect", 0, 0, 0],
  ];
  const players = definitions.map(([name, position, category, aav, years, retained], index) => ({
    ownershipId: capOutlookId(10 + index), ownershipVersion: 1, playerId: capOutlookId(30 + index),
    name, normalizedPosition: position, rosterCategory: category, ownershipKind: category === "Prospect" ? "Prospect Right" : "Rostered",
    displayOrder: index, slotNumber: index + 1, age: 27, onTradeBlock: false, statistics: null,
    nhlTeamAbbreviation: "NHL", contract: years ? { id: capOutlookId(50 + index), version: 1, aavCents: aav, retainedAavCents: retained, originalTermYears: years, remainingYears: years, type: category === "Prospect" ? "fantasy_elc" : "standard" } : null,
  }));
  let canManage = true;
  const fixture = {
    players, team, league, requests: [], failNext: false, requireConfirmation: false,
    setCanManage(value) { canManage = value; },
    workspace() {
      const rows = players.map((player) => ({
        id: player.ownershipId, ownershipId: player.ownershipId, playerId: player.playerId, name: player.name,
        category: player.rosterCategory === "Active" ? player.normalizedPosition === "F" ? "Forwards" : "Defence" : player.rosterCategory,
        amountsCents: [0, 1, 2].map((year) => player.contract && year < player.contract.remainingYears ? player.contract.aavCents - player.contract.retainedAavCents : null),
      }));
      rows.push({ id: capOutlookId(80), ownershipId: null, playerId: capOutlookId(81), name: "Auston Matthews", category: "Retained salary", amountsCents: [125, 125, null] });
      rows.push({ id: capOutlookId(82), ownershipId: null, playerId: capOutlookId(83), name: "Alex Ovechkin", category: "Buyouts", amountsCents: [63, 63, 63] });
      const sum = (category, year) => rows.filter((row) => row.category === category).reduce((total, row) => total + (row.amountsCents[year] ?? 0), 0);
      const seasons = [0, 1, 2].map((offset) => {
        const forwardCents = sum("Forwards", offset), defenceCents = sum("Defence", offset), retainedSalaryCents = sum("Retained salary", offset), buyoutPenaltyCents = sum("Buyouts", offset);
        const usageCents = forwardCents + defenceCents + retainedSalaryCents + buyoutPenaltyCents;
        return { key: `${2026 + offset}${2027 + offset}`, label: `${2026 + offset}–${27 + offset}`, offset, complete: true, limitCents: 10000, usageCents, spaceCents: 10000 - usageCents, forwardCents, defenceCents, retainedSalaryCents, buyoutPenaltyCents, benchCents: sum("Bench", offset), injuredReserveCents: sum("Injured Reserve", offset), prospectCents: sum("Prospect", offset) };
      });
      const current = seasons[0];
      return structuredClone({
        code: "TEAM_WORKSPACE_FOUND", canManage, orderVersion: 0, league, team, season: { id: capOutlookId(4), label: seasons[0].label }, players,
        cap: { limitCents: 10000, usageCents: current.usageCents, spaceCents: current.spaceCents, activePlayerCents: current.forwardCents + current.defenceCents, retainedSalaryCents: 125, buyoutPenaltyCents: 63, retentionSlotsUsed: 1, retentionSlotLimit: 3, complete: true, issues: [] },
        capOutlook: { seasons, rows }, legality: { legal: true, reasons: [], counts: {}, limits: {}, cap: {} }, draftPicks: [],
        tradeAssets: { contracts: [], prospects: [], draftPicks: [], retentions: [], buyouts: [], futureConsiderations: [] },
      });
    },
    async request(path, options = {}) {
      fixture.requests.push({ path, ...options });
      if (options.method === "POST") {
        if (fixture.failNext) { fixture.failNext = false; throw new Error("The roster move could not be saved."); }
        if (fixture.requireConfirmation && !options.body.confirmedIllegal) {
          const error = new Error("Confirm the illegal roster."); error.code = "ROSTER_ILLEGAL_CONFIRMATION_REQUIRED"; throw error;
        }
        const player = players.find((item) => path.includes(item.ownershipId));
        if (!canManage || !player || options.body.expectedVersion !== player.ownershipVersion) throw new Error("Move unavailable.");
        player.rosterCategory = options.body.destinationCategory;
        player.ownershipVersion += 1;
        return { data: {} };
      }
      const data = fixture.workspace();
      options.validateData?.(data);
      return { data };
    },
  };
  return fixture;
}
