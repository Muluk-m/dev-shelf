# External Integrations

**Analysis Date:** 2026-03-01

## APIs & External Services

**Authentication:**
- Feishu (Lark) OAuth - User authentication via third-party OAuth service
  - Client ID: Configured via `FEISHU_CLIENT_ID` env var
  - OAuth endpoints: Proxied through `OAUTH_BASE_URL` (https://thirdpart-service-hub-app-test.qiliangjia.org)
  - Implementation: `workers/routes/auth.ts`
  - Flow: OAuth 2.0 authorization code grant with JWT tokens

**AI/LLM Services:**
- Cloudflare AI (Workers AI) - Used for query analysis and icon generation
  - Endpoints: `/api/query-analyzer/convert-to-sql`, `/api/query-analyzer/analyze-data`
  - Model: Accessed via `c.env.AI` binding
  - Implementation: `workers/routes/query-analyzer.ts`, `workers/routes/icon-generator.ts`

**A/B Testing Router:**
- Custom A/B Router Service - External link routing service
  - Upstream URL: https://app.downloads.my
  - Proxy implementation: `workers/routes/ab-router.ts`
  - Features: Link management, traffic routing, statistics tracking
  - Client API: `app/lib/api.ts` (A/B Router section)

**CDN/Image Service:**
- Image CDN - Static image hosting
  - URL prefix: Configured via `IMAGE_PREFIX` env var (https://image.deepclick.com)

## Data Storage

**Databases:**
- Cloudflare D1 (SQLite) - Primary application database
  - Binding name: `DB`
  - Database name: `devhub-database`
  - Database ID: `61845697-203d-4a2c-9eaf-dc2985b7f727`
  - Schema file: `db/database.sql`
  - Tables: `tools`, `tool_environments`, `tool_tags`, `tool_categories`, `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `user_preferences`
  - Access layer: `lib/database/tools.ts`, `lib/database/permissions.ts`

**File Storage:**
- Cloudflare R2 - Object storage for assets and logs
  - `ASSETS_BUCKET` binding → `storage` bucket (user uploads, tool icons)
  - `CF_ALL_LOG` binding → `cloudflare-all-logs` bucket (Cloudflare analytics logs)
  - Public CDN endpoint: `/assets/*` route serves R2 objects with 1-year cache
  - Upload handler: `workers/routes/uploads.ts`

**Caching:**
- Cloudflare KV - Cache storage for API responses
  - Binding name: `CACHE_KV`
  - KV namespace ID: `76fb6b23405646699f1eea148fac6079`
  - Cache manager: `lib/cache-manager.ts`
  - Usage: Tool lists, categories, permissions caching with version management

## Authentication & Identity

**Auth Provider:**
- Feishu OAuth (via custom OAuth service)
  - Implementation: OAuth 2.0 with JWT tokens
  - Session: HTTP-only cookie (`auth_token`) with 30-day expiration
  - User management: `lib/database/permissions.ts`
  - Middleware: `workers/middleware/auth.ts`
  - Identity endpoint: `/api/identity` (user info and roles)

**Authorization:**
- Role-Based Access Control (RBAC)
  - Roles: Admin, user (default)
  - Permissions: Resource-action pairs (e.g., `tools:create`, `categories:delete`)
  - Admin UI: `app/routes/admin.permissions.tsx`

## Monitoring & Observability

**Error Tracking:**
- None - No external error tracking service configured

**Logs:**
- Cloudflare Workers Observability - Built-in logging via wrangler.jsonc
  - Observability enabled: true
  - Access via Cloudflare dashboard
- Custom log storage: Cloudflare R2 bucket (`CF_ALL_LOG`) for analytics logs
  - Query interface: `app/routes/tools/query-analyzer.tsx`

**Analytics:**
- Custom usage tracking
  - Tool usage statistics: `api/tools/${toolId}/usage` endpoint
  - Implementation: `lib/database/tools.ts` (tool_usage table)
  - Visualization: `app/routes/home.tsx` (recently used, popular tools)

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers
  - Production domain: qlj-devhub-homepage.qiliangjia.one
  - Test domain: qlj-devhub-homepage-test.qiliangjia.one
  - Deploy command: `npm run deploy` (builds and deploys via wrangler)

**CI Pipeline:**
- None - No GitHub Actions or automated CI detected
  - Deployment: Manual via `wrangler deploy`

**Version Control:**
- Git repository
  - Main branch: `main`
  - Recent commits show feature development and PR merges

## Environment Configuration

**Required env vars (wrangler.jsonc):**
- `API_BASE_URL` - Production API endpoint (https://qlj-devhub-homepage.qiliangjia.one)
- `FEISHU_CLIENT_ID` - Feishu OAuth client identifier
- `OAUTH_BASE_URL` - OAuth service base URL
- `IMAGE_PREFIX` - CDN prefix for images

**Cloudflare Bindings:**
- `DB` - D1 database binding
- `ASSETS_BUCKET` - R2 storage binding
- `CF_ALL_LOG` - R2 logs binding
- `CACHE_KV` - KV namespace binding
- `AI` - Cloudflare AI binding (Workers AI)

**Secrets location:**
- `.env` file present (contents not accessible for security)
- Production secrets: Managed via Cloudflare Workers dashboard
- No committed credential files detected

## Webhooks & Callbacks

**Incoming:**
- `/auth/callback` - OAuth callback endpoint for Feishu authentication
  - Handler: `workers/routes/auth.ts`
  - Creates/updates user records in D1 database

**Outgoing:**
- None - No outbound webhooks detected

## Third-Party Libraries

**npm Packages:**
- All managed via `package.json` and `pnpm-lock.yaml`
- Custom internal package: `@qlj/common-utils` 0.0.11 (private organization package)

**CDN Resources:**
- shadcn/ui components (self-hosted via npm)
- Lucide icons (npm package)
- No external CDN dependencies for critical functionality

---

*Integration audit: 2026-03-01*
