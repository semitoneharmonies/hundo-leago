# Hundo Leago - Security

## Document Status

`APPROVED`

This technical specification defines:

* password storage and credential verification;
* backend-managed sessions, cookies, expiration, replacement, and revocation;
* request-forgery, cross-origin, input, injection, and browser protections;
* account-action tokens, email-link handling, and one-time consumption;
* authentication rate limits and anti-enumeration behavior;
* authorization, league isolation, audit, logging, secrets, and bootstrap controls;
* technical decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the security decisions and approved adoption of the resulting design on 2026-07-18. The final transactional-email provider boundary was selected and recorded on 2026-07-21.

---

## Technical Purpose

Hundo Leago needs one backend-enforced security boundary for accounts, leagues, teams, and platform operations.

The design must:

* replace the current browser-only password comparison;
* identify users from opaque server-managed sessions;
* authorize every protected action from current persisted relationships;
* prevent cross-league reads and writes;
* prevent session, reset, verification, and setup secrets from leaking;
* resist password guessing, account discovery, request forgery, token replay, and injection;
* record useful security evidence without recording secrets;
* fail closed without silently changing league data.

Security controls supplement approved product behavior. They must not create new commissioner powers, weaken read-only guarantees, or expose private data through error messages, logs, history, or Socket.IO.

---

## Out of Scope

This specification does not:

* define visual page layout;
* make commissioner tools into platform-administrator tools;
* permit administrators to view passwords, password hashes, session tokens, or active auction bids;
* define league rules;
* authorize public league creation;
* authorize production deployment;
* replace infrastructure access controls owned by Deployment and Operations;
* introduce social login, passkeys, or multi-factor authentication in the initial release.

Email-provider configuration, deployment, environment, incident-response, and backup details follow their specialized documents.

---

# Part 1 - Authority and Threat Boundary

