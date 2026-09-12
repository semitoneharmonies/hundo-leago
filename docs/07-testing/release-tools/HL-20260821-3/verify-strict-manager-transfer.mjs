import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const runtimeNames = [
  "strict-manager-transfer.html",
  "strict-manager-transfer.js",
  "strict-manager-transfer.css",
  "enabled.json",
];
const expectedMarker = {
  contractVersion: 1,
  enabled: true,
  releaseId: "HL-20260821-3",
  frontendBuildId: "0e8eee92e2e323dd7f25ec3112988feaf23f96f0",
  backendBuildId: "23971a4d66ee6383c6ad54339e769dbc9a76561e",
  frontendOrigin: "https://staging.hundoleago.com",
  apiOrigin: "https://api-staging.hundoleago.com",
  expiresAt: "2026-08-23T07:00:00.000Z",
};
const expectedGlobalNetlifyHeaders = `[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://api-staging.hundoleago.com https://hundo-leago-backend-staging.onrender.com https://api.hundoleago.com https://hundo-leago-backend.onrender.com; media-src 'self' data: blob:; connect-src 'self' https://api-staging.hundoleago.com wss://api-staging.hundoleago.com https://hundo-leago-backend-staging.onrender.com wss://hundo-leago-backend-staging.onrender.com https://api.hundoleago.com wss://api.hundoleago.com https://hundo-leago-backend.onrender.com wss://hundo-leago-backend.onrender.com; worker-src 'self' blob:; upgrade-insecure-requests"
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Resource-Policy = "same-origin"
    Permissions-Policy = "camera=(), display-capture=(), geolocation=(), microphone=(), payment=(), usb=()"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"`;
const expectedHelperNetlifyHeaders = `[[headers]]
  for = "/release-qa/hl-20260821-3/*"
  [headers.values]
    Cache-Control = "no-store"
    Content-Security-Policy = "default-src 'none'; base-uri 'none'; connect-src 'self' https://api-staging.hundoleago.com; form-action 'none'; frame-ancestors 'none'; img-src 'none'; object-src 'none'; script-src 'self'; style-src 'self'"
    Referrer-Policy = "no-referrer"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-Robots-Tag = "noindex, nofollow, noarchive"`;
const expectedNetlifyToml = `[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "24.14.1"

${expectedGlobalNetlifyHeaders}

${expectedHelperNetlifyHeaders}

[[headers]]
  for = "/"
  [headers.values]
    Cache-Control = "no-store"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-store"

[[headers]]
  for = "/leagues/*"
  [headers.values]
    Cache-Control = "no-store"
`;
const expectedRetiredBaselineNetlifyToml = `[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "24.14.1"

${expectedGlobalNetlifyHeaders}

[[headers]]
  for = "/"
  [headers.values]
    Cache-Control = "no-store"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-store"

[[headers]]
  for = "/leagues/*"
  [headers.values]
    Cache-Control = "no-store"
`;

