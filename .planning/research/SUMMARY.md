# Project Research Summary

**Project:** DevHub Open Source Edition
**Domain:** Self-Hosted Developer Tool Management Platform on Cloudflare Workers
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

DevHub targets the underserved middle ground in developer tooling: teams needing more than a static bookmark page (Homer/Heimdall) but less complexity than enterprise Internal Developer Portals (Backstage). The recommended approach is a one-click deployable Cloudflare Workers application with built-in username/password authentication, replacing the current Feishu OAuth system. The core technical challenge is implementing secure password hashing within Workers' constraints (Web Crypto API PBKDF2 with 600,000+ iterations instead of bcrypt/argon2) while maintaining zero-configuration deployment via Cloudflare Deploy Button.

The conversion from internal tool to open-source requires systematically removing business integrations (Feishu OAuth, ClickHouse credentials, @qlj/common-utils package, DeepClick modules) and replacing them with self-contained alternatives. The biggest risk is leaking internal URLs or credentials in Git history, which requires careful auditing and potential history rewriting. Success hinges on a first-run setup wizard that auto-creates admin accounts from environment variables, comprehensive D1 migration strategy, and clear documentation of Cloudflare's D1 limitations (10 GB hard cap, single-threaded queries, 2 MB row size).

The product already has strong differentiators (command palette, multi-environment links, embedded tools) and proven architecture (Hono + D1 + React Router v7). The path to open-source is well-defined: remove business dependencies, implement local auth, configure Deploy Button, and document self-hosting requirements.

## Key Findings

### Recommended Stack

The existing stack is well-suited for open-source conversion with strategic upgrades and dependency replacements. The critical change is replacing Feishu OAuth with self-contained authentication using Hono's built-in JWT helpers and Web Crypto API for password hashing.

**Core technologies:**
- **Hono 4.8.2 → 4.12+**: Web framework with built-in JWT middleware — upgrade required for algorithm confusion protection (CVE fixes in 4.11.4+)
- **Web Crypto API PBKDF2**: Password hashing with 600,000+ iterations — only viable option for Workers (bcrypt/argon2 incompatible with Workers runtime)
- **Cloudflare D1 SQLite**: User authentication database — already in use for tools, zero additional cost, native binding support
- **es-toolkit**: Utility library replacing @qlj/common-utils — provides safeJsonParse, type guards, async utilities without private package dependency
- **Zod ^3.23+**: Schema validation for auth endpoints — industry standard for request/response validation

**Critical constraint:** Cloudflare Workers cannot use bcrypt or argon2 due to V8 isolate limitations and 50ms CPU time caps. PBKDF2-SHA256 with 600,000 iterations via Web Crypto API is the recommended approach, balancing security and Workers compatibility.

### Expected Features

Users in this domain expect zero-config deployment with automatic resource provisioning, first-run setup wizards, and data portability. DevHub already delivers many differentiators but needs table-stakes authentication.

**Must have (table stakes):**
- **User Authentication** — username/password with JWT sessions (currently missing, uses Feishu OAuth)
- **First-Run Setup Wizard** — detect empty user table, create initial admin without CLI
- **Role-Based Access Control** — admin (CRUD) vs user (read-only) distinction
- **One-Click Deploy** — Cloudflare Deploy Button with auto-provisioned D1, KV, R2
- **Data Export** — JSON export of all tools/categories for portability
- **Session Management** — HTTP-only cookies with 7-day expiry, reasonable timeout
- **Documentation** — clear Deploy Button + manual setup instructions

**Should have (competitive differentiators):**
- **Command Palette (Cmd+K)** — already exists, major advantage over Heimdall/Homer
- **Multi-Environment Links** — already exists, rare in simple dashboards
- **Embedded Tools** — already exists, turns DevHub into Swiss Army knife
- **Edge Caching** — already exists (KV + Cache API), instant load times
- **Tool Status Indicators** — already exists (Active/Maintenance/Deprecated)
- **User Preferences** — favorites + recently used, already exists in localStorage

