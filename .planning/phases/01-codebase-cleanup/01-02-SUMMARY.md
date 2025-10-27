---
phase: 01-codebase-cleanup
plan: 02
subsystem: ui
tags: [react-router, cleanup, frontend-routes, private-registry]

# Dependency graph
requires: []
provides:
  - Clean route config with only 10 generic tool routes
  - Removed all business-specific frontend code (routes, components, libs, types)
  - Eliminated private @qlj/common-utils dependency and .npmrc registry config
  - Cleaned api.ts to only tool/category/upload CRUD functions
affects: [01-codebase-cleanup, 02-authentication]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline utility functions rather than depending on private packages"

key-files:
  created: []
  modified:
    - app/routes.ts
    - app/lib/api.ts
    - app/routes/tools/json-diff.tsx
    - app/components/admin/tool-form.tsx
    - package.json

key-decisions:
  - "Replaced hardcoded production URL in API_BASE_URL with empty string (plan 03 will handle final config)"
  - "Stubbed generateToolIcon in tool-form.tsx as no-op (Rule 3: broken import after api.ts cleanup)"

patterns-established:
  - "Generic tools only: route definitions limited to developer utility tools"
  - "No private NPM registries: all dependencies must be publicly available"

requirements-completed: [CLEAN-02, CLEAN-04, CLEAN-08]

# Metrics
duration: 5min
completed: 2026-03-01
---

# Phase 1 Plan 2: Remove Business Frontend Code Summary

**Stripped 53 business-specific frontend files (routes, components, libs, types), cleaned api.ts from 841 to 209 lines, eliminated private @qlj/common-utils package and .npmrc registry**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T12:59:52Z
- **Completed:** 2026-03-01T13:05:36Z
- **Tasks:** 2
- **Files modified:** 58 (54 deleted, 4 modified)

## Accomplishments
- Deleted 11 business-specific route files (quick-login, roibest-analyzer, query-analyzer, website-check, whitelist-token, rb-domain-check, pwa-link-health, ab-router, cf-log-analyzer, pixel-activation-tool, query-analyzer.backup)
- Deleted 4 component directories containing 30 files (ab-router, query-analyzer, pwa-link-health, pixel-tools)
- Deleted 5 business lib files including 2 with hardcoded credentials (clickhouse-service.ts, whitelist-token.ts)
- Deleted 7 business type files
- Cleaned app/routes.ts to contain only 10 generic tool routes
- Cleaned app/lib/api.ts from 841 lines to 209 lines (removed auth, CF logs, query analyzer, icon generator, AB router functions)
- Inlined safeJsonParse in json-diff.tsx replacing @qlj/common-utils import
- Removed @qlj/common-utils from package.json and deleted .npmrc private registry config

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove business frontend routes, components, libs, and types** - `ca91251` (feat)
2. **Task 2: Clean api.ts + inline safeJsonParse + remove @qlj/common-utils** - Changes captured in `c659d2c` (overlap with plan 01-01 Task 2 which cleaned the same files)

**Note:** Task 2 changes to api.ts, json-diff.tsx, package.json, .npmrc, and tool-form.tsx were committed as part of plan 01-01's Task 2 (`c659d2c`) due to wave 1 parallel execution overlap. Both plans modified api.ts as part of their cleanup scope.

## Files Created/Modified
- `app/routes.ts` - Clean route config with 10 generic tool routes (removed 11 business routes)
- `app/lib/api.ts` - Reduced from 841 to 209 lines; only tool/category/upload CRUD functions remain
- `app/routes/tools/json-diff.tsx` - Inlined safeJsonParse function, removed @qlj/common-utils import
- `app/components/admin/tool-form.tsx` - Stubbed generateToolIcon (removed business API import)
- `package.json` - Removed @qlj/common-utils dependency
- `.npmrc` - Deleted (private registry config)

### Deleted Files (53 total)
- 11 route files in `app/routes/tools/`
- 30 component files in `app/components/{ab-router,query-analyzer,pwa-link-health,pixel-tools}/`
- 5 lib files in `app/lib/`
- 7 type files in `app/types/` and `lib/types/`

## Decisions Made
- Replaced hardcoded production URL `https://qlj-devhub-homepage.qiliangjia.one` with empty string in API_BASE_URL -- Plan 03 will handle final deployment configuration
- Stubbed generateToolIcon in tool-form.tsx as a no-op toast notification rather than removing the entire AI icon generation UI -- keeps the form structure intact for potential future re-implementation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stubbed generateToolIcon in tool-form.tsx**
- **Found during:** Task 2 (api.ts cleanup)
- **Issue:** Removing generateToolIcon from api.ts broke the import in app/components/admin/tool-form.tsx
- **Fix:** Removed the import and replaced handleGenerateIcon body with a no-op toast notification
- **Files modified:** app/components/admin/tool-form.tsx
- **Verification:** No broken imports remain
- **Committed in:** c659d2c (part of overlapping plan 01-01 commit)

**2. [Rule 3 - Blocking] Verified user-info-store.ts already stubbed**
- **Found during:** Task 2 (api.ts cleanup)
- **Issue:** Removing getUserInfo/logout from api.ts would break app/stores/user-info-store.ts import
- **Fix:** Plan 01-01 had already stubbed this file (no import from api.ts), no additional action needed
- **Files modified:** None (already handled)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary to prevent broken imports after api.ts cleanup. No scope creep.

## Issues Encountered
- Plan 01-01 and 01-02 both cleaned app/lib/api.ts in their scope (wave 1 parallel execution). Plan 01-01 executed first and committed the api.ts changes. Task 2 of this plan found the working tree already clean for overlapping files. All intended changes are in place.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All business-specific frontend code removed
- Only generic developer tool routes remain (10 tools)
- api.ts contains only tool/category/upload functions
- Ready for Plan 03 (configuration cleanup) to handle final wrangler.jsonc, environment variables, and pnpm install

## Self-Check: PASSED

- [x] app/routes.ts exists
- [x] app/lib/api.ts exists (209 lines)
- [x] app/routes/tools/json-diff.tsx exists with inline safeJsonParse
- [x] 01-02-SUMMARY.md created
- [x] Commit ca91251 exists (Task 1)
- [x] Commit c659d2c exists (Task 2 overlap with 01-01)

---
*Phase: 01-codebase-cleanup*
*Completed: 2026-03-01*
