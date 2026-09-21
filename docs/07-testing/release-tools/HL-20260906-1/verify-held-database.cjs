// Private-copy staging verification under M7_STAGING_RESUME_2026-09-06.md.
// Preserves reviewed P23 data checks; no backup, restore, provider change or old binding action.
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const RELEASE_ID = "HL-20260823-1";
const CHECKLIST_ID = "RC-STG-006P23";
const BACKEND_COMMIT = "6359ec9997f90dddf17ba2c9b07481746ae171bb";
const FRONTEND_BUILD_ID = "4dfe12d1366314e3d9df722c50771324647743c9";
const SERVICE_ID = "srv-d9eo2turnols73ekb830";
const PERSISTENT_ROOT = "/opt/render/project/data/hundo-staging";
const SOURCE = `${PERSISTENT_ROOT}/sqlite/` +
  "hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3";
const TARGET = `${PERSISTENT_ROOT}/sqlite/` +
  "hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3";
const RECEIPT = `${TARGET}.activation-receipt.json`;
const WORK_DIRECTORY = path.join(
  path.dirname(TARGET),
  `.${path.basename(TARGET)}.strict-restore-work-v1`
);
const TARGET_SHA256 =
  "cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc";
const RECEIPT_SHA256 =
  "24adf2d36c1adae8674552d44fc99fb43fd875dd58be85008f0c00b35450e8c8";
const SOURCE_INSPECTION_SHA256 =
  "d41571620c9f2bf93968e83da0b7847770fb75ea1260765017edcabe45c2ccca";
const TARGET_INSPECTION_SHA256 =
  "362a799abf311110b5e651827e713a07e006ce8966792d3c49a8adef89673b3d";
const MIGRATION_CHECKSUM_SET_ID =
  "6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89";
const ROTATION_RECEIPT_ID = "9152f844-d8cd-42f7-b0d5-b12f530ad618";
const FIXTURE_LEAGUE_ID = "60c82aa0-54f9-4c93-83f5-73b0d6d6f63e";
const CURRENT_FIXTURE_RECEIPT_ID =
  "2c1230c3-ee2c-4c1b-8218-5e3fe2172873";
const PREDECESSOR_FIXTURE_RECEIPT_ID =
  "88a56507-73fd-47f9-ac66-c305f0075d24";
const OLDER_FIXTURE_RECEIPT_ID =
  "0ed590d8-832a-469a-848e-f91b0b37fe56";
const STRICT_FIXTURE_EVENT_TYPE = "release_qa.fad_privacy_gate_prepared";
const HEX40 = /^[a-f0-9]{40}$/u;
const HEX64 = /^[a-f0-9]{64}$/u;
const DEPLOY_ID = /^dep-[a-z0-9]{20}$/u;

