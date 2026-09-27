# Player hockey cards

Approved scope: Graem's 27 September 2026 request. Implemented locally; publication and hosted acceptance are separate.

Player names in league rosters (including Cap outlook), Players, Dashboard, Matchups, Trade block, trade assets/activity, auctions, published draft results and expanded auction notifications open a shared hockey-card overlay. Search suggestions, editable fields and selection controls retain their selection behavior. Global administration without a selected league cannot display league transaction history.

The desktop card opens beside the clicked name/cursor and clamps to the viewport. It is up to 380px wide and capped at the smaller of 680px or 82% of the viewport height. Mobile centers it in the available viewport; expanded history scrolls inside the card. Keyboard activation, contained focus, Escape, outside click and a labelled close button are supported; closing restores focus to the original name. Normal clicks keep the page in place. Existing player-detail URLs remain available for direct links and modified/new-tab clicks.

The visual treatment uses the website's existing Hundo wordmark, typography and navy/blue/orange palette, with a subtle collectible-card edge. The supplied image establishes the card concept and information layout, not its theme. There is no footer slogan. Player portraits and generated likenesses remain deferred.

When a verified NHL player mapping and current number are available, the top of the card displays the jersey number in team colours. Team accent pairs are maintained locally from official NHL team marks; these are decorative numbers, not exact sweater reproductions. Missing numbers, unmapped players or inactive NHL profiles omit the decorative panel rather than guess. Unknown team abbreviations use Hundo colours.

The card shows name, NHL team/position when recorded, current fantasy team/category, goals, assists, fantasy points, GP, health, contract and value. The owning fantasy team's name is prominent, with its saved colours and pattern subtly behind the name strip using the same pattern renderer as the roster header. NHL colours remain on the jersey panel. Advanced statistics are omitted. Unknown health stays unconfirmed. The season/update line, value-explanation sentence and older-history disclaimer are omitted from the card; their underlying data and calculations are unchanged. Explicit empty-data states remain.

Value is season fantasy points divided by games played, then divided by net annual cap rate in Hundo dollars. Net rate is contract AAV less current-season retained salary. This is a descriptive ratio, not a prediction or a change to roster/cap rules. Bench, IR and prospect exemptions are identified; their value still uses the active-roster rate rather than dividing by zero. Missing games, missing statistics, unsigned contracts and a zero cap rate show an unavailable value.

History is league-specific and comes from saved records. Signing entries use the original contract-created event's team and price, with Candidate Card, Rapid auction, Restricted auction, Auction, Fantasy ELC or commissioner assignment provenance where known. Missing imported provenance is labelled rather than guessed. Cancelled contracts and reversed/under-review trades are identified.

Only executed trades are included, with expandable full deals: all team-to-team directions (including three-team deals), contracts, prospect rights, picks, salary retention, buyout obligations and Future Considerations. Saved yearly obligations and original pick teams are displayed where available. Private pending offers, losing Candidate Cards, private bids and negotiation/audit history are not inputs. Older unsaved transactions cannot be reconstructed.

Opening a card is read-only and requires active membership in the requested league. Cache keys include both league and player, and the card closes on navigation, account changes or authorization changes.

## API

`GET /api/v1/leagues/:leagueId/players/:playerId/card`

Existing session/origin/security boundaries apply; responses are private and `no-store`. Invalid identities return 400; inaccessible league or missing player returns 404; anonymous access returns 401. No new write endpoint, migration or scheduled task.

`data` contains `leagueId`, `playerId`, `name`, `birthDate`, `position`, `nhlTeam`, nullable `appearance`, `injury`, nullable `statistics`, nullable `ownership`, nullable `contract`, `value` and `history`.

`appearance` contains `jerseyNumber` (integer 1–99) and `nhlTeam`, read from `sweaterNumber` and `currentTeamAbbrev` in the NHL player landing feed. The existing statistics/catalogue import does not persist numbers. This optional read uses only one unambiguous saved `nhl` external ID, verifies the returned identity and active status, and updates the card's team abbreviation from the same response. It does not perform name matching or write to the database. Membership validation and saved history reads happen before any provider request.

Appearance is cached in memory for six hours (five minutes for unavailable results), up to 512 identities; duplicate in-flight lookups share one request. At most four lookups run concurrently. There are no queued retries: an unavailable feed, excess concurrent work or a 1.5-second timeout returns `appearance: null` while preserving the card's saved information. No NHL credentials or paid service are needed. Availability and future endpoint stability are not guaranteed. League-specific cards are not stored in this shared public-metadata cache.

`statistics` projects only season, goals, assists, GP, fantasy-point hundredths and the source timestamp. `contract` adds type, retained AAV and net AAV to the existing league contract summary. `value` contains nullable `fantasyPointsPerGame` and `perCapDollar`.

`ownership.team` also includes nullable `primaryColour`, `secondaryColour`, `tertiaryColour` and `patternTemplate`, read for the current owner from the requested league's teams. Other player list/detail contracts remain unchanged. No team-colour or pattern writes occur when viewing a card.

`history.signings` contains contract ID, recorded time, season, method, status, original signing team and original recorded price/term. `history.trades` contains trade ID, execution time, status, participating teams and all public asset snapshots. Each asset includes optional display details resolving the original pick team, retention player and saved yearly obligation labels. Existing player list/detail response contracts are unchanged.
