# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run typecheck        # Generate Cloudflare types, React Router types, and run TypeScript compiler

# Build & Deploy
npm run build           # Build for production
npm run preview         # Preview production build locally
npm run deploy          # Build and deploy to Cloudflare Workers
npm run cf-typegen      # Generate Cloudflare D1 database types

# Linting & Code Quality
npm run lint            # Run Biome linter to check code quality
npm run lint:fix         # Run Biome linter and auto-fix issues

# Package Management
# This project uses pnpm as the package manager (see packageManager in package.json)
```

## Architecture Overview

This is a full-stack application deployed on Cloudflare Workers with the following architecture:

### Frontend (React Router v7 SPA)
- **Entry Point**: `app/root.tsx` - Root component with providers and layout
- **Routing**: File-based routing defined in `app/routes.ts`
  - `/` → `routes/home.tsx` (main tool dashboard)
  - `/admin` → `routes/admin.tsx` (tool management interface)
  - `/tools/:id` → `routes/tools.$id.tsx` (individual tool details)
- **Components**: Located in `app/components/` with modular structure
  - `ui/` - shadcn/ui components
  - `layout/` - Layout components (header, etc.)
  - `admin/` - Admin-specific components
  - `command-panel/` - Command palette implementation
- **Styling**: Tailwind CSS with shadcn/ui component system

### Backend (Hono API on Cloudflare Workers)
- **Entry Point**: `workers/app.ts` - Main Hono application
- **Modular Structure**:
  - `lib/database/tools.ts` - D1 database operations and data mapping
  - `workers/routes/tools.ts` - Tool CRUD API endpoints
  - `workers/routes/categories.ts` - Category API endpoints
- **Database**: Cloudflare D1 SQLite database with binding name "DB"

### Data Flow & Field Mapping
**Critical**: The database uses snake_case fields (`is_internal`, `is_external`, `last_updated`) while the frontend uses camelCase (`isInternal`, `isExternal`, `lastUpdated`). Field mapping occurs in `lib/database/tools.ts`.

### API Configuration
The API base URL is dynamically determined in `app/lib/api.ts`:
1. Development: `http://localhost:5173` (Vite dev server)
2. Production: `https://qlj-devhub-homepage.qiliangjia.one` (from wrangler.jsonc vars)

### Key Features
- **Command Panel**: Global command palette (Cmd/Ctrl+K) with keyboard and mouse navigation
- **Tool Management**: Full CRUD operations for development tools with multiple environments
- **Database Integration**: Complete D1 database integration with transactions
- **Theme Support**: Light/dark theme switching
- **Responsive Design**: Mobile-first responsive layout

### Database Schema
Tools are stored with relationships:
- `tools` - Main tool information
- `tool_environments` - Multiple deployment environments per tool
- `tool_tags` - Tags for categorization
- `tool_categories` - Tool categories

### Environment Configuration
- **Development**: Uses `npm run dev` with Vite dev server on port 5173
- **Production**: Deployed via `npm run deploy` to Cloudflare Workers
- **Database**: D1 database "devhub-database" bound as "DB" in wrangler.jsonc

### Important Patterns
- React Router v7 loaders return plain objects (no `json()` wrapper needed)
- Database transactions use `db.batch()` for atomic operations
- Error handling includes proper HTTP status codes and user-friendly messages
- TypeScript interfaces are shared between frontend and backend via `app/types/`

### Development Notes
- Uses pnpm as package manager
- TypeScript strict mode enabled
- Supports both server-side and client-side rendering
- API responses automatically handle field name conversion between database and frontend formats
- Code formatting and linting handled by Biome (configured in biome.json)
- shadcn/ui components configured with New York style and neutral base color (components.json)