const EXPECTED_RUNTIME = Object.freeze({
  STAGING_MAINTENANCE_HOLD: "true",
  APP_ENV: "staging",
  NODE_ENV: "production",
  APP_ENVIRONMENT_ID: "test:release-qa",
  DATABASE_ID: "m7-release-qa-fixture",
  DATABASE_PATH: TARGET,
  PERSISTENT_DATA_ROOT: PERSISTENT_ROOT,
  FRONTEND_BUILD_ID,
  APP_BUILD_ID: BACKEND_COMMIT,
  RENDER_GIT_COMMIT: BACKEND_COMMIT,
  CURRENT_SEASON_LABEL: "2026",
  CURRENT_NHL_SEASON_KEY: "20262027",
  LEAGUE_WRITE_MODE: "closed",
  SCHEDULED_JOBS_ENABLED: "false",
  FREE_AGENT_DRAFT_ROUTES_ENABLED: "false",
  ACCOUNT_EMAIL_DELIVERY_ENABLED: "false",
  EMAIL_DELIVERY_MODE: "capture",
  DEBUG_ROUTES_ENABLED: "false",
  BACKUP_SCHEDULE_ENABLED: "false",
  SPORTSDATAIO_NHL_LIVE_MODE: "disabled",
});
const ABSENT_PROVIDER_FIELDS = Object.freeze([
  "SPORTSDATAIO_NHL_API_KEY",
  "SPORTSDATAIO_NHL_API_ORIGIN",
  "SPORTSDATAIO_NHL_LAST_SEASON_START_YEAR",
  "SPORTSDATAIO_NHL_LIVE_API_KEY",
  "SPORTSDATAIO_NHL_LIVE_API_ORIGIN",
  "SPORTSDATAIO_NHL_LIVE_CAPABILITY_SECRET",
  "SPORTSDATAIO_NHL_LIVE_CAPABILITY_KEY_VERSION",
  "SPORTSDATAIO_NHL_LIVE_CAPABILITY_ARTIFACT",
  "SPORTSDATAIO_NHL_LIVE_PROBE_MANIFEST",
]);
const EXPECTED_FILES = Object.freeze({
  sourceMain: Object.freeze({
    path: SOURCE,
    ino: "131156", uid: "1000", mode: "0600", nlink: "1",
    size: "37744640", mtimeNs: "1787554966495529258",
    ctimeNs: "1787554966495529258",
    sha256:
      "b4163695d6f9db9e1f2db2b3aee536126e42b83f540fb0ee919b962fbd92b103",
  }),
  sourceWal: Object.freeze({
    path: `${SOURCE}-wal`,
    ino: "131151", uid: "1000", mode: "0600", nlink: "1",
    size: "568592", mtimeNs: "1787612907793135680",
    ctimeNs: "1787612907793135680",
    sha256:
      "0dde02d102f502b73e175f9c11741f13689c316cca4fbcb6c8146dc820884c1d",
  }),
  sourceShm: Object.freeze({
    path: `${SOURCE}-shm`,
    ino: "131152", uid: "1000", mode: "0600", nlink: "1",
    size: "32768", mtimeNs: "1787612907789135562",
    ctimeNs: "1787612907789135562",
    sha256:
      "e03d9ff8a727d8e05e6231393df9f83f146d6a0b1b369050798c9acc481be17e",
  }),
  targetMain: Object.freeze({
    path: TARGET,
    ino: "131160", uid: "1000", mode: "0600", nlink: "1",
    size: "37105664", mtimeNs: "1787637279580772662",
    ctimeNs: "1787637281401829191", sha256: TARGET_SHA256,
  }),
  receipt: Object.freeze({
    path: RECEIPT,
    ino: "131161", uid: "1000", mode: "0600", nlink: "1",
    size: "4991", mtimeNs: "1787637281211823293",
    ctimeNs: "1787637281214823386", sha256: RECEIPT_SHA256,
  }),
});
const ABSENCE_PATHS = Object.freeze([
  `${SOURCE}-journal`,
  `${TARGET}-wal`,
  `${TARGET}-shm`,
  `${TARGET}-journal`,
  WORK_DIRECTORY,
]);
const PINNED_BACKEND_FILES = Object.freeze([
  Object.freeze({ path: "src/infrastructure/database/connection.js", bytes: "8371", sha256: "c80e871485778f9f88a04e58e313c7a6a132fc50aa513658c4bf81fbcd56a031", blob: "1d906dfdb9c77b8fb3d628f78a04d296dc04396d" }),
  Object.freeze({ path: "src/infrastructure/database/sqliteBackup.js", bytes: "12271", sha256: "6c8ea9c3a88a5c9b9da74a7e3c2e262e9f5d83380573f327cfc18718957014e9", blob: "d7c0a847f60323920e49c6b9b2c629d31e1c53b2" }),
  Object.freeze({ path: "src/config/loadBackupConfig.js", bytes: "4901", sha256: "5d20fa3b1b1e725f8c6028fe83142d22a81e28519071a8ec6c78b05cf083692e", blob: "3144abd3f107f538bce676c945229e86b2321771" }),
  Object.freeze({ path: "src/config/loadTargetRuntimeConfig.js", bytes: "12859", sha256: "cadee257dd254139c6e1ebd4d3983bcbdd26d0d3a7bbac04732ca7703a8c37b0", blob: "40a816c061ffa3a9359846b6b373becaabbfb76a" }),
  Object.freeze({ path: "src/infrastructure/backups/createS3CompatibleClient.js", bytes: "5158", sha256: "25c54b8f733023f5fb27a18e69d482e8b236f45a7fd571beb39c568e9ec63661", blob: "941e0c77c85171b57cdb45473d9f0ceb66802b87" }),
  Object.freeze({ path: "src/infrastructure/backups/createObjectStorageAdapter.js", bytes: "1776", sha256: "069806f943b2921466746e902fdf457e6925b8fb53131eeaf3b5429a730cb729", blob: "4a06d3c46ffbc006ec69e39a5f9505863cb56711" }),
  Object.freeze({ path: "src/infrastructure/backups/backupArtifactCrypto.js", bytes: "2160", sha256: "fe5e3835325cb7b2a1f3dc206a692bb3057bd5f8acd4a8712d9580c6baa1c0dd", blob: "bac70f94219f566a81ea0f6ff6253bea0e9930f4" }),
  Object.freeze({ path: "src/operations/backups/createEncryptedOffsiteBackup.js", bytes: "10985", sha256: "1ecaf95b816059d77ffa960ed238f43f97c7f70bd8184ea48a19addf9bc82e02", blob: "a3522fe4434addabd62ef9bae6ef46e8656072f2" }),
  Object.freeze({ path: "src/infrastructure/migration/sourceInventory.js", bytes: "27098", sha256: "e9a263c4489e386266b3be81545ea10aa684075c43cf26fa8b601f99669dcb51", blob: "a8ad8db23eb03ef0c78d03d1dcb5cbe0c589d5ad" }),
  Object.freeze({ path: "src/operations/release/materializeReleaseQaStrictRestore.js", bytes: "99039", sha256: "d49c870bdf300983a0b57577ce68e0647ba6ff318ccf55fe11a5596016671889", blob: "4a198c71554b7e7c5fc8ee481cd79b51c1ef799f" }),
  Object.freeze({ path: "src/operations/release/prepareReleaseQaFadPrivacyGate.js", bytes: "52720", sha256: "d775c78c9eec19e716081052835575aca62a7e8a6669a9736aad13a3e1f40d74", blob: "ccc4f0b11b025a9ef276ff65f7e1053421de67ee" }),
]);

