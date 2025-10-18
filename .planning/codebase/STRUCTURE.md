# Codebase Structure

**Analysis Date:** 2026-03-01

## Directory Layout

```
qlj-devhub-homepage/
├── app/                    # Frontend React Router v7 application
│   ├── components/         # React components (161 files total)
│   ├── routes/             # File-based routing definitions
│   ├── lib/                # Frontend utilities and API client
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript type definitions
│   ├── context/            # React context providers
│   ├── root.tsx            # Root layout component
│   └── routes.ts           # Route configuration
├── workers/                # Cloudflare Workers backend (13 files)
│   ├── routes/             # API route handlers
│   ├── middleware/         # Request middleware (auth, etc.)
│   ├── utils/              # Worker utilities
│   └── app.ts              # Main Hono application
├── lib/                    # Shared database and type logic
│   ├── database/           # D1 database operations
│   └── types/              # Shared TypeScript types
├── db/                     # Database schema and migrations
│   └── database.sql        # D1 schema dump
├── public/                 # Static assets
├── .planning/              # GSD planning documents
│   └── codebase/           # Codebase analysis docs
├── .react-router/          # Generated React Router types
├── build/                  # Production build output
├── package.json            # Dependencies (pnpm)
├── wrangler.jsonc          # Cloudflare Workers config
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
└── biome.json              # Biome linter config
```

## Directory Purposes