**Defer (v2+):**
- **OAuth Providers (GitHub/Google)** — adds external dependencies, complexity
- **Email Notifications** — requires SMTP/SendGrid, secrets management
- **Multi-Tenancy** — database isolation complexity, one deployment per team is simpler
- **Plugin System** — API stability burden, fork-friendly codebase is better approach

### Architecture Approach

The existing full-stack architecture on Cloudflare Workers is sound. The conversion requires replacing the auth layer while preserving the field mapping pattern and caching strategy.

**Major components:**
1. **Frontend (React Router v7)** — SPA with file-based routing, shadcn/ui components, Zustand state management
2. **API Layer (Hono)** — Request handling, JWT authentication middleware, business logic on Workers runtime
3. **Database Layer (D1)** — SQLite persistence with snake_case → camelCase field mapping in `lib/database/*.ts`
4. **Auth Middleware** — JWT validation via Hono helpers, session management with HTTP-only cookies, user context in request pipeline
5. **Cache Layer** — Multi-tier caching (KV + Cache API + localStorage), version-based invalidation on updates

**Key architectural patterns:**
- **JWT-Based Authentication**: Replace OAuth with self-contained username/password using Web Crypto PBKDF2 and Hono JWT helpers
- **First-Run Setup**: Auto-detect empty users table, trigger setup wizard to create admin from ADMIN_PASSWORD env var
- **Deploy Button Integration**: Configure deploy.json to auto-provision D1, KV, R2 with binding descriptions
- **Field Mapping Layer**: Maintain existing snake_case ↔ camelCase translation at database boundary for idiomatic code

**Critical integration changes:**
- Remove Feishu OAuth (OAUTH_BASE_URL, FEISHU_CLIENT_ID)
- Remove R2 log storage (CF_ALL_LOG binding)
- Replace @qlj/common-utils with es-toolkit or inline utilities
- Remove DeepClick quick-login module

### Critical Pitfalls

Based on research, these are the highest-risk failures during open-source conversion:

1. **Leaked Internal URLs in Client Code** — Internal domains (qiliangjia, deepclick), ClickHouse credentials, business-specific endpoints exposed in public repo. **Avoid:** Systematic grep audit, replace hardcoded URLs with env vars, remove business features entirely before public release.

2. **Secrets in wrangler.jsonc Git History** — Real credentials, database IDs, KV namespace IDs committed to version control remain in Git history forever. **Avoid:** Replace all real IDs with empty strings, use Deploy Button auto-provisioning, add .env.example with safe placeholders, run git-filter-repo if already leaked.

3. **Password Hashing Incompatible with Workers** — bcrypt/argon2 fail on Workers due to 50ms CPU limits and V8 isolate constraints. **Avoid:** Use Web Crypto PBKDF2-SHA256 with 600,000+ iterations, calibrate to 50-150ms on Workers, or delegate to external auth service.

4. **D1 Migrations Not Running After Deploy** — Deploy Button provisions empty D1 database but doesn't auto-run migrations, causing "table not found" errors. **Avoid:** Use binding names (DB) not database names in migration commands, provide setup script in package.json, document post-deploy migration steps clearly.

5. **Private NPM Package Blocks Install** — @qlj/common-utils is organization-private, npm install fails immediately for open-source users. **Avoid:** Remove from package.json, inline needed utilities to lib/utils/, test clean install without private registry access.

6. **D1 Production Limits Hit Without Warning** — Database hits 10 GB hard cap, single-threaded queries queue under load, row size >2 MB rejected. **Avoid:** Document limits prominently in README, design for horizontal scaling (per-tenant DBs), cache aggressively, paginate all result sets.

7. **Deploy Button Resource Provisioning Race Conditions** — Worker deploys before D1/KV/R2 bindings ready, causing "binding not found" errors. **Avoid:** Use consistent binding names, validate bindings at startup, provide health check endpoint, leave resource IDs empty in wrangler.jsonc for auto-provisioning.

