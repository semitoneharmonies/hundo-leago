# Hundo Leago — User Accounts

## Document Status

`APPROVED`

This product specification consolidates:

* approved Season 2 account, authentication, and session requirements;
* approved permission boundaries that depend on a verified user identity;
* user-visible sign-up, sign-in, password, recovery, deactivation, and reactivation workflows;
* current implementation limitations that must not be treated as approved security behaviour;
* approved product decisions that account implementation must follow.

Grae approved the Season 2 User Accounts product specification recorded in this document on 2026-07-18.

---

## Product Purpose

Hundo Leago needs one secure account system that identifies a person independently from any league or team.

This specification defines how:

* a visitor creates an account;
* a platform administrator creates an account;
* a user signs in and signs out;
* the application maintains one authenticated session;
* a user changes or resets a password;
* a user deactivates and reactivates an account;
* account identity connects safely to league memberships and team assignments;
* security-sensitive events are recorded and exposed;
* invalid, stale, duplicated, or hostile requests fail without granting access.

The goal is to give every later feature a stable, backend-verified user identity and a predictable account lifecycle.

---

## Out of Scope

This document does not define:

* league creation;
* commissioner invitations;
* team-manager invitations or transfers;
* exact league membership administration;
* feature-specific commissioner or manager permissions;
* roster, contract, auction, trade, matchup, standings, or draft workflows;
* database table definitions;
* exact API paths, request bodies, or response bodies;
* password-hashing library selection;
* session-storage technology;
* email-provider selection;
* deployment secrets;
* backup or migration procedures.

Those subjects belong in Leagues and Teams, Permissions, API Contracts, Data Model, Deployment, Testing Strategy, and related specifications.

---

# Part 1 — Product Authority

## Source Documents

This specification depends on:

```text
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
```

When this product specification conflicts with an approved shared rule, the approved shared rule remains authoritative until the conflict is deliberately resolved.

---

## Existing Behaviour Is Not the Target Account System

The current frontend contains hard-coded team names, roles, and plaintext passwords.

It compares credentials in the browser and stores the selected login identity in browser local storage.

The current backend does not provide:

* persistent user accounts;
* secure password storage;
* backend credential verification;
* backend-managed sessions;
* session revocation;
* password reset;
* account deactivation and reactivation;
* account-to-membership relationships;
* reliable authorization based on a verified user.

This behaviour is current implementation only.

It is not approved authentication, is not a safe foundation for new code, and must not be copied into new features.

Frontend state such as a role name, team name, selected team, user object, or local-storage value is never proof of identity or authority.

---

## Backend Authority

The backend is authoritative for:

* account identity;
* account status;
* credential verification;
* password-change and password-reset state;
* authenticated session creation;
* session validity and expiration;
* session revocation;
* the authenticated user ID attached to a request;
* current memberships, roles, and team assignments used during authorization;
* security-audit records.

The frontend may collect credentials and display account state, but it must not independently authenticate a user or decide that a session is valid.

---

## Deny by Default

Missing, expired, revoked, malformed, or unverifiable authentication must fail safely.

Failure must:

* grant no authenticated identity;
* grant no protected read;
* grant no write;
* leave durable league and account state unchanged except for an approved security-audit event;
* return a clear user-facing result without exposing secrets or internal security details.

No account or session operation may silently fall back to the current hard-coded frontend login.

---

# Part 2 — Identity and Account Records

## User

A user is a person with one Hundo Leago account.

One stable user ID identifies the account across:

* password changes;
* display-name changes;
* league memberships;
* role changes;
* team assignments and transfers;
* account deactivation and reactivation.

Names, email addresses, login identifiers, league names, and team names must not replace the stable user ID in stored relationships.

---

## Account Is Separate From League Access

Creating or possessing an account does not:

* create a league;
* create a membership;
* assign a commissioner role;
* assign a team;
* grant access to private league information;
* authorize a league action.

A user may participate in more than one league when separate active memberships permit it.

Account authentication answers who the user is.

Permissions, memberships, and team assignments determine what that user may do in a particular league.

---

## Account Status

The account must have an explicit lifecycle status rather than using deletion or a missing password as an informal status.

At minimum, the product must distinguish:

* an account that may authenticate;
* a user-deactivated account that may follow the approved reactivation workflow;
* an account disabled by an authorized platform safety action, if that action is approved.

