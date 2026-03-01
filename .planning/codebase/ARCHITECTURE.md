# Architecture

**Analysis Date:** 2026-03-01

## Pattern Overview

**Overall:** Full-stack Single Page Application with API Backend on Edge Workers

**Key Characteristics:**
- React Router v7 SPA frontend with server-side rendering support
- Hono-based REST API running on Cloudflare Workers (edge compute)
- Cloudflare D1 (SQLite) database with multi-table relational schema
- State management via Zustand with localStorage persistence
- Edge caching via Cloudflare KV and Cache API
- Modular separation between frontend (`app/`), backend (`workers/`), and shared database logic (`lib/`)

## Layers

**Presentation Layer (React Router v7 SPA):**
- Purpose: User interface, routing, client-side state management
- Location: `app/`
- Contains: React components, routes, hooks, stores, UI logic
- Depends on: Backend API layer via `app/lib/api.ts`
- Used by: End users via browser

**Backend API Layer (Hono on Workers):**
- Purpose: REST API endpoints, request handling, authentication, business logic orchestration
- Location: `workers/`
- Contains: Hono router, API route handlers, middleware (auth, CORS)
- Depends on: Database layer (`lib/database/`), Cloudflare bindings (D1, R2, KV)
- Used by: Presentation layer, external clients

**Database Layer (D1 Operations):**
- Purpose: Data access, SQL query execution, field mapping (snake_case ↔ camelCase), caching
- Location: `lib/database/`
- Contains: CRUD functions for tools, categories, permissions; cache version management
- Depends on: Cloudflare D1 binding, KV for cache versioning
- Used by: Backend API layer

**Cross-Cutting Utilities:**
- Purpose: Shared types, utilities, formatting helpers
- Location: `app/lib/`, `lib/types/`, `workers/utils/`
- Contains: Type definitions, utility functions, API client
- Depends on: Nothing (utility layer)
- Used by: All other layers

## Data Flow

**Tool Listing Flow (with caching):**

1. User visits homepage → `app/routes/home.tsx` component mounts
2. `useToolsInit()` hook checks Zustand store for cached tools
3. If not cached, React Query fetches `/api/tools/init`
4. Backend handler in `workers/routes/tools.ts` receives request
5. Database layer `lib/database/tools.ts` checks KV cache version
6. If cache valid, return cached JSON; else query D1 database
7. SQL results mapped from `snake_case` to `camelCase` fields
8. Response cached with 7-day TTL in Cloudflare Cache API
9. Frontend receives data, stores in Zustand + localStorage
10. Component renders tool grid

**Tool Creation Flow (with transactions):**

1. Admin submits form → POST to `/api/tools`
2. Backend validates required fields (name, description, category)
3. `createTool()` in `lib/database/tools.ts` starts D1 batch transaction
4. Insert into `tools`, `tool_environments`, `tool_tags` tables atomically
5. On success, increment cache version in KV (invalidates all caches)
6. Return 201 with new tool ID
7. Frontend re-fetches tools list, updates UI

**State Management:**
- Server state: React Query manages API data fetching, caching, background updates
- Client state: Zustand stores for tools, user preferences, permissions
- Persistence: localStorage via Zustand persist middleware
- Hydration: SSR-safe hydration flag (`_hasHydrated`) prevents flash of empty state

## Key Abstractions

**Tool Entity:**
- Purpose: Core domain model representing a development tool
- Examples: `app/types/tool.ts`, `lib/types/tool.ts`
- Pattern: Rich domain model with nested environments, tags, metadata
- Critical fields: `id`, `name`, `isInternal`, `environments[]`, `permissionId`

**Cache Version Manager:**
- Purpose: Global cache invalidation across distributed edge locations
- Examples: `lib/database/tools.ts` lines 17-50 (CacheVersionManager class)
- Pattern: Timestamp-based versioning stored in KV, appended to cache keys
- Invalidation: Increment version on mutations → all old caches become stale

**Database Field Mapper:**
- Purpose: Translate between SQL snake_case and JavaScript camelCase
- Examples: `lib/database/tools.ts` lines 84-89, 98-100
- Pattern: In-place object mutation after query results
- Critical mappings: `is_internal` → `isInternal`, `last_updated` → `lastUpdated`

**Command Panel:**
- Purpose: Global keyboard-driven tool launcher (Cmd/Ctrl+K)
- Examples: `app/components/command-panel/command-panel.tsx`, `app/context/command-panel-context.tsx`
- Pattern: Context provider with command registry, fuzzy search, keyboard navigation

## Entry Points

**Frontend Entry Point:**
- Location: `app/root.tsx`
- Triggers: Browser navigation
- Responsibilities:
  - HTML document structure with SSR-safe theme script
  - Provider tree (ThemeProvider, QueryClientProvider, CommandPanelProvider)
  - Global error boundary
  - Outlet for nested routes

**Backend Entry Point:**
- Location: `workers/app.ts`
- Triggers: HTTP requests to Cloudflare Worker
- Responsibilities:
  - Hono app initialization
  - CORS and auth middleware application
  - Route mounting (`/api/tools`, `/api/categories`, `/auth`, etc.)
  - Static asset serving from R2 (`/assets/*`)
  - React Router SSR fallback for SPA routes (`*`)

**Database Schema Entry:**
- Location: `db/database.sql`
- Triggers: Manual database setup via `wrangler d1 execute`
- Responsibilities:
  - Create tables: `tools`, `tool_categories`, `tool_environments`, `tool_tags`, `tool_usage_events`
  - Define foreign key relationships
  - Create indexes for query performance
  - Seed initial category data

## Error Handling

**Strategy:** Layered error handling with fail-safe defaults

**Patterns:**
- **API Layer:** Try-catch blocks return HTTP error codes (400, 404, 500) with JSON error messages
- **Database Layer:** Catch query errors, log to console, throw descriptive Error objects
- **Frontend:** React Query error boundaries, toast notifications via Sonner
- **Permissions:** Fail-open on access check errors (allow access if check fails)
- **Cache Failures:** Graceful degradation - return fresh data if cache unavailable

**Example from `workers/routes/tools.ts` lines 46-49:**
```typescript
} catch (error) {
    console.error("Error fetching initial data:", error);
    return c.json({ error: "Internal server error" }, 500);
}
```

## Cross-Cutting Concerns

**Logging:** Console-based logging (relies on Cloudflare Workers console output)

**Validation:**
- Frontend: React Hook Form with type-safe validation
- Backend: Manual field presence checks in route handlers
- Database: SQL constraints (FOREIGN KEY, CHECK, UNIQUE)

**Authentication:**
- Middleware: `workers/middleware/auth.ts` checks JWT tokens
- Session management: HTTP-only cookies
- User context: `getCurrentUserId()` utility in `workers/utils/auth.ts`
- OAuth integration: Feishu (Lark) OAuth via `OAUTH_BASE_URL` env var

**Permissions:**
- Model: Tools can have optional `permissionId` linking to permission requirements
- Check: `lib/database/tool-permissions.ts` filters tools based on user permissions
- Enforcement: Per-tool access checks via `/api/tools/:id/access` endpoint

**Caching:**
- Strategy: Multi-layer caching (KV + Cache API + client localStorage)
- Invalidation: Version-based global invalidation via KV timestamps
- TTL: 7 days for tools/categories data
- Client: Zustand persist + React Query stale-while-revalidate

---

*Architecture analysis: 2026-03-01*