## Implications for Roadmap

Based on research, the conversion follows a clear dependency chain from cleanup → auth → deployment configuration → polish. Total timeline: 2-3 weeks for single focused developer.

### Phase 1: Remove Business Dependencies & Audit Security
**Rationale:** Must establish clean codebase before adding new auth. Prevents confusion between OAuth and local auth systems, removes private packages blocking open-source adoption.

**Delivers:**
- Clean codebase with no internal URLs, credentials, or business logic
- Removed Feishu OAuth routes, @qlj/common-utils dependency, DeepClick modules
- Sanitized wrangler.jsonc with placeholder values
- Verified no secrets in Git history

**Addresses:**
- Pitfall #1 (leaked URLs), #2 (secrets in config), #5 (private packages)
- Anti-feature: OAuth providers (removes Feishu, keeps door open for future OAuth via fork)

**Avoids:**
- Client-side secret exposure, Git history leaks, dependency installation failures

**Research flags:** Standard cleanup work, no additional research needed (grep patterns well-defined).

---

### Phase 2: Implement Local Authentication System
**Rationale:** Foundation for all access control. Must exist before RBAC, first-run setup, or Deploy Button. Replaces external OAuth with self-contained auth.

**Delivers:**
- User authentication tables (users, sessions) via D1 migration
- Password hashing with Web Crypto PBKDF2-SHA256 (600,000+ iterations)
- User database operations (createUser, getUserByUsername, validatePassword)
- Auth routes (POST /api/auth/login, /api/auth/logout, /api/auth/change-password)
- JWT middleware with Hono helpers (HS256 algorithm, HTTP-only cookies)

**Uses:**
- Hono JWT helpers (hono/jwt) for token signing/verification
- Web Crypto API for PBKDF2 password hashing
- Zod for request validation on auth endpoints
- D1 for user/session persistence

