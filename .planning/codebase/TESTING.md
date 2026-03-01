# Testing Patterns

**Analysis Date:** 2026-03-01

## Test Framework

**Runner:**
- None configured in project
- No test framework detected in `package.json`
- No test configuration files present

**Assertion Library:**
- Not applicable

**Run Commands:**
- No test commands configured
- `package.json` contains no test scripts

## Test File Organization

**Location:**
- No test files found in `app/` or `workers/` directories
- Test files from dependencies exist in `node_modules/` (not project tests)

**Naming:**
- Not applicable (no project tests)

**Structure:**
- Not applicable

## Test Structure

**Suite Organization:**
- No test suites present

**Patterns:**
- Not applicable

## Mocking

**Framework:**
- Not configured

**Patterns:**
- Not applicable

**What to Mock:**
- Recommendations for future testing:
  - External API calls (Cloudflare D1, R2, KV)
  - Authentication middleware
  - Database operations
  - External service integrations (Feishu OAuth)

**What NOT to Mock:**
- Utility functions (`cn`, formatters)
- Type definitions
- Constants

## Fixtures and Factories

**Test Data:**
- Not applicable (no fixtures present)

**Location:**
- Recommendation: Create `app/__tests__/fixtures/` for test data

## Coverage

**Requirements:**
- None enforced

**View Coverage:**
- Not configured

## Test Types

**Unit Tests:**
- Not implemented
- Recommended scope: Utility functions, hooks, data transformations

**Integration Tests:**
- Not implemented
- Recommended scope: API routes, database operations, authentication flow

**E2E Tests:**
- Not implemented
- Recommended framework: Playwright or Cypress for Cloudflare Workers

## Common Patterns

**Async Testing:**
- Not applicable (no tests)
- Recommendation: Use async/await patterns consistent with codebase style

**Error Testing:**
- Not applicable (no tests)
- Recommendation: Test error boundaries and API error responses

## Testing Recommendations

**Priority areas for testing:**

1. **Database operations** (`lib/database/tools.ts`)
   - CRUD operations
   - Field mapping (snake_case ↔ camelCase)
   - Transaction handling
   - Cache invalidation

2. **API routes** (`workers/routes/*.ts`)
   - Request validation
   - Response formats
   - Error handling
   - Permission checks

3. **React hooks** (`app/hooks/*.ts`)
   - `useToolsInit` - Data fetching and caching
   - `useSearch` - Search and filter logic
   - `useToolAccess` - Permission checking

4. **Data transformations**
   - Database result mapping
   - API response normalization
   - Log query response transformation

5. **Authentication**
   - Auth middleware
   - Permission validation
   - Token handling

**Suggested testing framework:**
- **Vitest** - Fast, Vite-native test runner
- **@cloudflare/vitest-pool-workers** - Test Cloudflare Workers locally
- **@testing-library/react** - React component testing
- **MSW (Mock Service Worker)** - API mocking

**Suggested test structure:**
```
app/
  __tests__/
    hooks/
      use-search.test.ts
      use-tools-query.test.ts
    lib/
      utils.test.ts
      format-utils.test.ts
    fixtures/
      tools.ts
      categories.ts

workers/
  __tests__/
    routes/
      tools.test.ts
      categories.test.ts
    utils/
      auth.test.ts

lib/
  __tests__/
    database/
      tools.test.ts
    cache-manager.test.ts
```

**Coverage goals:**
- Critical business logic: 80%+
- API routes: 70%+
- Utility functions: 90%+
- React components: 60%+

---

*Testing analysis: 2026-03-01*
