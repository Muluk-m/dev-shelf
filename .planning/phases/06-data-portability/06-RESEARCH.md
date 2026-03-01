# Phase 6: Data Portability - Research

**Researched:** 2026-03-01
**Domain:** Data export / JSON serialization on Cloudflare Workers
**Confidence:** HIGH

## Summary

Phase 6 is a straightforward feature: add a backend API endpoint that queries all tool-related tables from D1, assembles them into a single JSON object, and returns it as a downloadable file. The admin interface gets an "Export Data" button that triggers this download.

The codebase already contains all the building blocks: `lib/database/tools.ts` has `getTools()` and `getToolCategories()` which query D1 and map fields from snake_case to camelCase. The admin page (`app/routes/admin.tsx`) provides the UI shell where the export button belongs. The Hono backend (`workers/app.ts`) shows the pattern for mounting new route modules. No new libraries are needed -- this is pure D1 queries + JSON serialization + browser file download.

**Primary recommendation:** Create one new backend route (`workers/routes/export.ts`) with a single GET endpoint that queries all four tables (tools, tool_categories, tool_environments, tool_tags), assembles them into a structured JSON response with metadata, and returns it with `Content-Disposition: attachment` header. Add a frontend export button to the admin page that triggers a download via `window.location` or `<a>` tag.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Admin can export all tool data as JSON | Backend export endpoint queries all tables, returns JSON with Content-Disposition header for file download. Admin UI gets export button. |
| DATA-02 | Export includes tools, categories, environments, and tags as complete dataset | Export query fetches from all four tables: `tools`, `tool_categories`, `tool_environments`, `tool_tags`. Data assembled into nested structure with metadata. |
</phase_requirements>

## Standard Stack

### Core

No new libraries needed. Everything uses existing stack:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Hono | (existing) | Backend API route for export endpoint | Already used for all API routes |
| D1 | (existing) | Database queries to extract all data | Already used throughout `lib/database/tools.ts` |
| React | (existing) | Admin UI export button | Already used for admin page |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Button | (existing) | Export button in admin interface | UI component for triggering export |
| lucide-react | (existing) | Download icon for export button | Icon for the button |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct JSON download | Blob + URL.createObjectURL | More complex client-side handling, unnecessary for JSON |
| Single endpoint | Separate endpoints per table | More requests, more complex client assembly |
| camelCase export | Raw snake_case from DB | Inconsistent with frontend types; use camelCase for portability |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure

```
workers/routes/export.ts      # New: Export API endpoint
lib/database/export.ts        # New: Export data query function
app/routes/admin.tsx           # Modified: Add export button
app/lib/api.ts                 # Modified: Add export API function
```

### Pattern 1: Hono Route with File Download Response

**What:** A GET endpoint that returns JSON with Content-Disposition header to trigger browser download.
**When to use:** When the export result should be saved as a file by the browser.
**Example:**
```typescript
// Source: Existing pattern in workers/routes/tools.ts
import { Hono } from "hono";

const exportRouter = new Hono<{ Bindings: Cloudflare.Env }>();

exportRouter.get("/", async (c) => {
  const db = c.env.DB;

  // Query all data
  const [tools, categories, environments, tags] = await Promise.all([
    db.prepare("SELECT * FROM tools").all(),
    db.prepare("SELECT * FROM tool_categories").all(),
    db.prepare("SELECT * FROM tool_environments").all(),
    db.prepare("SELECT * FROM tool_tags").all(),
  ]);

  const exportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: {
      tools: tools.results,
      categories: categories.results,
      environments: environments.results,
      tags: tags.results,
    },
  };

  const json = JSON.stringify(exportData, null, 2);
  const timestamp = new Date().toISOString().split("T")[0];

  return new Response(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="devhub-export-${timestamp}.json"`,
    },
  });
});
```

### Pattern 2: Direct Browser Download via Anchor Tag

**What:** Trigger file download from frontend without fetch + blob dance.
**When to use:** When the endpoint returns Content-Disposition attachment header.
**Example:**
```typescript
// Simple: just navigate to the endpoint URL
function handleExport() {
  window.location.href = `${API_BASE_URL}/api/export`;
}