const originalDistInventory = [
  ["_redirects", 103, "368f029496e27e1b4aae7dace10e653c93a103039f596cefb426742a3011ae36"],
  ["assets/AccountActionPages-SZTj6ixm.js", 4942, "d5ff38a750ef94cef29ec46bfb8e20723feaa4c5048f87438b7a7569cc1954b1"],
  ["assets/AccountSettingsPage-A_H1xkHM.js", 9417, "e6fd08008e298547aef9e4348bd7113ee1b3b04c325fe9833c35d0ae416f04aa"],
  ["assets/AuctionPages-CufRTYuh.js", 37894, "0559d94ed174359fdce11d543912206d76d86aed2e70a59d1eea89161c82b12d"],
  ["assets/AuctionPages-LkNcnirM.css", 7244, "ec5a505534fb21132a1dd45c0a13b6435a349d1bb05810ccc9ed717fea54a368"],
  ["assets/CommissionerRosterPage-abMERwYm.js", 30575, "3bfab0e0e9d4a1d81ff5d0b140feeadf2b9e9d8c4c4074e52fed862b0ed55ae9"],
  ["assets/CommissionerRosterPage-nJzxaoIj.css", 4317, "e90540f818bed813a8442768d4354b8138218272c6a72f3d91139ec6c12d2331"],
  ["assets/CompetitionPages--8Oi0acS.js", 45683, "f3f194590776e4f02e6ee09bc98f01b7234e508cc6b2c22ae0d9a35be6f0548c"],
  ["assets/competitionQueries-BTYHP97F.js", 9522, "456c4a040f10d1c270542d090f4741e636ebe5258d806695e9dba2ee8a7e2e80"],
  ["assets/FreeAgentDraftPage-DSS8xEim.css", 21707, "a79a2732d26069c73a35b9d6b22dcae582746cb611277e0dc1e028c61a129c42"],
  ["assets/FreeAgentDraftPage.module-CDqPVOnm.js", 5389, "643ba32f68a8e2ca51703ff6a33dbb005020176120575e0bba0298aafa1d435b"],
  ["assets/FreeAgentDraftPages-CeMV0yeN.js", 42977, "91fcce36d01744364cf1b882164224bcbd1671ac47f1af395a6398611cb9f5e0"],
  ["assets/hundoFormat-DiB_zqTr.js", 1436, "aa6f63e4e8809bcdcdf7818339b69e50b7f3aee522204260c8934dfb0f3a55af"],
  ["assets/HundoUi-CmALIjSB.js", 3974, "87378d9c76a654c1f78bc08f4e4eb2f748bdb81d1d1200f192bf0bf385737a7c"],
  ["assets/idempotency-CmJAho3p.js", 536, "4882def72a9c4f3188ffa9545892281487f157729ac98dc0e06cf02c91e0e0fc"],
  ["assets/index-C-yMyteT.css", 108551, "74aab8400795639840c5efeff9e14ffe5539b71dda1a09c523e50edf63c1ab88"],
  ["assets/index-CI54gRot.js", 527839, "5b2336e5b1e099ef32747b48124c331495cefad1511e26d244e09d5567460394"],
  ["assets/LeaguePages-qR7DXFak.js", 75168, "acfb9d98a40c63d7863dde391f8d6b5134ad0315f50c3c72c03e9fb9af9d4bf3"],
  ["assets/NotificationsPage-C8kCjqnd.js", 9890, "2a6274757d1a0a08c778c1606979adf7487c29895483f2f0b3a02d5efdc7b14a"],
  ["assets/PlayerPages-BWPSIGdx.js", 23204, "c1a652b576fcf0c980e747615166e2f676cff288a34f9d1e30aee26949135e37"],
  ["assets/playerQueries-9h6tjOEQ.js", 8233, "de22b7f5802c05d2ecc1637db989a0363373498f052ceac07aea4ee98bd8f41a"],
  ["assets/transactionContracts-D-lqpUQN.js", 10042, "d8112c6b032dfdfd034495ca47fffe7442d8f85302ffd7a638a990bf37aefdbf"],
  ["assets/TransactionPages-H3FQxwgW.js", 33183, "72c93e776ea4effd7c305562d206f65d176d3358ec63cdf36796238a9baea0b2"],
  ["assets/transactionQueries-DCCV0as3.js", 15682, "0cc47ac09d0710742052ad4021e1cbc8747588ca54a3bf6aaef8eb4329ab09e8"],
  ["assets/useInfiniteQuery-CzZHSsPX.js", 1119, "5eca1b55a59c82ce877311762720564279ca31f282048ec613d3e86dba6c95be"],
  ["assets/useMutation-BmIW0eAW.js", 2207, "a91362039368ec644a085791eaf36a5ce5edb12f919b69a33ae5c7ac80232d4d"],
  ["index.html", 472, "1982ecf04cc456d989f7b42f15f3ced49a5d825df0dedd948deaffe8d8c1adc8"],
  ["sounds/VGaccepttrade-crop.wav", 102390, "3a175017d6f15a72957fdd851a511a36ebb351d8f2e443975db98ddce7488f75"],
  ["sounds/VGauctionwin-crop.wav", 275262, "fd460adf87fada4b0e25fc4c13a54c203faa8ecd8343e2041d02a592fcaee3e5"],
  ["sounds/VGoffertrade-crop.wav", 98862, "70e0986c380d7a5070d9571facbe08f6a229f946234810232793fee20d4d8c0f"],
  ["sounds/VGplacebid-crop.wav", 160642, "10d034ed947371e8d3f29d4e4b8fde83fd41414d22bc06884496bc3a3945d2a8"],
  ["sounds/VGrejecttrade.wav", 251996, "7d96fe49bc5b62ab958a4494378c8673814365b7a676bc1ac60f0a72193f3bf0"],
  ["vite.svg", 1497, "4a748afd443918bb16591c834c401dae33e87861ab5dbad0811c3a3b4a9214fb"],
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fileEvidence(path) {
  const bytes = readFileSync(path);
  return { byteLength: bytes.byteLength, sha256: sha256(bytes) };
}

function walk(root, current = root) {
  return readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const path = join(current, entry.name);
    if (entry.isDirectory()) return walk(root, path);
    assert.ok(entry.isFile(), `unexpected non-file inventory entry: ${path}`);
    return [relative(root, path).replaceAll("\\", "/")];
  });
}