let scratchRoot = null;
let database = null;
let baseline = null;
const boundaries = [];

function reject(code) {
  const error = new Error(code);
  error.safeCode = code;
  throw error;
}

function requireExact(condition, code) {
  if (!condition) reject(code);
}

function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function sha256File(filePath) {
  return sha256Bytes(fs.readFileSync(filePath));
}

function gitBlobId(filePath) {
  const bytes = fs.readFileSync(filePath);
  return crypto.createHash("sha1")
    .update(Buffer.from(`blob ${bytes.length}\0`, "utf8"))
    .update(bytes)
    .digest("hex");
}

function canonicalObject(value) {
  if (Array.isArray(value)) return value.map(canonicalObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(
      (key) => [key, canonicalObject(value[key])]
    ));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalObject(value));
}

function metadata(filePath) {
  const before = fs.lstatSync(filePath, { bigint: true });
  requireExact(before.isFile() && !before.isSymbolicLink(), "FILE_NOT_REGULAR");
  const realpath = fs.realpathSync.native(filePath);
  const digest = sha256File(filePath);
  const after = fs.lstatSync(filePath, { bigint: true });
  requireExact(
    after.isFile() && !after.isSymbolicLink() &&
      before.dev === after.dev && before.ino === after.ino &&
      before.uid === after.uid && before.mode === after.mode &&
      before.nlink === after.nlink && before.size === after.size &&
      before.mtimeNs === after.mtimeNs && before.ctimeNs === after.ctimeNs &&
      fs.realpathSync.native(filePath) === realpath,
    "FILE_CHANGED_DURING_HASH"
  );
  return Object.freeze({
    path: filePath,
    realpath,
    dev: String(after.dev),
    ino: String(after.ino),
    uid: String(after.uid),
    mode: Number(after.mode & 0o7777n).toString(8).padStart(4, "0"),
    nlink: String(after.nlink),
    size: String(after.size),
    mtimeNs: String(after.mtimeNs),
    ctimeNs: String(after.ctimeNs),
    sha256: digest,
  });
}

function snapshotProtected() {
  return Object.freeze(Object.fromEntries(Object.entries(EXPECTED_FILES).map(
    ([name, expected]) => [name, metadata(expected.path)]
  )));
}

