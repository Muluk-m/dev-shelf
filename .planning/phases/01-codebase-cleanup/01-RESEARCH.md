# Phase 1: Codebase Cleanup - Research

**Researched:** 2026-03-01
**Domain:** Removing business-specific code, private dependencies, and internal URLs from a Cloudflare Workers full-stack application
**Confidence:** HIGH

## Summary

Phase 1 transforms the existing internal DevHub codebase into a clean, standalone open-source project. The codebase currently contains: (1) Feishu OAuth authentication deeply integrated across 5 backend files and multiple frontend stores/components, (2) a private NPM package `@qlj/common-utils` with a private registry in `.npmrc`, (3) 9+ business-specific tool routes (quick-login, roibest-analyzer, query-analyzer, website-check, ab-router, etc.) with associated backend API routes and component directories, (4) hardcoded internal URLs across 15+ source files spanning `qiliangjia.org`, `qiliangjia.one`, `deepclick.com`, and `roibest.com` domains, (5) hardcoded secrets in `wrangler.jsonc` (database IDs, KV namespace IDs, Feishu client IDs), and (6) business-specific seed data in `db/database.sql` with internal tool entries and URLs. The database schema file also embeds INSERT statements for internal tools -- the entire SQL file must be replaced with a clean schema-only file plus optional generic seed data.

The cleanup is entirely mechanical -- no new features are built. The risk is breaking the app by removing something that a core feature depends on. The key strategy is: remove in layers (auth first, then business routes, then private packages, then URLs/secrets), and verify the build compiles after each layer.