Status changes must be saved atomically and checked by the backend during authentication and every protected request.

---

## Credentials

Passwords are secrets used only to prove identity.

The product must never:

* store a recoverable plaintext password;
* return a password or password hash to a client;
* display an existing password;
* log a password;
* place a password in a URL;
* use a team name as proof of account ownership;
* expose password-reset tokens or session secrets in activity history.

The backend must store passwords using an approved one-way password-hashing method defined in the technical specifications.

The approved initial password policy is:

* minimum length of `6` characters;
* implementation safety maximum of at least `128` characters;
* spaces and Unicode characters are permitted;
* no required uppercase, lowercase, number, or symbol categories;
* no common-or-compromised-password-list rejection in the initial release;
* the new password is entered twice during sign-up, password change, and password reset.

---

# Part 3 — Product Actors

## Unauthenticated Visitor

An unauthenticated visitor may:

* access the home-page sign-in form;
* access the home-page sign-up form;
* begin the approved password-reset workflow;
* begin the approved self-reactivation workflow;
* view approved public roster information.

An unauthenticated visitor may not:

* access private account information;
* inspect whether an account exists through account-error differences;
* access private league information;
* perform a league write.

---

## Authenticated User

An authenticated user may:

* sign out;
* view the approved fields of their own account;
* change their own password;
* deactivate their own account;
* reactivate their own account through the approved workflow;
* access leagues and teams only where current authorization permits.

An authenticated account is not automatically a manager, commissioner, or platform administrator.

---

## Platform Administrator

An authorized platform administrator may create a user account.

Platform-administrator account tools must not reveal:

* a user’s password;
* a password hash;
* a session token;
* a password-reset token;
* a recovery secret.

Platform-administrator recovery powers must be explicit, narrowly scoped, confirmed where destructive or wide-reaching, and recorded in the security audit.

The initial platform administrator is Grae.

---

## Commissioner

A commissioner may not create user accounts.

Commissioners may administer approved league memberships and team assignments only within their leagues.

Those actions do not give commissioners access to passwords, sessions, password resets, or platform account administration.

---

# Part 4 — Self-Service Sign-Up

## Entry Point

The sign-up form is available from the home page.

The user chooses their credentials through this workflow.

Sign-up must not require the user to already belong to a league or team.

---

## Normal Sign-Up Sequence

The intended sequence is:

1. The visitor opens the home-page sign-up form.
2. The visitor enters an email address, unique display name, password, and matching password confirmation.
3. The frontend performs helpful format checks.
4. The backend independently normalizes and validates every submitted field.
5. The backend checks approved uniqueness rules without exposing other account details.
6. The backend securely transforms the password for storage.
7. The backend creates exactly one account with a stable user ID.
8. The backend records the approved security-audit event.
9. The product begins the approved email-control verification workflow.
10. The account remains unable to sign in until the user verifies control of that email address.
11. Successful verification signs the user in automatically.

The account and its credential record must be created atomically.

If any required save fails, no partial usable account may remain.

---

## Duplicate and Repeated Submission Safety

Double-clicks, retries, refreshed pages, repeated network requests, and concurrent requests must not create duplicate accounts.

The backend must enforce uniqueness.

A disabled submit button is useful interface feedback but is not a correctness guarantee.

If a request result is uncertain, the frontend must not invent a successful account or session.

---

## Sign-Up Does Not Grant League Authority

Successful self-service sign-up produces an account only.

It must not automatically:

* join a league;
* create a team;
* claim an unassigned team;
* become a manager;
* become a commissioner;
* become a platform administrator.

League invitations, memberships, and assignments use the separately approved Leagues and Teams workflows.

---

# Part 5 — Administrator-Created Accounts

## Entry Point

Account creation is available only to an authenticated, authorized platform administrator.

The backend must verify platform-level authority when the create request is received.

Hiding the control from other users is not sufficient authorization.

---

## Normal Administrator-Creation Sequence

The intended sequence is:

1. The platform administrator opens the account-creation control.
2. The administrator enters the approved initial email address and display name.
3. The backend validates current platform-administrator authority.
4. The backend validates and normalizes the account fields.
5. The backend creates one account with a stable user ID in `Pending Credential Setup` status.
6. The product sends a single-use credential-setup link to the user’s email address.
7. The credential-setup link expires after `72` hours.
8. The user opens the link and chooses a password without the platform administrator viewing or communicating it.
9. The backend records the administrator as actor and the new user as target in the security audit.
10. The product shows a clear success or failure result.