function compareExpected(actual, expected) {
  requireExact(actual.path === expected.path && actual.realpath === expected.path,
    "PROTECTED_PATH_INVALID");
  for (const field of [
    "ino", "uid", "mode", "nlink", "size", "mtimeNs", "ctimeNs", "sha256",
  ]) {
    requireExact(actual[field] === expected[field], "PROTECTED_FILE_PIN_MISMATCH");
  }
}

function requireAbsences() {
  for (const filePath of ABSENCE_PATHS) {
    requireExact(!fs.existsSync(filePath), "PROTECTED_ABSENCE_VIOLATION");
  }
}

function sameSnapshot(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function captureBoundary(name) {
  requireAbsences();
  const snapshot = snapshotProtected();
  for (const [key, expected] of Object.entries(EXPECTED_FILES)) {
    compareExpected(snapshot[key], expected);
  }
  if (baseline !== null) {
    requireExact(sameSnapshot(snapshot, baseline), "PROTECTED_FILE_DRIFT");
  }
  requireAbsences();
  boundaries.push(Object.freeze({ name, snapshotSha256: sha256Bytes(
    Buffer.from(canonicalJson(snapshot), "utf8")
  ) }));
  return snapshot;
}

function fdProof(snapshot) {
  requireExact(process.platform === "linux" && fs.existsSync("/proc"),
    "FD_PROOF_UNAVAILABLE");
  const protectedIds = new Set([
    snapshot.sourceMain,
    snapshot.sourceWal,
    snapshot.sourceShm,
    snapshot.targetMain,
  ].map((entry) => `${entry.dev}:${entry.ino}`));
  let scannedPidCount = 0;
  let scannedDescriptorCount = 0;
  let deniedProcessCount = 0;
  let deniedDescriptorCount = 0;
  let holderCount = 0;
  for (const pid of fs.readdirSync("/proc").filter((name) => /^\d+$/u.test(name))) {
    let descriptors;
    try {
      descriptors = fs.readdirSync(`/proc/${pid}/fd`);
      scannedPidCount += 1;
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      deniedProcessCount += 1;
      continue;
    }
    for (const descriptor of descriptors) {
      try {
        const state = fs.statSync(`/proc/${pid}/fd/${descriptor}`, { bigint: true });
        scannedDescriptorCount += 1;
        if (protectedIds.has(`${state.dev}:${state.ino}`)) holderCount += 1;
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        deniedDescriptorCount += 1;
      }
    }
  }
  const proof = Object.freeze({
    scannedPidCount,
    scannedDescriptorCount,
    deniedProcessCount,
    deniedDescriptorCount,
    holderCount,
    complete: deniedProcessCount === 0 && deniedDescriptorCount === 0,
  });
  requireExact(proof.complete && proof.holderCount === 0,
    "PROTECTED_FILE_HOLDER_PROOF_FAILED");
  return proof;
}

function verifyBackendAndRuntime() {
  requireExact(process.versions.node === "24.14.1", "NODE_VERSION_INVALID");
  requireExact(process.getuid() === 1000 && process.geteuid() === 1000,
    "UID_CONTEXT_INVALID");
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  const status = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
    encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
  });
  requireExact(head === BACKEND_COMMIT && status === "", "BACKEND_GIT_INVALID");
  requireExact(Object.keys(EXPECTED_RUNTIME).length === 20,
    "CRITICAL_BINDING_COUNT_INVALID");
  for (const [key, expected] of Object.entries(EXPECTED_RUNTIME)) {
    requireExact(process.env[key] === expected, "CRITICAL_RUNTIME_BINDING_INVALID");
  }
  requireExact(ABSENT_PROVIDER_FIELDS.length === 9 &&
    ABSENT_PROVIDER_FIELDS.every((key) => process.env[key] === undefined),
  "FORBIDDEN_PROVIDER_FIELD_PRESENT");
  for (const pin of PINNED_BACKEND_FILES) {
    const absolute = path.resolve(pin.path);
    const state = fs.lstatSync(absolute, { bigint: true });
    requireExact(
      state.isFile() && !state.isSymbolicLink() &&
        fs.realpathSync.native(absolute) === absolute &&
        String(state.size) === pin.bytes && sha256File(absolute) === pin.sha256 &&
        gitBlobId(absolute) === pin.blob,
      "BACKEND_FILE_PIN_INVALID"
    );
  }
  return head;
}