**Primary recommendation:** Work in a strict order: (1) Remove Feishu OAuth and auth-dependent code, (2) Remove business-specific routes and their components/types/libs, (3) Replace `@qlj/common-utils` with inline code, (4) Clean `wrangler.jsonc` and environment config, (5) Clean database seed data, (6) Remove `.npmrc` private registry, (7) Final verification with clean `pnpm install && pnpm build`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLEAN-01 | Remove Feishu OAuth authentication flow (login, callback, token management) | Feishu OAuth is in `workers/routes/auth.ts` (full file), `workers/utils/auth.ts` (getCurrentUserId uses getUserByFeishuId), `workers/middleware/auth.ts` (redirects to /auth/login), `workers/routes/permissions.ts` (uses feishuId), `workers/routes/identity.ts` (full GitHub-Feishu identity mapping), `lib/database/permissions.ts` (User interface has feishuId, getUserByFeishuId function). Frontend: `app/stores/user-info-store.ts`, `app/components/user-profile.tsx`, `app/hooks/use-permissions.ts`, `app/lib/api.ts` (getUserInfo, logout functions), `app/types/user-info.ts` (openId, platform fields from Feishu JWT), `lib/types/jwt.ts`. |
| CLEAN-02 | Remove DeepClick quick-login module | `app/routes/tools/quick-login.tsx` (entire file -- contains hardcoded DeepClick URLs, environment configs with `qiliangjia.one` and `deepclick.com` domains). Remove route from `app/routes.ts`. |
| CLEAN-03 | Remove R2 log storage dependency (CF_ALL_LOG binding) | `workers/routes/cf-logs.ts` (entire backend route), `app/routes/tools/cf-log-analyzer.tsx` (frontend route), `app/lib/api.ts` (listCfLogs, queryCfLogs functions), `app/types/cf-logs.ts` (type definitions), `lib/types/cf-logs.ts` (shared types), `wrangler.jsonc` CF_ALL_LOG R2 binding. Route in `workers/app.ts` line 27. |
| CLEAN-04 | Remove `@qlj/common-utils` private NPM package, inline necessary code | Used in exactly ONE file: `app/routes/tools/json-diff.tsx:1` imports `safeJsonParse`. The function is trivial (try/catch around JSON.parse). Also: remove from `package.json`, remove `.npmrc` private registry config (`@qlj:registry=https://nexus.qiliangjia.com/...`), regenerate lockfile. |
| CLEAN-05 | Clean hardcoded secrets from wrangler.jsonc | `database_id: "61845697-..."`, KV `id: "76fb6b23..."` and `preview_id`, `FEISHU_CLIENT_ID: "cli_a81054..."`, custom domain routes `qlj-devhub-homepage.qiliangjia.one`, test environment entire block. Replace with placeholders. |
| CLEAN-06 | Clean all internal URLs from codebase | 15+ files with `qiliangjia.org`, `qiliangjia.one`, `deepclick.com`, `roibest.com`, `downloads.my`, `fe-toolkit` URLs. Key files: `app/lib/api.ts:37` (API_BASE_URL), `app/lib/clickhouse-service.ts:161`, `app/lib/pwa-link-health.ts:5`, `app/routes/tools/website-check.tsx:38`, `app/routes/tools/roibest-analyzer.tsx:25`, `workers/routes/query-analyzer.ts` (3 URLs), `workers/routes/icon-generator.ts:22-23` (Dify API URL + key), `workers/routes/ab-router.ts:6`, `app/lib/query-templates.ts:86-88`. Also: `worker-configuration.d.ts` (auto-generated, will be regenerated). Also: `db/database.sql` INSERT statements with 25+ internal URLs. |
| CLEAN-07 | Clean business-related environment variables | Remove from `wrangler.jsonc`: `FEISHU_CLIENT_ID`, `OAUTH_BASE_URL`, `IMAGE_PREFIX` (deepclick.com). Replace `API_BASE_URL` with placeholder. Remove test environment block. Clean `worker-configuration.d.ts` by running `wrangler types`. |
| CLEAN-08 | Remove business-specific tool routes | Frontend routes to remove: `quick-login`, `roibest-analyzer`, `query-analyzer`, `website-check`, `whitelist-token`, `rb-domain-check`, `pwa-link-health`, `ab-router`, `cf-log-analyzer`, `pixel-activation-tool`. Backend routes to remove: `query-analyzer`, `cf-logs`, `icon-generator`, `ab-router`, `identity`. Associated component directories: `app/components/ab-router/` (10 files), `app/components/query-analyzer/` (7 files), `app/components/pwa-link-health/` (11 files), `app/components/pixel-tools/` (2 files). Associated lib files: `app/lib/clickhouse-service.ts`, `app/lib/pwa-link-health.ts`, `app/lib/query-templates.ts`, `app/lib/query-history-storage.ts`, `app/lib/whitelist-token.ts`. Type files: `app/types/ab-router.ts`, `app/types/cf-logs.ts`, `app/types/pwa-link-health.ts`, `app/types/roibest-analyzer.ts`, `app/types/website-check.ts`, `lib/types/cf-logs.ts`, `lib/types/query-analyzer.ts`. Backup file: `app/routes/tools/query-analyzer.backup.tsx`. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Hono | 4.8.2 | Backend web framework | Already in use, stays |
| React Router | 7.6.3 | Frontend routing | Already in use, stays |
| React | 19.2.1 | UI rendering | Already in use, stays |
| Zustand | 5.0.8 | State management | Already in use, stays |
| Biome | 2.2.4 | Linting and formatting | Already in use, stays |

### Supporting (Changes)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@qlj/common-utils` | 0.0.11 | **REMOVE** | Private package, inline `safeJsonParse` directly in `json-diff.tsx` |

**No new packages need to be installed for Phase 1.** The `safeJsonParse` function is trivial (3 lines) and should be inlined, not replaced with es-toolkit. es-toolkit is relevant for Phase 2+, not Phase 1.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `safeJsonParse` | es-toolkit `attempt` | Overkill for a 3-line function; adding a dependency to replace a dependency is counterproductive in a cleanup phase |

**Installation:**
```bash
# Phase 1: Only removals, no additions
pnpm remove @qlj/common-utils
# Then: rm .npmrc, pnpm install (regenerates lockfile)
```

## Architecture Patterns

### Removal Strategy: Outside-In Layers

The cleanup must proceed in dependency order. Removing files that other files import from causes TypeScript compilation errors. The correct order is:

```
Layer 1: Auth system (Feishu OAuth)
  Remove: workers/routes/auth.ts, workers/routes/identity.ts
  Stub:   workers/middleware/auth.ts (make passthrough for now)
  Stub:   workers/utils/auth.ts (keep getAuthToken, remove Feishu-specific getCurrentUserId)
  Clean:  lib/database/permissions.ts (remove feishuId, getUserByFeishuId)
  Clean:  app/stores/user-info-store.ts (stub or simplify)
  Clean:  app/components/user-profile.tsx (hide or stub)
  Clean:  app/types/user-info.ts (simplify for no-auth state)

Layer 2: Business-specific backend routes
  Remove: workers/routes/query-analyzer.ts
  Remove: workers/routes/cf-logs.ts
  Remove: workers/routes/icon-generator.ts
  Remove: workers/routes/ab-router.ts
  Clean:  workers/app.ts (remove all route mounts for removed routes)

Layer 3: Business-specific frontend routes + components + libs
  Remove: 10 route files from app/routes/tools/
  Remove: 4 component directories (30 files total)
  Remove: 5 lib files, 5 type files
  Clean:  app/routes.ts (remove route definitions)
  Clean:  app/lib/api.ts (remove all business API functions)

Layer 4: Private packages
  Replace: @qlj/common-utils import in json-diff.tsx with inline function
  Remove: package.json dependency
  Remove: .npmrc private registry

Layer 5: Configuration cleanup
  Clean:  wrangler.jsonc (remove secrets, IDs, business env vars)
  Clean:  db/database.sql (replace with schema-only, no business seed data)
  Regen:  worker-configuration.d.ts (run wrangler types)
  Clean:  package.json name (rename from qlj-devhub-homepage)
```

### Pattern: Stub Auth Middleware for Phase 1

**What:** Replace the current Feishu-dependent auth middleware with a passthrough that does nothing (auth comes in Phase 2)
**When to use:** Phase 1 only -- the app should work WITHOUT any authentication

The current middleware (`workers/middleware/auth.ts`) does three things:
1. Bypasses auth for public paths (`/auth`)
2. Allows unauthenticated GET requests to `/api/*`
3. Redirects unauthenticated non-GET requests to `/auth/login`

For Phase 1, the middleware should simply call `next()` for all requests, or be removed entirely. Since Phase 2 will rebuild auth, a simple passthrough is cleanest:

```typescript
// workers/middleware/auth.ts (Phase 1 stub)
import { createMiddleware } from "hono/factory";

export const authMiddleware = createMiddleware(async (_c, next) => {
  return next();
});
```

### Pattern: Clean Database Schema File

**What:** Replace `db/database.sql` (which contains schema + business INSERT data) with schema-only DDL
**When to use:** When removing all business-specific seed data

The current `database.sql` is a full database dump including:
- Schema DDL (CREATE TABLE, CREATE INDEX) -- **KEEP**
- Business seed data (INSERT INTO tools/environments/tags with internal URLs) -- **REMOVE**
- User/role/permission tables -- **NOT PRESENT** (these are created elsewhere, not in this dump)
- Usage events data -- **REMOVE**

The clean file should contain only:
- `tool_categories` table creation + generic sample categories (Development Tools, Testing, Deployment, etc.)
- `tools`, `tool_environments`, `tool_tags`, `tool_usage_events` table creation with indexes
- NO INSERT statements for tools (users add their own via the admin UI)
- Optional: 1-2 generic sample tool entries (e.g., "Example Tool") to show the system works

### Anti-Patterns to Avoid

- **Removing auth middleware entirely:** The middleware export is imported by `workers/app.ts`. Remove the import and usage, or keep as a stub. Don't just delete the file without updating imports.
- **Leaving orphan imports:** After deleting files, TypeScript will fail to compile if any remaining file imports from a deleted module. Always check `pnpm build` after each removal layer.
- **Cleaning URLs with regex find-replace:** Internal URLs appear in different contexts (environment configs, API endpoints, seed data, type literals). A global replace risks breaking legitimate code. Clean each occurrence manually with understanding of context.
- **Forgetting `worker-configuration.d.ts`:** This file is auto-generated but committed. It contains hardcoded Feishu client IDs and internal URLs as type literals. After cleaning `wrangler.jsonc`, run `pnpm run cf-typegen` to regenerate it.
- **Forgetting the `.npmrc` file:** Contains `@qlj:registry=https://nexus.qiliangjia.com/repository/npm-local/` -- a private registry. Must be deleted entirely.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Safe JSON parsing | Don't install es-toolkit just for this | Inline 3-line try/catch function | One usage in one file; adding dependencies defeats the purpose of cleanup |
| Auth system | Don't build auth in Phase 1 | Stub middleware (passthrough) | Auth is Phase 2's scope; Phase 1 just removes the old Feishu OAuth |
| Database migration | Don't build a migration system for seed data cleanup | Replace the entire `db/database.sql` with clean schema | The file is a dump, not a versioned migration; wholesale replacement is correct |

