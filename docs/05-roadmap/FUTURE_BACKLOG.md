# Hundo Leago — Future Backlog

## Document Status

`IDEAS ONLY — NOT APPROVED FOR IMPLEMENTATION EXCEPT EXPLICITLY PROMOTED BOUNDARIES`

This document stores possible future work that must not displace launch-critical, in-season, or otherwise higher-priority development.

An item in this file may be researched, specified, or implemented only after
Grae deliberately moves it into the active project scope and roadmap. An
explicitly identified promoted boundary records approved direction but does
not approve the remaining implementation ideas around it.

The high-level Free Agent Draft presentation-video direction was promoted on
`2026-07-27`: it is optional for Season 2, required for Season 3 readiness,
generated from authoritative initial Candidate Card results, and never allowed
to alter or delay the FAD. The detailed media, playback, retention, and
generation ideas below remain unapproved until a later presentation and
technical design adopts them.

---

# P1 Production-Promotion Follow-up - Signed-Prospect Buyout Trade Cancellation

## Promoted pre-production boundary

The M7-26 staging review identified a known limitation: buying out a player
whose signed contract remains in the `Prospect` roster category does not yet
cancel every pending trade whose immutable asset snapshot carries that player
as `prospect_right`. The current command fails atomically and leaves the buyout
and proposal unchanged; there is no observed partial-write risk, but the
manager cannot complete the intended buyout workflow.

This is a `P1` production-promotion blocker/follow-up, not an optional
post-launch idea and not a blocker for the contained M7-26 isolated-staging UI
review. Before production promotion, the buyout application transaction must:

* resolve the signed Prospect's stable player, ownership, right, and contract
  identity before mutation;
* find and cancel every affected nonterminal pending trade in the same league,
  including snapshots represented as `prospect_right`;
* persist the buyout, trade cancellations, explicit cancellation reason,
  retained history, approved Activity/notification records, and transactional
  outbox/realtime publications atomically;
* roll back the buyout and every related side effect if any cancellation or
  publication persistence fails; and
* prove idempotent replay, concurrent proposal/buyout behavior, multiple
  affected proposals, unaffected proposals, and two-league isolation.

`T-074` remains `PLANNED`. This item does not claim that the buyout endpoint,
service, final automated gate, shared-staging fix, or production behavior is
complete. Focused M7-26 prospect sign/decline/release movement remains complete;
this separately scoped follow-up preserves the buyout limitation until its own
implementation and verification evidence exists.

---

# Collectible Player Cards

## Promoted post-launch direction

Grae identified the collectible-style hockey-card interaction during the
2026-08-20 full-site review and explicitly deferred it until after launch.

A future contained specification may replace player-name navigation on roster
and Players catalog pages with an in-place collectible-style card containing
useful player information, then retire the standalone player-detail page only
after feature parity, deep-link handling, accessibility, and responsive
behavior are verified. Until that work is deliberately promoted, the current
player-detail routes and links remain supported.

---

# Seasonal Event Presentation Videos

## Idea

Create one league-specific presentation video for each of these special annual events:

1. **Entry Draft Lottery** — reveal the lottery results and final draft order.
2. **Pre-season Free Agent Draft** — reveal notable player assignments,
   contracts, and restricted-auction storylines after initial Candidate
   allocation is finalized.
3. **Season Championship** — present the league trophy to the winning team at season end.

These are presentation features only. They must never calculate, alter, delay, or become authoritative for lottery, draft, contract, standings, playoff, or championship results.

---

## Presentation Content

Videos may use:

* text and animated result graphics;
* AI-generated narration;
* team names, logos, colours, and branding;
* league branding;
* licensed or approved stock background images;
* music or sound effects that Hundo Leago has permission to use.

Player photographs and headshots are not required.

Possible Free Agent Draft highlights include:

* notable or highly ranked players;
* largest contracts by total value or AAV;
* most-contested players;
* tied submissions and unresolved restricted-auction storylines;
* other noteworthy results calculated from authoritative draft records.

The lottery video may progressively reveal the final pick order.

The championship video may show the winning team, season, final result, and trophy presentation using league and team branding.

---

## League-Wide Behaviour

For each event:

* one video is created for the league;
* every team and league member receives the same video;
* the video is generated only from finalized authoritative results;
* each league member is automatically presented with the video the first time they open the website after it becomes available;
* the interface provides an option to skip the automatic presentation;
* the video remains available for replay for two weeks after creation;
* the generated video file is automatically deleted after the two-week replay period;
* deletion of the presentation video must not delete or alter the underlying event results, league history, standings, contracts, draft records, or championship record.

The system may retain only the minimal non-video metadata needed to record that the event presentation existed and expired.

---

## Future Planning Requirements

Before implementation, a future product and technical specification must define:

* exact highlight-selection formulas;
* narration and visual templates;
* team-logo and stock-media rights;
* AI-generated voice disclosure;
* generation cost and failure handling;
* background rendering, storage, playback, and deletion;
* per-user first-view tracking;
* accessibility, captions, and reduced-motion behaviour;
* commissioner recovery when generation fails;
* privacy and league-isolation requirements;
* tests proving presentation generation cannot change authoritative league results.

The technical design should not depend permanently on a specific media-generation model or provider.

---

## Priority

`DEFERRED`

Do not spend implementation time on seasonal presentation videos until the Free Agent Draft, Entry Draft Lottery, season completion, championship, account, permissions, persistence, and other higher-priority league systems are complete and stable.