function createScratch() {
  const temporaryParent = fs.realpathSync.native("/tmp");
  scratchRoot = fs.mkdtempSync(path.join(temporaryParent, "hl23-p23-semantic-"));
  fs.chmodSync(scratchRoot, 0o700);
  for (const name of ["source", "target"]) {
    const directory = path.join(scratchRoot, name);
    fs.mkdirSync(directory, { mode: 0o700 });
    fs.chmodSync(directory, 0o700);
  }
  return scratchRoot;
}

function copyExclusive(sourcePath, destinationPath, expectedSha256) {
  fs.copyFileSync(sourcePath, destinationPath, fs.constants.COPYFILE_EXCL);
  fs.chmodSync(destinationPath, 0o600);
  const state = fs.lstatSync(destinationPath, { bigint: true });
  requireExact(
    state.isFile() && !state.isSymbolicLink() && state.nlink === 1n &&
      Number(state.mode & 0o7777n) === 0o600 &&
      fs.realpathSync.native(destinationPath) === destinationPath &&
      sha256File(destinationPath) === expectedSha256,
    "PRIVATE_COPY_INVALID"
  );
}

function cleanupScratch() {
  if (scratchRoot === null) return;
  const resolved = path.resolve(scratchRoot);
  const state = fs.lstatSync(resolved, { bigint: true });
  requireExact(
    state.isDirectory() && !state.isSymbolicLink() &&
      path.dirname(resolved) === fs.realpathSync.native("/tmp") &&
      /^hl23-p23-semantic-[A-Za-z0-9]+$/u.test(path.basename(resolved)) &&
      Number(state.mode & 0o7777n) === 0o700,
    "PRIVATE_SCRATCH_CLEANUP_TARGET_INVALID"
  );
  const allow = new Set([
    "source", "target",
    "source/source.sqlite3", "source/source.sqlite3-wal",
    "source/source.sqlite3-shm", "source/source.sqlite3-journal",
    "target/target.sqlite3", "target/target.sqlite3-wal",
    "target/target.sqlite3-shm", "target/target.sqlite3-journal",
  ]);
  const walk = (directory, prefix = "") => {
    for (const name of fs.readdirSync(directory)) {
      const relative = prefix ? `${prefix}/${name}` : name;
      requireExact(allow.has(relative), "PRIVATE_SCRATCH_UNEXPECTED_ENTRY");
      const absolute = path.join(directory, name);
      const item = fs.lstatSync(absolute, { bigint: true });
      requireExact(!item.isSymbolicLink(), "PRIVATE_SCRATCH_SYMLINK_REJECTED");
      if (item.isDirectory()) walk(absolute, relative);
      else requireExact(item.isFile() && item.nlink === 1n,
        "PRIVATE_SCRATCH_ENTRY_INVALID");
    }
  };
  walk(resolved);
  fs.rmSync(resolved, { recursive: true, force: false });
  requireExact(!fs.existsSync(resolved), "PRIVATE_SCRATCH_CLEANUP_FAILED");
  scratchRoot = null;
}

function count(databaseHandle, sql, ...parameters) {
  return databaseHandle.prepare(sql).get(...parameters).count;
}