**Key insight:** Phase 1 is purely subtractive. Every temptation to "improve while we're here" should be deferred. The only code ADDED is: (1) a 3-line inline `safeJsonParse` function, (2) a 3-line stub auth middleware.

## Common Pitfalls

### Pitfall 1: Breaking the Frontend by Removing Auth Stores

**What goes wrong:** Removing auth routes and the user-info store causes cascading import failures across the frontend because `UserProfile`, `usePermissions`, and admin layout all depend on user state.

**Why it happens:** The auth state is consumed by the header component (`app/components/layout/header.tsx` imports `UserProfile` and `usePermissions`), admin routes, and permission checks throughout the UI.

**How to avoid:** Don't delete the stores and hooks -- **simplify them**. `useUserInfoStore` should return `null` for `userInfo` and no-op for `refresh`/`logout`. `usePermissions` should return `isAdmin: false` (or `true` to allow admin access during testing). `UserProfile` can be hidden (return null) or show a placeholder. This keeps all import chains intact.

**Warning signs:** If `pnpm build` fails with "Cannot find module" errors in components that seem unrelated to auth.

### Pitfall 2: Forgetting Backend Route Mounts in workers/app.ts

**What goes wrong:** Backend route files are deleted but `workers/app.ts` still imports them, causing compilation failure.

**Why it happens:** `workers/app.ts` imports 9 route modules. If you delete route files but forget to update the imports and `app.route()` calls, TypeScript fails.

**How to avoid:** When removing a backend route file, ALWAYS update `workers/app.ts` to remove both the import line and the corresponding `app.route()` call. Current routes to remove from `workers/app.ts`:
- Line 5: `import { abRouterProxy } from "./routes/ab-router"`
- Line 6: `import { auth } from "./routes/auth"`
- Line 8: `import { cfLogsRouter } from "./routes/cf-logs"`
- Line 9: `import { iconGeneratorRouter } from "./routes/icon-generator"`
- Line 10: `import { identityRouter } from "./routes/identity"`
- Line 11: `import { permissions } from "./routes/permissions"`
- Line 12: `import { queryAnalyzerRouter } from "./routes/query-analyzer"`
- Lines 21, 27-32: corresponding `app.route()` calls

**Warning signs:** TypeScript errors like `Cannot find module './routes/ab-router'`.

### Pitfall 3: Business Data in Database Seed File

**What goes wrong:** The `db/database.sql` file ships with business-specific tool entries containing internal URLs (`qiliangjia.org`, `deepclick.com`, etc.). Open-source users who run `db:apply` get a database pre-loaded with another organization's internal tools.

**Why it happens:** The SQL file is a production database dump, not a clean schema file. It contains 15+ INSERT statements for tools, 20+ for environments, and 15+ for tags, all referencing internal services.

**How to avoid:** Rewrite `db/database.sql` to contain ONLY schema DDL (CREATE TABLE, CREATE INDEX) and optionally 1-2 generic sample entries. Strip all business INSERT statements.

**Warning signs:** Any INSERT statement containing `qiliangjia`, `deepclick`, `roibest`, or business-specific tool names.

### Pitfall 4: Icon Generator Contains Hardcoded API Key

**What goes wrong:** The `workers/routes/icon-generator.ts` file at line 23-24 contains a hardcoded Dify AI API URL (`https://api-ai.qiliangjia.org/v1`) and API key (`app-Uwz1jNDR32zex0xTuYO1fVku`). This is a leaked credential.

**Why it happens:** Internal tool had the key hardcoded for convenience. The entire icon-generator route is business-specific and should be removed completely.