const html = readFileSync(join(here, "strict-manager-transfer.html"), "utf8");
const javascript = readFileSync(
  join(here, "strict-manager-transfer.source.js"),
  "utf8"
);
const bundle = readFileSync(join(here, "strict-manager-transfer.js"), "utf8");
const marker = JSON.parse(readFileSync(join(here, "enabled.json"), "utf8"));
const netlifyToml = readFileSync(
  resolve(here, "../../../../netlify.toml"),
  "utf8"
).replaceAll("\r\n", "\n");
const retiredBaselineFlagIndex = process.argv.indexOf(
  "--retired-baseline-root"
);
const retiredBaselineMode = retiredBaselineFlagIndex !== -1;
const overlayFlagIndex = process.argv.indexOf("--overlay-root");

assert.ok(
  !(retiredBaselineMode && overlayFlagIndex !== -1),
  "--retired-baseline-root cannot verify an active helper overlay"
);

assert.deepEqual(marker, expectedMarker);
assert.ok(bundle.startsWith("/* eslint-disable */\n"));
assert.equal(
  netlifyToml,
  retiredBaselineMode
    ? expectedRetiredBaselineNetlifyToml
    : expectedNetlifyToml,
  retiredBaselineMode
    ? "retired Netlify baseline drifted or the helper rule was reintroduced"
    : "Netlify global/non-helper rules or temporary helper rule drifted"
);
assert.equal(netlifyToml.split(expectedGlobalNetlifyHeaders).length - 1, 1);
if (retiredBaselineMode) {
  assert.equal(netlifyToml.split(expectedHelperNetlifyHeaders).length - 1, 0);
  assert.ok(
    !netlifyToml.includes('/release-qa/hl-20260821-3/*'),
    "retired helper header scope must remain absent"
  );
} else {
  assert.equal(netlifyToml.split(expectedHelperNetlifyHeaders).length - 1, 1);
  assert.ok(
    netlifyToml.includes(
      `${expectedGlobalNetlifyHeaders}\n\n${expectedHelperNetlifyHeaders}\n\n[[headers]]\n  for = "/"`
    ),
    "temporary helper headers must immediately follow the unchanged global rule"
  );
}
assert.match(
  html,
  /default-src 'none'; base-uri 'none'; connect-src 'self' https:\/\/api-staging\.hundoleago\.com; form-action 'none'; img-src 'none'; object-src 'none'; script-src 'self'; style-src 'self'/
);
assert.match(html, /<script src="\.\/strict-manager-transfer\.js" defer><\/script>/);
assert.match(html, /<link rel="stylesheet" href="\.\/strict-manager-transfer\.css" \/>/);
assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
assert.doesNotMatch(html, /<form\b/i);
assert.doesNotMatch(html, /type="password"/i);