// Or use an anchor tag approach
function handleExport() {
  const a = document.createElement("a");
  a.href = `${API_BASE_URL}/api/export`;
  a.download = "devhub-export.json";
  a.click();
}
```

### Pattern 3: Existing Database Query Pattern

**What:** Direct D1 queries using `db.prepare().all()` pattern already established in codebase.
**When to use:** For the export function that retrieves raw data from all tables.
**Example:**
```typescript
// Source: Existing pattern in lib/database/tools.ts
// Note: Export should use raw queries WITHOUT caching (export should always be fresh)
const toolsResult = await db.prepare("SELECT * FROM tools ORDER BY name").all();
```

### Anti-Patterns to Avoid

- **Using cached data for export:** The existing `getTools()` function uses CacheManager. Export should query D1 directly for guaranteed freshness.
- **Client-side assembly:** Do not fetch tools and categories separately from frontend and assemble client-side. Server should provide complete export in one response.
- **Streaming for small datasets:** D1 databases in this app are small (< 100 tools typically). No need for streaming; a single JSON response is fine.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File download trigger | Custom fetch + blob + createObjectURL | Direct navigation to endpoint with Content-Disposition | Simpler, works universally, no memory overhead |
| Data serialization | Custom recursive serializer | `JSON.stringify(data, null, 2)` | Standard, complete, handles all types |

**Key insight:** This is a simple feature. The entire implementation is a SQL query, JSON serialization, and an HTTP header. Resist the urge to over-engineer.

## Common Pitfalls

### Pitfall 1: Using Cached Data for Export

**What goes wrong:** Export returns stale data from cache instead of current database state.
**Why it happens:** Reusing existing `getTools()` and `getToolCategories()` which go through CacheManager.
**How to avoid:** Write dedicated export queries that go directly to D1, bypassing the cache layer.
**Warning signs:** Export data doesn't match what's visible in the admin UI after recent edits.

### Pitfall 2: Missing Auth Check on Export Endpoint

**What goes wrong:** Any user (or unauthenticated visitor) can export all data.
**Why it happens:** The current auth middleware allows GET requests without authentication for API routes.
**How to avoid:** The export endpoint must explicitly check for admin role. After Phase 3 (RBAC), there will be middleware or utility functions for role checking. The export route should require admin role.
**Warning signs:** Export endpoint returns data without any authentication.

### Pitfall 3: snake_case vs camelCase Confusion in Export

**What goes wrong:** Export mixes snake_case (raw DB) and camelCase (mapped) field names.
**Why it happens:** Some fields are mapped in `getTools()` but raw queries return snake_case.
**How to avoid:** Choose ONE convention for export. Recommendation: use camelCase for portability (matches frontend types). Apply the same mapping as `getTools()` does, or use the existing `getTools()`/`getToolCategories()` functions but bypass cache.
**Warning signs:** Exported JSON has inconsistent field naming.

### Pitfall 4: Cloudflare Workers Response Size Limits

**What goes wrong:** Export fails for large datasets.
**Why it happens:** Cloudflare Workers have response size limits (but generous -- multiple MB).
**How to avoid:** For typical DevHub usage (< 1000 tools), this is not an issue. The JSON export will be well under 1MB. No mitigation needed for v1.
**Warning signs:** 500 errors only on very large datasets.

## Code Examples

### Complete Export Database Function

```typescript
// lib/database/export.ts
export interface ExportData {
  version: string;
  exportedAt: string;
  data: {
    tools: Tool[];
    categories: ToolCategory[];
  };
}

