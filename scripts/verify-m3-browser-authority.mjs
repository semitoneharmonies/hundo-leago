import fs from "node:fs";
import path from "node:path";

const rootDirectory = process.cwd();
const sourceDirectory = path.join(rootDirectory, "src");
const appPath = path.join(sourceDirectory, "App.jsx");
const componentsDirectory = path.join(sourceDirectory, "components");
const pagesDirectory = path.join(sourceDirectory, "pages");
const topBarPath = path.join(sourceDirectory, "components", "TopBar.jsx");
const commissionerPath = path.join(
  sourceDirectory,
  "components",
  "CommissionerPanel.jsx"
);

function collectSourceFiles(directoryPath) {
  const files = [];

  for (const entry of fs.readdirSync(directoryPath, {
    withFileTypes: true,
  })) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".js") || entry.name.endsWith(".jsx"))
    ) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function relative(filePath) {
  return path.relative(rootDirectory, filePath).replaceAll("\\", "/");
}

function requireText(source, expected, label, failures) {
  if (!source.includes(expected)) {
    failures.push(label);
  }
}

function requireGuardBefore({
  source,
  functionMarker,
  requestMarker,
  guard,
  label,
  failures,
}) {
  const functionIndex = source.indexOf(functionMarker);
  const requestIndex = source.indexOf(requestMarker, functionIndex);
  const guardIndex = source.indexOf(guard, functionIndex);

  if (
    functionIndex === -1 ||
    requestIndex === -1 ||
    guardIndex === -1 ||
    guardIndex > requestIndex
  ) {
    failures.push(label);
  }
}

if (!fs.existsSync(sourceDirectory)) {
  throw new Error(`Source directory not found: ${sourceDirectory}`);
}

const sourceFiles = collectSourceFiles(sourceDirectory);
const compatibilityFiles = [
  appPath,
  ...collectSourceFiles(componentsDirectory),
  ...collectSourceFiles(pagesDirectory),
].sort();
const compatibilityEntries = compatibilityFiles.map((filePath) => ({
  filePath,
  source: fs.readFileSync(filePath, "utf8"),
}));
const failures = [];