**Implements:**
- Authentication Flow (Architecture pattern #1)
- User schema with password_hash, salt, role fields
- JWT pattern: 15min access token, 7day refresh token, session table for revocation

**Avoids:**
- Pitfall #3 (bcrypt incompatibility) by using Web Crypto PBKDF2
- Pitfall #4 (migration failures) by using binding names, sequential migrations

**Research flags:** Standard JWT + PBKDF2 implementation, well-documented patterns. No additional research needed.

---

### Phase 3: Admin Setup & Role-Based Access Control
**Rationale:** Enables zero-config deployment. Requires auth system from Phase 2 to exist first. Protects admin endpoints before public release.

**Delivers:**
- First-run setup wizard (detects empty users table, shows setup form)
- Admin initialization endpoint (POST /api/setup/initialize, creates user from ADMIN_PASSWORD env var)
- RBAC middleware (requireAdmin, requireAuth)
- Protected admin routes (tool CRUD restricted to admin role)
- Admin user management UI (create users, reset passwords, assign roles)

**Uses:**
- Auth system from Phase 2 (createUser, JWT validation)
- D1 users table with role column ('admin' | 'user')
- Environment variables (ADMIN_PASSWORD for initial setup)

**Implements:**
- First-Run Setup pattern (Architecture pattern #2)
- Role-based route protection

**Addresses:**
- Table stakes: First-Run Setup, Role-Based Access, Password Reset (admin-initiated)
- UX pitfall: "No first-run setup wizard" (users confused about admin creation)

**Avoids:**
- Pitfall: Manual admin account creation via CLI (breaks zero-config promise)
- Security mistake: GET requests bypass auth (enforce auth on all sensitive endpoints)

**Research flags:** Standard RBAC implementation, no additional research needed.

---

### Phase 4: Cloudflare Deploy Button Configuration
**Rationale:** Requires complete auth and database schema from Phases 2-3. Final integration point for zero-config deployment.

**Delivers:**
- deploy.json with D1, KV, R2 auto-provisioning
- Environment variable documentation (JWT_SECRET, ADMIN_PASSWORD with generation instructions)
- Finalized D1 migrations (complete schema with version tracking)
- Deployment guide (docs/DEPLOYMENT.md with Deploy Button + manual setup paths)
- Health check endpoint (GET /api/health returns binding status)

**Uses:**
- Deploy Button auto-provisioning (D1 database, KV namespace, R2 bucket)
- Binding descriptions in deploy.json
- Migration auto-apply configuration

**Implements:**
- Deploy Button pattern (Architecture pattern #3)
- First-Time Deployment Flow (creates resources → runs migrations → triggers setup)

**Addresses:**
- Table stakes: One-Click Deploy, Environment Variables, Documentation
- UX pitfall: "Deploy completes but app crashes" (health check + setup status page)

**Avoids:**
- Pitfall #7 (resource provisioning race conditions) with binding validation
- Pitfall #4 (migrations not running) with clear setup instructions
- Pitfall #6 (wrong bindings) by leaving IDs empty for auto-provisioning

**Research flags:** Deploy Button mechanics well-documented, test end-to-end flow required.

---

### Phase 5: Open-Source Infrastructure & Documentation
**Rationale:** Polish for public release. Can proceed in parallel with Phase 4 (documentation work).

**Delivers:**
- CONTRIBUTING.md (code style, PR process, development setup)
- LICENSE (MIT or Apache 2.0)
- README.md with Deploy Button badge, self-hosting guide, feature list
- GitHub Actions CI/CD (linting via Biome, type checking, automated testing)
- GitHub issue templates (bug report, feature request)
- Architecture documentation (docs/ARCHITECTURE.md)

**Addresses:**
- Table stakes: Documentation with clear deployment instructions
- Open-source best practices (contributor guide, license, CI/CD)

**Avoids:**
- UX pitfall: "Error messages reference internal terms" (user-friendly README/docs)
- Documentation gaps that block community adoption

**Research flags:** None, standard open-source documentation patterns.

---

### Phase 6: Data Portability & Admin Features
**Rationale:** Table-stakes features that enhance user trust and control. Can be implemented after core launch.

**Delivers:**
- JSON export of all tools, categories, environments, tags
- Admin dashboard showing database stats (tool count, user count, storage used)
- Bulk import (JSON/CSV) for migrating from other dashboards
- Data backup documentation (Cloudflare D1 export commands)

**Addresses:**
- Table stakes: Data Export (self-hosted users demand data ownership)
- Post-MVP: Bulk Import (v1.x feature after user validation)

**Avoids:**
- Vendor lock-in perception (users want export capability before adopting)

**Research flags:** Standard JSON serialization, no additional research needed.

---

### Phase 7: Performance Optimization & Security Hardening
**Rationale:** Address production scalability before wider adoption. Implements lessons from PITFALLS.md.

**Delivers:**
- N+1 query optimization (JOIN queries for tools with environments/tags)
- Database indexes on foreign keys (tool_id, category_id)
- Rate limiting on auth endpoints (prevent brute force via KV counter)
- Session token rotation (reduce JWT verification overhead)
- Audit logging for admin operations (track tool changes)

**Addresses:**
- Pitfall: N+1 queries cause performance issues (optimize before 100+ tools)
- Security mistake: No rate limiting on auth endpoints (implement early)
- Performance trap: Unbounded result sets (add pagination everywhere)

**Avoids:**
- D1 overload errors by reducing query load via caching and optimization
- Brute force attacks via rate limiting implementation

**Research flags:** **Needs deeper research** — D1 performance optimization patterns, Workers rate limiting strategies.

---

### Phase Ordering Rationale

1. **Phase 1 before Phase 2:** Cannot implement local auth cleanly without removing OAuth system first. Private package blocks all development.

2. **Phase 2 before Phase 3:** Admin setup depends on user authentication system existing (createUser, JWT tokens).

3. **Phase 3 before Phase 4:** Deploy Button requires finalized database schema including user tables. First-run wizard depends on admin initialization.

4. **Phase 5 parallel with Phase 4:** Documentation work doesn't block deployment configuration. Can proceed simultaneously.

5. **Phase 6 after Phase 4:** Data export requires stable API and auth system. Not blocking launch.

6. **Phase 7 last:** Performance optimization and security hardening happen after core validation. Premature optimization risk otherwise.

**Critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 4 (2-3 weeks)
**Parallel work:** Phase 5 alongside Phase 4 (1 week overlap)
**Post-launch:** Phase 6 → Phase 7 (v1.1 - v1.2 releases)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 7 (Performance):** D1 query optimization patterns, Workers rate limiting strategies, session token caching approaches

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Standard cleanup (grep, package removal, config sanitization)
- **Phase 2:** Well-documented JWT + PBKDF2 implementation (Hono docs, Web Crypto API docs)
- **Phase 3:** Standard RBAC middleware patterns (Hono examples)
- **Phase 4:** Deploy Button mechanics documented in Cloudflare official docs
- **Phase 5:** Standard open-source documentation (templates exist)
- **Phase 6:** Standard JSON serialization (no novel patterns)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Cloudflare docs + Hono docs + reference implementations verified. PBKDF2 approach validated by multiple sources. |
| Features | HIGH | Extensive research on IDP landscape, self-hosted dashboards, and bookmark managers. Clear market positioning identified. |
| Architecture | HIGH | Existing patterns proven (field mapping, caching). JWT/PBKDF2 patterns well-documented. Deploy Button mechanics official. |
| Pitfalls | HIGH | Security issues drawn from recent 2026 research, D1 limits from official docs, Deploy Button issues from community reports. |

**Overall confidence:** HIGH

### Gaps to Address

**PBKDF2 iteration calibration:** Research recommends 600,000-800,000 iterations for 2026, but Workers CPU limits (50ms) require testing actual performance. **Action:** Benchmark during Phase 2 implementation, adjust iterations based on real Workers performance.

**D1 query performance at scale:** Research identifies N+1 patterns and batch operation inefficiencies, but actual performance degradation point (100 tools? 1000 tools?) unknown. **Action:** Load testing during Phase 7, document observed limits in README.

**Deploy Button migration timing:** Unclear if migrations can auto-apply during Deploy Button provisioning or require separate setup step. **Action:** Test during Phase 4, document proven approach in deployment guide.

**Multi-environment tooling:** Current code supports Dev/Test/Prod environments per tool, but unclear if this scales to 10+ environments or custom environment names. **Action:** Validate during Phase 6 if users request custom environments.

## Sources

### Primary (HIGH confidence)
- **Cloudflare Official Documentation:** Workers runtime APIs, D1 database, Deploy Buttons, Web Crypto API
- **Hono Official Documentation:** JWT authentication, middleware patterns, Cloudflare Workers integration
- **OWASP 2023:** PBKDF2 iteration recommendations (600,000 minimum for SHA-256)
- **Codebase Analysis:** .planning/codebase/CONCERNS.md, INTEGRATIONS.md, wrangler.jsonc, existing architecture patterns

### Secondary (MEDIUM confidence)
- **Cloudflare Community Forums:** Password hashing discussions, D1 migration patterns, Deploy Button troubleshooting
- **Reference Implementation:** vhscom/private-landing (PBKDF2-SHA384 with 128-bit salts, NIST SP 800-132 compliant)
- **Developer Blogs:** Jamie Lord (password hashing on Workers), morphinewan (D1 2MB limit lessons)
- **IDP Research:** Backstage documentation, Cortex/Qovery IDP comparisons, Gartner on Internal Developer Portals

### Tertiary (LOW confidence)
- **dev.to Articles:** PBKDF2 iteration projections for 2025+ (800k recommended, needs validation)
- **Community Support Forums:** AnswerOverflow discussions on D1 scaling complexity

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