**How to avoid:** Delete the entire `workers/routes/icon-generator.ts` file as part of CLEAN-08. The icon generation feature is business-specific (uses Dify AI, an internal service). Remove the route mount from `workers/app.ts` and the API function from `app/lib/api.ts`.

**Warning signs:** Grep for `DIFY_API_KEY`, `app-Uwz1jNDR`, or `api-ai.qiliangjia`.

### Pitfall 5: ClickHouse Service Contains Hardcoded Access Key

**What goes wrong:** `app/lib/clickhouse-service.ts:161` contains `accessKey: "d561b95f5cda783b50042f9d75e912d3"` -- a hardcoded credential in CLIENT-SIDE code. This is shipped to every browser.

**Why it happens:** The ClickHouse query tool was an internal utility that connected directly to a ClickHouse instance.

**How to avoid:** Delete `app/lib/clickhouse-service.ts` entirely as part of CLEAN-08. Also delete the query-analyzer route, components, and types that depend on it.

### Pitfall 6: Whitelist Token Contains Hardcoded Secret Key

**What goes wrong:** `app/lib/whitelist-token.ts:5` contains `SECRET_KEY = "c7d065b0d405ec46e2597c4e53368598"` -- a hardcoded HMAC secret in client-side code.

**Why it happens:** Business-specific tool for generating whitelist tokens with a shared secret.

**How to avoid:** Delete `app/lib/whitelist-token.ts` and `app/routes/tools/whitelist-token.tsx` as part of CLEAN-08.

### Pitfall 7: app/lib/api.ts Contains Business API Functions

**What goes wrong:** `app/lib/api.ts` is 841 lines long and contains API functions for every business feature (CF logs, query analyzer, AB router, icon generator). Simply removing backend routes without cleaning this file causes unused code and potential import errors.

**Why it happens:** Centralized API client grew organically with each feature.

**How to avoid:** After removing business backend routes and frontend routes, clean `app/lib/api.ts` by removing:
- All CF log functions (listCfLogs, queryCfLogs)
- All query analyzer functions (convertToSQL, executeQuery, analyzeData) and their interfaces
- All icon generator functions (generateToolIcon) and interfaces
- All AB router functions (~370 lines, roughly half the file) and the AB_ROUTER_UPSTREAM_URL constant
- The `getUserInfo` and `logout` functions (auth removed)
- Fix `API_BASE_URL` to not reference `qiliangjia.one`

### Pitfall 8: admin.permissions.tsx Uses feishuId

**What goes wrong:** `app/routes/admin.permissions.tsx` at line 59 references `feishuId` in its User type, and at line 375 searches by `user.feishuId`. If permissions database code is cleaned but this route is not updated, TypeScript fails.

**Why it happens:** The permissions UI is tightly coupled to the Feishu identity system.

**How to avoid:** For Phase 1, simplify `admin.permissions.tsx` to remove feishuId references. The permissions management UI will be rebuilt in Phase 3. Consider stubbing this route to show a "Coming soon" message, or keeping the UI working without the feishuId fields.

## Code Examples

### Inline safeJsonParse Replacement (CLEAN-04)

```typescript
// In app/routes/tools/json-diff.tsx
// BEFORE:
import { safeJsonParse } from "@qlj/common-utils/common";

// AFTER:
function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
```

### Clean wrangler.jsonc (CLEAN-05, CLEAN-07)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "devhub",
  "compatibility_date": "2025-10-10",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./workers/app.ts",
  "upload_source_maps": true,
  "r2_buckets": [
    {
      "binding": "ASSETS_BUCKET",
      "bucket_name": "storage"
    }
  ],
  "observability": {
    "enabled": true
  },
  "vars": {
    "API_BASE_URL": ""
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "devhub-database",
      "database_id": ""
    }
  ],
  "kv_namespaces": [
    {
      "binding": "CACHE_KV",
      "id": "",
      "preview_id": ""
    }
  ]
}
```

Key changes:
- Removed `CF_ALL_LOG` R2 binding
- Removed `FEISHU_CLIENT_ID`, `OAUTH_BASE_URL`, `IMAGE_PREFIX` vars
- Emptied `database_id`, KV `id`/`preview_id`
- Removed `routes` (custom domain)
- Removed `env.test` block
- Renamed from `qlj-devhub-homepage` to `devhub`

### Stub Auth Middleware (CLEAN-01)

```typescript
// workers/middleware/auth.ts (Phase 1 stub -- auth rebuilt in Phase 2)
import { createMiddleware } from "hono/factory";

