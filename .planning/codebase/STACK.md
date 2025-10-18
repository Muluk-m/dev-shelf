# Technology Stack

**Analysis Date:** 2026-03-01

## Languages

**Primary:**
- TypeScript 5.8.3 - All application code (frontend and backend)
- SQL - Database schema and queries (Cloudflare D1)

**Secondary:**
- JavaScript - Build configuration and tooling

## Runtime

**Environment:**
- Cloudflare Workers - Edge runtime with Node.js compatibility
- Node.js compatibility flag enabled (via wrangler.jsonc)

**Package Manager:**
- pnpm 10.12.2 - Locked via packageManager field in package.json
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**
- React 19.2.1 - Frontend UI library
- React Router 7.6.3 - Full-stack routing framework with SSR
- Hono 4.8.2 - Backend HTTP framework for Cloudflare Workers

**UI Components:**
- shadcn/ui (New York style, neutral base color) - Component system built on Radix UI
- Radix UI 1.x - Headless accessible component primitives (accordion, dialog, dropdown, etc.)
- Tailwind CSS 4.1.1 - Utility-first CSS framework
- Lucide React 0.539.0 - Icon library

**State Management:**
- Zustand 5.0.8 - Client-side state management
- TanStack Query 5.90.8 - Server state management and data fetching

**Testing:**
- Not detected - No test framework configured

**Build/Dev:**
- Vite 6.0.0 - Development server and build tool
- React Router Dev 7.6.3 - React Router build system
- Cloudflare Vite Plugin 1.7.5 - Cloudflare Workers integration
- TypeScript Compiler 5.8.3 - Type checking
- Biome 2.2.4 - Linting and formatting

## Key Dependencies

**Critical:**
- `@qlj/common-utils` 0.0.11 - Internal shared utilities library
- `hono` 4.8.2 - Backend API framework
- `react-router` 7.6.3 - Routing and SSR framework

**UI/UX:**
- `cmdk` 1.1.1 - Command palette component
- `sonner` 1.7.4 - Toast notifications
- `recharts` 3.2.0 - Data visualization charts
- `embla-carousel-react` 8.6.0 - Carousel component
- `class-variance-authority` 0.7.1 - Component variant styling
- `tailwind-merge` 3.3.1 - Tailwind class merging utility

**Data Processing:**
- `date-fns` 4.1.0 - Date manipulation
- `jsonpath-plus` 10.3.0 - JSONPath querying
- `ua-parser-js` 2.0.6 - User agent parsing
- `enum-plus` 3.1.6 - Enhanced enums

**Content Rendering:**
- `react-markdown` 10.1.0 - Markdown rendering
- `remark-gfm` 4.0.1 - GitHub Flavored Markdown support
- `react-syntax-highlighter` 15.6.6 - Code syntax highlighting
- `react-json-view` 1.21.3 - JSON viewer component
- `qr-code-styling` 1.9.2 - QR code generation
- `qrcode.react` 4.2.0 - QR code React component

**Infrastructure:**
- `isbot` 5.1.26 - Bot detection
- `@cloudflare/workers-types` 4.20250425.0 - TypeScript definitions for Cloudflare Workers

## Configuration

**Environment:**
- Environment variables managed via `wrangler.jsonc` vars section
- `.env` file present for local development
- Critical vars: `API_BASE_URL`, `FEISHU_CLIENT_ID`, `OAUTH_BASE_URL`, `IMAGE_PREFIX`

**Build:**
- `vite.config.ts` - Vite configuration with Cloudflare, Tailwind, React Router plugins
- `react-router.config.ts` - SSR enabled with experimental vite environment API
- `tsconfig.json` - TypeScript project references architecture
- `wrangler.jsonc` - Cloudflare Workers deployment configuration
- `biome.json` - Code quality and formatting rules (tab indentation, double quotes)
- `components.json` - shadcn/ui configuration
- `tailwindcss` - Configured via Vite plugin (@tailwindcss/vite 4.1.4)

**TypeScript:**
- Strict mode enabled
- Path aliases: `@/*` maps to `app/*`
- Multiple config files: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.cloudflare.json`
- VerbatimModuleSyntax enabled
- Cloudflare Workers types from 2023-07-01

## Platform Requirements

**Development:**
- Node.js (version not pinned, managed via package.json engines field if present)
- pnpm 10.12.2+
- Wrangler 4.21.x for local D1 database and Workers development

**Production:**
- Cloudflare Workers platform
- Custom domain: `qlj-devhub-homepage.qiliangjia.one`
- Test environment: `qlj-devhub-homepage-test.qiliangjia.one`
- Compatibility date: 2025-10-10
- Upload source maps enabled for debugging
- Observability enabled

---

*Stack analysis: 2026-03-01*
