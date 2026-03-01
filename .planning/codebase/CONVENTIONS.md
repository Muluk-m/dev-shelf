# Coding Conventions

**Analysis Date:** 2026-03-01

## Naming Patterns

**Files:**
- React components: `kebab-case.tsx` (e.g., `tool-card.tsx`, `theme-provider.tsx`)
- TypeScript utilities: `kebab-case.ts` (e.g., `use-search.ts`, `format-utils.ts`)
- UI components: Located in `app/components/ui/` following shadcn/ui conventions
- Feature components: Organized by feature in subdirectories (e.g., `app/components/admin/`, `app/components/query-analyzer/`)
- Routes: File-based routing with dot notation (e.g., `home.tsx`, `tools.$id.tsx`, `admin.permissions.tsx`)

**Functions:**
- Standard functions: `camelCase` (e.g., `getTools`, `createTool`, `recordToolUsage`)
- React components: `PascalCase` (e.g., `ToolCard`, `ThemeProvider`, `Button`)
- React hooks: `camelCase` with `use` prefix (e.g., `useSearch`, `useToolsInit`, `usePermissions`)
- API endpoints: RESTful conventions with `camelCase` handlers (e.g., `toolsRouter.get("/")`)

**Variables:**
- Local variables: `camelCase` (e.g., `toolId`, `selectedCategory`, `usageStats`)
- Constants: `SCREAMING_SNAKE_CASE` for module-level (e.g., `API_BASE_URL`, `TOOLS_CACHE_TTL_SECONDS`)
- React state: `camelCase` with descriptive names (e.g., `[selectedEnv, setSelectedEnv]`)
- Environment variables: `SCREAMING_SNAKE_CASE` in `wrangler.jsonc` (e.g., `API_BASE_URL`, `FEISHU_CLIENT_ID`)

**Types:**
- Interfaces: `PascalCase` (e.g., `Tool`, `ToolEnvironment`, `ToolCategory`)
- Type aliases: `PascalCase` (e.g., `ToolUsageStat`, `LinkConfig`)
- Props interfaces: Component name + `Props` suffix (e.g., `ToolCardProps`, `ToolCardCompactProps`)

## Code Style

**Formatting:**
- Tool: Biome v2.2.4
- Indentation: Tabs (configured in `biome.json`)
- Quote style: Double quotes for JavaScript/TypeScript
- Line endings: Auto-detected
- Semicolons: Required (implicit in TypeScript configuration)

**Linting:**
- Tool: Biome v2.2.4
- Configuration: `biome.json`
- Recommended rules enabled with selective overrides:
  - `noNonNullAssertion`: off (allows `!` operator)
  - `noArrayIndexKey`: off (allows array index as key in React)
  - `noExplicitAny`: off (allows `any` type)
  - `useExhaustiveDependencies`: off (React hook dependency warnings)
  - Multiple a11y rules disabled for flexibility
- Run command: `npm run lint` or `npm run lint:fix`
- Scope: `app/**/*` and `workers/**/*` only

## Import Organization

**Order:**
1. External library imports (React, third-party packages)
2. Type imports from types files
3. Internal module imports (components, utilities)
4. Relative imports (same directory)
5. Asset imports (styles, images)

**Pattern observed:**
```typescript
import { Hono } from "hono";
import type { CacheContext } from "../../lib/cache-manager";
import * as toolsDb from "../../lib/database/tools";
import { getCurrentUserId } from "../utils/auth";
```

**Path Aliases:**
- `@/*` → `app/*` (configured in `tsconfig.json`)
- `~/*` → `app/*` (React Router convention, used throughout)

**Import style:**
- Named imports preferred: `import { Button } from "~/components/ui/button"`
- Type-only imports: `import type { Tool } from "~/types/tool"`
- Namespace imports for utilities: `import * as toolsDb from "../../lib/database/tools"`

## Error Handling

**Patterns:**

**Frontend (React components):**
```typescript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch");
  }
  return response.json();
} catch (error) {
  console.error("Error:", error);
  throw error; // Re-throw for caller handling
}
```

**Backend (Hono routes):**
```typescript
try {
  // Operation
  return c.json({ data });
} catch (error) {
  console.error("Error:", error);
  return c.json({ error: "Internal server error" }, 500);
}
```

**Validation errors:**
- Return HTTP 400 with descriptive error message
- Example: `return c.json({ error: "Missing required fields" }, 400)`

**Not found errors:**
- Return HTTP 404 with error message
- Example: `return c.json({ error: "Tool not found" }, 404)`

**Permission errors:**
- Return HTTP 403 with reason
- Example: `return c.json({ error: "无权限访问此工具" }, 403)`

**Fail-open strategy:**
- Permission checks default to allowing access on API failures
- Example in `useToolAccess`: Returns `{ hasAccess: true, error: null }` on fetch failure