**app/**
- Purpose: Frontend application code (React Router v7 SPA)
- Contains: Components, routes, hooks, stores, styles, types
- Key files: `root.tsx` (entry), `routes.ts` (routing config), `app.css` (global styles)

**app/components/**
- Purpose: Reusable React components organized by feature
- Contains:
  - `ui/` - shadcn/ui components (buttons, dialogs, forms, etc.)
  - `layout/` - Layout components (header, admin layout)
  - `admin/` - Admin panel components (tool form, category list)
  - `command-panel/` - Command palette implementation
  - `search/` - Search UI components
  - `query-analyzer/` - ClickHouse query tool components
  - `ab-router/` - A/B testing link router components
  - `pwa-link-health/` - PWA link health checker components
  - `pixel-tools/` - Marketing pixel testing tools

**app/routes/**
- Purpose: File-based route definitions for React Router
- Contains:
  - `home.tsx` - Main dashboard/tool listing page
  - `admin.tsx` - Admin panel for tool management
  - `admin.permissions.tsx` - Permission management UI
  - `tools/` - Internal tool routes (JSON formatter, URL parser, etc.)
  - `tools.$id.tsx` - External tool detail page

**app/lib/**
- Purpose: Frontend utilities and API client
- Contains:
  - `api.ts` - Centralized API client with all backend endpoints
  - `utils.ts` - General utilities (cn, formatting, etc.)
  - Feature-specific utilities (query templates, whitelist token, etc.)

**app/stores/**
- Purpose: Zustand state management stores
- Contains:
  - `tools-store.ts` - Tools, categories, usage stats with localStorage persistence
  - `user-info-store.ts` - Current user information
  - `user-preferences-store.ts` - Favorites, recent tools
  - `permissions-store.ts` - User permissions

**app/hooks/**
- Purpose: Custom React hooks for shared logic
- Contains: Query hooks, search hooks, command panel logic, etc.

**workers/**
- Purpose: Cloudflare Workers backend API
- Contains: Hono app, route handlers, middleware, utilities

**workers/routes/**
- Purpose: API endpoint handlers
- Contains:
  - `tools.ts` - Tool CRUD endpoints (`/api/tools`)
  - `categories.ts` - Category endpoints (`/api/categories`)
  - `auth.ts` - Authentication endpoints (`/auth`)
  - `permissions.ts` - Permission management
  - `uploads.ts` - R2 file upload handling
  - `cf-logs.ts` - Cloudflare log analysis
  - `query-analyzer.ts` - ClickHouse query proxy
  - `icon-generator.ts` - AI icon generation
  - `ab-router.ts` - A/B link routing proxy

**workers/middleware/**
- Purpose: Request processing middleware
- Contains: `auth.ts` - JWT authentication and CORS middleware

**lib/**
- Purpose: Shared logic between frontend and backend
- Contains: Database operations, shared types

**lib/database/**
- Purpose: D1 database query functions and caching
- Contains:
  - `tools.ts` - Tool CRUD with cache management
  - `permissions.ts` - Permission queries
  - `tool-permissions.ts` - Tool access control logic

**db/**
- Purpose: Database schema and seed data
- Contains: `database.sql` - Full D1 schema export (SQLite)
- Generated: No (manually created/dumped)
- Committed: Yes

**.planning/codebase/**
- Purpose: GSD codebase analysis documents
- Contains: ARCHITECTURE.md, STRUCTURE.md (this file)
- Generated: By `/gsd:map-codebase` command
- Committed: Yes

**build/**
- Purpose: Production build artifacts
- Contains: `client/` (static assets), `server/` (SSR bundle)
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**.react-router/**
- Purpose: Auto-generated route type definitions
- Contains: Type-safe route typing for React Router
- Generated: Yes (by `react-router typegen`)
- Committed: No

## Key File Locations

**Entry Points:**
- `app/root.tsx`: React app root with providers
- `workers/app.ts`: Hono backend entry point
- `app/routes.ts`: Route configuration

**Configuration:**
- `wrangler.jsonc`: Cloudflare Workers deployment config (D1, R2, KV bindings)
- `package.json`: Dependencies and npm scripts (pnpm)
- `vite.config.ts`: Vite build configuration
- `tsconfig.json`: TypeScript compiler settings
- `biome.json`: Code linter/formatter configuration
- `components.json`: shadcn/ui component registry

**Core Logic:**
- `lib/database/tools.ts`: Tool database operations with caching
- `app/lib/api.ts`: Frontend API client (single source of truth for endpoints)
- `workers/middleware/auth.ts`: Authentication middleware
- `app/stores/tools-store.ts`: Client-side tool state management

**Testing:**
- No test files currently present in codebase

## Naming Conventions

**Files:**
- Routes: `kebab-case.tsx` (e.g., `admin.permissions.tsx`, `tools.$id.tsx`)
- Components: `kebab-case.tsx` (e.g., `tool-card.tsx`, `command-panel.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-utils.ts`, `query-history-storage.ts`)
- Types: `kebab-case.ts` (e.g., `user-info.ts`, `cf-logs.ts`)

**Directories:**
- Feature-based: `kebab-case` (e.g., `command-panel/`, `ab-router/`, `pwa-link-health/`)
- Layer-based: `lowercase` (e.g., `routes/`, `components/`, `hooks/`)

**React Components:**
- PascalCase in code (e.g., `ToolCard`, `CommandPanel`)
- kebab-case in filenames (e.g., `tool-card.tsx`, `command-panel.tsx`)

**TypeScript:**
- Interfaces: PascalCase (e.g., `Tool`, `ToolCategory`, `ToolUsageStat`)
- Variables: camelCase (e.g., `toolsRouter`, `getCacheContext`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `TOOLS_CACHE_TTL_SECONDS`)

## Where to Add New Code

**New Internal Tool (browser-based utility):**
- Primary code: `app/routes/tools/new-tool.tsx` (route component)
- Route registration: Add to `app/routes.ts` under `tools` route group
- Tests: Not currently structured (would be `app/routes/tools/new-tool.test.tsx`)

**New External Tool (database entry):**
- Database: Add via Admin UI at `/admin` or POST to `/api/tools`
- Icon: Upload to R2 or use external URL
- Environments: Configure production/test URLs in database

**New API Endpoint:**
- Implementation: `workers/routes/new-feature.ts` (create new router)
- Mount: Import and mount in `workers/app.ts` (e.g., `app.route("/api/new-feature", newFeatureRouter)`)
- Types: `lib/types/new-feature.ts` for shared types
- Frontend client: Add functions to `app/lib/api.ts`

**New Component/Module:**
- Implementation: `app/components/feature-name/component-name.tsx`
- Organize by feature if complex (e.g., `app/components/my-feature/`)
- Use `app/components/ui/` for generic shadcn/ui components

**New Database Table:**
- Schema: Add to `db/database.sql`
- Apply: Run `wrangler d1 execute devhub-database --file=db/database.sql --local`
- Operations: Create functions in `lib/database/table-name.ts`
- Types: Define interface in `lib/types/table-name.ts`

**Utilities:**
- Shared helpers: `lib/` (for both frontend and backend)
- Frontend-only: `app/lib/`
- Backend-only: `workers/utils/`

**New Zustand Store:**
- Create: `app/stores/feature-store.ts`
- Pattern: Use `create()` with `persist()` middleware for localStorage
- Initialize: Call store hook in `app/root.tsx` or route component

## Special Directories

**public/**
- Purpose: Static assets served directly (images, fonts, etc.)
- Generated: No (manually added)
- Committed: Yes

**.wrangler/**
- Purpose: Wrangler development server state (local D1 database)
- Generated: Yes (by `wrangler dev`)
- Committed: No

**node_modules/**
- Purpose: pnpm dependency installation
- Generated: Yes (by `pnpm install`)
- Committed: No

**.git/**
- Purpose: Git version control metadata
- Generated: Yes (by git)
- Committed: N/A (git internal)

**.github/workflows/**
- Purpose: GitHub Actions CI/CD pipelines
- Generated: No (manually created)
- Committed: Yes

**openspec/**
- Purpose: OpenAPI specification or change documentation
- Generated: No (manually created)
- Committed: Yes

## Import Path Aliases

**Configured in `tsconfig.json` and `vite.config.ts`:**
- `~/` → `app/` (primary alias for frontend code)

**Usage examples:**
- `import { Button } from "~/components/ui/button"` → `app/components/ui/button.tsx`
- `import { useToolsStore } from "~/stores/tools-store"` → `app/stores/tools-store.ts`
- `import type { Tool } from "~/types/tool"` → `app/types/tool.ts`

**No aliases for:**
- `workers/` - use relative imports (e.g., `../utils/auth`)
- `lib/` - use relative imports (e.g., `../../lib/database/tools`)

---

*Structure analysis: 2026-03-01*