for (const exactValue of [
  "https://staging.hundoleago.com",
  "/release-qa/hl-20260821-3/strict-manager-transfer",
  "https://staging.hundoleago.com/release-qa/hl-20260821-3/enabled.json",
  "https://api-staging.hundoleago.com",
  "HL-20260821-3",
  "2026-08-23T07:00:00.000Z",
  "23971a4d66ee6383c6ad54339e769dbc9a76561e",
  "0e8eee92e2e323dd7f25ec3112988feaf23f96f0",
  "test:release-qa",
  "m7-release-qa-fixture",
  "60c82aa0-54f9-4c93-83f5-73b0d6d6f63e",
  "ebc815c7-8a41-4326-8faf-04548aa91c76",
  "dbc0118a-21f9-408c-abf5-b01d9ca05e64",
  "e9f723c4-32d2-4823-a1d4-233fe0ce2f45",
  "c2684bf0-d30d-4b37-ae14-66620259798e",
  "HL-20260821-3-team1-to-b-propose",
  "HL-20260821-3-team1-to-b-accept",
  "HL-20260821-3-team1-to-a-propose",
  "HL-20260821-3-team1-to-a-accept",
  "HL-20260821-3-outbox-team1-to-manager-b",
  "HL-20260821-3-outbox-team1-return-to-manager-a",
  "PUBLISH-HL-20260821-3-TEAM1-TO-MANAGER-B",
  "PUBLISH-HL-20260821-3-TEAM1-RETURN-TO-MANAGER-A",
  "/api/v1/operations/release-qa/strict-manager-outbox",
]) {
  assert.ok(javascript.includes(exactValue), `missing exact value: ${exactValue}`);
}