function inspectPrivateCopies(sourceScratch, targetScratch, bindings) {
  const { openReadonlyDatabase } =
    require("./src/infrastructure/database/connection");
  const { inspectDatabase } =
    require("./src/infrastructure/database/sqliteBackup");
  const { migrationChecksumSetId } =
    require("./src/operations/backups/createEncryptedOffsiteBackup");
  const { canonicalize } =
    require("./src/infrastructure/migration/sourceInventory");
  const {
    DEFAULT_CONTRACT,
    EXPECTED_ROTATION_RECEIPT_ID,
    verifyAbortStrictSmokeEvidence,
  } = require("./src/operations/release/materializeReleaseQaStrictRestore");

  requireExact(
    sourceScratch !== SOURCE && targetScratch !== TARGET &&
      path.dirname(path.dirname(sourceScratch)) === scratchRoot &&
      path.dirname(path.dirname(targetScratch)) === scratchRoot,
    "AUTHORITATIVE_SQLITE_OPEN_REJECTED"
  );
  requireExact(EXPECTED_ROTATION_RECEIPT_ID === ROTATION_RECEIPT_ID,
    "ROTATION_RECEIPT_CONSTANT_INVALID");

  const sourceInspection = inspectDatabase(sourceScratch);
  const sourceInspectionSha256 = sha256Bytes(
    Buffer.from(canonicalize(sourceInspection), "utf8")
  );
  database = openReadonlyDatabase({ databasePath: sourceScratch });
  database.pragma("query_only = ON");
  const sourceChangesBefore = database.prepare(
    "SELECT total_changes() AS count"
  ).get().count;
  const sourceDataModelVersion = Number(database.prepare(
    "SELECT metadata_value AS value FROM application_metadata " +
      "WHERE metadata_key = 'data_model_version'"
  ).get()?.value);
  const sourceSmoke = verifyAbortStrictSmokeEvidence(database, DEFAULT_CONTRACT);
  const sourceChangesAfter = database.prepare(
    "SELECT total_changes() AS count"
  ).get().count;
  database.close();
  database = null;
  const sourceResult = Object.freeze({
    inspectionSha256: sourceInspectionSha256,
    integrity: sourceInspection.integrity,
    foreignKeyViolationCount: sourceInspection.foreignKeyViolationCount,
    schemaVersion: sourceInspection.userVersion,
    dataModelVersion: sourceDataModelVersion,
    migrationCount: sourceInspection.migrations.length,
    migrationChecksumSetId: migrationChecksumSetId(sourceInspection.migrations),
    environmentId: sourceInspection.databaseIdentity.environmentId,
    databaseId: sourceInspection.databaseIdentity.databaseId,
    abortClassification: sourceSmoke.classification,
    phaseOnePublicationState: sourceSmoke.phaseOnePublicationState,
    returnPublicationState: sourceSmoke.returnPublicationState,
    sourceSemanticChainCompleted: sourceSmoke.sourceSemanticChainCompleted,
    smokeCompleted: sourceSmoke.smokeCompleted,
    hostedSmokeCompleted: sourceSmoke.hostedSmokeCompleted,
    releaseBlocked: sourceSmoke.releaseBlocked,
    rollbackOnly: sourceSmoke.rollbackOnly,
    fixtureReceiptId: sourceSmoke.fixtureReceiptId,
    fixtureLeagueId: sourceSmoke.fixtureLeagueId,
    scratchChanges: sourceChangesAfter - sourceChangesBefore,
  });
  requireExact(
    sourceResult.inspectionSha256 === SOURCE_INSPECTION_SHA256 &&
      sourceResult.integrity === "ok" &&
      sourceResult.foreignKeyViolationCount === 0 &&
      sourceResult.schemaVersion === 54 && sourceResult.dataModelVersion === 54 &&
      sourceResult.migrationCount === 54 &&
      sourceResult.migrationChecksumSetId === MIGRATION_CHECKSUM_SET_ID &&
      sourceResult.environmentId === "test:release-qa" &&
      sourceResult.databaseId === "m7-release-qa-fixture" &&
      sourceResult.abortClassification === "to_b_accepted" &&
      sourceResult.phaseOnePublicationState === "published" &&
      sourceResult.returnPublicationState === "none" &&
      sourceResult.sourceSemanticChainCompleted === false &&
      sourceResult.smokeCompleted === false &&
      sourceResult.hostedSmokeCompleted === false &&
      sourceResult.releaseBlocked === true && sourceResult.rollbackOnly === true &&
      sourceResult.fixtureReceiptId === CURRENT_FIXTURE_RECEIPT_ID &&
      sourceResult.fixtureLeagueId === FIXTURE_LEAGUE_ID &&
      sourceResult.scratchChanges === 0,
    "SOURCE_PRIVATE_SEMANTICS_INVALID"
  );

  const targetInspection = inspectDatabase(targetScratch);
  const targetInspectionSha256 = sha256Bytes(
    Buffer.from(canonicalize(targetInspection), "utf8")
  );
  database = openReadonlyDatabase({ databasePath: targetScratch });
  database.pragma("query_only = ON");
  const targetChangesBefore = database.prepare(
    "SELECT total_changes() AS count"
  ).get().count;
  const targetDataModelVersion = Number(database.prepare(
    "SELECT metadata_value AS value FROM application_metadata " +
      "WHERE metadata_key = 'data_model_version'"
  ).get()?.value);
  const activeSessionCount = count(
    database,
    "SELECT COUNT(*) AS count FROM sessions WHERE status = 'active'"
  );
  const rotation = database.prepare(
    "SELECT event_type,outcome,request_correlation_id,reason_code " +
      "FROM security_audit_events WHERE id = ?"
  ).get(ROTATION_RECEIPT_ID);
  const artifactCounts = Object.freeze({
    currentFixtureReceipts: count(database,
      "SELECT COUNT(*) AS count FROM security_audit_events WHERE id = ?",
      CURRENT_FIXTURE_RECEIPT_ID),
    predecessorFixtureReceipts: count(database,
      "SELECT COUNT(*) AS count FROM security_audit_events WHERE id = ?",
      PREDECESSOR_FIXTURE_RECEIPT_ID),
    olderFixtureReceipts: count(database,
      "SELECT COUNT(*) AS count FROM security_audit_events WHERE id = ?",
      OLDER_FIXTURE_RECEIPT_ID),
    fixtureReceiptEventsForLeague: count(database,
      "SELECT COUNT(*) AS count FROM security_audit_events " +
        "WHERE league_id = ? AND event_type = ?",
      FIXTURE_LEAGUE_ID, STRICT_FIXTURE_EVENT_TYPE),
    fixtureLeagues: count(database,
      "SELECT COUNT(*) AS count FROM leagues WHERE id = ?", FIXTURE_LEAGUE_ID),
    managerAssignments: count(database,
      "SELECT COUNT(*) AS count FROM team_manager_assignments WHERE league_id = ?",
      FIXTURE_LEAGUE_ID),
    managerActivities: count(database,
      "SELECT COUNT(*) AS count FROM league_activity WHERE league_id = ? " +
        "AND event_type IN ('team_manager_assignment_proposed'," +
        "'team_manager_assignment_accepted')", FIXTURE_LEAGUE_ID),
    managerIdempotency: count(database,
      "SELECT COUNT(*) AS count FROM idempotency_requests WHERE league_id = ? " +
        "AND operation IN ('league.team_manager_assignment.propose.v1'," +
        "'league.team_manager_assignment.accept.v1')", FIXTURE_LEAGUE_ID),
    managerNotifications: count(database,
      "SELECT COUNT(*) AS count FROM notifications WHERE league_id = ? " +
        "AND related_feature = 'team_manager_assignment'", FIXTURE_LEAGUE_ID),
    managerOutboxEvents: count(database,
      "SELECT COUNT(*) AS count FROM outbox_events WHERE league_id = ? " +
        "AND aggregate_type = 'team_manager_assignment'", FIXTURE_LEAGUE_ID),
    managerOutboxAudiences: count(database,
      "SELECT COUNT(*) AS count FROM outbox_event_audiences WHERE league_id = ?",
      FIXTURE_LEAGUE_ID),
  });
  const targetChangesAfter = database.prepare(
    "SELECT total_changes() AS count"
  ).get().count;
  database.close();
  database = null;
  const targetResult = Object.freeze({
    inspectionSha256: targetInspectionSha256,
    integrity: targetInspection.integrity,
    foreignKeyViolationCount: targetInspection.foreignKeyViolationCount,
    schemaVersion: targetInspection.userVersion,
    dataModelVersion: targetDataModelVersion,
    migrationCount: targetInspection.migrations.length,
    migrationChecksumSetId: migrationChecksumSetId(targetInspection.migrations),
    environmentId: targetInspection.databaseIdentity.environmentId,
    databaseId: targetInspection.databaseIdentity.databaseId,
    credentialRotationReceiptVerified:
      rotation?.event_type === "release_qa.credentials_rotated" &&
      rotation?.outcome === "success" &&
      rotation?.request_correlation_id === "HL-20260821-2" &&
      rotation?.reason_code === "operator_shared_password_recovery_r9_s0",
    activeSessionCount,
    forbiddenArtifactCounts: artifactCounts,
    allForbiddenArtifactCountsZero:
      Object.values(artifactCounts).every((value) => value === 0),
    scratchChanges: targetChangesAfter - targetChangesBefore,
  });
  requireExact(
    targetResult.inspectionSha256 === TARGET_INSPECTION_SHA256 &&
      targetResult.integrity === "ok" &&
      targetResult.foreignKeyViolationCount === 0 &&
      targetResult.schemaVersion === 54 && targetResult.dataModelVersion === 54 &&
      targetResult.migrationCount === 54 &&
      targetResult.migrationChecksumSetId === MIGRATION_CHECKSUM_SET_ID &&
      targetResult.environmentId === "test:release-qa" &&
      targetResult.databaseId === "m7-release-qa-fixture" &&
      targetResult.credentialRotationReceiptVerified === true &&
      targetResult.activeSessionCount === 0 &&
      targetResult.allForbiddenArtifactCountsZero === true &&
      targetResult.scratchChanges === 0,
    "TARGET_PRIVATE_SEMANTICS_INVALID"
  );
  requireExact(
    sha256File(sourceScratch) === bindings.sourceMainSha256 &&
      sha256File(`${sourceScratch}-wal`) === bindings.sourceWalSha256 &&
      sha256File(targetScratch) === TARGET_SHA256,
    "PRIVATE_DURABLE_COPY_MUTATED"
  );
  return Object.freeze({
    source: sourceResult,
    target: targetResult,
    scratchSqliteTotalChanges:
      sourceResult.scratchChanges + targetResult.scratchChanges,
  });
}


