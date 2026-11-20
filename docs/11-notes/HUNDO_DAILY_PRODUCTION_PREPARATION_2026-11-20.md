# Hundo Daily production preparation — 20 November 2026

The production candidate starts from accepted production frontend `9663cb643a2e1b9f7ffc8764a8bcaf1b189c670c` and adds the Hundo Daily experience approved on staging: rooms and auctions, scheduling, sealed roster-aware bids, standings and provisional live scores, history, optional sounds, salary totals, notifications, and separate Daily stripes.

The shared header switches between Leago and Daily. HL/HD chips have a 4px corner radius; the active chip remains larger and orange/purple, and the inactive chip is grey. Existing brand destinations and the 1.3-second soft transition remain.

Production features remain the baseline: season competition/live scoring and Day boundaries, existing games and kitty tools, install/push behavior, navigation, and account flows. The service worker gains only a bounded same-origin `/daily/rooms/{id}` notification destination beside existing notification/league paths. The release retains all 100 public assets: 99 exact published bytes, with this service worker addition the only intentional difference. Fifteen production header blocks are preserved exactly.

Local evidence: 123 unique focused unit checks pass after correcting two test harness issues; ESLint, whitespace check, and production Vite build pass. Supported Chrome review used an isolated memory fixture at desktop and portrait widths for square toggles, both navigation directions, and Daily room entry. No real account, league, bid, or room was changed. Previously accepted browser specifications are carried forward but were not rerun through external browser automation.

Frozen production artifact, source/asset audits, and the anonymous HTTP verifier are under `E:/hundo-leago/.hundo.local/daily-production-20261120/`. Publication and hosted production acceptance are pending the release coordinator's final checks; this note alone does not claim them complete.

The production Netlify site remains Git-connected to `main`. This release follows the existing verified manual-artifact workflow and a separate `codex/` source branch. A later `main`/continuous deployment must include this source to retain Daily; no CD settings or main-branch integration are changed by this preparation.