The platform administrator may resend an expired credential-setup invitation.

Creating an account must remain separate from:

* creating a league membership;
* assigning a commissioner;
* assigning a team manager;
* granting platform-administrator authority.

Each separate action requires its own authorization and atomic save.

---

# Part 6 — Sign-In

## Entry Point

The sign-in form is available on the home page.

Authentication must be performed by the backend.

The browser must not contain a credential list or compare submitted passwords with hard-coded values.

---

## Normal Sign-In Sequence

The intended sequence is:

1. The visitor enters their verified email address and password.
2. The frontend sends them only through an approved protected request.
3. The backend applies login abuse controls.
4. The backend locates the eligible account without exposing lookup details.
5. The backend verifies the password securely.
6. The backend verifies that the account may authenticate.
7. The backend invalidates any earlier session for that user.
8. The backend creates one new expiring session.
9. The backend records the sign-in result in the security audit.
10. The frontend receives only the safe account and session state needed by the interface.
11. The product returns the user to the last requested protected page when that page remains authorized.
12. If the requested page is unavailable or no longer authorized, the product sends the user to the league-selection page.

The session must identify the user by stable user ID.

The frontend must not submit or accept a role, membership, or team as proof of login authority.

---

## Failed Sign-In

Failed sign-in must:

* create no authenticated session;
* leave an existing valid session unchanged unless an approved security rule says otherwise;
* reveal neither whether the identifier exists nor why a particular credential failed;
* preserve the user’s non-secret form input only where safe;
* clear the password field;
* record the approved security-audit data without recording the password.

---

## Post-Sign-In League Selection

After sign-in, the product may show leagues available through the user’s current memberships.

The product must not assume:

* the user has exactly one league;
* the account name is a team name;
* the last selected league is still available;
* the last selected team is still assigned;
* the user still has the same role.

Current permissions must be loaded from backend state.

---

# Part 7 — Sessions

## Backend-Managed Session

A session is a securely managed authenticated login state.

It allows the backend to identify the user across requests without repeatedly sending the password.

The technical specification must select a session mechanism that:

* keeps session secrets out of application URLs;
* prevents client-written identity claims from becoming authority;
* supports expiration;
* supports immediate server-side revocation;
* protects production transport and browser storage appropriately;
* prevents scripts from reading session secrets where the selected architecture permits;
* supports request-forgery protection where required.

---

## One Session Per User

Concurrent sessions are not permitted.

A successful new login invalidates the user’s previous session before the new session becomes the only valid session.

The verified email address receives a mandatory security notification that a new session replaced the earlier session.

The previous browser must fail safely on its next protected request.

That browser receives a generic signed-out state.

No protected action may succeed merely because an old page still displays authenticated controls.

---

## Session-Derived Identity

Every protected action must derive the acting user ID from the verified session.

Client-supplied fields such as:

* `userId`;
* `role`;
* `teamName`;
* `teamId`;
* `leagueId`;
* `isCommissioner`;
* `isAdmin`;

may provide request context where appropriate, but they are never proof of identity or authority.

The backend must reload current permissions for each protected action.

---

## Role and Membership Changes

Membership and role changes do not revoke the authenticated session.

They take effect on the next protected request because the backend reloads current authorization state.

For example:

* a removed manager may remain signed in but may no longer manage the former team;
* a removed commissioner may remain signed in but may no longer use commissioner tools;
* a new membership may become available without requiring a new login;
* a stale open form may remain visible but its unauthorized submission must fail.

---

## Required Session Revocation

The current session must become invalid after:

* explicit sign-out;
* password reset;
* account deactivation;
* a successful new login for that user;
* session expiration;
* any approved platform security action that revokes the session.

A successful password change invalidates all existing sessions and requires the user to sign in again.

---

## Session Expiration

Sessions must expire.

A session has an absolute lifetime of `7` days and expires after `12` hours without a protected request.

Valid protected activity may refresh the idle deadline but never extend the absolute lifetime.

There is no `Remember me` option in the initial release.

