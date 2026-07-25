# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`ACTIVE`

## Work Plan ID

```text
M7-09
```

## Work Item

```text
Isolated Hosted Staging Deployment and Acceptance
```

# Objective

Deploy the exact M7 candidate to a new dedicated Netlify staging project and
the existing Render service `hundo-leago-backend-staging`, initialize only the
isolated staging database identity and deterministic two-league QA fixture,
and run the highest-value hosted acceptance checks that are safely possible.
Return the public staging URLs so Grae can complete manual browser testing.

# Authority and Boundary

Grae authorized continuous hosted staging work on `2026-07-24`.

This plan authorizes:

* a separate Netlify staging project created from the frontend `staging`
  branch;
* configuration and deployment of only Render service
  `hundo-leago-backend-staging` (`srv-d9eo2turnols73ekb830`);
* staging-only environment variables, public origins, secrets, persistent
  storage paths, database identity, providers, and job controls;
* explicit staging database initialization and migrations;
* the deterministic M7 two-league release-QA fixture;
* hosted HTTPS, CORS, CSRF, Socket.IO, authentication, authorization,
  league-isolation, provider-containment, backup/restore, and rollback checks
  that do not cross the staging boundary;
* staging-only corrective commits and staging-branch pushes when required.

This plan does not authorize:

* any use of a legacy `C:` Hundo Leago copy;
* any change, redeploy, restart, configuration update, domain update, or
  traffic action on Netlify production project `hundoleago`;
* any change, redeploy, restart, configuration update, database action, or
  job action on Render production service `hundo-leago-backend`;
* production reset, migration, deployment, traffic opening, job activation,
  provider activation, or write;
* a merge to `main`, pull request, tag, release, force-push, or history rewrite;
* treating a successful staging test as production authorization.

# Exact Candidate

```text
Release ID:              HL-20260724-1
Frontend repository:     E:\hundo-leago
Frontend branch:         staging
Frontend commit:         3d2cc5989badd9432c312410d4306d07d6c400ce
Backend repository:      E:\hundo-leago-backend
Backend branch:          staging
Backend commit:          d6eea77a0ab0b8c82a9bcd347d5ee0da76f0bd4a
Render staging service:  srv-d9eo2turnols73ekb830
```

Documentation-only evidence commits may follow the frontend candidate commit.
They must not change the verified application build inputs unless the complete
affected verification is rerun and a new exact candidate is recorded.

# Required Sequence

1. Verify both remote `staging` refs and the clean local branch states.
2. Inspect the existing Render staging service and current staging-only
   environment without exposing secret values.
3. Create or identify a separate Netlify staging project; positively verify it
   is not the production project `hundoleago`.
4. Establish the exact public frontend and backend staging origins.
5. Configure only staging environment variables and secrets, with jobs
   disabled, capture/sandbox email delivery, debug routes disabled, exact
   origins, and explicit environment/database identities.
6. Provision or select an isolated persistent staging database path, initialize
   it explicitly, apply the approved migrations, and load the deterministic
   two-league release-QA fixture.
7. Deploy the exact backend candidate to the existing Render staging service.
8. Build and deploy the exact frontend candidate to the dedicated Netlify
   staging project with the Render staging API origin.
9. Verify HTTPS, public health, build and environment identities, CORS,
   credentialed sessions, CSRF rejection and acceptance, Socket.IO
   authorization, role boundaries, and two-league isolation.
10. Verify provider failure containment and keep scheduled jobs disabled.
11. Run a staging backup/restore verification when a correctly isolated target
    and credentials are available; record any provider-dependent gate that
    cannot safely run.
12. Confirm rollback identities for both hosted staging services and leave
    production untouched.
13. Open the public Netlify staging site in the live browser for Grae.

# Configuration Safety

* Do not copy production environment variables, databases, provider
  credentials, domains, or storage objects into staging.
* Do not print, commit, or store plaintext secrets in the repositories.
* Use exact allowlisted HTTPS origins; do not use wildcard CORS.
* Keep `SCHEDULED_JOBS_ENABLED=false` throughout this plan.
* Keep staging email in capture or approved sandbox mode.
* Use a distinct `APP_ENVIRONMENT_ID`, `DATABASE_ID`, persistent path, and
  backup prefix for staging.
* Runtime initialization must be explicit and observable; it must not become
  an automatic production startup migration.

# Verification Evidence

Record:

* Netlify staging project identity and public HTTPS URL;
* Render staging service identity and public HTTPS URL;
* deployed frontend and backend source identities;
* schema version, migration checksum set, environment identity, database
  identity, and fixture checksum;
* authenticated and anonymous hosted check results;
* CORS, CSRF, cookie, Socket.IO, authorization, and league-isolation results;
* provider, backup/restore, and rollback results or explicit safe blockers;
* confirmation that production resources did not change.

# Rollback

If frontend staging fails, roll the dedicated Netlify staging project back to
its prior staging deploy or leave it unpublished. Do not touch `hundoleago`.

If backend staging fails, use only the Render staging service rollback identity
and preserve the isolated staging database for diagnosis. Do not restart,
redeploy, reconfigure, or write to the production Render service.

Correct source defects with new staging commits. Do not amend, reset, force
push, discard, or rewrite the published candidate.

# Stop Conditions

Stop hosted mutation when:

* the target cannot be positively identified as staging;
* an operation would affect either named production resource;
* a required value appears to be a production credential, database, domain,
  storage object, or provider target;
* origin, identity, persistent-path, schema, or migration evidence differs;
* initialization would overwrite a non-disposable or unidentified database;
* a secret would need to be committed or printed;
* a hosted gate reveals cross-league access or an authorization bypass;
* safe rollback identity cannot be established.

# Completion Gate

M7-09 completes only when:

* both public staging URLs are known and resolve over HTTPS;
* only the dedicated Netlify staging project and named Render staging service
  changed;
* hosted build, health, identity, database, fixture, authentication,
  authorization, isolation, CORS, CSRF, and Socket.IO checks pass;
* jobs remain disabled and provider behavior is contained;
* rollback evidence is recorded;
* any safely impossible provider or backup gate is explicit;
* Grae receives the staging URL and can test it in the live browser;
* production remains unchanged and blocked.

# Next Step Boundary

After M7-09, Grae performs manual hosted staging acceptance. Production work
requires separate explicit authorization after that acceptance; it is not part
of this plan.