for (const forbidden of [
  /document\.cookie/i,
  /localStorage/i,
  /sessionStorage/i,
  /indexedDB/i,
  /navigator\.sendBeacon/i,
  /XMLHttpRequest/i,
  /\bnew\s+WebSocket\b/i,
  /EventSource/i,
  /\.innerHTML\b/i,
  /insertAdjacentHTML/i,
  /\beval\s*\(/i,
  /new\s+Function\b/i,
  /\bconsole\s*\./i,
  /\/api\/v1\/notifications/i,
]) {
  assert.doesNotMatch(javascript, forbidden);
}

assert.match(javascript, /import \{ QueryClient \} from "@tanstack\/react-query";/);
assert.match(javascript, /const actionQueryClient = new QueryClient\(/);
assert.match(javascript, /actionQueryClient\.getQueryCache\(\)\.getAll\(\)\.length/);
assert.match(javascript, /actionQueryClient\.getMutationCache\(\)\.getAll\(\)\.length/);
assert.match(javascript, /queryClientPresent: true, queryCacheSize, mutationCacheSize/);
assert.match(javascript, /mutations: \{ retry: false \}/);
assert.match(javascript, /queries: \{ retry: false \}/);
assert.match(javascript, /window\.location\.hash\.slice\(1\)/);
assert.match(javascript, /window\.location\.search !== ""/);
assert.match(javascript, /window\.history\.replaceState\(/);
assert.match(javascript, /acceptingManagerActionUrl/);
assert.match(javascript, /state\.unsafeSequenceInFlight = true/);
assert.match(javascript, /window\.addEventListener\("beforeunload"/);
assert.match(javascript, /Date\.now\(\) < EXPIRES_AT_MS/);
assert.match(javascript, /responseMediaType\(response\) === "application\/json"/);
assert.match(javascript, /credentials: "include"/);
assert.match(javascript, /credentials: "same-origin"/);
assert.match(javascript, /cache: "no-store"/);
assert.match(javascript, /redirect: "error"/);
assert.match(javascript, /referrerPolicy: "no-referrer"/);
assert.match(javascript, /"X-CSRF-Token": csrfValue/);
assert.match(javascript, /"Idempotency-Key": idempotencyKey/);
assert.match(javascript, /data\.databaseWriteCount === \(replayed \? 0 : 2\)/);
assert.match(javascript, /data\.schedulerRemainedDisabled === true/);
assert.match(javascript, /state\.stopped = true/);
assert.match(javascript, /do not reload or retry/i);
assert.match(
  javascript,
  /data\.team\.currentManager\.assignmentId ===\s*data\.assignment\.replacesAssignmentId/
);
assert.match(javascript, /const teamPrecheck = await requestJson\(/);
assert.match(javascript, /const replaySession = await loadSession\(phase\.targetUserId\)/);
assert.match(
  javascript,
  /async function writeJson[\s\S]*?await requireActivationMarker\(\);\s*return requestJson\(/
);

for (const forbiddenActionClientUse of [
  /free-agent-drafts/i,
  /candidate-cards/i,
  /RealtimeProvider/,
  /socket\.io/i,
  /socket\.io-client/i,
  /actionQueryClient\.(?:fetchQuery|prefetchQuery|setQueryData|setQueriesData|invalidateQueries|refetchQueries|removeQueries)\s*\(/,
]) {
  assert.doesNotMatch(javascript, forbiddenActionClientUse);
}

const initialize = javascript.match(
  /function initialize\(\) \{(?<body>[\s\S]*?)\n  \}\n\n  initialize\(\);/
);
assert.ok(initialize?.groups?.body, "initialize body was not found");
for (const forbiddenInitialization of [
  /\bfetch\s*\(/,
  /\brequestJson\s*\(/,
  /\bloadSession\s*\(/,
  /\bwriteJson\s*\(/,
  /\bpropose\s*\(/,
  /\baccept\s*\(/,
  /\bpublishAndVerifyReplay\s*\(/,
]) {
  assert.doesNotMatch(initialize.groups.body, forbiddenInitialization);
}

for (const markerText of [
  "READY_NO_SESSION_REQUEST",
  "ACTION_QUERY_CLIENT_BOUNDARY_MISMATCH",
  "FIXTURE_ACTION_HORIZON_EXPIRED",
  "ACTIVATION_MARKER_CONTENT_MISMATCH",
  "PUBLISH_AND_REPLAY_OK",
  "acceptingManagerActionUrl",
]) {
  assert.ok(bundle.includes(markerText), `bundle marker missing: ${markerText}`);
}
for (const forbiddenBundleText of [
  "free-agent-drafts",
  "candidate-cards",
  "RealtimeProvider",
  "socket.io-client",
]) {
  assert.ok(!bundle.includes(forbiddenBundleText), `forbidden bundle marker: ${forbiddenBundleText}`);
}

if (retiredBaselineMode) {
  const rootArgument = process.argv[retiredBaselineFlagIndex + 1];
  assert.ok(rootArgument, "--retired-baseline-root requires a path");
  const retiredRoot = resolve(process.cwd(), rootArgument);
  const expected = new Map(
    originalDistInventory.map(([path, byteLength, hash]) => [
      path,
      { byteLength, sha256: hash },
    ])
  );
  const actualPaths = walk(retiredRoot).sort();
  assert.deepEqual(
    actualPaths,
    [...expected.keys()].sort(),
    "retired baseline inventory drift"
  );
  assert.ok(
    !actualPaths.some((path) =>
      path.startsWith("release-qa/hl-20260821-3/")
    ),
    "retired helper runtime must remain absent"
  );
  for (const [path, evidence] of expected) {
    assert.deepEqual(
      fileEvidence(join(retiredRoot, path)),
      evidence,
      `retired baseline byte drift: ${path}`
    );
  }
}

if (overlayFlagIndex !== -1) {
  const rootArgument = process.argv[overlayFlagIndex + 1];
  assert.ok(rootArgument, "--overlay-root requires a path");
  const overlayRoot = resolve(process.cwd(), rootArgument);
  const expected = new Map(
    originalDistInventory.map(([path, byteLength, hash]) => [
      path,
      { byteLength, sha256: hash },
    ])
  );
  for (const name of runtimeNames) {
    expected.set(
      `release-qa/hl-20260821-3/${name}`,
      fileEvidence(join(here, name))
    );
  }
  const actualPaths = walk(overlayRoot).sort();
  assert.deepEqual(actualPaths, [...expected.keys()].sort(), "overlay inventory drift");
  for (const [path, evidence] of expected) {
    assert.deepEqual(fileEvidence(join(overlayRoot, path)), evidence, `overlay byte drift: ${path}`);
  }
}

assert.deepEqual(
  originalDistInventory.find(([path]) => path === "index.html"),
  ["index.html", 472, "1982ecf04cc456d989f7b42f15f3ced49a5d825df0dedd948deaffe8d8c1adc8"]
);
assert.deepEqual(
  originalDistInventory.find(([path]) => path === "assets/index-CI54gRot.js"),
  ["assets/index-CI54gRot.js", 527839, "5b2336e5b1e099ef32747b48124c331495cefad1511e26d244e09d5567460394"]
);

process.stdout.write(
  `strict manager-transfer helper verified (${retiredBaselineMode ? "retired baseline; " : ""}${runtimeNames.length} runtime files; ${originalDistInventory.length} pinned base files)\n`
);