When the interface is open, the product warns the user shortly before the idle deadline expires.

Expired sessions must never be silently recreated from unverified browser state.

Closing the browser does not itself invalidate a session.

---

# Part 8 — Sign-Out

## Normal Sign-Out Sequence

The intended sequence is:

1. The authenticated user selects sign out.
2. The backend invalidates the current session.
3. The frontend clears non-authoritative authenticated interface state.
4. The product returns to the approved public destination.
5. Any later protected request using the old session fails safely.

The backend result is authoritative.

Removing a local-storage user object without revoking the backend session is not a complete sign-out.

---

## Sign-Out Failure

If the frontend cannot confirm the sign-out response, it must clear local authenticated presentation state and avoid presenting the session as safely reusable.

The technical specification must define retry and token-expiration handling without allowing a network failure to expose protected information.

---

# Part 9 — Password Change

## User-Initiated Change

An authenticated user may change their own password.

The backend must:

* identify the user from the session;
* verify the current password;
* validate the new password;
* require a matching new-password confirmation;
* require the new password to differ from the current password;
* securely store the new password representation;
* avoid storing or logging either submitted password;
* invalidate all existing sessions;
* record the change in the security audit;
* send a mandatory security notification to the verified email address;
* require the user to sign in again.

The old and new credential state must not be partially applied.

---

## Password Reuse

The new password must differ from the current password.

The initial release keeps no longer password history.

The product must not claim to detect password reuse unless the backend has a safe implementation that does not store recoverable passwords.

---

# Part 10 — Password Reset and Account Recovery

## Recovery Method

Account recovery uses password reset.

The product must never send an existing password to a user or administrator.

Password-reset requests use the account’s verified email address.

The public response is the same whether or not the submitted email belongs to an eligible account.

A reset link expires after `30` minutes. Requesting a new link invalidates every earlier outstanding reset link for that account.

Password-reset request and completion notifications are sent to the account’s verified email address.

---

## Password-Reset Safety

Any reset token or equivalent recovery secret must be:

* unpredictable;
* time-limited;
* single-use;
* stored and compared safely;
* invalidated after successful use;
* excluded from logs and league activity history;
* unusable to identify a different account;
* protected from replay and concurrent double use.

The user-facing request result must not reveal whether the submitted identifier belongs to an account.

---

## Successful Reset

A successful password reset must:

* replace the password atomically;
* invalidate every existing session for that user;
* invalidate every outstanding reset secret for that user;
* record the approved security-audit event;
* send the request and completion notifications to the verified email address;
* send the user to sign in with the new password.

An authorized platform administrator may send a user a new password-reset link but may not set or view the password.

A failed or expired reset must change neither the password nor account status.

---

# Part 11 — Deactivation and Reactivation

## Self-Deactivation

Each user may deactivate their own account.

The action must:

* require an authenticated session;
* require the current password;
* require an `Are you sure?` confirmation;
* explain that league roles and team assignments may be reassigned while the account is inactive;
* atomically change the account status;
* invalidate the user’s session;
* prevent new sign-ins while deactivated;
* send a mandatory security notification to the verified email address;
* record the security event;
* preserve records that must remain attributable.

Self-deactivation is not permanent deletion.

A deactivated account is retained indefinitely and is not automatically deleted.

---

## Effect on League Records

Account deactivation must not erase:

* the user’s historical identity;
* league activity records;
* security-audit records;
* completed transactions;
* historical team assignments;
* other records that must remain attributable.

Leagues and Teams defines how active commissioner and manager responsibilities are reassigned or made inactive.

Account code must call or coordinate with those approved workflows rather than silently leaving invalid league authority.

---

## Self-Reactivation

Each user may reactivate their own account.

Reactivation must:

* use a single-use link sent to the verified email address;
* require the current password after the user opens the link;
* reactivate only the intended account;
* create no league membership or team assignment;
* restore no role that was separately removed;
* create no authenticated session automatically;
* send a mandatory security notification to the verified email address;
* record the security event;
* produce a clear result.

Reactivation restores account eligibility only.

It does not undo membership or assignment changes made while the account was inactive.

The user signs in normally after reactivation succeeds.

---

## Platform Safety Disablement

A platform administrator may disable an account for platform safety separately from user self-deactivation.

Platform safety disablement and re-enablement:

* require confirmation;
* require a security-audit record;
* preserve historical attribution.

A platform-disabled account cannot self-reactivate until a platform administrator removes the safety disable.

---

# Part 12 — Account Profile

## Product Identity and Display Identity

The stable user ID is the permanent system identity.

Human-readable account fields are display or login data and may change only through approved workflows.

Changing a human-readable field must not:

* create a new user;
* break memberships;
* transfer team control;
* change historical attribution;
* alter the stable user ID.

Self-service sign-up requires:

* one verified email address;
* one unique display name;
* one password.

The email address is the login identifier and there is no separate username.

Email addresses are unique across the platform after trimming whitespace and comparing without case sensitivity.

Display names:

* must be unique;
* have a maximum of `50` characters;
* permit ordinary letters, numbers, spaces, punctuation, and Unicode characters;
* may be changed after account creation, subject to the same validation and uniqueness rule.

The account email address may not be changed after account creation.

The initial release has no user avatar, biography, or other public account profile fields.

---

## Private Account Data

A normal authenticated user may view only the approved private fields of their own account.

League members must not gain access to another user’s private account information merely because they share a league.

Public roster access must not expose private account data.

Any public or league-visible manager name must be an explicitly approved display field rather than an email address or login secret.

---

# Part 13 — Validation and Error Behaviour

## Backend Validation

Every account input must be validated by the backend.

Frontend validation may improve usability but is never sufficient.

Validation must cover:

* required fields;
* whitespace and normalization;
* approved length limits;
* approved character rules;
* uniqueness;
* password policy;
* account status;
* session status;
* authorization;
* reset-secret validity;
* repeated and concurrent requests.

---

## Enumeration Resistance

Public account endpoints must not allow a visitor to discover registered accounts by comparing:

* response messages;
* status details;
* response shape;
* redirect destination;
* materially different timing where reasonably preventable.

Internal logs may record the real reason where safe, but client-visible results must follow the approved generic-message policy.

---

## Safe Errors

User-facing errors must:

* explain what the user can do next;
* avoid passwords, hashes, tokens, session secrets, and recovery secrets;
* avoid internal stack traces;
* avoid disclosing another account;
* avoid claiming success when durable state is uncertain.

Logs must contain enough non-secret context for diagnosis.

---

## Atomic State Changes

Account creation, password replacement, deactivation, reactivation, session replacement, and reset-secret consumption must be atomic at the product level.

A failure must not leave:

* an account without a valid intended status;
* two valid sessions when only one is allowed;
* a reset secret reusable after a completed reset;
* a new password saved while the old session remains valid contrary to the approved rule;
* a partially created membership or role.

---

# Part 14 — Abuse and Security Controls

## Login Abuse

The product requires controls against repeated credential guessing and automated account abuse.

Those controls must not:

* create a permanent denial of service from a small number of failed attempts;
* disclose whether an account exists;
* rely only on frontend delays;
* store attempted passwords;
* prevent platform administrators from diagnosing incidents through safe audit data.

Public sign-in, sign-up, reset, and reactivation endpoints use backend rate limits based on network source and the relevant normalized account identifier.

Repeated failures cause temporary throttling rather than permanent account lockout.

The initial release does not use CAPTCHA.

Exact safe thresholds and implementation mechanics belong in the Security technical specification.

---

## Sensitive Data

Passwords, password hashes, reset secrets, session secrets, and deployment secrets must never appear in:

* API responses not expressly designed to set an opaque session credential;
* browser application state readable by ordinary UI code where avoidable;
* local storage;
* query strings;
* analytics;
* league activity history;
* security-audit views;
* application logs;
* error messages.

---

## Production and Non-Production Accounts

Test and development accounts must not provide hidden production access.

Non-production credentials must not be embedded in the production frontend.

Any bootstrap procedure for the initial platform administrator must be explicit, one-time, auditable, and documented in Deployment and Operations.

---

# Part 15 — Audit and History

## Security Audit

Security-audit records must include the approved non-secret context for:

* successful sign-in;
* failed sign-in;
* sign-out or session revocation where required;
* password change;
* password-reset request and completion at the approved level of detail;
* account creation;
* account deactivation;
* account reactivation;
* platform-administrator recovery action;
* role, membership, commissioner, and team-assignment changes;
* denied high-risk actions.