function verifyHeld() {
  requireExact(process.platform === "linux", "LINUX_STAGING_RUNTIME_REQUIRED");
  requireExact(process.env.RENDER_SERVICE_ID === SERVICE_ID, "STAGING_SERVICE_REQUIRED");
  verifyBackendAndRuntime();
  baseline = captureBoundary("before-private-copy");
  const fdBefore = fdProof(baseline);
  let semantics;
  let failure = null;
  try {
    createScratch();
    const sourceScratch = path.join(scratchRoot, "source", "source.sqlite3");
    const targetScratch = path.join(scratchRoot, "target", "target.sqlite3");
    copyExclusive(SOURCE, sourceScratch, EXPECTED_FILES.sourceMain.sha256);
    copyExclusive(SOURCE + "-wal", sourceScratch + "-wal", EXPECTED_FILES.sourceWal.sha256);
    copyExclusive(TARGET, targetScratch, TARGET_SHA256);
    captureBoundary("after-private-copy");
    semantics = inspectPrivateCopies(sourceScratch, targetScratch, {
      sourceMainSha256: EXPECTED_FILES.sourceMain.sha256,
      sourceWalSha256: EXPECTED_FILES.sourceWal.sha256,
    });
    captureBoundary("after-private-semantics");
  } catch (error) {
    failure = error;
  } finally {
    if (database?.open) database.close();
    database = null;
    cleanupScratch();
  }
  const after = captureBoundary("after-private-cleanup");
  const fdAfter = fdProof(after);
  if (failure) throw failure;
  return Object.freeze({
    code: "HL26_HELD_SEMANTICS_VERIFIED", at: new Date().toISOString(),
    backendCommit: BACKEND_COMMIT, stagingServiceId: SERVICE_ID,
    targetPath: TARGET, targetSha256: TARGET_SHA256, receiptSha256: RECEIPT_SHA256,
    authoritativeFilesUnchanged: true, authoritativeSqliteOpened: false,
    privateScratchRemoved: scratchRoot === null, backupAttempted: false,
    providerMutationCount: 0, productionTouched: false,
    semantics, fdBefore, fdAfter, boundaries,
  });
}
module.exports = Object.freeze({
  verifyHeld, verifyBackendAndRuntime, canonicalJson, compareExpected,
  EXPECTED_FILES, EXPECTED_RUNTIME, PINNED_BACKEND_FILES,
});
if (process.argv.includes("--verify-held")) {
  try {
    process.stdout.write(canonicalJson(verifyHeld()) + "\n");
  } catch (error) {
    process.stdout.write(canonicalJson({
      code: "HL26_HELD_SEMANTICS_REJECTED",
      reason: /^[A-Z0-9_]+$/.test(error?.safeCode || "") ? error.safeCode : "UNEXPECTED_FAILURE",
      sourceErrorCode: /^[A-Z0-9_]+$/.test(error?.code || "") ? error.code : null,
      backupAttempted: false, providerMutationCount: 0, productionTouched: false,
    }) + "\n");
    process.exitCode = 1;
  }
}
