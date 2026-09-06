"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const root = "/opt/render/project/data/hundo-staging";
const target = root + "/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3";
const expectedHash = "cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc";
const attemptRoot = root + "/.staging-resume-backup-HL-20260906-1";
let claimed = false;
function hash(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function requireExact(value, code) {
  if (!value) { const error = new Error(code); error.safeCode = code; throw error; }
}
function writeReceipt(name, value) {
  const fd = fs.openSync(path.join(attemptRoot, name), "wx", 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value) + "\n"); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  const directory = fs.openSync(attemptRoot, "r");
  try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
}
async function run() {
  requireExact(process.platform === "linux", "LINUX_STAGING_REQUIRED");
  requireExact(process.env.RENDER_SERVICE_ID === "srv-d9eo2turnols73ekb830", "STAGING_SERVICE_REQUIRED");
  const expected = {
    APP_ENV: "staging", APP_ENVIRONMENT_ID: "test:release-qa",
    DATABASE_ID: "m7-release-qa-fixture", DATABASE_PATH: target,
    PERSISTENT_DATA_ROOT: root, STAGING_MAINTENANCE_HOLD: "true",
    LEAGUE_WRITE_MODE: "closed", SCHEDULED_JOBS_ENABLED: "false",
    FREE_AGENT_DRAFT_ROUTES_ENABLED: "false", ACCOUNT_EMAIL_DELIVERY_ENABLED: "false",
    EMAIL_DELIVERY_MODE: "capture", DEBUG_ROUTES_ENABLED: "false",
    BACKUP_SCHEDULE_ENABLED: "false", SPORTSDATAIO_NHL_LIVE_MODE: "disabled",
    APP_BUILD_ID: "6359ec9997f90dddf17ba2c9b07481746ae171bb",
    RENDER_GIT_COMMIT: "6359ec9997f90dddf17ba2c9b07481746ae171bb",
  };
  for (const [key, value] of Object.entries(expected)) {
    requireExact(process.env[key] === value, "HELD_STAGING_BINDING_REQUIRED");
  }
  requireExact(fs.realpathSync(root) === root && fs.realpathSync(target) === target,
    "STAGING_PATH_REDIRECTED");
  requireExact(fs.statSync(target).size === 37105664 && hash(target) === expectedHash,
    "RECOVERED_TARGET_CHANGED");
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    requireExact(!fs.existsSync(target + suffix), "UNEXPECTED_TARGET_SIDECAR");
  }
  const { loadTargetRuntimeConfig } = require("./src/config/loadTargetRuntimeConfig");
  const { loadBackupConfig } = require("./src/config/loadBackupConfig");
  loadBackupConfig({ env: process.env, runtimeConfig: loadTargetRuntimeConfig({ env: process.env }) });
  requireExact(!fs.existsSync(attemptRoot), "BACKUP_ATTEMPT_ALREADY_EXISTS");
  fs.mkdirSync(attemptRoot, { mode: 0o700 });
  claimed = true;
  writeReceipt("attempt.json", {
    code: "HL26_BACKUP_ATTEMPT", at: new Date().toISOString(),
    target, expectedHash, requestedById: "HL-20260906-1-staging-reopen",
    semanticVerificationAt: "2026-09-06T11:53:47.521Z",
    retryWithoutReconciliation: false,
  });
  const { runDeployedBackup } = require("./scripts/db-backup");
  const created = await runDeployedBackup({ argv: [
    "--reason", "incident-preservation", "--requested-by-type", "platform_operation",
    "--requested-by-id", "HL-20260906-1-staging-reopen",
    "--retention-class", "incident-preservation",
  ] });
  assert.equal(created.status, "verified");
  writeReceipt("created.json", created);
  const { runBackupVerification } = require("./scripts/db-backup-verify");
  const verified = await runBackupVerification({ argv: ["--manifest-object-key", created.manifestObjectKey] });
  requireExact(verified.backupId === created.backupId &&
    verified.plaintextSha256 === expectedHash &&
    verified.inspection.integrity === "ok" &&
    verified.inspection.foreignKeyViolationCount === 0, "RESTORE_VERIFICATION_FAILED");
  requireExact(hash(target) === expectedHash, "TARGET_CHANGED_DURING_BACKUP");
  const result = {
    code: "HL26_BACKUP_VERIFIED", at: new Date().toISOString(),
    backupId: created.backupId, manifestObjectKey: created.manifestObjectKey,
    manifestChecksum: created.manifestChecksum,
    encryptedArtifactSha256: created.encryptedArtifactSha256,
    plaintextSha256: verified.plaintextSha256,
    integrity: verified.inspection.integrity,
    foreignKeyViolationCount: verified.inspection.foreignKeyViolationCount,
    targetUnchanged: true, productionTouched: false,
  };
  writeReceipt("verified.json", result);
  return result;
}
module.exports = { run };
if (process.argv.includes("--backup-once")) {
  run().then(result => process.stdout.write(JSON.stringify(result) + "\n")).catch(error => {
    const failure = {
      code: "HL26_BACKUP_REJECTED", at: new Date().toISOString(), attemptClaimed: claimed,
      reason: /^[A-Z0-9_]+$/.test(error?.safeCode || error?.code || "") ?
        (error.safeCode || error.code) : "UNEXPECTED_FAILURE",
      retryWithoutReconciliation: false, productionTouched: false,
    };
    if (claimed) {
      try { writeReceipt("failure.json", failure); } catch { failure.failureReceiptSaved = false; }
    }
    process.stdout.write(JSON.stringify(failure) + "\n");
    process.exitCode = 1;
  });
}