Security-audit records retain:

* user ID;
* event type;
* outcome;
* timestamp;
* safe network metadata;
* safe client metadata;
* actor ID when different;
* target ID when applicable.

Security-audit records are retained for the lifetime of the platform unless Operations later approves a longer legal or shorter privacy-driven policy.

---

## Security Audit Visibility

Every authenticated user in a league may view the approved league-scoped login and security-audit information.

Platform administrators may view platform-wide audit information.

Visibility must not expose:

* passwords or hashes;
* session or reset secrets;
* private recovery data;
* unrelated private account data;
* security information outside the viewer’s approved scope.

Account events that do not belong to a league must not be placed into a league merely because the user is a member there.

---

## Account Security Notifications

Successful:

* password change;
* password reset;
* self-deactivation;
* self-reactivation;
* replacement of an earlier session by a new session;

send a mandatory security notification to the verified email address.

A user may not disable these account-security notifications.

---

## League Activity History

Security authentication events are not ordinary league transactions.

They belong in the security audit, not in league activity history, unless an approved feature specification explicitly defines a league administration event that belongs in both.

Matchup and standings information must not be added to activity history by account workflows.

---

# Part 16 — User Interface Requirements

## Home Page

The home page must provide clear access to:

* sign in;
* sign up;
* password reset;
* approved public roster browsing.

An authenticated view must provide clear access to sign out and the approved account-management controls.

---

## Forms

Account forms must:

* label every field;
* identify required fields;
* support keyboard navigation;
* associate validation messages with the relevant field;
* use password input controls for passwords;
* prevent accidental duplicate submission while a request is pending;
* preserve safe input after a correctable error;
* clear secrets when appropriate;
* show a clear pending, success, or failure state.

The interface must not show a successful account, password, or session change before the backend confirms it.

---

## Stale Interface State

When a protected request fails because the session is invalid, the frontend must:

* stop presenting the request as successful;
* clear or refresh stale authenticated state;
* direct the user to sign in again;
* preserve only non-secret work where safe;
* avoid automatic resubmission of a write after reauthentication unless a later specification explicitly approves it.

---

# Part 17 — Required Testing

## Account Creation Tests

Tests must cover:

* valid self-service sign-up;
* valid platform-administrator account creation;
* commissioner account-creation denial;
* unauthenticated administrator-route denial;
* duplicate identifiers;
* normalization collisions;
* missing and invalid fields;
* repeated submission;
* concurrent duplicate submission;
* storage failure without a partial account;
* sign-up without accidental membership or role creation.

---

## Authentication Tests

Tests must cover:

* successful sign-in;
* incorrect identifier;
* incorrect password;
* deactivated account;
* malformed input;
* abuse-control behaviour;
* generic non-enumerating errors;
* one valid session per user;
* old-session rejection after a new login;
* expired-session rejection;
* revoked-session rejection;
* client-supplied role and user-ID impersonation attempts.

---

## Password and Recovery Tests

Tests must cover:

* valid password change;
* invalid prerequisite credentials where required;
* password-policy rejection;
* reset request for existing and non-existing identifiers with safe public results;
* expired reset secret;
* reused reset secret;
* concurrent reset use;
* reset for the wrong account;
* session revocation after reset;
* storage failure without partial password replacement.

---

## Lifecycle Tests

Tests must cover:

* self-deactivation;
* session invalidation after deactivation;
* sign-in denial while deactivated;
* self-reactivation;
* reactivation without automatic role or membership restoration;
* preserved historical attribution;
* commissioner and manager continuity according to Leagues and Teams;
* concurrent deactivation, reactivation, and protected-action requests.

---

## Multi-League Tests

Use at least:

* two leagues;
* one user with memberships in both leagues;
* one user with an account but no membership;
* one manager with more than one team where permitted;
* one commissioner who is also a manager;
* one platform administrator with protected active memberships in both leagues,
  plus a deliberately corrupted missing-membership fixture that must fail
  closed until reconciliation.

Verify that authentication establishes one user identity while authorization remains isolated by league, membership, role, and team assignment.

---

# Part 18 — Approval Checklist

Grae approved the following Season 2 User Accounts product decisions on 2026-07-18.

## Approved Account Foundation