export const authMiddleware = createMiddleware(async (_c, next) => {
  return next();
});
```

### Clean workers/app.ts (CLEAN-01, CLEAN-03, CLEAN-08)

```typescript
// workers/app.ts (after cleanup)
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRequestHandler } from "react-router";
import { authMiddleware } from "./middleware/auth";
import { categoriesRouter } from "./routes/categories";
import { toolsRouter } from "./routes/tools";
import { uploadsRouter } from "./routes/uploads";

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.use("*", cors(), authMiddleware);

// API routes
app.route("/api/tools", toolsRouter);
app.route("/api/categories", categoriesRouter);
app.route("/api/uploads", uploadsRouter);

app.get("/.well-known/appspecific/com.chrome.devtools.json", (ctx) =>
  ctx.json({}),
);

// Public R2 asset serving
app.get("/assets/*", async (c) => {
  const key = c.req.path.replace(/^\/assets\//, "");
  if (!key || key.length === 0) {
    return c.json({ error: "Missing key" }, 400);
  }
  const obj = await c.env.ASSETS_BUCKET.get(key);
  if (!obj) {
    return c.json({ error: "Not found" }, 404);
  }
  const headers = new Headers();
  if (obj.httpMetadata?.contentType) {
    headers.set("Content-Type", obj.httpMetadata.contentType);
  }
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { status: 200, headers });
});

app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );
  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
