# Pitfalls Research

**Domain:** Open-sourcing internal tools + Cloudflare Workers deployment
**Researched:** 2026-03-01
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Leaked Internal URLs and Business Logic in Client Code

**What goes wrong:**
Internal URLs, business logic endpoints, and domain-specific implementations get committed to the public repository, exposing internal infrastructure and potentially creating security vulnerabilities.

**Why it happens:**
Developers don't audit all hardcoded URLs when converting an internal tool to open source. Business logic that was "safe" in a private repo becomes a disclosure risk when made public. Frontend code often contains direct API calls that worked fine internally but expose internal infrastructure in open source.

**How to avoid:**
- Run systematic grep for all internal domains: `qiliangjia`, `deepclick`, company-specific endpoints
- Replace hardcoded business URLs with configurable environment variables
- Remove business-specific features entirely (Quick Login, DeepClick integrations, ClickHouse queries with hardcoded credentials)
- Audit all files found by: `grep -r "qiliangjia\|deepclick\|qlj-\|thirdpart-service" .`

**Warning signs:**
- Hardcoded API endpoints in `/app/lib/api.ts`, `/app/routes/tools/*.tsx`
- Business-specific tools: `quick-login.tsx`, `roibest-analyzer.tsx`, `website-check.tsx`
- ClickHouse credentials in `app/lib/clickhouse-service.ts:162` (access key exposed)
- OAuth URLs pointing to internal services: `OAUTH_BASE_URL: "https://thirdpart-service-hub-app-test.qiliangjia.org"`
- Image CDN: `IMAGE_PREFIX: "https://image.deepclick.com"`

**Phase to address:**
Phase 1 (Audit & Clean) — Before any public release

**Recovery cost:** HIGH — Requires emergency secret rotation, infrastructure review, potential security incident response if already leaked

---

### Pitfall 2: Environment Variables and Secrets in wrangler.jsonc

**What goes wrong:**
Committing real credentials, API keys, or production resource IDs in `wrangler.jsonc` exposes secrets in public Git history. Even after deletion, secrets remain in commit history forever.

**Why it happens:**
Wrangler configuration mixes public config (compatibility_date) with sensitive data (client IDs, database IDs, KV namespace IDs). Developers forget that what's safe in private repos becomes dangerous in public repos.

**How to avoid:**
- Remove all real IDs and replace with placeholder values in `wrangler.jsonc`:
  ```jsonc
  "vars": {
    "API_BASE_URL": "https://your-domain.com",  // User replaces
    "FEISHU_CLIENT_ID": "",  // REMOVE - no longer needed
    "OAUTH_BASE_URL": "",    // REMOVE - no longer needed
    "IMAGE_PREFIX": ""       // Optional user config
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "devhub-database",
      "database_id": ""  // Auto-populated by Deploy Button
    }
  ]
  ```
- Use Deploy Button's automatic resource provisioning instead of hardcoded IDs
- Document required environment variables in README with example values
- Add `.env.example` file with safe placeholders
- Run `git log --all --full-history -- "*wrangler.jsonc"` to check history for leaked secrets

**Warning signs:**
Current `wrangler.jsonc` contains:
- `FEISHU_CLIENT_ID: "cli_a81054e5b13ed013"` (real client ID)
- `database_id: "61845697-203d-4a2c-9eaf-dc2985b7f727"` (real database ID)
- `id: "76fb6b23405646699f1eea148fac6079"` (real KV namespace ID)
- Custom domain routes: `qlj-devhub-homepage.qiliangjia.one`

**Phase to address:**
Phase 1 (Audit & Clean) — Must clean before public fork/release

**Recovery cost:** HIGH — Secret rotation required, Git history rewrite needed (`git-filter-repo`), users must update bindings

---

### Pitfall 3: Cloudflare Workers Authentication with Password Hashing

**What goes wrong:**
Using bcrypt or argon2 fails on Cloudflare Workers due to 50ms CPU time limits. Passwords hashed with weak algorithms (or PBKDF2 with low iterations) become vulnerable to brute force attacks.

