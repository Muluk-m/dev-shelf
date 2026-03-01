# Phase 3: User Management & RBAC - Research

**Researched:** 2026-03-01
**Domain:** Role-Based Access Control, First-Run Setup Wizard, Admin User Management
**Confidence:** HIGH

## Summary

Phase 3 transforms the existing complex Feishu-OAuth-based RBAC system (users, roles, permissions, role_permissions, user_roles tables) into a simplified two-role model (admin/user) with a zero-config first-run setup wizard. The existing codebase already has a rich permissions infrastructure (`lib/database/permissions.ts`, `workers/routes/permissions.ts`, `app/components/protected-route.tsx`) built around Feishu OAuth identity. Phase 2 will have replaced Feishu OAuth with local username/password auth. Phase 3 simplifies the role model to just two roles (admin, user), adds RBAC middleware to protect write operations on tools/categories, implements the first-run setup wizard for initial admin creation, and adds admin password-reset capability for other users.

The key architectural insight is that the existing codebase already has the infrastructure for RBAC -- ProtectedRoute component, role-checking hooks, permissions middleware. Phase 3's job is to (1) simplify this to two roles, (2) rewire it from Feishu identity to local auth identity established in Phase 2, (3) add the first-run detection and setup wizard, and (4) add admin-only password reset.

**Primary recommendation:** Simplify the existing 5-table RBAC (users, roles, permissions, role_permissions, user_roles) into a single `role` column on the users table (values: 'admin' or 'user'). Add a `GET /api/setup/status` endpoint that checks if any users exist. Build a frontend setup wizard route that appears on first visit when no users exist.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| USER-01 | System distinguishes admin and user roles | Simplify existing RBAC to `role` column on users table with CHECK constraint ('admin', 'user'). Existing `ProtectedRoute` component and `usePermissions` hook provide frontend infrastructure. |
| USER-02 | Only admin can create, edit, delete tools | Add Hono RBAC middleware that checks `role = 'admin'` from JWT payload on POST/PUT/DELETE tool and category endpoints. Existing auth middleware extracts user from JWT cookie. |
| USER-03 | Non-admin users can browse tools, use favorites, manage preferences | Existing GET endpoints are already public/permissive. Favorites and preferences already use localStorage via `user-preferences-store.ts`. No changes needed for browse; ensure protected routes allow 'user' role for read operations. |
| USER-04 | Admin can reset passwords for other users | Add `POST /api/admin/users/:id/reset-password` endpoint. Admin provides new password, backend hashes with PBKDF2 (from Phase 2 auth utils) and updates users table. Frontend admin UI adds reset button. |
| USER-05 | First-run setup wizard on first deployment | `GET /api/setup/status` checks `SELECT COUNT(*) FROM users`. If 0, frontend redirects to `/setup` route showing admin account creation form. `POST /api/setup/init` creates first admin user and returns JWT cookie. |
| USER-06 | D1 database users table (username, password_hash, role, created_at) | Phase 2 creates users table with auth fields. Phase 3 ensures `role` column exists with proper CHECK constraint. Migration adds role column if Phase 2 schema didn't include it, or ALTER existing table. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Hono | Existing | RBAC middleware, route protection | Already used for all backend routes |
| hono/jwt | Existing | JWT payload extraction for role checking | Already used in auth middleware |
| React Router v7 | Existing | Setup wizard route, admin routes | Already used for all frontend routing |
| shadcn/ui | Existing | Setup wizard form UI components | Already used throughout the app |
| Zustand | Existing | User role state management | Already used for user-info-store |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Web Crypto API | Native | Password hashing for reset | Only for admin password reset (Phase 2 establishes pattern) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `role` column on users table | Separate roles/user_roles tables (existing) | Separate tables add complexity unnecessary for 2-role system; single column is simpler and sufficient |
| JWT role claim | Database lookup on every request | JWT claim avoids DB round-trip; role changes require re-login (acceptable for admin/user binary) |

**Installation:** No new packages needed. All dependencies already in codebase.

## Architecture Patterns

### Recommended Project Structure

```
workers/
├── middleware/
│   ├── auth.ts              # Existing auth middleware (Phase 2 rewired)
│   └── rbac.ts              # NEW: Role-based access control middleware
├── routes/
│   ├── setup.ts             # NEW: First-run setup endpoints
│   ├── admin.ts             # NEW: Admin user management (password reset)
│   ├── tools.ts             # MODIFIED: Add RBAC middleware to write ops
│   └── categories.ts        # MODIFIED: Add RBAC middleware to write ops
app/
├── routes/
│   └── setup.tsx            # NEW: First-run setup wizard page
├── components/
│   └── admin/
│       └── user-management.tsx  # NEW: Admin user list with password reset
lib/
└── database/
    └── users.ts             # NEW or MODIFIED: User CRUD with role support
```

### Pattern 1: Simplified RBAC via JWT Role Claim

**What:** Store user role in JWT payload during login. RBAC middleware reads role from JWT without DB query.