- [x] One person uses one stable Hundo Leago user account.
- [x] A user may participate in more than one league.
- [x] An account alone grants no private league access or league authority.
- [x] Stable user IDs, not names, connect accounts to memberships, roles, teams, and history.
- [x] Initial user categories are platform administrator, league commissioner, team manager, and unauthenticated visitor.
- [x] One user may hold multiple roles in the same league.
- [x] A commissioner may also manage a team in the same league.
- [x] Every active platform administrator is guaranteed one protected active `member` membership in every non-deleted league; missing membership is invariant corruption and fails closed until reconciliation.
- [x] The frontend never proves identity or authority.
- [x] The backend verifies credentials, manages sessions, and reloads authorization for each protected action.
- [x] Read-only endpoints remain read-only.
- [x] Missing or ambiguous authority fails without changing league state.

## Approved Creation and Access

- [x] An authorized platform administrator may create user accounts.
- [x] Users may create their own accounts through a home-page sign-up form.
- [x] A commissioner may not create user accounts.
- [x] Sign-in and sign-up controls are available on the home page.
- [x] Users choose credentials during self-service sign-up.
- [x] Self-service account creation does not create a league, membership, role, or team assignment.
- [x] Unauthenticated visitors may use login-related workflows and view approved public rosters only.

## Approved Password and Lifecycle Rules

- [x] Passwords use secure one-way storage and backend verification.
- [x] Passwords, hashes, session secrets, and recovery secrets are never exposed in logs or activity history.
- [x] Users may change their own passwords.
- [x] Account recovery uses password reset and never returns an existing password.
- [x] Each user may deactivate and reactivate their own account.
- [x] Deactivation invalidates the session and preserves records that must remain attributable.
- [x] Reactivation restores account eligibility but does not automatically restore a removed membership, role, or team assignment.

## Approved Session Rules

- [x] Sessions are backend-managed and expire.
- [x] Protected actions derive the acting user from the verified session.
- [x] Concurrent sessions are prohibited.
- [x] A successful new login invalidates the previous session.
- [x] Sign-out, password reset, account deactivation, and a new login invalidate the affected session.
- [x] Membership and role changes do not revoke the authenticated session.
- [x] Current permissions are reloaded for every protected action.
- [x] A stale page or client-supplied role cannot preserve removed authority.

## Approved Audit Rules

- [x] Login successes and failures, session revocation, account recovery, role changes, membership changes, team-assignment changes, and denied high-risk actions are security-audit subjects.
- [x] Every authenticated league user may view approved league-scoped login and security-audit information.
- [x] Platform administrators may view approved platform-wide security-audit information.
- [x] Security-audit views never expose passwords, hashes, session secrets, reset secrets, or unrelated private account data.
- [x] Authentication events are not ordinary league activity-history transactions.
- [x] Account workflows never add matchup or standings information to activity history.

## Account Fields and Identity Decisions

- [x] Self-service sign-up requires an email address, display name, and password.
- [x] Email address is the login identifier; there is no separate username.
- [x] Email addresses are unique across the platform after trimming whitespace and comparing without case sensitivity.
- [x] A user must verify control of the email address before the account may sign in.
- [x] Display names must be unique.
- [x] Display names have a maximum of `50` characters.
- [x] Display names permit ordinary letters, numbers, spaces, punctuation, and Unicode characters.
- [x] Users may change their display name after account creation.
- [x] Users may not change their email address after account creation.
- [x] Other league members may see a user’s display name, but never the user’s email address.
- [x] The initial release has no user avatar, biography, or other public account profile fields.

## Password Decisions

- [x] Passwords require at least `6` characters.
- [x] Passwords permit spaces and Unicode characters.
- [x] Passwords have no composition rule requiring particular uppercase, lowercase, number, or symbol categories.
- [x] The initial release does not reject passwords by checking a common-or-compromised-password list.
- [x] Password input has an implementation-defined safety maximum of at least `128` characters.
- [x] Sign-up, password change, and password reset require the new password to be entered twice.
- [x] Password change requires the current password.
- [x] A successful password change invalidates all existing sessions and requires the user to sign in again.
- [x] The new password must differ from the current password, but the initial release keeps no longer password history.

## Sign-Up and Administrator-Creation Decisions

