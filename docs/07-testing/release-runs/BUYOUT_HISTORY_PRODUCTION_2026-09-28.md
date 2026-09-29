# Buyout history production release - 28 September 2026

Graem explicitly authorized both buyout patches for production in the current chat.

## Scope

- Player hockey cards include saved buyouts in Hundo History, with the original team and date. History remains after a penalty finishes, transfers, or the player signs elsewhere. Cancelled buyouts are labelled.
- League Activity classifies `contract_bought_out` as Buyouts, excludes it from Other events, and gives buyout rows rose accents. Activity text is larger and wraps on small screens.
- No schema migration, data repair, transaction, roster, contract, salary, or permission changes.

## Release isolation and rollback

Backend base: `594588ed82ec356dfe9d44e8225fb187d1fe32ee`.
Frontend base: `5a8b4303c4810767da15c6a288d4cdbe0029bc9e`.
Branch in both repositories: `codex/buyout-history-production-20260928`.
Only the two patches were ported into isolated worktrees. Unrelated root work remains untouched.

Production targets are `api.hundoleago.com` on Render and `hundoleago.com` on Netlify. Schema stays at 65; the previous backend commit and Netlify deploy `6ab94d5ecae56e5abe7e9c75` remain compatible rollback targets. Keep all production settings except the backend build identifier unchanged.

## Verification and publication gates

Combined focused verification passed: 15 backend tests and 30 frontend tests, plus changed frontend JavaScript lint and whitespace checks.

Before deployment: desktop/mobile synthetic browser checks, production bundle validation, encrypted backup and isolated restore verification, and read-only fingerprints of every application table.

After deployment: verify exact deployed commits and assets, unchanged schema and records (accounting explicitly for legitimate concurrent activity), actual league-scoped buyout projections and activity filters, health, security boundaries, and anonymous desktop/mobile startup. Synthetic fixtures and anonymous checks are not authenticated manager acceptance.

Private receipts and completion results are stored on E: under `E:/hundo-leago-backend/.hundo.local/buyout-history-production-20260928/`. Publication is only confirmed by its deployment and verification receipts, not by this preparation document.
