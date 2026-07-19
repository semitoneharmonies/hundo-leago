# Hundo Leago — Future Backlog

## Document Status

`IDEAS ONLY — NOT APPROVED FOR IMPLEMENTATION`

This document stores possible future work that must not displace launch-critical, in-season, or otherwise higher-priority development.

An item in this file may be researched, specified, or implemented only after Grae deliberately moves it into the active project scope and roadmap.

---

# Seasonal Event Presentation Videos

## Idea

Create one league-specific presentation video for each of these special annual events:

1. **Entry Draft Lottery** — reveal the lottery results and final draft order.
2. **Pre-season Free Agent Draft** — reveal notable player assignments and contracts after results are finalized.
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
* tied submissions and their tie-break results;
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