## Required Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/USER_ACCOUNTS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SQLITE_MIGRATION.md
```

Permissions and User Accounts own approved user-visible behavior. This document owns the cryptographic, transport, storage, validation, throttling, and audit mechanisms used to implement it.

---

## Existing Login Is Not Authentication

The reviewed frontend contains hard-coded identities and plaintext passwords, performs credential comparison in the browser, and stores selected identity state in browser storage.

That code is an implementation risk, not a compatibility requirement.

Before secure accounts are enabled:

* hard-coded passwords must be removed from the shipped frontend;
* the frontend must stop deciding whether credentials are valid;
* local storage must stop acting as proof of login;
* client-supplied role, team name, user ID, or actor name must not establish authority;
* the backend must own credential verification and session state.

No compatibility endpoint may preserve plaintext or browser-only authentication.

---

## Assets Protected

The security design protects:

* passwords and credential hashes;
* session, reset, verification, setup, and reactivation tokens;
* user email addresses and private account data;
* platform-administrator authority;
* league membership and team-management authority;
* private league information;
* active sealed auction bids;
* persistent league and player data;
* provider and deployment secrets;
* backups and migration artifacts;
* security-audit integrity.

Public roster fields remain public only to the extent approved by Permissions and API Contracts.

---

## Primary Threats

The initial design explicitly addresses:

* credential stuffing and password guessing;
* user and email enumeration;
* stolen or fixed sessions;
* concurrent-session policy bypass;
* CSRF and login CSRF;
* malicious cross-origin browser requests;
* cross-site scripting stealing non-cookie state or issuing requests;
* SQL and command injection;
* cross-league object reference attacks;
* client-claimed roles or team control;
* replayed action tokens and duplicate writes;
* sensitive-data leakage through logs, URLs, errors, analytics, or Socket.IO;
* forged proxy headers and rate-limit bypass;
* unsafe first-administrator creation;
* accidental use of production secrets or storage in staging.

The initial design does not claim to protect a host after an attacker has gained full Render account, process, or operating-system control. Operational account protection and provider access are still required.

---

# Part 2 - Passwords and Credentials

## Password Input Rules

The technical limits are:

```text
Minimum: 6 Unicode code points
Maximum: 256 Unicode code points
Maximum UTF-8 representation: 1024 bytes
```

Spaces and Unicode are allowed. No uppercase, lowercase, digit, or symbol composition rule is added.

The backend:

* accepts the password as the exact submitted Unicode string;
* does not trim it;
* does not lowercase it;
* does not apply Unicode normalization;
* counts Unicode code points, not UTF-16 code units;
* separately enforces the byte ceiling before hashing;
* requires exact password confirmation where the product specification requires it.

This preserves user intent and prevents two distinct passwords from becoming the same through server normalization.

Email addresses and display names follow their separate normalization rules. Password rules must never be reused for them.

---

## Password Hash

The approved initial password hash is Node.js built-in asynchronous `crypto.scrypt`.

Parameters:

```text
N:        131072 (2^17)
r:        8
p:        1
salt:     16 cryptographically random bytes
key:      32 derived bytes
maxmem:   268435456 bytes (256 MiB)
```

The stored encoded value is self-describing and versioned, for example:

```text
scrypt$v=1$N=131072,r=8,p=1$<base64url-salt>$<base64url-derived-key>
```

The parser rejects:

* unknown algorithms or versions;
* duplicate or missing parameters;
* values outside approved bounds;
* malformed base64url;
* an unexpected salt or key length.

Password creation and replacement always use a fresh salt.

The raw password, salt-plus-password input, and derived key must not be logged or returned.

---

## Verification

Credential verification:

1. loads only the credential row needed for the normalized email match;
2. parses the stored algorithm and parameters;
3. derives the candidate hash asynchronously;
4. compares equal-length byte arrays with `crypto.timingSafeEqual`;
5. returns only a generic success or failure to the route;
6. records a safe audit result;
7. clears references to sensitive request data as soon as practical.

If no eligible account exists, the backend still performs a bounded dummy `scrypt` verification before returning the same public failure. This reduces obvious account-existence timing differences.

Authentication work must have a concurrency limiter so a burst of expensive hashes cannot starve the Node process. Requests exceeding the bounded authentication queue fail with a generic retryable response and are counted by rate limits.

---

## Rehash Policy

The encoded credential records the algorithm version and parameters.

After a successful password verification, the backend may replace the hash in the same authenticated operation when:

* the stored parameters are weaker than the approved current parameters; or
* an approved algorithm migration is active.

Rehashing never occurs after a failed login and never changes the password itself.

Algorithm or cost changes require benchmark evidence on local and staging hardware, an approved security change, and protection against process starvation.

---

## Pepper Decision

The initial release does not add a password pepper.

A pepper would require a separately protected secret plus a rehearsed rotation and recovery process. The initial controls instead rely on:

* memory-hard salted password hashing;
* protected environment and provider access;
* disk and backup controls;
* rate limiting;
* security monitoring.

A future pepper may be added only with versioned credential metadata, rotation support, and a recovery plan. It must never be stored in SQLite.

---

## Password Change and Reset

Password change requires:

* a valid session;
* the current password;
* a new password and matching confirmation;
* a new password different from the current password;
* successful transactional credential replacement;
* revocation of every session;
* security audit and required notification;
* normal sign-in afterward.

Password reset requires:

* a valid one-time reset token;
* a new password and matching confirmation;
* transactional token consumption and credential replacement;
* revocation of every session;
* invalidation of every remaining reset token;
* security audit and required notifications.

No password is ever emailed.

---

# Part 3 - Session Design

## Session Mechanism

Sessions are opaque server-side records stored in SQLite.

On successful authentication, the backend generates:

```text
32 cryptographically random bytes
```

encoded as base64url for the browser token.

The raw token is sent only in a cookie. SQLite stores only:

```text
SHA-256(raw session token)
```

plus the approved session metadata.

The token has no embedded user ID, role, expiry, or authorization. It is not a JWT.

Database disclosure alone must not reveal reusable session credentials.

---

## Session Cookie

Production cookie name:

```text
__Host-hl_session
```

Production attributes:

```text
Path=/
HttpOnly
Secure
no Domain attribute
Max-Age=604800
```

`SameSite` depends on the deployed site relationship:

* `Lax` when frontend and backend are same-site under the same registrable domain;
* `None` while the approved Netlify frontend and Render backend are cross-site.

`SameSite=None` is allowed only with:

* `Secure`;
* exact credentialed CORS allowlisting;
* Origin verification;
* CSRF tokens for authenticated unsafe requests;
* no wildcard origin;
* no unreviewed third-party frontend.

Moving production to same-site custom domains and `SameSite=Lax` is preferred when deployment supports it, but the security implementation must accurately represent the deployed origins instead of assuming they are same-site.

Local development uses a separate:

```text
hl_session
```

cookie with `HttpOnly`, `SameSite=Lax`, and `Secure=false` only on exact localhost development origins. A non-local environment must never disable `Secure`.

---

## Cookie Transport

The frontend sends authenticated requests with credentials enabled.

The session token must never appear in:

* local storage;
* session storage;
* frontend state accessible to application code;
* query strings;
* URL fragments;
* JSON responses;
* logs;
* Socket.IO event payloads;
* league activity;
* security-audit views.

The server clears the cookie on sign-out and on detected invalid or revoked session responses. Server-side revocation remains authoritative even if a browser retains an old cookie.

---

## Session Record

The session row includes:

* stable session ID;
* session-token digest with unique constraint;
* user ID;
* created timestamp;
* last-used timestamp;
* absolute expiry timestamp;
* idle expiry timestamp or enough data to derive it;
* revoked timestamp;
* revocation reason;
* safe client metadata;
* version.

No raw token is stored.

Revoked and expired session records may be retained for audit correlation according to operations policy, but they can never authenticate.

---

## One Active Session

One user may have at most one active session.

A successful login runs one transaction that:

1. verifies the account remains eligible;
2. revokes every previous active session for the user with reason `replaced_by_login`;
3. inserts the new session;
4. records the audit event and notification outbox item.

A partial state with two active sessions must be prevented by transaction logic and a database unique constraint or equivalent one-current-session invariant.

An unsuccessful login does not revoke an existing valid session.

---

## Expiration

Approved limits:

```text
Absolute lifetime: 7 days from creation
Idle lifetime:     12 hours since last protected request
```

The server checks both on every protected HTTP request and Socket.IO authentication or reauthorization.

Protected activity may refresh `last_used_at` and the idle deadline, but never the absolute deadline.

To avoid a write on every read, the security middleware persists a last-used refresh no more than once every five minutes per session. The in-memory decision may be more current, but a restart must not permit more than the approved idle lifetime plus that five-minute persistence interval.

This narrowly approved security metadata update:

* is not a league-domain write;
* is isolated from feature repositories;
* must not create league activity;
* must not change matchup or standings state;
* must not turn a domain GET into a feature write.

---

## Revocation

Sessions are revoked after:

* sign-out;
* successful new login;
* password change;
* password reset;
* account deactivation;
* platform safety disable;
* expiry;
* an approved platform security action.

Membership or league-role changes do not revoke the account session. Authorization is reloaded from current persisted memberships and assignments on every protected action, so removed league authority stops immediately.

Revocation and the security event occur atomically with the action that requires revocation.

---

## Socket.IO Authentication

Socket.IO uses the same opaque cookie and server-side session record.

Requirements:

* authenticate during the handshake;
* verify the request origin against the same allowlist;
* never accept a user, role, membership, league, or team identity from the client as authority;
* join only rooms derived from current backend authorization;
* re-check authorization before processing a protected client event;
* disconnect on session revocation or expiry;
* remove access to league rooms when membership no longer permits it;
* never emit active sealed bid values or private cross-league data.

Socket connections do not extend the session merely by remaining open. A reviewed protected heartbeat may count as activity no more often than the session refresh interval.

---

# Part 4 - Account-Action Tokens

## Token Construction

Email verification, administrator credential setup, password reset, and self-reactivation use purpose-specific opaque tokens.

Each token:

* contains 32 cryptographically random bytes;
* is base64url encoded for delivery;
* is stored in `account_action_tokens` only as a SHA-256 digest;
* has a stable token-record ID;
* has one explicit purpose;
* has an expiry;
* is single-use;
* is bound to one user;
* records created, consumed, invalidated, and expiry state;
* is consumed atomically with its successful action.

Tokens are not JWTs and contain no readable user data.

---

## Expiry Decisions

```text
Self-sign-up email verification: 24 hours
Administrator credential setup: 72 hours
Password reset:                  30 minutes
Self-reactivation:               30 minutes
```

Requesting a new token invalidates every earlier unconsumed token for the same user and purpose.

Expired, consumed, invalidated, wrong-purpose, malformed, or unknown tokens return the same public failure category.

The user may request a replacement through the approved generic-response flow.

---

## Link Handling

The preferred email link places the raw token in a URL fragment:

```text
https://<frontend-origin>/<action>#token=<raw-token>
```

Fragments are not sent in the initial HTTP request. The frontend:

1. reads the token once;
2. removes the fragment from visible browser history with `history.replaceState`;
3. keeps the token only in memory;
4. submits it in a JSON body to the exact action endpoint;
5. clears the in-memory value after success or terminal failure.

Action pages set a no-referrer policy and must not load third-party analytics, support widgets, images, or scripts that could observe page context.

The token must not be placed in a query string, server access log, analytics event, error report, or browser storage.

---

## Encrypted Delivery Envelope

Grae approved the durable-delivery design on 2026-07-20. A raw
account-action token may be retained after its creating transaction only
inside the matching `outbox_events.payload_json` as a short-lived
AES-256-GCM encrypted delivery envelope.

The exception is narrow:

* `account_action_tokens` continues to store only the SHA-256 digest;
* the envelope uses a dedicated `ACTION_TOKEN_DELIVERY_KEY`, independent
  from every rate-limit, audit, session, provider, and backup secret;
* the key decodes to exactly 32 bytes and has an explicit positive version;
* every encryption uses a new 96-bit nonce and the full 128-bit
  authentication tag;
* authenticated associated data binds the envelope to its outbox event,
  user, action-token record, purpose, canonical frontend origin, envelope
  version, and key version;
* the plaintext contains only the raw token, not an email address,
  password, session credential, or complete URL;
* only the internal email-delivery worker may decrypt it, and it constructs
  the fragment link from `PUBLIC_FRONTEND_ORIGIN` after decryption;
* logs, public errors, audit, account history, provider metadata, and dead
  letters never contain plaintext token material or the encryption key;
* successful delivery and terminal discard replace `payload_json` with a
  non-secret cleared tombstone in the same state transition;
* retryable failure retains ciphertext only until the bounded retry policy
  reaches success, expiry, or terminal discard;
* key rotation retains only the minimum old key versions needed for the
  bounded lifetime of still-pending envelopes and removes them after that
  window is proven empty.

Malformed, unauthenticated, wrongly bound, expired, or unavailable-key
envelopes are discarded without attempting provider delivery.

---

## Transactional Email Provider Boundary

Resend is the selected transactional-email provider.

The backend uses the provider's HTTPS email endpoint directly through an
injectable adapter. Provider-mode requirements are:

* a separately generated send-only API key for each enabled environment;
* one validated sender identity and optional reply-to address;
* the stable durable outbox event ID in the provider `Idempotency-Key` header;
* no provider SDK or browser credential;
* a bounded request timeout and safe retry classification;
* no password, cookie, CSRF value, audit metadata, role, membership, or
  authority claim in provider metadata; and
* no provider response body, API key, or decrypted action token in logs or
  public errors.

The application outbox remains authoritative even though the provider also
deduplicates an idempotency key for its documented retention window. Network,
timeout, rate-limit, concurrent-idempotency, and provider `5xx` failures are
retryable. Invalid credentials, invalid sender/domain, invalid payload, and
incompatible idempotency reuse are terminal.

Provider acceptance means only that the message was accepted for processing;
it is not evidence of inbox delivery. Local and test use capture or disabled
mode. Staging sandbox mode forces the recipient to Resend's non-delivering
`delivered@resend.dev` test address. Production send mode uses the verified
account address.

---

## Atomic Consumption

Token completion performs one transaction:

1. find the digest and expected purpose;
2. confirm unexpired and unconsumed state;
3. confirm the target account is in the allowed lifecycle state;
4. apply the approved account or credential change;
5. consume the token;
6. invalidate sibling tokens as required;
7. revoke sessions as required;
8. write audit and notification outbox records.

Two concurrent submissions cannot both succeed.

---

# Part 5 - CSRF, CORS, and Browser Controls

## CORS

The backend reads an explicit comma-separated allowlist from:

```text
FRONTEND_ORIGINS
```

Every value must be a complete `http` or `https` origin with:

* scheme;
* hostname;
* optional explicit port;
* no path;
* no wildcard.

Production permits only reviewed HTTPS frontend origins.

Credentialed CORS requirements:

* echo only an exact allowlisted origin;
* `Access-Control-Allow-Credentials: true`;
* `Vary: Origin`;
* allow only required methods;
* allow only required request headers;
* no `*` origin;
* no regular-expression suffix match;
* no reflection of an unknown Origin;
* a bounded preflight cache.

Requests without an Origin are permitted only for explicitly approved non-browser service or command-line use and still require normal authentication. Unsafe browser-facing endpoints require an approved Origin or a separately authenticated internal mechanism.

---

## Authenticated CSRF Token

Each session starts with an opaque 32-byte random session token. The
backend uses HMAC-SHA-256 with a fixed versioned CSRF purpose label and
that session token as key material to derive a separate stable 32-byte
CSRF token. SQLite stores the CSRF token's SHA-256 digest.

This approved domain separation means the backend can reconstruct the
same session-bound CSRF token from the HttpOnly session cookie during a
safe bootstrap request. It does not store a recoverable raw CSRF value,
does not turn the bootstrap `GET` into a write, and does not invalidate
another tab merely because one tab reloads.

The raw CSRF token is returned only in the safe authenticated session-bootstrap response, never in a cookie. The frontend holds it only in memory and sends:

```text
X-CSRF-Token: <token>
```

on every authenticated unsafe request:

```text
POST
PUT
PATCH
DELETE
```

The backend compares the digest in constant time and also verifies the request Origin.

A new session gets a new CSRF token. Sign-out, revocation, and replacement invalidate it with the session.

---

## Unsafe Request Rules

Authenticated unsafe requests require all of:

* valid session;
* valid session-bound CSRF token;
* exact allowed Origin;
* expected JSON content type unless the endpoint is an approved upload;
* Fetch Metadata compatible with the expected same-site or cross-site frontend deployment;
* normal authorization and input validation.

Missing or contradictory Fetch Metadata is not the only decision signal because clients and proxies vary. It supplements, but does not replace, Origin and CSRF validation.

HTML form content types are rejected from JSON mutation endpoints.

Public sign-up, sign-in, reset-request, verification, setup, and reactivation endpoints do not have an authenticated session token. They require:

* exact allowed Origin for browser requests;
* JSON content type;
* strict CORS;
* rate limits;
* generic public failures;
* one-time action tokens where applicable.

These controls prevent an arbitrary third-party site from silently creating or replacing a Hundo Leago browser session.

---

## Security Headers

The backend uses reviewed security-header middleware and explicit configuration.

API responses require:

```text
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-store
```

Account and private responses use `Cache-Control: no-store`. Public roster caching follows API Contracts and must not contain private fields.

After HTTPS and domain behavior are verified, production enables:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

`preload` is not added until every relevant subdomain is confirmed HTTPS-only and an explicit deployment decision is made.

The frontend hosting configuration must define a restrictive Content Security Policy. Initial target:

```text
default-src 'self';
base-uri 'none';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
script-src 'self';
style-src 'self';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' <approved-api-origin> <approved-socket-origin>;
upgrade-insecure-requests
```

Any required exception must name the exact trusted origin and be documented. Broad `*`, inline scripts, and `unsafe-eval` are not default allowances.

---

# Part 6 - Authentication Rate Limits

## Principles

Rate limits are enforced by the backend and stored durably in SQLite so a process restart does not erase an active abuse window.

Limits combine:

* trusted network source;
* normalized account identifier where supplied;
* authenticated user where applicable;
* endpoint action.

The limiter must not permanently lock an account because an attacker submitted bad passwords.

Public responses remain generic. A `429` may include a bounded `Retry-After`, but it must not reveal whether an account exists.

---

## Approved Initial Limits

| Action | Network-source limit | Account or user limit |
| --- | --- | --- |
| Sign in | 20 requests per 15 minutes | 5 failed attempts per normalized email per 15 minutes |
| Sign up | 5 requests per hour | 3 requests per normalized email per hour |
| Verification resend | 10 requests per hour | 3 requests per account per hour |
| Password-reset request | 10 requests per hour | 3 requests per normalized email per hour |
| Reactivation request | 10 requests per hour | 3 requests per normalized email per hour |
| Admin setup resend | normal admin API limit | 3 requests per target user per hour |
| Action-token completion | 20 requests per 15 minutes | 5 failed attempts per token record or target per 15 minutes |
| Password change | normal authenticated limit | 5 attempts per user per hour |
| Account deactivation | normal authenticated limit | 5 attempts per user per hour |

Successful login clears the account-specific failed-login counter after audit is recorded. It does not clear network abuse counters.

Rate-limit values are configuration with these approved defaults. Production cannot silently disable them.

---

## Network Source

The server trusts proxy forwarding headers only when Express `trust proxy` is configured for the known Render proxy topology.

It must not trust an arbitrary client-supplied `X-Forwarded-For` chain.

Rate limiting uses the framework-derived client address after trusted-proxy processing.

IPv4 and IPv6 representations are canonicalized before bucketing. Audit and limiter records use privacy-preserving derived keys rather than displaying raw addresses broadly.

---

## Durable Keys

Rate-limit keys are HMAC-SHA-256 values using a dedicated environment secret and version:

```text
HMAC(secret, action + canonical-source-or-identifier)
```

Raw email addresses and raw network addresses are not stored as rate-limit keys.

The secret is separate from session, CSRF, provider, and audit-metadata secrets.

Rate-limit rows contain bucket, count, first-seen, last-seen, blocked-until, and expiry metadata. Expired rows are removed by a bounded scheduled cleanup job.

---

## Response Timing and Enumeration

Public sign-in, sign-up, reset, resend, and reactivation flows must not reveal account existence through:

* different response text;
* different status for eligible versus unknown email where the product requires a generic response;
* presence or absence of a returned user ID;
* redirect destination;
* materially different server work;
* email-address echo;
* detailed token failure.

Internal audit may record the actual safe outcome for authorized diagnosis.

---

# Part 7 - Authorization and League Isolation

## Request Identity

Authentication middleware may attach only backend-derived identity:

```text
user ID
session ID
account status
```

Feature authorization then loads current:

* platform role when relevant;
* league membership;
* commissioner relationship;
* team-manager assignment;
* target league and season state.

The client may identify a target resource, but it never supplies the authoritative actor or role.

---

## Deny by Default

Protected operations fail unless the backend positively verifies:

1. valid active session;
2. eligible account;
3. requested league;
4. active membership when required;
5. required role or team assignment;
6. same-league ownership of every related record;
7. allowed league and season state;
8. resource version or idempotency condition where required.

Platform-administrator status does not grant silent league access. A platform administrator needs an active membership to view or operate inside a league, except for narrowly approved external platform-administration actions.

---

## Object-Level Authorization

Every endpoint that accepts a resource ID must verify its parent league from the database.

The system must not:

* infer a league from the first record;
* authorize by display name;
* combine a membership from one league with a team from another;
* reveal whether an unauthorized private object exists;
* accept a team ID as proof that the user manages it;
* trust IDs contained in a prior frontend page.

Repository methods must normally require `leagueId` alongside a league-owned resource ID so isolation is visible in the query boundary.

---

## Commissioner and Administrator Boundaries

Commissioners cannot:

* view passwords or password hashes;
* view raw session or action tokens;
* inspect active sealed bid values;
* grant themselves platform-administrator status;
* bypass membership requirements;
* edit account credentials;
* approve their own restore request where platform approval is required.

Platform administrators cannot view secrets merely because they administer the platform.

Sensitive platform actions require:

* current eligible session;
* current persisted platform role;
* explicit endpoint authorization;
* recent password confirmation where Security or the future admin specification requires it;
* audit actor and target;
* idempotency or confirmation controls appropriate to the action.

---

# Part 8 - Validation and Injection Defense

## Request Validation

Every endpoint defines a strict schema for:

* path parameters;
* query parameters;
* request headers;
* JSON body;
* file metadata where uploads are approved.

Validation rejects:

* unknown fields on security-sensitive writes;
* wrong types;
* non-finite numbers;
* unsafe integer values;
* out-of-range money and fantasy points;
* malformed UUIDs;
* unapproved statuses;
* excessive arrays or strings;
* duplicate keys where parser behavior would be ambiguous;
* unexpected content types.

The JSON body-size limit is small by default and raised only for a documented endpoint.

Validation failure occurs before business mutation.

---

## SQL Injection

All runtime SQL uses prepared statements with bound values.

Identifiers and SQL fragments cannot be bound as values. Therefore:

* sort fields use a server allowlist;
* sort direction uses a fixed two-value mapping;
* table and column names never come directly from requests;
* `IN` lists use bounded generated placeholders;
* user-supplied operators or raw conditions are forbidden.

SQLite extension loading, multi-statement request input, and arbitrary SQL administration endpoints are forbidden.

---

## Command and Path Safety

The backend must not construct shell commands from request data.

Operational scripts:

* use argument arrays rather than shell interpolation;
* validate environment and absolute paths;
* constrain output to approved roots;
* refuse symlink or traversal surprises where protected files are involved;
* never expose a production reset or restore operation as a general public endpoint.

Uploaded team logos use backend-generated UUID object keys and SQLite BLOB
storage rather than client filenames or filesystem paths. The JSON contract
accepts no filename, path, URL, data-URL prefix, or storage key. It decodes at
most `524288` canonical base64 bytes, matches the declared type against PNG,
JPEG, or WebP signatures, inspects dimensions from `1` through `2048` pixels,
and rejects animated PNG/WebP, GIF, SVG, HTML, malformed, mismatched, and
unrecognized content. Logo responses set the inspected allowlisted
`Content-Type`, exact `Content-Length`, `X-Content-Type-Options: nosniff`, and
`Cache-Control: private, no-store` and never reflect upload metadata.

---

## Output Encoding

React text rendering is used normally. User-controlled HTML is not rendered.

`dangerouslySetInnerHTML` is forbidden for account, league, team, player, activity, notification, and commissioner-supplied values unless a separate sanitization design is approved and tested.

Display names, team names, league names, comments, and activity descriptions are returned as data and encoded by the rendering layer.

---

# Part 9 - Secrets and Configuration

## Secret Sources

Secrets come only from the environment or an approved managed secret store.

They must not be committed to:

* source code;
* `.env.example` values;
* documentation;
* fixtures;
* tests;
* screenshots;
* migration reports;
* logs.

An example environment file contains names and non-secret descriptions only.

---

## Separate Secrets

Separate random secrets are used for distinct purposes, including when applicable:

```text
RATE_LIMIT_KEY_SECRET
AUDIT_METADATA_SECRET
email provider credential
NHL provider credential
internal operations credential
```

Session and account-action tokens are random per record and do not
depend on a global signing secret. A session's CSRF token is
cryptographically domain-separated from that random session token and
also does not depend on a global signing secret.

Local, staging, and production use different values.

Production startup validates required values and fails closed if a secret is absent, obviously placeholder text, or malformed.

---

## Rotation

Secrets that need rotation carry a key version in derived records.

Rotation procedure must:

* introduce a new version;
* keep only the minimum old versions needed for a bounded verification window;
* re-key or expire dependent non-user-facing records;
* verify staging first;
* record an operations event;
* remove the retired secret after the approved window.

Raw secret values never appear in the event.

Password hashes do not depend on an application-wide pepper in the initial release, so rotating deployment secrets does not invalidate every password.

---

## Frontend Environment

Any value embedded by Vite into the frontend bundle is public.

Frontend environment variables may contain:

* API origin;
* Socket.IO origin;
* non-secret build metadata;
* approved public feature configuration.

They must not contain:

* database paths;
* provider private keys;
* session material;
* email credentials;
* audit or rate-limit HMAC secrets;
* platform-administrator credentials.

---

# Part 10 - Audit, Logging, and Errors

## Security Audit Separation

Security audit is distinct from League Activity.

It does not record matchup events or standings changes. League Activity does not record raw authentication details.

Security audit covers the approved account and access events, including:

* sign-up and verification;
* sign-in success and failure;
* session replacement and sign-out where required;
* password change and reset;
* account deactivation and reactivation;
* administrator account creation;
* platform safety disable or re-enable;
* permission-sensitive administrative actions;
* security-rate-limit enforcement;
* suspicious or denied security operations where useful.

---

## Audit Fields

Audit rows contain only approved non-secret context:

* event ID;
* event type;
* outcome;
* UTC timestamp;
* actor user ID when known;
* target user ID when applicable;
* league ID when the event is legitimately league-scoped;
* session record ID when useful, never the raw token or token digest;
* request correlation ID;
* safe reason code;
* privacy-preserving network metadata;
* safe client metadata;
* audit-metadata key version.

Unknown-account attempts use a keyed pseudonymous identifier when correlation is needed. They do not store a raw submitted email in general audit display.

Security audit is append-only under ordinary application operation and retained for the platform lifetime unless a future approved operations policy changes that rule.

---

## Network and Client Metadata

Audit network metadata uses:

* canonical IPv4 `/24` or IPv6 `/48` prefix where available;
* HMAC-SHA-256 with the audit metadata secret;
* secret key version;
* no broad display of the raw address.

Client metadata may include:

* a bounded user-agent family;
* a keyed or unkeyed hash of a length-bounded user-agent value;
* request origin;
* trusted proxy-derived source category.

It must not become a fingerprinting system or store unrestricted request headers.

---

## Application Logs

Structured logs use:

* timestamp;
* severity;
* safe event name;
* request correlation ID;
* route template, not secret-bearing raw URL;
* safe status or error code;
* duration;
* stable internal actor or league ID only when needed and access-controlled.

Logs must redact or omit:

* `Cookie`, `Set-Cookie`, and `Authorization`;
* passwords and password confirmations;
* raw session and CSRF tokens;
* verification, setup, reset, and reactivation tokens;
* password hashes;
* raw email addresses except in the narrowly approved email-delivery system;
* provider credentials;
* environment-secret values;
* active sealed auction bid values;
* full private request or response bodies;
* database connection paths in public responses.

Log sanitization is tested with representative secret-shaped requests.

---

## Errors

Public errors use stable API error codes and safe messages.

They must not expose:

* SQL or table names;
* stack traces;
* filesystem paths;
* migration details;
* whether an unknown email exists;
* token digests or parsing details;
* authorization facts about private resources;
* internal package versions.

Unexpected errors receive a correlation ID. Detailed stacks remain in access-controlled server logs after redaction and only outside public responses.

Authentication responses remain generic even when internal audit records a specific safe reason.

---

# Part 11 - Email Security

## Delivery Adapter

Account email is sent through an adapter so provider selection does not enter domain services.

Domain services write a notification or outbox record in the same transaction as the relevant state change. Delivery occurs afterward with:

* idempotency key;
* bounded retries;
* safe failure status;
* no rollback of an already completed password or account action merely because email delivery failed.

Email content must not include an existing or generated password.

---

## Required Notifications

Notifications are sent to the verified email address for the approved events, including:

* password change;
* password-reset request and completion;
* account deactivation;
* reactivation request and completion;
* replacement of an earlier session by a new login;
* administrator account creation and setup;
* platform safety actions where approved.

Messages provide time, event type, and safe recovery guidance without exposing session details or internal audit metadata.

---

## Email Headers and Links

Email templates:

* use the configured canonical frontend origin;
* never trust a request Host header to construct security links;
* use HTTPS outside local development;
* avoid secret-bearing third-party tracking links or pixels;
* use plain-text and minimal reviewed HTML variants;
* escape all user-controlled display text.

Deployment must configure provider-domain authentication such as SPF, DKIM, and DMARC before production account email is relied upon. Exact DNS setup belongs in Deployment.

---

# Part 12 - Administrative and Operational Security

## First Platform Administrator

The first platform administrator is created through a one-time local or Render administrative script, not a public HTTP endpoint.

The script must:

* require an explicit production environment confirmation;
* connect to the explicit database path;
* refuse to run if any platform administrator already exists;
* accept the email and display name through safe interactive input or protected environment input;
* create the account without accepting a plaintext password on the command line;
* issue the normal 72-hour credential-setup token;
* write actor type `system_bootstrap` and target user to audit;
* print only safe completion details;
* be disabled or become permanently self-refusing after success.

Later platform administrators use an approved authenticated administrative workflow.

---

## Sensitive Reauthentication

The initial product explicitly requires current-password confirmation for password change and account deactivation.

Future highly sensitive platform actions should use a recent-authentication marker or current-password confirmation. This marker must be server-derived, short-lived, and tied to the current session; the browser cannot claim it.

No extra reauthentication requirement may be added to an ordinary manager action without product approval.

---

## Backup and Migration Security

Database backups and migration bundles may contain:

* emails;
* password hashes;
* session-token digests;
* private league data;
* security audit.

They are sensitive operational artifacts.

They must:

* live outside public web roots;
* use access-controlled storage;
* never enter Git;
* never be copied into frontend assets;
* be encrypted at rest by the storage layer and additionally protected according to Backup and Restore;
* use test-only sanitized fixtures for ordinary development;
* be destroyed only under an approved retention procedure.

A session-token digest is still sensitive metadata even though it cannot directly authenticate.

---

## Dependencies

Security-relevant dependencies must:

* be necessary and narrowly scoped;
* be pinned by the lockfile;
* be reviewed before introduction;
* receive automated vulnerability and update monitoring;
* be upgraded in focused changes with tests.

Node built-ins are used for scrypt, randomness, SHA-256, HMAC, and timing-safe comparison.

The project must not invent its own cryptographic primitive.

---

# Part 13 - Security Tests

## Password Tests

Tests cover:

* exact minimum and maximum code-point limits;
* UTF-8 byte limit;
* spaces and Unicode;
* no trimming or normalization;
* mismatched confirmation;
* malformed encoded hashes;
* wrong password;
* timing-safe equal-length comparison;
* dummy verification for unknown users;
* parameter upgrade after successful verification;
* authentication concurrency limit;
* no secret in logs or responses.

---

## Session Tests

Tests cover:

* secure cookie attributes in production;
* local cookie restrictions;
* same-site and cross-site deployment settings;
* raw token absent from SQLite;
* one active session per user;
* old-session rejection after replacement;
* seven-day absolute expiry;
* twelve-hour idle expiry;
* bounded last-used refresh;
* sign-out and all required revocation triggers;
* role and membership changes taking effect without session revocation;
* Socket.IO handshake, room isolation, expiry, and disconnect;
* no session token in logs, local storage, URL, or payload.

Time-dependent tests use an injected clock.

---

## Token Tests

Tests cover:

* correct expiry for each purpose;
* new-request invalidation;
* wrong-purpose rejection;
* unknown, malformed, expired, invalidated, and consumed generic failure;
* concurrent one-time consumption;
* digest-only storage;
* fragment removal and in-memory frontend handling;
* password reset revoking sessions;
* reactivation creating no session;
* setup expiry at 72 hours;
* token absence from logs and analytics.

---

## Request-Security Tests

Tests cover:

* exact allowed and denied Origins;
* no wildcard credentialed CORS;
* correct preflight;
* missing, wrong, expired-session, and cross-session CSRF token;
* unsafe request content type;
* same-site and cross-site Fetch Metadata;
* login CSRF attempt;
* SQL-injection strings treated as values;
* unknown sort field rejection;
* body-size and field-count limits;
* XSS-shaped display values rendered as text;
* security headers and CSP;
* public roster responses containing no private fields.

---

## Authorization Tests

At minimum, every protected feature tests:

* unauthenticated denial;
* inactive-account denial;
* no-membership denial;
* inactive-membership denial;
* manager acting on another team;
* commissioner acting outside their league;
* platform administrator without league membership;
* valid actor in one league targeting an object in another;
* object existence not leaked to unauthorized users;
* client-claimed role ignored;
* stale authorization after membership or assignment change;
* private Socket.IO event room isolation.

Use at least two leagues with overlapping display names and player pools.

---

## Rate-Limit and Audit Tests

Tests cover:

* network and account buckets independently;
* restart persistence;
* correct `Retry-After`;
* successful-login counter behavior;
* no permanent account lock;
* trusted proxy handling;
* IPv4 and IPv6 canonicalization;
* generic account-existence responses;
* audit creation and append-only behavior;
* audit visibility by user, league membership, and platform role;
* no password, hash, raw email, token, or active bid leakage;
* audit and League Activity remaining separate.

---

# Part 14 - Implementation Sequence

Security implementation proceeds in small verified stages:

1. Remove shipped hard-coded credentials and disable browser authority.
2. Add security configuration validation, clock, randomness, and redacted logging foundations.
3. Add user and credential repositories plus scrypt hashing tests.
4. Add opaque sessions, cookie handling, expiry, replacement, and revocation.
5. Add session-bootstrap CSRF and exact credentialed CORS.
6. Add sign-up and email verification.
7. Add sign-in, sign-out, and session replacement notification.
8. Add password change and reset.
9. Add deactivation and reactivation.
10. Add durable rate limits and generic public responses.
11. Add current membership, role, and team authorization policies to every protected feature.
12. Add league-scoped Socket.IO authentication and invalidation.
13. Add security audit and safe authorized views.
14. Add first-administrator bootstrap and provider-backed email delivery.
15. Complete staging security, dependency, log-redaction, and cross-league tests.

The active work plan must identify exact affected files and verification for each stage.

Authentication must not be switched on in production until the required account, permission, CSRF, session, rate-limit, email, audit, and rollback paths operate together in staging.

---

# Part 15 - Completion Criteria

Security preparation is complete when:

* password and session mechanisms are implemented exactly as specified;
* no plaintext or hard-coded credential ships in the frontend;
* the backend is authoritative for identity and permission;
* account-action tokens are digest-only, expiring, single-use, and purpose-bound;
* one-session enforcement and every revocation path pass concurrency tests;
* exact CORS, CSRF, cookie, and browser-header behavior is verified in the real hosting topology;
* durable rate limits and anti-enumeration responses pass;
* every league feature denies cross-league access;
* Socket.IO uses current backend authorization;
* logs and audits contain useful evidence without secrets;
* first-administrator creation is explicit and one-time;
* email links use a configured canonical origin and no secret-bearing tracking;
* staging uses different secrets, storage, accounts, and data;
* required tests pass;
* rollback and incident procedures are documented before production activation.

No secure-account launch is complete while the browser can still authenticate against hard-coded passwords or claim a role independently.

---

# Part 16 - Verification Commands

Document validation:

```powershell
Get-Content docs/04-technical-specs/SECURITY.md
rg -n "TODO|TBD|NEEDS DECISION|PENDING|\\[ \\]" docs/04-technical-specs/SECURITY.md
```

Implementation verification, once scripts and tests exist:

```powershell
npm test
npm run test:security
npm audit --omit=dev
```

Representative cookie and request checks:

```powershell
curl.exe -i -c cookies.txt -H "Origin: <frontend-origin>" -H "Content-Type: application/json" --data "{\"email\":\"<test-email>\",\"password\":\"<test-password>\"}" <api-origin>/api/v1/session
curl.exe -i -b cookies.txt -H "Origin: <frontend-origin>" <api-origin>/api/v1/session
curl.exe -i -X DELETE -b cookies.txt -H "Origin: <frontend-origin>" -H "X-CSRF-Token: <test-csrf-token>" <api-origin>/api/v1/session
```

Use only dedicated test credentials and staging or local origins. Never place a production password or token in shell history.

Expected verification includes:

* production cookie has `Secure`, `HttpOnly`, `Path=/`, no Domain, and the deployed `SameSite` value;
* invalid Origin or CSRF receives no state change;
* an old session fails after replacement;
* no raw session or action token exists in SQLite or logs;
* cross-league requests fail;
* public account-recovery responses do not reveal account existence.

---

# Part 17 - Technical References

Implementation should be checked against current official guidance at the time of coding:

* Node.js Crypto documentation for `scrypt`, `randomBytes`, `timingSafeEqual`, SHA-256, and HMAC;
* OWASP Password Storage Cheat Sheet;
* OWASP Session Management Cheat Sheet;
* OWASP Cross-Site Request Forgery Prevention Cheat Sheet;
* OWASP Authentication Cheat Sheet;
* OWASP Logging Cheat Sheet;
* Express and Socket.IO official security and proxy documentation;
* MDN cookie, Fetch Metadata, CORS, CSP, and Referrer Policy documentation.

If current primary guidance materially conflicts with an approved product requirement, implementation stops and documents the conflict instead of silently changing user-visible behavior.

---

# Final Approved Decisions

The security design is approved with:

* asynchronous Node `scrypt` using `N=131072`, `r=8`, `p=1`, a 16-byte salt, and a 32-byte key;
* exact password preservation with a 6-to-256 Unicode-code-point and 1024-byte safety boundary;
* no password pepper in the initial release;
* opaque 32-byte session tokens with digest-only SQLite storage;
* one active session, seven-day absolute expiry, and twelve-hour idle expiry;
* `__Host-hl_session` production cookies and deployment-accurate `SameSite`;
* stable session-bound HMAC-SHA-256 CSRF derivation, digest integrity,
  exact credentialed CORS, and Origin checks;
* digest-only, purpose-bound one-time account-action tokens;
* 24-hour verification, 72-hour setup, and 30-minute reset and reactivation links;
* durable network-and-account authentication rate limits;
* backend-derived authorization and strict league isolation;
* prepared SQL, strict validation, safe output rendering, security headers, and restrictive CSP;
* separate per-environment secrets and explicit one-time administrator bootstrap;
* append-only Security Audit separate from League Activity;
* secret-redacted logs, errors, email links, backups, and migration artifacts;
* staged implementation with comprehensive security and concurrency tests.

No authentication, account, database, or production state was changed by writing this specification.