const forbiddenRules = [
  {
    label: "credential object password property",
    pattern: /\bpassword\s*:/i,
  },
  {
    label: "legacy current-user storage key",
    pattern: /hundo_currentUser/,
  },
  {
    label: "legacy managers credential list",
    pattern: /\bconst\s+managers\s*=/,
  },
  {
    label: "legacy login password state",
    pattern: /\bloginPassword\b/,
  },
  {
    label: "legacy browser login handler",
    pattern: /\bhandleLogin\b/,
  },
  {
    label: "browser-supplied actor claim",
    pattern: /\bactor(?:Role|Team)\b/,
  },
  {
    label: "password input",
    pattern: /\btype\s*=\s*["']password["']/i,
  },
];

for (const { filePath, source } of compatibilityEntries) {
  for (const rule of forbiddenRules) {
    if (rule.pattern.test(source)) {
      failures.push(`${relative(filePath)}: ${rule.label}`);
    }
  }
}

const appSource = fs.readFileSync(appPath, "utf8");
const topBarSource = fs.readFileSync(topBarPath, "utf8");
const commissionerSource = fs.readFileSync(commissionerPath, "utf8");

requireText(
  appSource,
  "const currentUser = null;",
  "App.jsx must declare an explicit unauthenticated current-user state",
  failures
);
requireText(
  appSource,
  "const hasAuthenticatedBackendSession = false;",
  "App.jsx must declare that no authenticated backend session exists",
  failures
);
requireText(
  topBarSource,
  "const session = useSession();",
  "TopBar.jsx must derive account state from the backend session context",
  failures
);

for (const [feature, routeMarker] of [
  ["players", "routePaths.leaguePlayers(leagueId)"],
  ["matchups", "routePaths.leagueMatchups(leagueId)"],
  ["standings", "routePaths.leagueStandings(leagueId)"],
]) {
  requireText(
    topBarSource,
    routeMarker,
    `TopBar.jsx must retain canonical league-scoped ${feature} navigation`,
    failures
  );
}

if (/<form\b|<input\b|<select\b/i.test(topBarSource)) {
  failures.push("TopBar.jsx must not render the legacy login form controls");
}

const commitStart = appSource.indexOf(
  "const commitLeagueUpdate = (reason, updater) => {"
);
const commitGuard = appSource.indexOf(
  "if (!hasAuthenticatedBackendSession)",
  commitStart
);
const updaterCall = appSource.indexOf(
  "const patch = updater?.(prev);",
  commitStart
);

if (
  commitStart === -1 ||
  commitGuard === -1 ||
  updaterCall === -1 ||
  commitGuard > updaterCall
) {
  failures.push(
    "commitLeagueUpdate must refuse before invoking its updater"
  );
}

const autosaveMarker = appSource.indexOf(
  "// M3-01: autosave remains disabled until backend sessions exist."
);
const autosaveGuard = appSource.indexOf(
  "if (!hasAuthenticatedBackendSession)",
  autosaveMarker
);

if (autosaveMarker === -1 || autosaveGuard === -1) {
  failures.push(
    "App.jsx must retain the explicit unauthenticated autosave guard"
  );
}

requireText(
  appSource,
  "{hasAuthenticatedBackendSession && (",
  "App.jsx must keep the legacy home dashboard behind backend-session authority",
  failures
);

requireGuardBefore({
  source: appSource,
  functionMarker: "// Random quote: pick once per full page load",
  requestMarker: 'localStorage.getItem("hundo_lastQuoteIndex")',
  guard: "if (!hasAuthenticatedBackendSession) return;",
  label: "legacy quote storage must remain behind backend-session authority",
  failures,
});
requireGuardBefore({
  source: appSource,
  functionMarker: "const socketRef = useRef(null);",
  requestMarker: "const socket = socketIOClient(SOCKET_URL",
  guard: "if (!hasAuthenticatedBackendSession) return;",
  label: "legacy Socket.IO must refuse before connecting without a backend session",
  failures,
});
requireGuardBefore({
  source: appSource,
  functionMarker: "// Load league from backend on first page load",
  requestMarker: "fetch(API_URL)",
  guard: "if (!hasAuthenticatedBackendSession) return;",
  label: "legacy league loading must refuse before fetch without a backend session",
  failures,
});

if (
  /\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i.test(appSource)
) {
  failures.push("App.jsx must not contain a compatibility write request");
}

requireText(
  commissionerSource,
  "hasAuthenticatedBackendSession &&",
  "CommissionerPanel.jsx must derive commissioner visibility from a backend session",
  failures
);

const commissionerGuard =
  "if (!hasAuthenticatedBackendSession || !isCommish) return;";

requireGuardBefore({
  source: commissionerSource,
  functionMarker: "const restoreSnapshot = async",
  requestMarker: 'method: "POST"',
  guard: commissionerGuard,
  label: "snapshot restore must refuse before fetch without a backend session",
  failures,
});
requireGuardBefore({
  source: commissionerSource,
  functionMarker: "const createSnapshot = async",
  requestMarker: 'method: "POST"',
  guard: commissionerGuard,
  label: "snapshot create must refuse before fetch without a backend session",
  failures,
});
requireGuardBefore({
  source: commissionerSource,
  functionMarker: "const saveSelectedWeek = async",
  requestMarker: 'method: "POST"',
  guard: commissionerGuard,
  label: "schedule update must refuse before fetch without a backend session",
  failures,
});

const mutatingRequests = [];
for (const { filePath, source } of compatibilityEntries) {
  const pattern =
    /\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/gi;
  let match = pattern.exec(source);

  while (match) {
    mutatingRequests.push(relative(filePath));
    match = pattern.exec(source);
  }
}

if (
  mutatingRequests.length !== 3 ||
  mutatingRequests.some(
    (filePath) => filePath !== "src/components/CommissionerPanel.jsx"
  )
) {
  failures.push(
    "only the three explicitly guarded commissioner compatibility writes may remain"
  );
}

if (failures.length > 0) {
  console.error("M3 browser-authority verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `M3 browser-authority verification passed across ${compatibilityFiles.length} compatibility files (${sourceFiles.length} shipped source files inventoried).`
  );
}