**When to use:** When role model is simple (2 roles) and role changes are infrequent.

**Example:**
```typescript
// workers/middleware/rbac.ts
import { createMiddleware } from 'hono/factory'

export const requireAdmin = createMiddleware(async (c, next) => {
  const user = c.get('user') // Set by auth middleware from JWT
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403)
  }
  return next()
})

export const requireAuth = createMiddleware(async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  return next()
})
```

### Pattern 2: First-Run Detection

**What:** API endpoint checks if users table has any rows. Frontend calls on app load to decide whether to show setup wizard or normal app.

**When to use:** Zero-config first deployment experience for self-hosted apps.

**Example:**
```typescript
// workers/routes/setup.ts
setup.get('/status', async (c) => {
  const result = await c.env.DB
    .prepare('SELECT COUNT(*) as count FROM users')
    .first<{ count: number }>()

  return c.json({
    initialized: (result?.count ?? 0) > 0,
    needsSetup: (result?.count ?? 0) === 0
  })
})

setup.post('/init', async (c) => {
  // Check not already initialized
  const existing = await c.env.DB
    .prepare('SELECT COUNT(*) as count FROM users')
    .first<{ count: number }>()

  if ((existing?.count ?? 0) > 0) {
    return c.json({ error: 'Already initialized' }, 400)
  }

  const { username, password, displayName } = await c.req.json()
  // Hash password, create admin user, return JWT
})
```

### Pattern 3: Admin Password Reset

**What:** Admin user can set a new password for any non-admin user via API endpoint.

**When to use:** Self-hosted apps without email-based password reset.

**Example:**
```typescript
// workers/routes/admin.ts
admin.post('/users/:id/reset-password', requireAdmin, async (c) => {
  const targetUserId = c.req.param('id')
  const { newPassword } = await c.req.json()

  // Hash new password using Phase 2's hashPassword utility
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await hashPassword(newPassword, salt)

  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, salt = ? WHERE id = ?'
  ).bind(hash, salt, targetUserId).run()

  return c.json({ message: 'Password reset successfully' })
})
```

### Anti-Patterns to Avoid

- **Over-engineering RBAC:** Don't keep the existing 5-table roles/permissions system for just 2 roles. A single column is clearer.
- **Checking role in every component:** Use the existing `ProtectedRoute` wrapper, not inline role checks in every component.
- **Skipping first-run check on backend:** Always verify `needsSetup` on backend too, not just frontend redirect. The setup endpoint must verify no users exist before creating admin.
- **Storing role only in frontend state:** Role must be in JWT claim so backend can enforce it without extra DB queries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Role checking in routes | Per-route if/else blocks | Hono middleware (`requireAdmin`) | Consistent, reusable, can't forget |
| Setup wizard state | Custom state machine | Simple boolean flag from `/api/setup/status` | Two states only: needs setup or doesn't |
| Password hashing | Custom crypto code | Phase 2's `hashPassword()` utility | Already implemented and tested |
| Form validation | Manual validation | shadcn/ui form components with React Hook Form | Already used in admin forms |

**Key insight:** Phase 2 establishes the auth patterns (hashing, JWT, user table). Phase 3 builds on them, not reinvents them.

## Common Pitfalls

### Pitfall 1: Race Condition on First-Run Setup
**What goes wrong:** Two simultaneous requests both see `needsSetup: true` and both try to create admin.
**Why it happens:** No locking mechanism on the setup endpoint.
**How to avoid:** Use `INSERT INTO users ... WHERE NOT EXISTS (SELECT 1 FROM users)` or check count atomically before insert. The setup endpoint should be idempotent - if admin already exists, return error, not duplicate.
**Warning signs:** Two admin accounts created, or "unique constraint" errors.

### Pitfall 2: Stale Role in JWT After Admin Changes
**What goes wrong:** Admin changes a user's role, but user's existing JWT still has old role.
**Why it happens:** JWT is stateless - role is baked in at login time.
**How to avoid:** Accept this tradeoff for simplicity. With only 2 roles and infrequent changes, requiring re-login is acceptable. Document this behavior. Short JWT expiry (24h) limits the window.
**Warning signs:** User still has old permissions after role change.

### Pitfall 3: Setup Wizard Accessible After Initialization
**What goes wrong:** Someone navigates to `/setup` after admin already exists and sees the form.
**Why it happens:** Frontend route exists but doesn't check backend status.
**How to avoid:** Setup route component calls `/api/setup/status` on mount. If `initialized: true`, redirect to home. Backend setup endpoint also rejects if users exist.
**Warning signs:** Setup form visible to authenticated users.

### Pitfall 4: Forgetting to Protect Category Write Endpoints
**What goes wrong:** Non-admin users can create/edit/delete categories even though tools are protected.
**Why it happens:** RBAC middleware only applied to tool routes, not category routes.
**How to avoid:** Apply `requireAdmin` middleware to all write endpoints: tools POST/PUT/DELETE AND categories POST/PUT/DELETE.
**Warning signs:** Non-admin can add categories.

