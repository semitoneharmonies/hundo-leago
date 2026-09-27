import {createRoot} from 'react-dom/client';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {AppProviders} from '../../src/app/AppProviders.jsx';
import {PlayersCatalogPage} from '../../src/features/players/PlayersCatalogPage.jsx';
import '../../src/styles/theme-a.css';
const leagueId = "11111111-1111-4111-8111-111111111111";
const seasonId = "22222222-2222-4222-8222-222222222222";
const teamA = "33333333-3333-4333-8333-333333333333";
const _teamB = "44444444-4444-4444-8444-444444444444";
const userId = "55555555-5555-4555-8555-555555555555";
const freeAgentId = "66666666-6666-4666-8666-666666666666";
const ownedPlayerId = "77777777-7777-4777-8777-777777777777";
const prospectId = "88888888-8888-4888-8888-888888888888";
const unavailableId = "99999999-9999-4999-8999-999999999999";
const config = {
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
};

function envelope(data, { actions, page } = {}) {
  return new Response(
    JSON.stringify({
      data,
      ...(actions ? { actions } : {}),
      ...(page ? { page } : {}),
      meta: { requestId: "request-1" },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function _auctionActions(allowed = true) {
  return {
    startTeams: [
      {
        teamId: teamA,
        team: {
          teamId: teamA,
          name: "Alpha Team",
          primaryColour: "#16324f",
          secondaryColour: "#f7f7f7",
          tertiaryColour: null,
          patternTemplate: "solid",
          logoReference: null,
        },
        sourceKind: "fad_open_rapid",
        fadId: seasonId,
        fadRolloverId: null,
        targetRolloverAtMs: null,
        creationCutoffAtMs: null,
        startAuction: {
          allowed,
          reasonCode: allowed ? null : "PHASE_CLOSED",
        },
      },
    ],
  };
}

function session() {
  return {
    csrfToken: "D".repeat(43),
    session: {
      id: userId,
      userId,
      status: "active",
      createdAtMs: 1,
      lastUsedAtMs: 1,
      idleExpiresAtMs: 2,
      absoluteExpiresAtMs: 3,
      version: 1,
    },
    user: {
      id: userId,
      displayName: "Manager",
      status: "active",
      version: 1,
    },
  };
}

function league() {
  return {
    id: leagueId,
    name: "Test League",
    status: "active",
    timezone: "America/Vancouver",
    currentSeason: {
      id: seasonId,
      label: "2026-27",
      status: "active",
      version: 1,
    },
    membership: {
      id: userId,
      permissionCategory: "manager",
      status: "active",
      version: 1,
    },
    version: 1,
  };
}

function team(id, name) {
  return {
    id,
    leagueId,
    name,
    status: "active",
    primaryColour: "#16324f",
    secondaryColour: "#f7f7f7",
    logoReference: null,
    createdAtMs: 1,
    updatedAtMs: 1,
    version: 1,
    currentManager: null,
  };
}

function player({
  id,
  name,
  active = true,
  gamesPlayed,
  fantasyPointsHundredths,
  ownership = null,
  activeContract = null,
}) {
  const [firstName, ...lastParts] = name.split(" ");
  const lastName = lastParts.join(" ");
  return {
    id,
    firstName,
    lastName,
    fullName: name,
    birthDate: "1998-01-01",
    status: "active",
    provider: {
      provider: "sportsdataio-discovery-lab",
      sourcePosition: "C",
      normalizedPosition: "F",
      nhlTeamAbbreviation: "VAN",
      active,
      sourceVersion: "2026REG",
      effectiveAtMs: 1,
    },
    statistics: {
      provider: "release_qa_fixture",
      nhlSeasonKey: "20262027",
      gamesPlayed,
      goals: 1,
      assists: 2,
      nhlPoints: 3,
      fantasyPointsHundredths,
      sourceUpdatedAtMs: 1,
    },
    version: 1,
    league: {
      id: leagueId,
      ownership,
      activeContract,
    },
  };
}

function createContractFilterTestFixture() {
  const requests = [];
  const ownership = (category = "Active", kind = "Rostered") => ({
    kind, category, team: { id: teamA, name: "Alpha Team" },
  });
  const contract = (aavCents, remainingYears) => ({
    aavCents, remainingYears, originalTermYears: 3, originalTotalValueCents: aavCents * 3,
  });
  const rows = [
    player({ id: freeAgentId, name: "Free Agent", gamesPlayed: 50, fantasyPointsHundredths: 9000 }),
    player({ id: ownedPlayerId, name: "Lower Boundary", gamesPlayed: 50, fantasyPointsHundredths: 8000, ownership: ownership(), activeContract: contract(200, 1) }),
    player({ id: unavailableId, name: "Upper Boundary", gamesPlayed: 50, fantasyPointsHundredths: 7000, ownership: ownership(), activeContract: contract(600, 2) }),
    player({ id: seasonId, name: "ELC Prospect", gamesPlayed: 5, fantasyPointsHundredths: 500, ownership: ownership("Prospect"), activeContract: contract(100, 3) }),
    player({ id: prospectId, name: "Unsigned Prospect", gamesPlayed: 0, fantasyPointsHundredths: 0, ownership: ownership("Prospect", "Prospect Right") }),
  ];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), method: options.method || "GET" });
    const { pathname, searchParams: params } = new URL(url);
    if (pathname === "/api/v1/session") return envelope(session());
    if (pathname === "/api/v1/leagues") return envelope({ code: "LEAGUES_FOUND", leagues: [league()] });
    if (pathname.endsWith("/teams")) return envelope({ code: "TEAMS_FOUND", teams: [team(teamA, "Alpha Team")] });
    if (pathname.endsWith("/auctions")) return envelope([], { actions: { startTeams: [] }, page: { nextCursor: null, hasMore: false } });
    if (!pathname.endsWith("/players")) throw new Error(`Unexpected fixture request: ${pathname}`);
    const matches = rows.filter(({ fullName, league: { ownership: owned, activeContract: signed }, id }) =>
      (!params.get("query") || fullName.toLowerCase().includes(params.get("query").toLowerCase())) &&
      (!params.get("teamId") || owned?.team.id === params.get("teamId")) &&
      (params.get("ownership") !== "signed" || signed) &&
      (params.get("ownership") !== "free" || !owned) &&
      (params.get("ownership") !== "prospects" || owned?.category === "Prospect") &&
      (!params.has("minimumAavCents") || (signed && signed.aavCents >= Number(params.get("minimumAavCents")))) &&
      (!params.has("maximumAavCents") || (signed && signed.aavCents <= Number(params.get("maximumAavCents")))) &&
      (!params.has("remainingYears") || signed?.remainingYears === Number(params.get("remainingYears"))) &&
      (!params.has("contractType") || (signed && (params.get("contractType") === "fantasy_elc" ? id === seasonId : id !== seasonId)))
    );
    return envelope(matches, { page: { nextCursor: null, hasMore: false } });
  };
  return { fetchImpl, requests };
}


const fixture=createContractFilterTestFixture();
createRoot(document.getElementById('root')).render(<AppProviders Router={MemoryRouter} routerProps={{initialEntries:[`/leagues/${leagueId}/players`]}} config={config} sessionOptions={{fetchImpl:fixture.fetchImpl}} socketFactory={()=>({onAny(){},offAny(){},disconnect(){}})}><Routes><Route path="/leagues/:leagueId/players" element={<PlayersCatalogPage/>}/></Routes></AppProviders>);
