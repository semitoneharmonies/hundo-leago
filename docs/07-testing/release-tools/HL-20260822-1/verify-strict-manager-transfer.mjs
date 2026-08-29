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
  releaseId: "HL-20260822-1",
  frontendBuildId: "4dfe12d1366314e3d9df722c50771324647743c9",
  backendBuildId: "8e313902feefcd683b0f5edd746a9dd2a9029a18",
  frontendOrigin: "https://staging.hundoleago.com",
  apiOrigin: "https://api-staging.hundoleago.com",
  expiresAt: "2026-08-24T07:00:00.000Z",
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
  for = "/release-qa/hl-20260822-1/*"
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
  ["assets/AccountActionPages-CautDFmX.js", 4942, "6da900d5e871ddd50267af929a1d38c4b52fc9135f1f6d863576b7f5943870f1"],
  ["assets/AccountSettingsPage-vvSaaX0O.js", 9417, "a2c49355ee2b7b98da734484f3379531b20620a785bbb1bc23a4fb0aeb61e89d"],
  ["assets/AuctionPages-Duzgm_DZ.js", 37894, "106c773a8006294c8a7c0c0e728e7326bb66359d5333d0d605c5b9b7ab5e8e05"],
  ["assets/AuctionPages-LkNcnirM.css", 7244, "ec5a505534fb21132a1dd45c0a13b6435a349d1bb05810ccc9ed717fea54a368"],
  ["assets/CommissionerRosterPage-CTiPLE8n.js", 30575, "a2c62589d15fb6be630aaf317e7b8be9a414e073ee1eb4196e3c41a9dafa5f4f"],
  ["assets/CommissionerRosterPage-nJzxaoIj.css", 4317, "e90540f818bed813a8442768d4354b8138218272c6a72f3d91139ec6c12d2331"],
  ["assets/CompetitionPages-DnqAt2C_.js", 45683, "98820e691ca6d4141a7422ebe90b3aa15b37a9107be3ef769b12bce788e4d301"],
  ["assets/competitionQueries-Brx7VwRS.js", 9522, "86d2f6743f830d6d7e772523864c1720c517b1bbfba4485eb6f652b1d2bd5068"],
  ["assets/FreeAgentDraftPage-DSS8xEim.css", 21707, "a79a2732d26069c73a35b9d6b22dcae582746cb611277e0dc1e028c61a129c42"],
  ["assets/FreeAgentDraftPage.module-CDqPVOnm.js", 5389, "643ba32f68a8e2ca51703ff6a33dbb005020176120575e0bba0298aafa1d435b"],
  ["assets/FreeAgentDraftPages-BIylQS_b.js", 43142, "17390c8bc43007c480213d32f4a8dd77804003b65127138bd1ae25b4f5389bda"],
  ["assets/hundoFormat-DiB_zqTr.js", 1436, "aa6f63e4e8809bcdcdf7818339b69e50b7f3aee522204260c8934dfb0f3a55af"],
  ["assets/HundoUi-BSirx2Wz.js", 3974, "d666a2ab792f03ad19fdab7d3728ff970ee32b7d4f087774ccad1b6c093056c9"],
  ["assets/idempotency-DiRiatci.js", 536, "2574ff8e6a08b14a9178e31d1abda4917bcffa408f829fac2aee51df11da5a0d"],
  ["assets/index-BFtuYVmF.js", 527839, "19ee27ed0fa33016e9614b5dd63095b3f1d3af1fc8f33616b4c30a3c961cd201"],
  ["assets/index-C-yMyteT.css", 108551, "74aab8400795639840c5efeff9e14ffe5539b71dda1a09c523e50edf63c1ab88"],
  ["assets/LeaguePages-CSNIP_Bt.js", 75168, "5af03377c788f2421eb53af6a52eb8c94b52dc614c3822a58aba342f8ac7c411"],
  ["assets/NotificationsPage-B1md9_uJ.js", 9890, "8647df61cfff33a6e69cc09e1c86dfc4faafb2f8351b4289e58ad17d6e220cde"],
  ["assets/PlayerPages-CfzRkcXg.js", 23204, "a62644aa03cf19a49a35d16d17ceb5c7835245e516009c463c67aec5aef9dff2"],
  ["assets/playerQueries-wV7tTEuI.js", 8233, "557b5957ef04e3a546da92f87ab91d854a331187213c5ca3da3382725deee31c"],
  ["assets/transactionContracts-B0eWLPji.js", 10042, "4c287654260e6c2662680897d7f256ba2affbd64b3c38a6ad96041e4f51a8495"],
  ["assets/TransactionPages-DDVHIs0s.js", 33183, "fad50bb71f85a5f287ea6231521d9dcf365ac78276eff3192cdbacc0fbfc35f5"],
  ["assets/transactionQueries-nwfuC5Ge.js", 15682, "dec83b9b78f4d603c97278d496ff15f5f2e6bf936e7cca566de3718c4ebe13b1"],
  ["assets/useInfiniteQuery-yCq-tAjk.js", 1119, "db19be42f36e89553f09bc839c894c36a8814c778f9ffe9a797d53bd10448509"],
  ["assets/useMutation-CQAYjPaQ.js", 2207, "d3e231d4eab5326979d305120ebf4e24b849cb8b51bd93ccb4273fe3c7f761ab"],
  ["index.html", 472, "90620768a37b57b905a35cd576077cd4c4f1a760da28fc8c1c8a9347458383ca"],
  ["sounds/VGaccepttrade-crop.wav", 102390, "3a175017d6f15a72957fdd851a511a36ebb351d8f2e443975db98ddce7488f75"],
  ["sounds/VGauctionwin-crop.wav", 275262, "fd460adf87fada4b0e25fc4c13a54c203faa8ecd8343e2041d02a592fcaee3e5"],
  ["sounds/VGoffertrade-crop.wav", 98862, "70e0986c380d7a5070d9571facbe08f6a229f946234810232793fee20d4d8c0f"],
  ["sounds/VGplacebid-crop.wav", 160642, "10d034ed947371e8d3f29d4e4b8fde83fd41414d22bc06884496bc3a3945d2a8"],
  ["sounds/VGrejecttrade.wav", 251996, "7d96fe49bc5b62ab958a4494378c8673814365b7a676bc1ac60f0a72193f3bf0"],
  ["vite.svg", 1497, "4a748afd443918bb16591c834c401dae33e87861ab5dbad0811c3a3b4a9214fb"],
];
const originalDistInventorySha256 =
  "2d8069ca1aa61e02b5be14b09b97ded73b8363ae5e699c0e712f32026903ae6c";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fileEvidence(path) {
  const bytes = readFileSync(path);
  return { byteLength: bytes.byteLength, sha256: sha256(bytes) };
}