```

Removed: auth, cfLogs, queryAnalyzer, iconGenerator, abRouterProxy, permissions, identity routes.
Kept: tools, categories, uploads (core functionality), R2 asset serving, React Router handler.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full database dump as schema file | Schema DDL + migration files | Standard practice | `db/database.sql` must be rewritten as schema-only |
| Private NPM registries for shared code | Monorepo or inline utilities | Common in OSS | `.npmrc` and `@qlj/common-utils` must be removed |
| Hardcoded URLs in source | Environment variables | Standard practice | All internal URLs replaced with env vars or removed |

## Open Questions

1. **Which generic tool routes to keep vs. remove?**
   - What we know: Routes like `json-formatter`, `base64-converter`, `url-parser`, `url-encoder`, `qr-generator`, `time-formatter`, `json-diff`, `jwt-decoder`, `ua-parser`, `file-uploader` are generic developer tools with no business-specific dependencies
   - What's unclear: Whether `pixel-activation-tool` is business-specific (it uses `app/components/pixel-tools/` which has Facebook/TikTok pixel tools -- these are marketing-specific but not company-specific)
   - Recommendation: Keep all generic tools (json-formatter, base64, url-parser, url-encoder, qr-generator, time-formatter, json-diff, jwt-decoder, ua-parser, file-uploader). Remove business-specific ones (quick-login, roibest-analyzer, query-analyzer, website-check, rb-domain-check, pwa-link-health, ab-router, cf-log-analyzer, whitelist-token). For `pixel-activation-tool`, remove it -- it depends on `pixel-tools` components which are marketing-platform specific and reference business APIs.

2. **How to handle the permissions UI (`admin.permissions.tsx`)?**
   - What we know: This route manages users/roles/permissions using the Feishu identity system. Phase 3 rebuilds user management.
   - What's unclear: Whether to keep a stubbed version or remove entirely in Phase 1.
   - Recommendation: Keep the route file but simplify. Remove feishuId references. The UI structure (user list, role management) is useful scaffolding for Phase 3.

3. **What about `app/stores/user-preferences-store.ts`?**
   - What we know: This store manages favorites and recent tools. It does NOT depend on Feishu auth -- it uses localStorage only.
   - Recommendation: Keep as-is. No cleanup needed.

4. **Package name in `package.json`?**
   - What we know: Currently `"name": "qlj-devhub-homepage"`. This contains the `qlj` prefix.
   - Recommendation: Rename to `"devhub"` or `"devhub-homepage"`.

## Comprehensive File Inventory

### Files to DELETE Entirely

**Backend routes (workers/routes/):**
- `workers/routes/auth.ts` (163 lines -- Feishu OAuth)
- `workers/routes/identity.ts` (~170 lines -- GitHub-Feishu identity mapping)
- `workers/routes/query-analyzer.ts` (~500 lines -- ClickHouse proxy)
- `workers/routes/cf-logs.ts` (~200 lines -- R2 log analysis)
- `workers/routes/icon-generator.ts` (~80 lines -- Dify AI, contains leaked API key)
- `workers/routes/ab-router.ts` (~300 lines -- A/B testing proxy)

**Frontend routes (app/routes/tools/):**
- `app/routes/tools/quick-login.tsx` -- DeepClick quick login
- `app/routes/tools/roibest-analyzer.tsx` -- RoiBest link analyzer
- `app/routes/tools/query-analyzer.tsx` (~1250 lines) -- ClickHouse query tool
- `app/routes/tools/query-analyzer.backup.tsx` (~1167 lines) -- backup file
- `app/routes/tools/website-check.tsx` (~1224 lines) -- website checker
- `app/routes/tools/whitelist-token.tsx` -- whitelist token generator
- `app/routes/tools/rb-domain-check.tsx` -- domain status checker
- `app/routes/tools/pwa-link-health.tsx` -- PWA link health checker
- `app/routes/tools/ab-router.tsx` -- A/B testing router UI
- `app/routes/tools/cf-log-analyzer.tsx` -- CF log analyzer UI
- `app/routes/tools/pixel-activation-tool.tsx` -- pixel activation tool

**Component directories (app/components/):**
- `app/components/ab-router/` (10 files) -- A/B router components
- `app/components/query-analyzer/` (7 files) -- query analyzer components
- `app/components/pwa-link-health/` (11 files) -- PWA health components
- `app/components/pixel-tools/` (2 files) -- pixel tool components

**Library files (app/lib/):**
- `app/lib/clickhouse-service.ts` -- ClickHouse client (contains hardcoded access key)
- `app/lib/pwa-link-health.ts` -- PWA link health utilities
- `app/lib/query-templates.ts` -- ClickHouse query templates
- `app/lib/query-history-storage.ts` -- query history localStorage
- `app/lib/whitelist-token.ts` -- whitelist token generator (contains hardcoded secret key)

**Type files:**
- `app/types/ab-router.ts`
- `app/types/cf-logs.ts`
- `app/types/pwa-link-health.ts`
- `app/types/roibest-analyzer.ts`
- `app/types/website-check.ts`
- `lib/types/cf-logs.ts`
- `lib/types/query-analyzer.ts`

**Config files:**
- `.npmrc` (private registry config)

### Files to MODIFY

| File | Changes Needed |
|------|---------------|
| `workers/app.ts` | Remove 7 route imports, remove 8 `app.route()` calls, keep tools/categories/uploads |
| `workers/middleware/auth.ts` | Replace with passthrough stub (3 lines) |
| `workers/utils/auth.ts` | Remove `getCurrentUserId` and `getUserByFeishuId` import. Keep `getAuthToken` (generic). |
| `workers/routes/permissions.ts` | Remove feishuId usage or simplify for Phase 1 |
| `lib/database/permissions.ts` | Remove `getUserByFeishuId`, `feishuId` from User interface, update `createUser` |
| `lib/types/jwt.ts` | Remove or simplify (Phase 2 will define new JWT payload) |
| `app/routes.ts` | Remove 11 business route definitions, keep generic tools |
| `app/lib/api.ts` | Remove ~500 lines of business API functions, fix `API_BASE_URL`, remove auth functions |
| `app/stores/user-info-store.ts` | Stub to return null/no-op (auth rebuilt in Phase 2) |
| `app/components/user-profile.tsx` | Return null or minimal placeholder (no auth to show) |
| `app/hooks/use-permissions.ts` | Stub: return visitor-level defaults, keep interface intact |
| `app/types/user-info.ts` | Simplify (remove Feishu-specific fields: openId, platform, appId) |
| `app/routes/tools/json-diff.tsx` | Replace `@qlj/common-utils` import with inline `safeJsonParse` |
| `app/routes/admin.permissions.tsx` | Remove feishuId references |
| `wrangler.jsonc` | Remove secrets, IDs, business env vars, custom domains, test env |
| `worker-configuration.d.ts` | Regenerate via `pnpm run cf-typegen` after cleaning wrangler.jsonc |
| `db/database.sql` | Rewrite as schema-only DDL (remove all INSERT statements with business data) |
| `package.json` | Remove `@qlj/common-utils` dependency, rename project name |

### Files to KEEP As-Is

**Generic tool routes (no business dependencies):**
- `app/routes/tools/json-formatter.tsx`
- `app/routes/tools/base64-converter.tsx`
- `app/routes/tools/url-parser.tsx`
- `app/routes/tools/url-encoder.tsx`
- `app/routes/tools/qr-generator.tsx`
- `app/routes/tools/time-formatter.tsx`
- `app/routes/tools/jwt-decoder.tsx`
- `app/routes/tools/ua-parser.tsx`
- `app/routes/tools/file-uploader.tsx`
- `app/routes/tools/_layout.tsx`

**Core infrastructure:**
- `workers/routes/tools.ts` -- tool CRUD API
- `workers/routes/categories.ts` -- category API
- `workers/routes/uploads.ts` -- file upload handling
- `lib/database/tools.ts` -- tool database operations
- `app/stores/tools-store.ts` -- tool state management
- `app/stores/user-preferences-store.ts` -- favorites/recent (localStorage only)
- `app/stores/permissions-store.ts` -- permission cache (keep, simplify usage)
- All `app/components/ui/` -- shadcn/ui components
- All `app/components/layout/` -- layout components (modify header only)
- All `app/components/admin/` -- admin components (tool form, category list)
- `app/components/command-panel/` -- command palette
- `app/components/search/` -- search components

## Verification Commands

After cleanup is complete, run these commands to verify success criteria:

```bash
# Success Criterion 1: pnpm install succeeds without private registry
rm -rf node_modules pnpm-lock.yaml
pnpm install
# PASS if: exits 0, no errors about @qlj/common-utils or private registry