## Logging

**Framework:** `console` (built-in)

**Patterns:**
- Errors: `console.error("Error message:", error)` with error object
- Warnings: `console.warn("Warning message:", context)`
- Info logs: `console.log("Cache version incremented to:", version)`
- Structured: Include operation context in log messages

**What to log:**
- All caught errors with context
- Cache operations (version updates)
- Database transaction failures
- Permission check failures
- External API errors

**What NOT to log:**
- Successful operations (avoid noise)
- User input/sensitive data
- Environment variables/secrets

## Comments

**When to Comment:**
- Complex business logic requiring explanation
- Database field mapping conventions
- API contract documentation
- TODO/FIXME items (minimal usage observed)

**JSDoc/TSDoc:**
- Used for exported functions and API boundaries
- Pattern:
```typescript
/**
 * Helper to get cache context from Hono context
 */
function getCacheContext(c: any): CacheContext {
  // ...
}
```

**Inline comments:**
- Used sparingly for clarity on non-obvious code
- Example: `// 递增缓存版本号，让所有地区的缓存失效`

## Function Design

**Size:**
- Small, focused functions preferred
- Most functions under 50 lines
- Complex operations broken into helper functions

**Parameters:**
- Max 3-4 parameters typical
- Use object parameters for complex data: `createTool(db: D1Database, tool: Omit<Tool, "id">, context?: CacheContext)`
- Optional parameters at end with `?` modifier

**Return Values:**
- Explicit return types: `Promise<Tool[]>`, `Promise<void>`
- Error responses as objects: `{ error: string }`
- Success responses with data: `{ id: string, message: string }`
- React components return JSX.Element (implicit)

**Async patterns:**
- Always use `async/await` for asynchronous operations
- Parallel operations with `Promise.all()`: `const [allTools, toolCategories, usageStats] = await Promise.all([...])`
- No callback patterns observed

## Module Design

**Exports:**
- Named exports preferred: `export function getTools() { }`
- Default exports for React components: `export default function Home() { }`
- Type exports: `export type { Tool, ToolCategory }`
- Re-exports from type files: `export * from "../../lib/types/tool"`

**Barrel Files:**
- Used minimally
- Pattern: `app/types/tool.ts` re-exports from `lib/types/tool.ts`
- Component indexes: `app/components/ab-router/index.ts` exports all components

**Module boundaries:**
- Clear separation: `app/` (frontend) vs `workers/` (backend) vs `lib/` (shared)
- Shared types in `lib/types/`
- Shared utilities in `lib/` (database, cache management)

## React Patterns

**Component structure:**
- Functional components only (no class components)
- Hooks for state management
- Props destructuring in function signature

**State management:**
- Local state: `useState` hook
- Global state: Zustand stores with localStorage persistence
- Server state: TanStack Query (@tanstack/react-query)
- Form state: Controlled components with local state

**Styling:**
- Tailwind CSS utility classes
- `cn()` helper for conditional classes: `cn("base-class", condition && "conditional-class")`
- Inline styles for dynamic values: `style={{ backgroundColor: category.color }}`
- Class Variance Authority (CVA) for component variants (see `Button`)

**Event handlers:**
- Named handlers with `handle` prefix: `handleEnvClick`, `handleCategoryChange`
- Async handlers: `const handleAccessTool = (environment: ToolEnvironment) => { void recordToolUsage(tool.id); ... }`
- Event propagation controlled with `e.stopPropagation()`

## Database Conventions

**Field naming:**
- Database: `snake_case` (`is_internal`, `last_updated`, `permission_id`)
- Frontend: `camelCase` (`isInternal`, `lastUpdated`, `permissionId`)
- Mapping happens in `lib/database/tools.ts`

**Boolean conversion:**
- Database stores as integers (0/1)
- Convert with `Boolean()`: `tool.isInternal = Boolean(tool.is_internal)`

**Transactions:**
- Use `db.batch()` for atomic operations
- Pattern: Create/update/delete operations with related tables in single batch

**Cache invalidation:**
- Version-based cache keys: `/tools/list/v${version}`
- Increment version on mutations: `await toolsCacheManager.incrementVersion(context)`

## Type Safety

**TypeScript strict mode:** Enabled in `tsconfig.json`

**Type assertions:**
- Used sparingly: `as any`, `as Tool[]`
- Prefer type guards and validation

**Type imports:**
- Separate type imports: `import type { Tool }`
- Cloudflare bindings: `Hono<{ Bindings: Cloudflare.Env }>`

**Nullability:**
- Explicit handling with optional chaining: `context?.kv`
- Null checks before operations: `if (!tool) return null`

---

*Convention analysis: 2026-03-01*
