# League communications

Status: local implementation of Graem's 29 September 2026 request.
No publication or live message execution has occurred.

## User behavior

The league dashboard shows current announcements to active league members.
Pinned announcements appear first; expired and archived announcements leave the
dashboard. Archiving preserves the text, creator, creation time, archiving actor
and archiving time. Announcement creation supports an optional expiry and an
optional in-app notification.

Commissioners and platform administrators with league authority can open the
communication controls. Candidate Card progress lists current participating
teams, manager names and empty/incomplete/complete status. It reads status
metadata only: no player selections, offers, bid values or revisions are loaded.
Card progress applies to the current season's open, unlocked FAD.

Reminders can target active members, accepted team managers, managers with
unfinished cards, or active account holders with unexpired pending invitations.
The server derives the audience. Preview displays the message and named
recipients; confirmation rechecks authority and recipient eligibility.
Reminders appear in recipients' inboxes, not the public announcement list.
Notification delivery here means an in-app inbox record, not an email.

## API

Base: `/api/v1/leagues/:leagueId/communications`.
Use the existing session, allowed-origin and request-security middleware.
POST requests require the existing CSRF token.
All successful responses use `{ data, meta: { requestId } }` and no-store caching.

| Method | Suffix | Authority | Behavior |
| --- | --- | --- | --- |
| GET | empty | Active league member | Current announcement projection |
| GET | /history | Commissioner/admin | Recent communication history, including private reminders |
| GET | /card-progress | Commissioner/admin | Counts and status-only team/manager projection |
| POST | /preview | Commissioner/admin | Read-only message/audience preview |
| POST | empty | Commissioner/admin | Confirm and atomically publish/deliver |
| POST | /:id/archive | Commissioner/admin | Archive an announcement with version check |

Preview input has exactly `kind, title, body, audience, pinned, expiresAtMs, notify`.
Kinds: `announcement`, `reminder`. Audiences: `members`, `managers`,
`unfinished_cards`, `pending_invitations`. Titles are bounded to 120 characters
and bodies to 3000. Expiry is a future safe millisecond timestamp or null.
Announcements always use the members audience. Reminders require notifications,
cannot be pinned and have no expiry. An empty reminder audience is rejected.

Preview returns normalized message, recipients, recipientCount and previewHash.
The hash binds league, current actor, message and recipients. Publish accepts
exactly `{ message, previewHash }` with an `Idempotency-Key` header.
A stale preview returns 409. Repeating a successful send with the same actor,
league, key and message returns its original receipt without duplicate records;
reusing the key for different content returns 409. The UI keeps the original
key for a retry after an uncertain response.

Archive accepts `{ version, confirmed: true }`. It checks authority in the
transaction, refuses a stale version, and safely replays an already archived
announcement. The dashboard never deletes history.

Communication errors use the `COMMUNICATION_` code family and bounded public
messages. Permission failures follow existing league authorization semantics.
Ordinary members cannot read communication history or card progress. Public
announcement responses exclude recipient counts and private reminder records.
The frontend renders messages as text and does not interpret HTML.

## Persistence and compatibility

Migration 66 adds `league_communications` and a league-first visibility index.
It advances only the data-model metadata row among pre-existing application
tables. The existing migration runner owns the ledger and user_version update.
The new table is explicitly league-scoped and versioned in the repository
catalogue. Historical schema catalogues exclude it.

Publishing inserts a communication and all inbox records in one immediate
transaction. Any notification failure rolls the entire operation back.
No scheduled jobs, rosters, contracts, cards, bids, trades, scores or calendar
records are changed. GETs and previews never repair or refresh data.
Historical reset policy classifies the new table as require_empty, preventing
old reset authorization from destroying new communication records.

New inbox event types are `league_announcement` and `league_reminder`, with
messageData exactly `{ title, message, leagueId, communicationId }`.
The frontend validates league identity and text bounds. Announcement inbox
entries link to the league dashboard. Communication queries poll every 30
seconds while viewed; no new socket event is introduced.

The service returns unavailable when composed against schema 65. New feature
use requires a reviewed backend migration and compatible frontend publication.
Deploying the code, migration, and sending real messages remain separate actions.

## Evidence and remaining scope

See the communications checkpoint in
[the work plan](../06-work-plans/COMMISSIONER_CONTROLS_2026-09-29.md).
Deadline holds/rescheduling, calendar editing, scoring and other approved
controls remain separate pending slices; this feature does not implement them.