# Success Criterion 2: pnpm build produces working app with zero internal references
pnpm build
# PASS if: exits 0, no TypeScript errors

# Verify no internal URLs in source
grep -r "qiliangjia\|deepclick\|roibest\|thirdpart-service" app/ workers/ lib/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".planning/"
# PASS if: zero results

grep -r "feishu\|FEISHU\|飞书" app/ workers/ lib/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".planning/"
# PASS if: zero results

# Success Criterion 3: wrangler.jsonc has no hardcoded secrets
grep -E "cli_a|61845697|76fb6b23|qiliangjia" wrangler.jsonc
# PASS if: zero results

# Success Criterion 4: No business routes exist
ls app/routes/tools/quick-login.tsx app/routes/tools/roibest-analyzer.tsx workers/routes/auth.ts workers/routes/identity.ts 2>/dev/null
# PASS if: "No such file or directory" for all

# Success Criterion 5: App starts (dev mode)
pnpm dev &
sleep 5
curl -s http://localhost:5173 | head -20
# PASS if: HTML response with React app shell
kill %1
```

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all 30+ files involved in cleanup
- `wrangler.jsonc` -- verified all hardcoded secrets and binding IDs
- `.npmrc` -- verified private registry configuration
- `db/database.sql` -- verified business seed data (25+ INSERT statements with internal URLs)
- `workers/app.ts` -- verified all route mounts (9 business routes to remove)

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` -- pitfall analysis for leaked URLs, secrets, private packages
- `.planning/codebase/INTEGRATIONS.md` -- integration inventory
- `.planning/codebase/CONCERNS.md` -- known tech debt and security issues
- `.planning/research/STACK.md` -- stack research including es-toolkit recommendation

## Metadata

**Confidence breakdown:**
- File inventory: HIGH -- every file verified by direct read and grep across codebase
- Removal strategy: HIGH -- dependency chain mapped through actual import analysis
- Pitfalls: HIGH -- identified from actual code inspection (hardcoded keys, leaked credentials confirmed)
- Verification: HIGH -- commands are standard shell operations, testable

**Research date:** 2026-03-01
**Valid until:** Indefinite (codebase state is the source of truth; phase is mechanical removal)
