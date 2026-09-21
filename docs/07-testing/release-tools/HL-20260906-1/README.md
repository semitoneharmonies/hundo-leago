# Held staging verification — HL-20260906-1

These reviewed tools support the separately authorized 6 September staging continuation in ../../release-runs/M7_STAGING_RESUME_2026-09-06.md. They do not resume or modify retired V1–V10 attempts.

The helpers were delivered through stdin to Node in /opt/render/project/src on the exact staging service. Their relative backend imports intentionally resolve from that working directory. They are not application routes, scheduled jobs or client assets.

- verify-held-database.cjs --verify-held validates the held runtime and protected files, inspects private copies, removes only its owned scratch, and verifies the originals again. No authoritative SQLite file is opened by the verifier.
- verify-held-database.test.cjs runs locally with node --test and checks approved Git bytes, protected-file rejection and the held staging target.
- backup-once.cjs --backup-once creates a durable unique attempt before invoking the existing encrypted backup and private restore verifier. Its 6 September attempt succeeded. Do not rerun it. Read the saved receipt if reconciling this release.

Safe local receipts are in .hundo.local/launch-resume-20260906. The remote backup attempt and receipts remain in /opt/render/project/data/hundo-staging/.staging-resume-backup-HL-20260906-1. No credentials are included in this folder.