export async function exportAllData(db: D1Database): Promise<ExportData> {
  // Query all tables in parallel - bypass cache for freshness
  const [toolsResult, categoriesResult, environmentsResult, tagsResult] =
    await Promise.all([
      db.prepare("SELECT * FROM tools ORDER BY name").all(),
      db.prepare("SELECT * FROM tool_categories ORDER BY name").all(),
      db.prepare("SELECT * FROM tool_environments ORDER BY tool_id, name").all(),
      db.prepare("SELECT * FROM tool_tags ORDER BY tool_id").all(),
    ]);

  // Map and assemble tools with their environments and tags
  const tools = (toolsResult.results as any[]).map((tool) => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    icon: tool.icon,
    isInternal: Boolean(tool.is_internal),
    status: tool.status,
    lastUpdated: tool.last_updated,
    environments: (environmentsResult.results as any[])
      .filter((env) => env.tool_id === tool.id)
      .map((env) => ({
        name: env.name,
        label: env.label,
        url: env.url,
        isExternal: Boolean(env.is_external),
      })),
    tags: (tagsResult.results as any[])
      .filter((tag) => tag.tool_id === tool.id)
      .map((tag) => tag.tag),
  }));

  const categories = (categoriesResult.results as any[]).map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    color: cat.color,
  }));

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: { tools, categories },
  };
}
```

### Export Route Handler

```typescript
// workers/routes/export.ts
import { Hono } from "hono";
import { exportAllData } from "../../lib/database/export";

const exportRouter = new Hono<{ Bindings: Cloudflare.Env }>();

exportRouter.get("/", async (c) => {
  // TODO: After Phase 3, add admin role check here
  try {
    const exportData = await exportAllData(c.env.DB);
    const json = JSON.stringify(exportData, null, 2);
    const timestamp = new Date().toISOString().split("T")[0];

    return new Response(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="devhub-export-${timestamp}.json"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return c.json({ error: "Export failed" }, 500);
  }
});

export { exportRouter };
```

### Frontend Export Button

```typescript
// In admin.tsx - add to the admin layout actions
<Button
  variant="outline"
  onClick={() => {
    window.location.href = `${API_BASE_URL}/api/export`;
  }}
  className="gap-2"
>
  <Download className="h-4 w-4" />
  Export Data
</Button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSV export | JSON export | Standard practice | JSON preserves nested structures (environments, tags) that CSV cannot |
| Custom binary formats | JSON with metadata | N/A | JSON is universally readable, no special tools needed |

**Deprecated/outdated:**
- None relevant. JSON export is stable and standard.

## Open Questions

1. **Admin role enforcement mechanism**
   - What we know: Phase 3 will implement RBAC with admin/user roles
   - What's unclear: Exact API/middleware pattern for role checking (depends on Phase 3 implementation)
   - Recommendation: Plan the export endpoint to include a role check placeholder. When Phase 3 is complete, the actual role checking utility will be available. Since Phase 6 depends on Phase 3, this will be resolved by execution time.

2. **Export format: flat tables vs nested objects**
   - What we know: Both approaches work. Flat tables mirror the DB; nested objects are more portable.
   - What's unclear: Whether future import (v2 DATA-V2-01) would prefer flat or nested format.
   - Recommendation: Use nested format (tools contain their environments and tags inline). This matches the existing `Tool` interface and is more human-readable. Future import can flatten as needed.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `lib/database/tools.ts` - Existing D1 query patterns, field mapping
- Codebase analysis: `workers/routes/tools.ts` - Existing Hono route patterns
- Codebase analysis: `workers/app.ts` - Route mounting pattern
- Codebase analysis: `app/routes/admin.tsx` - Admin UI structure
- Codebase analysis: `lib/types/tool.ts` - Type definitions (Tool, ToolCategory, ToolEnvironment)
- Codebase analysis: `db/database.sql` - Complete database schema with all four tables

### Secondary (MEDIUM confidence)
- Cloudflare Workers response handling - Content-Disposition header support is standard HTTP

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, all existing patterns
- Architecture: HIGH - Simple endpoint + button, follows established codebase patterns exactly
- Pitfalls: HIGH - Well-understood domain, common patterns

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable domain, no moving parts)