**Why it happens:**
Workers run in V8 isolates, not Node.js, so traditional password hashing libraries don't work. Web Crypto API's PBKDF2 has iteration limits (max ~100,000) that conflict with modern security recommendations (600,000+ iterations). Developers underestimate CPU time constraints.

**How to avoid:**
**Option A: Web Crypto API PBKDF2 (recommended for MVP)**
```typescript
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,  // Max safe value for Workers
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return base64encode(salt) + ':' + base64encode(derived);
}
```
**Limitations:** Lower security than bcrypt/argon2, but acceptable for internal tool deployment.

**Option B: External auth service** (higher security, more complex)
- Delegate password handling to Cloudflare Access, Auth0, or separate Node.js service
- Workers only validate JWT tokens
- Better security but eliminates "zero-configuration" Deploy Button appeal

**Warning signs:**
- No password hashing implementation exists yet (needs to be built)
- Current auth uses Feishu OAuth tokens (external service dependency)
- JWT validation in `workers/middleware/auth.ts` assumes external token issuer

**Phase to address:**
Phase 2 (Auth Implementation) — Core authentication system

**Recovery cost:** MEDIUM — If weak hashing deployed, requires password reset for all users

**Sources:**
- [Cloudflare Community: Password Hashing Options](https://community.cloudflare.com/t/options-for-password-hashing/138077)
- [Jamie Lord: Hashing Passwords on Cloudflare Workers](https://lord.technology/2024/02/21/hashing-passwords-on-cloudflare-workers.html)
- [Cloudflare Web Crypto API Docs](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)

---

### Pitfall 4: D1 Database Migration Strategy with Deploy Button

**What goes wrong:**
Deploy Button doesn't automatically run D1 migrations after provisioning the database. Users deploy the app, but the database has no schema, causing runtime errors on first page load. Migrations referencing database names (instead of binding names) fail when users choose different database names.

**Why it happens:**
Cloudflare's Deploy Button provisions empty D1 databases but doesn't execute SQL files automatically. Developers assume migrations run automatically like Heroku or Railway. Migration commands using `--database-name` fail because users rename databases during deployment.

**How to avoid:**
1. **Reference binding names in migrations:**
   ```json
   // package.json
   {
     "scripts": {
       "deploy": "npm run build && wrangler d1 migrations apply DB --remote && wrangler deploy"
     }
   }
   ```
   Note: `DB` is the binding name, not database name.

2. **Provide setup script for first deployment:**
   ```json
   {
     "scripts": {
       "setup": "wrangler d1 migrations apply DB --remote",
       "deploy": "npm run build && wrangler deploy"
     }
   }
   ```
   Document: "After Deploy Button completes, run `npm run setup` once."

3. **Include migration files in proper location:**
   - Standard path: `migrations/0001_initial_schema.sql`
   - Configure in `wrangler.jsonc`: `"migrations_dir": "migrations"`

4. **Avoid automatic migration in deploy script:**
   - Risk: Failed migration during deployment breaks the app
   - Better: Separate setup step with clear error messages

**Warning signs:**
- No `migrations/` directory detected in current codebase
- Schema in `db/database.sql` but no migration tracking
- No migration commands in `package.json` scripts
- Users report "database table not found" errors after Deploy Button

**Phase to address:**
Phase 2 (Auth Implementation) — When creating new user tables
Phase 4 (Deploy Button) — Must document migration process clearly

**Recovery cost:** MEDIUM — Users must manually run migrations, potential data loss if they inserted data into wrong schema

**Sources:**
- [Cloudflare D1 Migrations Docs](https://developers.cloudflare.com/d1/reference/migrations/)
- [Community: D1 Migrations with Deploy Button](https://www.answeroverflow.com/m/1281277968001269923)
- [Deploy Button Docs](https://developers.cloudflare.com/workers/platform/deploy-buttons/)

---

### Pitfall 5: D1 Production Limitations Hit Without Warning

**What goes wrong:**
D1 database suddenly returns "overloaded" errors during normal usage. Large tool imports fail with "row size exceeded" errors. Queries start timing out. Database hits 10 GB limit and becomes read-only.

**Why it happens:**
D1 is single-threaded and processes queries sequentially. Concurrent requests queue up, and the queue fills under load. Single large rows (>2 MB) are rejected. The 10 GB database limit is hard and cannot be increased. Developers test with small datasets and don't encounter limits until production.

**How to avoid:**
1. **Document D1 limits prominently in README:**
   - Max database size: 10 GB (cannot be increased)
   - Single-threaded query processing (queues concurrent requests)
   - Max row size: ~2 MB (store large content in R2 instead)
   - Recommended: <1000 concurrent users per database

2. **Design for horizontal scaling from day one:**
   - Avoid storing large blobs in D1 (use R2 for tool icons, user avatars)
   - Plan for per-tenant databases if multi-tenant
   - Implement pagination for large result sets
   - Add database size monitoring

3. **Optimize batch operations:**
   ```typescript
   // BAD: Updates all rows at once
   await db.prepare('UPDATE tools SET updated_at = ?').bind(Date.now()).run();

   // GOOD: Process in batches of 1000
   for (const batch of chunks(toolIds, 1000)) {
     await db.batch(batch.map(id =>
       db.prepare('UPDATE tools SET updated_at = ? WHERE id = ?').bind(Date.now(), id)
     ));
   }
   ```

4. **Cache aggressively:**
   - Current code already has 7-day KV cache for tool lists (good!)
   - Extend caching to reduce D1 query load

**Warning signs:**
- Current code has N+1 query pattern (`lib/database/tools.ts:83-110`)
- Batch updates delete-then-reinsert entire relations (`lib/database/tools.ts:275-323`)
- No database size monitoring
- No row size validation before inserts
- `tool_usage_events` table grows unbounded (no archival strategy)

**Phase to address:**
Phase 3 (Core Features) — Optimize existing queries before public launch
Phase 5 (Documentation) — Document scaling limits clearly

**Recovery cost:** HIGH — Requires database sharding, data migration, or feature removal if limits hit in production

**Sources:**
- [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 2MB Limit Lesson](https://dev.to/morphinewan/when-cloudflare-d1s-2mb-limit-taught-me-a-hard-lesson-about-database-design-3edb)
- [Scaling D1 from 10GB to TBs](https://dev.to/araldhafeeri/scaling-your-cloudflare-d1-database-from-the-10-gb-limit-to-tbs-4a16)

---

### Pitfall 6: Deploy Button Resource Provisioning Race Conditions

**What goes wrong:**
Deploy Button provisions resources (D1, KV, R2) but the Worker deploys before resources are ready. First requests crash with "binding not found" errors. Some bindings auto-provision with different names than expected, breaking hardcoded references.

**Why it happens:**
Cloudflare provisions resources asynchronously. The Worker can deploy and start serving requests before D1/KV/R2 are fully bound. Developers test locally with pre-existing bindings and don't encounter the timing issue. Binding names in `wrangler.jsonc` must match code references exactly, or runtime errors occur.

**How to avoid:**
1. **Use consistent binding names:**
   ```jsonc
   // wrangler.jsonc - Deploy Button auto-provisions based on these
   {
     "d1_databases": [
       { "binding": "DB", "database_name": "devhub-database", "database_id": "" }
     ],
     "kv_namespaces": [
       { "binding": "CACHE_KV", "id": "", "preview_id": "" }
     ],
     "r2_buckets": [
       { "binding": "ASSETS_BUCKET", "bucket_name": "storage" }
     ]
   }
   ```
   - Leave IDs empty — Deploy Button fills them
   - Use descriptive `database_name` and `bucket_name` (user-visible)
   - Binding names (`DB`, `CACHE_KV`, `ASSETS_BUCKET`) must match code

2. **Validate bindings at Worker startup:**
   ```typescript
   // workers/app.ts
   app.use('*', async (c, next) => {
     if (!c.env.DB) {
       return c.json({ error: 'Database not configured. Run setup.' }, 503);
     }
     if (!c.env.CACHE_KV) {
       console.warn('Cache KV not available, using in-memory cache');
     }
     return next();
   });
   ```

3. **Provide binding descriptions in package.json:**
   ```json
   {
     "cloudflare": {
       "bindings": {
         "DB": {
           "type": "d1",
           "description": "Main application database for tools, users, and permissions"
         },
         "CACHE_KV": {
           "type": "kv",
           "description": "Cache storage for API responses (optional but recommended)"
         },
         "ASSETS_BUCKET": {
           "type": "r2",
           "description": "File storage for tool icons and user uploads"
         }
       }
     }
   }
   ```

4. **Document post-deployment setup:**
   - README must include: "After deployment, run migrations before accessing the app"
   - Provide health check endpoint: `GET /api/health` returns binding status

**Warning signs:**
- Current `wrangler.jsonc` has hardcoded `database_id` and KV `id` (will break for new users)
- No binding validation in `workers/app.ts`
- No health check endpoint
- R2 bucket `CF_ALL_LOG` is business-specific (should be removed or made optional)

**Phase to address:**
Phase 4 (Deploy Button) — Configure bindings correctly before Deploy Button testing

**Recovery cost:** MEDIUM — Users must manually create bindings via dashboard, update wrangler.jsonc, redeploy

**Sources:**
- [Cloudflare Workers Deploy Button Docs](https://developers.cloudflare.com/workers/platform/deploy-buttons/)
- [Deploy Button Bindings Support](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Community: Deploy Button Resource Provisioning Issues](https://community.cloudflare.com/t/deploy-to-cloudflare-button-not-provisioning-resources-correctly/854128)

---

### Pitfall 7: Private NPM Package Dependency Blocks Open Source

**What goes wrong:**
Open source users cannot install dependencies because `@qlj/common-utils` is a private organization package. `npm install` fails immediately after cloning the repo. Users open issues asking for package access, but it's internal-only.

**Why it happens:**
Internal tools accumulate dependencies on organization-private packages for code sharing across projects. These packages work fine in private repos but block public use. Developers forget to audit `package.json` dependencies for private packages.

**How to avoid:**
1. **Audit all dependencies:**
   ```bash
   # Check package.json for @org-scoped packages
   grep -E '"@[a-z-]+/' package.json
   ```

2. **Remove or inline `@qlj/common-utils`:**
   - Option A: Copy needed utilities directly into `lib/utils/` (recommended)
   - Option B: Replace with public equivalent (e.g., lodash, date-fns)
   - Option C: Remove features that depend on the package

3. **Current usage check:**
   ```bash
   grep -r "@qlj/common-utils" --include="*.ts" --include="*.tsx"
   ```
   Likely uses: date formatting, validation helpers, API client utilities

4. **Update package.json:**
   ```json
   // Remove:
   "dependencies": {
     "@qlj/common-utils": "0.0.11"  // DELETE
   }
   ```

5. **Test clean install:**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install  # Should succeed without private package access
   ```

**Warning signs:**
- `package.json` contains: `"@qlj/common-utils": "0.0.11"`
- `.npmrc` might contain private registry config
- No public alternative documented
- Users will immediately hit this on `git clone && pnpm install`

**Phase to address:**
Phase 1 (Audit & Clean) — Must remove before public fork

**Recovery cost:** LOW — Just remove or inline the utilities, no data migration needed

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip comprehensive test suite | Faster initial development | Cannot safely refactor auth, DB layer, or API — risk breaking changes | Never for auth/DB operations; acceptable for UI components in MVP |
| Hardcode environment-specific URLs in code | Works quickly in internal deployment | Breaks in open source, requires code changes per environment | Never — always use env vars |
| Use Feishu OAuth instead of building auth | No auth implementation needed | Vendor lock-in, cannot open source without full rewrite | Internal tools only — must replace for OSS |
| Manual field mapping (snake_case ↔ camelCase) | Simpler than ORM setup | Fragile, error-prone on schema changes, no compile-time safety | Small projects (<10 tables); use ORM/codegen for larger |
| Delete-then-reinsert for updates | Easier than diffing changes | Inefficient at scale, race conditions, triggers overhead | Acceptable for <100 rows; batch operations need proper update logic |
| Client-side SQL validation only | Fast to implement, no server changes | Security bypass risk, attackers can skip validation | Never for production — always validate server-side |
| No database migration system | Direct SQL execution is faster | Schema changes break across environments, no rollback | Acceptable for solo projects; required for multi-user/OSS |
| Global cache invalidation | Simple cache strategy | Cache stampede on updates, unnecessary re-fetching | Acceptable for <10k requests/day; use granular keys at scale |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Cloudflare D1 | Using database name in code instead of binding name (`c.env.DB`) | Always reference binding (`c.env.DB`), never hardcode database name |
| Workers KV | Forgetting KV is eventually consistent, reading immediately after write | Add wait/retry logic or use Durable Objects for strong consistency |
| R2 Storage | Listing all objects without pagination (`bucket.list()`) | Use `cursor` for pagination, limit to 1000 objects per request |
| Web Crypto API | Using bcrypt/argon2 libraries (fail in Workers) | Use Web Crypto PBKDF2 or external auth service |
| OAuth providers | Storing client secrets in frontend code | Proxy through Worker, store secrets in `wrangler.toml` [secrets] |
| ClickHouse/external APIs | Hardcoding access keys in client code | Move to Worker-side proxy, use environment variables |
| JWT validation | Not checking token expiration or signature | Use `hono/jwt` with proper verification, check `exp` claim |
| Cloudflare Deploy Button | Assuming migrations auto-run after provisioning | Explicitly run migrations in setup script or deploy script |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries in tool fetching | Slow API responses, high D1 latency | Use JOIN queries or batch fetching in single query | >100 tools with environments/tags |
| Unbounded result sets | "Database overloaded" errors, timeouts | Always use LIMIT and OFFSET, implement pagination | >10,000 rows in `tool_usage_events` |
| Synchronous file uploads to R2 | Request timeouts, 50ms CPU limit exceeded | Use async background jobs or queue (Workers Queue) | Files >1 MB or >10 concurrent uploads |
| Cache stampede on updates | Sudden latency spikes after cache clear | Use cache locking or stale-while-revalidate pattern | >1000 concurrent users |
| localStorage for large data | Browser quota exceeded, slow page loads | Use IndexedDB or server-side storage | >5 MB of cached tools/preferences |
| Single D1 database for all data | "Database overloaded" errors | Shard by tenant or use separate DBs for analytics | >1000 concurrent writes/second |
| In-memory state in Workers | State loss on Worker restart, inconsistent data | Use Durable Objects or external state store | >1 request/second (Workers can restart anytime) |
| Large transaction batches | Transaction timeout errors | Chunk into batches of <1000 operations | Bulk updates >5000 rows |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Client-side SQL validation only | SQL injection via bypassing frontend checks | Always validate SQL on Worker-side, use parameterized queries |
| Exposing database/KV IDs in public config | Attackers can target specific resources | Use placeholder IDs in public `wrangler.jsonc`, provision via Deploy Button |
| Weak password hashing (low PBKDF2 iterations) | Brute force attacks succeed quickly | Use 100,000+ iterations, or external auth service |
| HTTP-only cookies without SameSite | CSRF attacks possible | Set `sameSite: "lax"` and `secure: true` for auth cookies |
| No rate limiting on auth endpoints | Brute force login attempts | Implement rate limiting via KV counter or Cloudflare WAF |
| Storing secrets in Git history | Leaked credentials even after deletion | Use `git-filter-repo` to rewrite history, rotate all leaked secrets |
| GET requests bypass auth (current code) | Internal tool data exposed publicly | Require auth for all API requests, or explicitly mark endpoints as public |
| No audit logging for admin actions | Cannot trace permission changes or data modifications | Log all admin operations to D1 or external logging service |
| Trusting user input in redirects | Open redirect vulnerability | Validate redirect URLs against allowlist |
| Session tokens without expiration | Stolen tokens valid forever | Set short expiration (1-7 days), implement token refresh |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Deploy Button completes but app crashes | Users think deployment failed, abandon setup | Add health check endpoint, show setup status page with binding validation |
| No first-run setup wizard | Users confused about admin account creation | Detect empty user table, show setup page to create first admin |
| Error messages reference internal terms | "DB binding not found" confuses users | User-friendly errors: "Database not configured. See setup guide." |
| Migration errors are cryptic | Users don't know how to fix "migration failed" | Provide specific error messages and recovery commands |
| No indication of required env vars | Users deploy with missing config, nothing works | Validate required env vars on startup, show clear error for missing values |
| Admin features visible to non-admin users | Users try to create tools, get permission errors | Hide admin UI elements based on user role |
| Dark mode doesn't persist across devices | Inconsistent theme experience | Store theme preference in user account, not just localStorage |
| No loading states during tool operations | Users think CRUD operations failed | Show loading spinners, success toasts, optimistic UI updates |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Authentication:** Password hashing implemented but iterations too low (<100,000) — verify crypto.subtle.deriveBits config
- [ ] **Database setup:** Schema file exists but no migration tracking — verify `migrations/` directory and version control
- [ ] **Deploy Button:** Config file present but bindings have hardcoded IDs — verify all IDs are empty strings or removed
- [ ] **Environment variables:** .env.example exists but missing descriptions — verify each var has comment explaining purpose
- [ ] **Admin account:** User registration works but no first-admin setup — verify detection of empty user table
- [ ] **Error handling:** Try-catch blocks exist but empty catch bodies — verify all errors are logged or returned to user
- [ ] **Security:** Auth middleware exists but allows GET requests — verify all sensitive endpoints require auth
- [ ] **Caching:** Cache layer implemented but no invalidation on updates — verify cache version increments on writes
- [ ] **File uploads:** Upload endpoint exists but no file size limits — verify R2 upload size validation and type checking
- [ ] **Role-based access:** Permissions table exists but no UI to manage — verify admin interface for role/permission CRUD

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Leaked secrets in Git history | HIGH | 1. Rotate ALL exposed secrets immediately 2. Use `git-filter-repo` to rewrite history 3. Force push to all branches 4. Notify users to re-clone repo 5. Update all deployments with new secrets |
| Weak password hashing deployed | MEDIUM | 1. Generate migration to add `needs_password_reset` flag 2. Force password reset on next login 3. Rehash with stronger algorithm 4. Communicate security update to users |
| D1 database hit 10 GB limit | HIGH | 1. Implement data archival to R2 2. Migrate to per-tenant database architecture 3. Delete old analytics data 4. No easy way to expand single DB — requires architectural change |
| N+1 queries cause performance issues | MEDIUM | 1. Add database indexes on foreign keys 2. Refactor to use JOIN queries 3. Implement aggressive caching 4. Consider read replicas (future D1 feature) |
| Deploy Button broken (wrong bindings) | LOW | 1. Fix `wrangler.jsonc` binding configuration 2. Test with fresh Cloudflare account 3. Update Deploy Button link 4. Document manual binding creation as fallback |
| Private package blocks install | LOW | 1. Remove package from `package.json` 2. Inline needed utilities to `lib/utils/` 3. Update imports 4. Test clean install 5. Update lock file |
| Migrations not running on deploy | MEDIUM | 1. Document manual migration command 2. Create setup script in `package.json` 3. Add migration status check to health endpoint 4. Provide rollback instructions |
| Client-side secret leaked | HIGH | 1. Rotate secret immediately 2. Move logic to Worker-side proxy 3. Audit all client code for other secrets 4. Add pre-commit hook to prevent future leaks |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Leaked internal URLs | Phase 1: Audit & Clean | `grep -r "qiliangjia\|deepclick\|qlj-"` returns zero results in app/ and workers/ |
| Secrets in wrangler.jsonc | Phase 1: Audit & Clean | All `database_id`, KV `id`, and sensitive vars are empty strings or removed |
| Private NPM packages | Phase 1: Audit & Clean | `pnpm install` succeeds in fresh clone without private registry access |
| Password hashing weakness | Phase 2: Auth Implementation | Web Crypto PBKDF2 with 100,000+ iterations verified in code review |
| D1 migration strategy | Phase 2: Auth Implementation | `migrations/` directory exists, migration command in package.json works |
| N+1 query performance | Phase 3: Core Features | Tool list API response time <200ms for 100 tools with 5 environments each |
| Deploy Button binding config | Phase 4: Deploy Button | Fresh deployment via Deploy Button succeeds without manual binding creation |
| D1 production limits | Phase 5: Documentation | README documents 10 GB limit, single-threaded nature, row size limits |
| Missing first-run wizard | Phase 6: Polish | Empty database redirects to setup page to create first admin account |
| Security audit gaps | Phase 7: Security Review | All API endpoints require auth, rate limiting implemented, secrets rotated |

## Sources

**Open Source Security:**
- [The Most Common Secret-Leaking Patterns I Still See in 2026](https://www.d4b.dev/blog/2026-02-04-common-secret-leaking-patterns-2026)
- [Are Environment Variables Still Safe for Secrets in 2026?](https://www.doppler.com/blog/environment-variable-secrets-2026)
- [Top 7 Secret Scanning Tools for 2026](https://www.apono.io/blog/top-7-secret-scanning-tools-for-2026/)

**Cloudflare Workers Authentication:**
- [Cloudflare Community: Options for Password Hashing](https://community.cloudflare.com/t/options-for-password-hashing/138077)
- [Jamie Lord: Hashing Passwords on Cloudflare Workers](https://lord.technology/2024/02/21/hashing-passwords-on-cloudflare-workers.html)
- [Cloudflare Web Crypto API Docs](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [Cloudflare API Shield: JWT Validation](https://developers.cloudflare.com/api-shield/security/jwt-validation/)
- [Protecting APIs with JWT Validation](https://blog.cloudflare.com/protecting-apis-with-jwt-validation/)

**Cloudflare D1 Limitations:**
- [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Scaling D1 from 10GB to TBs](https://dev.to/araldhafeeri/scaling-your-cloudflare-d1-database-from-the-10-gb-limit-to-tbs-4a16)
- [When D1's 2MB Limit Taught Me a Hard Lesson](https://dev.to/morphinewan/when-cloudflare-d1s-2mb-limit-taught-me-a-hard-lesson-about-database-design-3edb)
- [Complexity of Scaling D1 in Production](https://www.answeroverflow.com/m/1345869029906059305)

**Deploy Button & Bindings:**
- [Cloudflare Workers Deploy Button Docs](https://developers.cloudflare.com/workers/platform/deploy-buttons/)
- [Deploy Button Supports Environment Variables & Secrets](https://developers.cloudflare.com/changelog/2025-07-01-workers-deploy-button-supports-environment-variables-and-secrets/)
- [Wrangler Configuration Docs](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [D1 Migrations Docs](https://developers.cloudflare.com/d1/reference/migrations/)
- [Community: D1 Migrations with Deploy Button](https://www.answeroverflow.com/m/1281277968001269923)
- [Community: Deploy Button Not Provisioning Resources](https://community.cloudflare.com/t/deploy-to-cloudflare-button-not-provisioning-resources-correctly/854128)

**Internal Codebase Analysis:**
- `.planning/codebase/CONCERNS.md` — Existing technical debt and security issues
- `.planning/codebase/INTEGRATIONS.md` — External dependencies to remove
- `.planning/PROJECT.md` — Open source conversion requirements
- `wrangler.jsonc` — Current configuration with hardcoded secrets
- `workers/routes/auth.ts` — Feishu OAuth implementation to replace
- `app/lib/clickhouse-service.ts` — Hardcoded credentials example

---

*Pitfalls research for: Open-sourcing DevHub internal tool on Cloudflare Workers*
*Researched: 2026-03-01*