- [x] Successful self-service sign-up signs the user in automatically after email verification.
- [x] An account created by a platform administrator begins in a pending-credential-setup state.
- [x] Administrator-created accounts receive a single-use email link to choose their own password.
- [x] Platform administrators never choose, view, or communicate a temporary password.
- [x] An unused administrator-created account invitation expires after `72` hours.
- [x] A platform administrator may resend an expired credential-setup invitation.
- [x] Account creation records the actor, target user ID, creation method, timestamp, and result in the security audit.

## Sign-In and Session Decisions

- [x] A successful sign-in returns the user to the last requested protected page when it is still authorized, otherwise to the user’s league-selection page.
- [x] A session has an absolute lifetime of `7` days.
- [x] A session expires after `12` hours without a protected request.
- [x] Valid activity may refresh the idle deadline but never extend the absolute lifetime.
- [x] The product has no `Remember me` option in the initial release.
- [x] The product warns the user shortly before an idle session expires when the interface is open.
- [x] The old browser receives a generic signed-out state after another browser creates the replacement session.
- [x] Closing the browser does not itself invalidate a session.

## Password-Reset Decisions

- [x] Password-reset requests use the account’s verified email address.
- [x] The public response is the same whether or not the submitted email belongs to an eligible account.
- [x] A password-reset link expires after `30` minutes.
- [x] Requesting a new password-reset link invalidates every earlier outstanding reset link for that account.
- [x] A successful password reset invalidates all sessions and sends the user to sign in with the new password.
- [x] Platform administrators may send a user a new password-reset link but may not set or view the password.
- [x] Password-reset request and completion notifications are sent to the account’s verified email address.

## Deactivation and Reactivation Decisions

- [x] Self-deactivation requires the current password and an `Are you sure?` confirmation.
- [x] The deactivation screen explains that league roles and team assignments may be reassigned while the account is inactive.
- [x] A deactivated account is retained indefinitely and is not automatically deleted.
- [x] Self-reactivation uses a single-use link sent to the account’s verified email address.
- [x] Reactivation requires the user to confirm the current password after opening the link.
- [x] Reactivation creates no session automatically; the user signs in after success.
- [x] A platform administrator may disable an account for platform safety separately from user self-deactivation.
- [x] A platform-disabled account cannot self-reactivate until the platform administrator removes the safety disable.
- [x] Platform safety disablement and re-enablement require confirmation and a security-audit record.

## Abuse, Error, and Notification Decisions

- [x] Public sign-in, sign-up, reset, and reactivation endpoints use backend rate limits by network source and relevant normalized account identifier.
- [x] Repeated failures cause temporary throttling rather than permanent account lockout.
- [x] The initial release does not use CAPTCHA.
- [x] Public responses use generic wording whenever more specific wording would reveal whether an account exists.
- [x] Successful password change, password reset, deactivation, reactivation, and new-session replacement send a security notification to the verified email address.
- [x] A user may not disable mandatory account-security notifications.
- [x] Security-audit records retain the user ID, event type, outcome, timestamp, safe network metadata, safe client metadata, actor ID when different, and target ID when applicable.
- [x] Security-audit records are retained for the lifetime of the platform unless Operations later approves a longer legal or shorter privacy-driven policy.

## Approval

- [x] Remaining implementation details are assigned to the appropriate product and technical specifications.
- [x] Grae approves this document as the Season 2 User Accounts product specification.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The rule-approval phase for this product specification is complete because:

* Grae approved or revised every material product decision;
* no unchecked workflow is presented as final behaviour;
* self-service and administrator-created account workflows are explicit;
* email, display-name, and password rules are explicit;
* sign-in, session replacement, expiration, and sign-out behaviour are explicit;
* password change and reset workflows are explicit;
* deactivation, reactivation, and platform safety disablement are explicit;
* abuse controls, security notifications, audit data, and retention are explicit;
* user-interface expectations and failure states are clear.

The planned Data Model, API Contracts, Security, Frontend Structure, Testing Strategy, Deployment, and operations documents must implement these approved workflows.

Current hard-coded login behaviour remains current-state evidence only and must not be treated as approved authentication.

---

# Related Documents

```text
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/04-technical-specs/DEPLOYMENT.md
docs/04-technical-specs/SECURITY.md
docs/07-testing/TESTING_STRATEGY.md
docs/08-operations/BACKUP_AND_RESTORE.md
```
