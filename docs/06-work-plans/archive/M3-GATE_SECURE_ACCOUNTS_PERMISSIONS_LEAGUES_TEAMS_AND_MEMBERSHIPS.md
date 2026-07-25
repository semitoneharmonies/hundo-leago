# M3 Gate - Secure Accounts, Permissions, Leagues, Teams, and Memberships

## Document Status

`COMPLETE`

## Completion Date

`2026-07-21`

## Gate Result

Milestone M3 is complete locally.

M3-01 through M3-21 now provide the approved backend-authoritative identity,
account lifecycle, authorization, league, membership, commissioner, team,
manager, Socket.IO, frontend account/league-selection, and transactional email
foundations. The target runtime remains isolated from production authority.

## Required Gate Evidence

1. Browser-only credentials, password checks, local-storage identity, actor
   claims, and authority-bearing compatibility writes are removed or fail
   closed.
2. Opaque digest-only sessions enforce one active session, absolute and idle
   expiry, replacement, revocation, refresh, derived CSRF, exact credentialed
   origins, Fetch Metadata, and safe cookie behavior.
3. Public registration, verification, sign-in, reset, and reactivation use
   generic anti-enumeration responses, durable rate limits, single-use tokens,
   and encrypted outbox delivery.
4. Platform-administrator, commissioner, active-member, manager, league, and
   team authority comes only from current backend records. A platform
   administrator without active membership receives no internal league room.
5. Two-league tests prove safe visibility, stable IDs, hidden cross-league
   targets, identical team names across leagues, cross-league relational
   rejection, and backend-derived user, league, and team Socket.IO rooms.
6. Security Audit remains append-only and separate from League Activity for
   authentication and account-security events.
7. The ordinary-Chrome connected journey passes at a real `390 x 844`
   viewport with native Enter submission, accessible errors, reload,
   back/forward history, sign-out, credential DOM clearing, all four valid
   terminal action links, stable league/team routes, and no request-body
   authority claims.
8. Provider-backed required account email passes through the same durable
   outbox with explicit capture, sandbox, send, retry, terminal, recovery,
   idempotency, and shutdown behavior.

The exact origin, secure-cookie, and CSRF topology is covered by production-
mode configuration/transport tests and separate-origin connected-browser
evidence. Shared staging release-candidate acceptance remains an M7 deployment
gate and does not make the local M3 implementation incomplete.

## Final Verification

```text
Required Node runtime: 24.14.1
Complete backend suite: 546/546 passed across 136 suites
Frontend suite: 57/57 passed across 11 files
Frontend lint: passed
Frontend production build: passed
Connected ordinary-Chrome M3-20 journey: passed
M3-21 focused provider/rendering/job suite: 12/12 passed
Repository JavaScript syntax: 236/236 parsed
Backend and frontend diff checks: passed
Production target mount markers: 0
Generated database artifacts: 0
Protected backend hashes changed by M3-21: 0
```

The frontend build retains one non-blocking advisory for a minified JavaScript
chunk larger than 500 kB.

## Safety Result

Milestone M3 was completed without enabling target authority in production,
opening or migrating shared data, sending provider email, deploying, creating
secrets, committing, or pushing. M4 is ready for a separately bounded work
plan; no M4 implementation is active.
