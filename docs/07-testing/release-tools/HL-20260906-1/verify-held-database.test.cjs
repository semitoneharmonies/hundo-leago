const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { test } = require("node:test");
const verifier = require("./verify-held-database.cjs");
const backend = path.resolve(__dirname, "../../../../../hundo-leago-backend");
const commit = "6359ec9997f90dddf17ba2c9b07481746ae171bb";

test("every hosted source fingerprint matches the approved Git object bytes", () => {
  assert.equal(verifier.PINNED_BACKEND_FILES.length, 11);
  for (const pin of verifier.PINNED_BACKEND_FILES) {
    const bytes = execFileSync("git", ["-C", backend, "show", commit + ":" + pin.path]);
    assert.equal(String(bytes.length), pin.bytes, pin.path + " bytes");
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),
      pin.sha256, pin.path + " SHA-256");
    assert.equal(crypto.createHash("sha1")
      .update(Buffer.from("blob " + bytes.length + "\0")).update(bytes).digest("hex"),
      pin.blob, pin.path + " Git blob");
  }
});

test("protected durable-file changes and redirected paths are rejected", () => {
  assert.equal(Object.keys(verifier.EXPECTED_FILES).length, 5);
  for (const pin of Object.values(verifier.EXPECTED_FILES)) {
    const valid = { ...pin, realpath: pin.path };
    verifier.compareExpected(valid, pin);
    for (const field of ["ino", "uid", "mode", "nlink", "size", "mtimeNs", "ctimeNs", "sha256"]) {
      assert.throws(() => verifier.compareExpected({ ...valid, [field]: "changed" }, pin),
        error => error.safeCode === "PROTECTED_FILE_PIN_MISMATCH");
    }
    assert.throws(() => verifier.compareExpected({ ...valid, realpath: "/other/database" }, pin),
      error => error.safeCode === "PROTECTED_PATH_INVALID");
  }
});

test("the held runtime requires the staging database and all hold controls", () => {
  assert.equal(Object.keys(verifier.EXPECTED_RUNTIME).length, 20);
  assert.equal(verifier.EXPECTED_RUNTIME.APP_ENV, "staging");
  assert.match(verifier.EXPECTED_RUNTIME.DATABASE_PATH, /\/hundo-staging\/sqlite\//);
  assert.equal(verifier.EXPECTED_RUNTIME.STAGING_MAINTENANCE_HOLD, "true");
  assert.equal(verifier.EXPECTED_RUNTIME.LEAGUE_WRITE_MODE, "closed");
  assert.equal(verifier.EXPECTED_RUNTIME.FREE_AGENT_DRAFT_ROUTES_ENABLED, "false");
  if (process.platform !== "linux") {
    assert.throws(() => verifier.verifyHeld(),
      error => error.safeCode === "LINUX_STAGING_RUNTIME_REQUIRED");
  }
});
