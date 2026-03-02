---
status: awaiting_human_verify
trigger: "Investigate issue: auth-register-500"
created: 2026-03-01T00:00:00Z
updated: 2026-03-01T00:00:03Z
---

## Current Focus

hypothesis: Running local D1 migrations before the dev server starts prevents auth routes from hitting missing `users` and `sessions` tables.
test: Have the user restart local dev with the updated `pnpm dev` flow and retry registration against the real worker binding.
expecting: Startup will apply migrations to local D1, after which `/api/auth/register` should create a user or return a normal validation/conflict response instead of a schema-driven 500.
next_action: wait for user confirmation from a real local register attempt

## Symptoms

expected: Register endpoint should create a user or return a validation/conflict error.
actual: Endpoint returns HTTP 500 Internal Server Error.
errors: User reported only the 500 from browser devtools. Current code has no local try/catch around auth register DB operations.
reproduction: In local dev, submit the register form or POST JSON to /api/auth/register.
started: Current repository state on 2026-03-01.

## Eliminated

## Evidence

- timestamp: 2026-03-01T00:00:01Z
  checked: workers/routes/auth.ts
  found: The register route calls `getUserByUsername`, `createUser`, and `createSession` without a local try/catch around D1 operations.
  implication: Missing-table or other D1 errors bubble up as unhandled HTTP 500 responses.

- timestamp: 2026-03-01T00:00:01Z
  checked: lib/database/auth.ts
  found: Auth queries directly read/write `users` and `sessions`.
  implication: Register depends on both auth tables existing before the route is called.

- timestamp: 2026-03-01T00:00:01Z
  checked: migrations/0001_initial_schema.sql and wrangler.jsonc
  found: The active Wrangler D1 config uses root `migrations/`, and migration `0001_initial_schema.sql` creates `users` and `sessions`.
  implication: The intended source of truth for schema includes the auth tables.

- timestamp: 2026-03-01T00:00:01Z
  checked: db/database.sql
  found: The checked-in schema snapshot omits `users`, `sessions`, and `user_preferences`.
  implication: Alternate local bootstrap paths can create a tools-only database that is incompatible with auth routes.

- timestamp: 2026-03-01T00:00:01Z
  checked: README.md and package.json
  found: Local setup instructs `pnpm run db:migrate:local`, but `pnpm dev` itself does not enforce migrations.
  implication: Local development can still start against a stale or never-migrated D1 state.

- timestamp: 2026-03-01T00:00:01Z
  checked: .wrangler/state/v3/d1/miniflare-D1DatabaseObject/42beaf551cafa88b31b16792193d510f0952a15b652ac338e14a8114f1f06117.sqlite
  found: The existing local D1 file contains only tool tables and lacks `users` and `sessions`.
  implication: The reported 500 is reproducible from the current local state and matches the missing-schema hypothesis.

- timestamp: 2026-03-01T00:00:01Z
  checked: `pnpm exec wrangler d1 execute DB --local --command ...`
  found: Wrangler identified the local DB binding path under `.wrangler/state/v3/d1` but could not complete in the sandbox due EPERM on log/listen operations.
  implication: The sandbox blocked direct Wrangler verification, but the local sqlite evidence and config path still align on the same root cause.

- timestamp: 2026-03-01T00:00:03Z
  checked: package.json
  found: The `dev` script now runs `wrangler d1 migrations apply DB --local && react-router dev`.
  implication: Normal local development startup now enforces the schema initialization step that auth depends on.

- timestamp: 2026-03-01T00:00:03Z
  checked: migrations/0001_initial_schema.sql applied to a copy of the current local sqlite database
  found: After applying the migration SQL, the copied database contains both `users` and `sessions`.
  implication: The configured local migration path is sufficient to repair the missing-schema state that causes register to 500.

## Resolution

root_cause: Local development can run against an unmigrated or stale D1 database that lacks the `users` and `sessions` tables. `/api/auth/register` immediately queries those tables and bubbles the D1 exception as an HTTP 500.
fix:
The `dev` script now applies local D1 migrations before launching the app, so normal local development initializes the auth schema before `/api/auth/register` executes.
verification:
Verified that the current local sqlite database lacks `users` and `sessions`, and that applying `migrations/0001_initial_schema.sql` to a copy of that database creates both tables. Verified the updated `dev` script now runs local D1 migrations before starting the app.
files_changed: ["package.json"]