function inventoryDigest(entries) {
  const payload = `${entries
    .map(([path, byteLength, hash]) => `${path}|${byteLength}|${hash}`)
    .join("\n")}\n`;
  return sha256(Buffer.from(payload, "utf8"));
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

assert.equal(originalDistInventory.length, 33);
assert.equal(
  inventoryDigest(originalDistInventory),
  originalDistInventorySha256,
  "sealed baseline inventory manifest drift"
);

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
    !netlifyToml.includes('/release-qa/hl-20260822-1/*'),
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
  "/release-qa/hl-20260822-1/strict-manager-transfer",
  "https://staging.hundoleago.com/release-qa/hl-20260822-1/enabled.json",
  "https://api-staging.hundoleago.com",
  "HL-20260822-1",
  "2026-08-24T07:00:00.000Z",
  "8e313902feefcd683b0f5edd746a9dd2a9029a18",
  "4dfe12d1366314e3d9df722c50771324647743c9",
  "test:release-qa",
  "m7-release-qa-fixture",
  "60c82aa0-54f9-4c93-83f5-73b0d6d6f63e",
  "ebc815c7-8a41-4326-8faf-04548aa91c76",
  "dbc0118a-21f9-408c-abf5-b01d9ca05e64",
  "e9f723c4-32d2-4823-a1d4-233fe0ce2f45",
  "c2684bf0-d30d-4b37-ae14-66620259798e",
  "HL-20260822-1-team1-to-b-propose",
  "HL-20260822-1-team1-to-b-accept",
  "HL-20260822-1-team1-to-a-propose",
  "HL-20260822-1-team1-to-a-accept",
  "HL-20260822-1-outbox-team1-to-manager-b",
  "HL-20260822-1-outbox-team1-return-to-manager-a",
  "PUBLISH-HL-20260822-1-TEAM1-TO-MANAGER-B",
  "PUBLISH-HL-20260822-1-TEAM1-RETURN-TO-MANAGER-A",
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
      path.startsWith("release-qa/hl-20260822-1/")
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
      `release-qa/hl-20260822-1/${name}`,
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
  ["index.html", 472, "90620768a37b57b905a35cd576077cd4c4f1a760da28fc8c1c8a9347458383ca"]
);
assert.deepEqual(
  originalDistInventory.find(([path]) => path === "assets/index-BFtuYVmF.js"),
  ["assets/index-BFtuYVmF.js", 527839, "19ee27ed0fa33016e9614b5dd63095b3f1d3af1fc8f33616b4c30a3c961cd201"]
);

process.stdout.write(
  `strict manager-transfer helper verified (${retiredBaselineMode ? "retired baseline; " : ""}${runtimeNames.length} runtime files; ${originalDistInventory.length} pinned base files)\n`
);