### Pitfall 5: Breaking Existing Frontend Permission Checks
**What goes wrong:** The existing `usePermissions` hook and `ProtectedRoute` component break because they expect the old Feishu-based role/permissions structure.
**Why it happens:** Phase 2 changes the auth system but these components may still reference old patterns.
**How to avoid:** Update `usePermissions` hook to read role from the new JWT-based user info. Update `ProtectedRoute` to check simple role string instead of complex permission objects.
**Warning signs:** Admin page shows "access denied" for admin users.

## Code Examples

### RBAC Middleware Integration with Tools Router

```typescript
// workers/routes/tools.ts (modification)
import { requireAdmin } from '../middleware/rbac'

// Read operations - no auth required (existing behavior)
toolsRouter.get('/init', async (c) => { ... })
toolsRouter.get('/', async (c) => { ... })
toolsRouter.get('/:id', async (c) => { ... })

// Write operations - admin only (NEW)
toolsRouter.post('/', requireAdmin, async (c) => { ... })
toolsRouter.put('/:id', requireAdmin, async (c) => { ... })
toolsRouter.delete('/:id', requireAdmin, async (c) => { ... })
```

### Setup Wizard Frontend Component Structure

```typescript
// app/routes/setup.tsx
export default function SetupPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'initialized'>('loading')

  useEffect(() => {
    fetch('/api/setup/status')
      .then(r => r.json())
      .then(data => {
        if (data.initialized) {
          // Already set up, redirect to home
          window.location.href = '/'
        } else {
          setStatus('ready')
        }
      })
  }, [])

  if (status === 'loading') return <LoadingSpinner />
  if (status === 'initialized') return null // redirecting

  return (
    <SetupWizardForm onComplete={() => window.location.href = '/'} />
  )
}
```

### Updated User Info Type

```typescript
// app/types/user-info.ts (after Phase 2+3)
export interface UserInfo {
  userId: string
  username: string
  displayName: string
  role: 'admin' | 'user'
  createdAt: string
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Complex RBAC with roles/permissions tables | Simple role column for 2-role systems | Industry consensus for self-hosted apps | Dramatically simpler code and DB schema |
| Admin seeded via env vars | First-run setup wizard via web UI | Standard in self-hosted apps (Gitea, Nextcloud) | Better UX, no env var credential management |
| Role stored only in DB | Role in JWT claim + DB source of truth | Standard JWT practice | Eliminates per-request DB role lookups |

**Deprecated/outdated:**
- The existing 5-table RBAC model (users, roles, permissions, role_permissions, user_roles) is over-engineered for this use case and will be simplified.

## Open Questions

1. **What does Phase 2 actually produce?**
   - What we know: Phase 2 will create the users table, auth routes (login/register/logout), JWT middleware, password hashing utility
   - What's unclear: Exact schema of users table, whether `role` column is included in Phase 2 or deferred to Phase 3
   - Recommendation: Phase 3 plan should handle both cases -- add `role` column if missing, or use it if exists. The D1 migration should be idempotent.

2. **Should the complex RBAC tables be dropped?**
   - What we know: The existing roles, permissions, role_permissions, user_roles tables were built for Feishu OAuth
   - What's unclear: Whether Phase 1 cleanup removes these tables or Phase 3 should
   - Recommendation: Phase 3 should drop the old RBAC tables and the permissions route/page, replacing with simple role-based logic. Phase 1 may have already cleaned some of this.

3. **Admin password reset: should admin be prevented from resetting their own password here?**
   - What we know: AUTH-06 covers users changing their own password (Phase 2). USER-04 covers admin resetting others' passwords.
   - What's unclear: Edge case of admin resetting own password via admin UI vs settings page
   - Recommendation: Admin reset endpoint should work for any user ID. Self-password-change remains in Phase 2's settings page. No special restriction needed.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `lib/database/permissions.ts` - Existing RBAC model with 5 tables
- Codebase analysis: `workers/middleware/auth.ts` - Existing auth middleware pattern
- Codebase analysis: `workers/routes/permissions.ts` - Existing admin permission management
- Codebase analysis: `app/components/protected-route.tsx` - Existing frontend role checking
- Codebase analysis: `app/stores/user-info-store.ts` - Existing user state management
- Codebase analysis: `workers/routes/tools.ts` - Tool CRUD endpoints needing RBAC
- Codebase analysis: `db/database.sql` - Current database schema

### Secondary (MEDIUM confidence)
- Architecture Research: `.planning/research/ARCHITECTURE.md` - Pattern 2 (First-Run Setup), Pattern 1 (JWT Auth)
- Feature Research: `.planning/research/FEATURES.md` - First-Run Setup Wizard requirements, RBAC as table stakes

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies
- Architecture: HIGH - Simplification of existing patterns, well-understood domain
- Pitfalls: HIGH - Based on direct codebase analysis of existing RBAC implementation

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable domain, no fast-moving dependencies)
