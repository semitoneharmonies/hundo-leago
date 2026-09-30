# Commissioner controls: staging publication

Graem authorized staging publication on September 30, 2026. Production remains
outside this release. The original local acceptance evidence is in
`../../06-work-plans/COMMISSIONER_CONTROLS_STAGING_QA_2026-09-30.md`.

## Compatibility review

Current staging backend: `168d20cb7e7491f89c58b6031cdadb23a4a3e4ed`;
frontend Netlify deploy: `6abb0c6fac2ff6ae58ab85ae`.
Staging uses schema 63, with three-team trades at migration 62 and injuries at 63.
The production-derived commissioner candidate has those changes at 64/65, after
two schema-only FAD corrections. Replacing the existing staging ledger is unsafe.

The release adds an explicit staging-only migration lineage. Its original
62/63 files and checksums stay unchanged; the missing FAD corrections become
64/65. Migrations 1–61 and 66–84 are shared with the canonical directory.
`STAGING_MIGRATION_LINEAGE=true` selects this lineage only in staging. Production
configuration rejects it. Fresh databases using either lineage converge to the
same schema, and the existing strict filename/checksum checks still apply.

Existing Delete League controls are retained, including typed name confirmation,
administrator and membership checks, current preview, transaction rollback,
retained platform evidence, and refusal of an unreviewed schema. Schema 84's
league tables and guards are reviewed; tests also cover reset archives and
receipts belonging to two different leagues. No actual league deletion is part
of publication. Published staging dashboard layout is retained; the candidate
also carries the already released activity readability changes.

## Verification and publication record

Local evidence is under
`E:/hundo-leago-backend/.hundo.local/commissioner-controls-20260929/tmp/`.

- `staging-migration-tests.log`: 8 migration/lineage checks pass.
- `staging-runtime-compatibility-final.log`: staging-only configuration and all
  193 unique HTTP route contracts pass.
- `staging-deletion-final.log`: 10 deletion tests pass, including HTTP security,
  populated preservation, schema rejection, immutable archives, and rollback.
- `staging-deletion-frontend.log`: 27 frontend tests pass.
- `staging-compatible-lint.log`: frontend lint passes.
- `staging-before.json`: query-only hosted schema/data inventory, integrity OK,
  zero foreign-key violations and zero writes.
- `staging-backup.json`: encrypted staging backup restored independently with
  byte equality, integrity OK, and zero foreign-key violations.

The release is still being prepared at this checkpoint. Provider publication,
the deployed migration receipt, and public hosted verification must be recorded
before describing staging as updated. Authenticated acceptance remains separate.
