# Phase 2: Authentication - Research

**Researched:** 2026-03-01
**Domain:** Self-contained username/password authentication on Cloudflare Workers with JWT session cookies
**Confidence:** HIGH

## Summary

Phase 2 replaces the removed Feishu OAuth system (cleaned in Phase 1) with a self-contained username/password authentication system. The stack is already well-defined from prior research: Web Crypto API PBKDF2-SHA256 for password hashing, Hono's built-in JWT helpers (`hono/jwt`) for token signing/verification, and HTTP-only cookies for session persistence. The D1 database already hosts the application data; adding `users` and `sessions` tables follows established patterns.

The existing codebase provides clear integration points. The current `workers/routes/auth.ts` handles Feishu OAuth -- after Phase 1 cleanup this will be removed and replaced. The current `workers/middleware/auth.ts` uses a simple token-presence check without verification -- this must be upgraded to JWT signature verification. The frontend `app/stores/user-info-store.ts`, `app/components/user-profile.tsx`, and `app/hooks/use-permissions.ts` all consume auth state and will need updates to match the new local auth model.

**Primary recommendation:** Use Web Crypto PBKDF2-SHA256 with 600,000 iterations + Hono JWT HS256 with 15-minute access tokens and 7-day refresh tokens stored in HTTP-only cookies. Keep the architecture simple: single `users` table with password_hash column, single `sessions` table for refresh token tracking and revocation.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User registration with username/password | Web Crypto PBKDF2 hashing + D1 users table + POST /api/auth/register endpoint |
| AUTH-02 | User login with username/password | PBKDF2 password verification + JWT token generation via hono/jwt + cookie setting |
| AUTH-03 | JWT HTTP-only cookie session persistence | Hono cookie helpers (hono/cookie) + dual-token pattern (access + refresh) + SameSite=Lax |
| AUTH-04 | PBKDF2-SHA256 password hashing | Web Crypto API crypto.subtle.deriveBits() with PBKDF2, 600k iterations, 16-byte salt |
| AUTH-05 | Logout from any page | Clear cookies + delete session from D1 sessions table + frontend store reset |
| AUTH-06 | Change password from settings | Verify current password, hash new password, invalidate all sessions except current |
| AUTH-07 | Update display name from settings | Simple D1 UPDATE on users table + refresh user info in frontend store |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web Crypto API | Native (Workers) | PBKDF2-SHA256 password hashing | Native to Workers runtime; no dependencies; OWASP-recommended algorithm for constrained environments |
| hono/jwt | Built-in (hono 4.8.2+) | JWT sign/verify with HS256 | Already bundled with Hono; explicit algorithm pinning; no extra dependencies |
| hono/cookie | Built-in (hono 4.8.2+) | HTTP-only cookie management | Already bundled; supports Secure, SameSite, HttpOnly flags; integrated with Hono context |
| Cloudflare D1 | Native | Users and sessions storage | Already in use for tools; zero additional cost; supports batch transactions |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^3.23.8 | Request validation | Validate registration/login payloads, password strength rules |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PBKDF2-SHA256 | bcrypt via nodejs_compat | Adds Node.js runtime overhead; PBKDF2 is native and sufficient |
| Dual-token (access+refresh) | Single long-lived JWT (30d) | Simpler but no revocation capability; security risk for self-hosted app |
| D1 sessions table | Stateless JWT only | No server-side revocation; cannot force logout; password change cannot invalidate sessions |

**Installation:**
```bash
# zod for validation (only new dependency)
pnpm add zod@^3.23.8

# Everything else is already available:
# - Web Crypto API: native Workers runtime
# - hono/jwt, hono/cookie: bundled with hono@4.8.2
# - D1: existing binding
```

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)

```
workers/
├── routes/
│   └── auth.ts             # REPLACE: register, login, logout, me endpoints
├── middleware/
│   └── auth.ts             # REPLACE: JWT verification middleware
└── utils/
    └── auth.ts             # REPLACE: password hashing, token helpers
lib/
├── database/
│   └── auth.ts             # NEW: user CRUD, session management
└── types/
    └── auth.ts             # NEW: User, Session, AuthPayload types
app/
├── routes/
│   ├── login.tsx           # NEW: login page
│   ├── register.tsx        # NEW: registration page
│   └── settings.tsx        # NEW: personal settings (password, display name)
├── components/
│   └── auth/               # NEW: login form, register form components
├── stores/
│   └── user-info-store.ts  # UPDATE: adapt to local auth model
├── hooks/
│   └── use-permissions.ts  # UPDATE: simplified role model (admin/user)
├── types/
│   └── user-info.ts        # UPDATE: replace Feishu-specific fields
└── lib/
    └── api.ts              # UPDATE: auth API functions
```

### Pattern 1: Dual-Token Authentication Flow

**What:** Use short-lived access tokens (15 min) in cookies for API authentication, paired with longer-lived refresh tokens (7 days) stored in D1 sessions table for session continuity.

**When to use:** When you need both stateless performance (access token) and server-side revocation (refresh token in D1).

**Example:**
```typescript
// workers/routes/auth.ts - Login flow
import { sign } from 'hono/jwt'
import { setCookie } from 'hono/cookie'

async function generateTokens(userId: string, role: string, jwtSecret: string) {
  const now = Math.floor(Date.now() / 1000)

  const accessToken = await sign(
    { sub: userId, role, exp: now + 900, iat: now },  // 15 min
    jwtSecret,
    'HS256'
  )

  const refreshToken = crypto.randomUUID()

  return { accessToken, refreshToken }
}

function setAuthCookies(c: Context, accessToken: string, refreshToken: string) {
  setCookie(c, 'access_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 900,  // 15 min
  })

  setCookie(c, 'refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/api/auth/refresh',  // Only sent to refresh endpoint
    maxAge: 60 * 60 * 24 * 7,  // 7 days
  })
}
```

### Pattern 2: PBKDF2 Password Hashing with Web Crypto

**What:** Hash passwords using PBKDF2-SHA256 with 600,000 iterations and 16-byte random salt, storing salt:hash as base64 in D1.

**When to use:** All password storage and verification operations.

**Example:**
```typescript
// workers/utils/auth.ts
const PBKDF2_ITERATIONS = 600_000
const SALT_LENGTH = 16  // bytes
const HASH_LENGTH = 256  // bits

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  )

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    HASH_LENGTH
  )

  const saltB64 = btoa(String.fromCharCode(...salt))
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)))
  return `${saltB64}:${hashB64}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(':')
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0))

  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  )

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    HASH_LENGTH
  )

  const computedB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)))
  return computedB64 === hashB64
}
```

### Pattern 3: Auth Middleware with Token Refresh

**What:** Middleware that verifies JWT access tokens, and transparently refreshes expired access tokens using the refresh token.

**When to use:** Applied to all `/api/*` routes that require authentication.

**Example:**
```typescript
// workers/middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

export const authMiddleware = createMiddleware(async (c, next) => {
  const path = c.req.path
  const method = c.req.method

  // Public paths
  if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) {
    return next()
  }

  // Allow GET requests without auth (public tool browsing)
  if (method === 'GET' && path.startsWith('/api/')) {
    const token = getCookie(c, 'access_token')
    if (token) {
      try {
        const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
        c.set('userId', payload.sub as string)
        c.set('userRole', payload.role as string)
      } catch {
        // Token invalid/expired, continue as anonymous
      }
    }
    return next()
  }

  // Write operations require valid auth
  const token = getCookie(c, 'access_token')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('userId', payload.sub as string)
    c.set('userRole', payload.role as string)
    return next()
  } catch {
    return c.json({ error: 'Token expired or invalid' }, 401)
  }
})
```

### Pattern 4: Database Field Mapping (Existing Pattern Extended)

**What:** Continue the existing snake_case (DB) to camelCase (API) mapping pattern from `lib/database/tools.ts` for user and session entities.

**When to use:** All database operations for auth entities.

### Anti-Patterns to Avoid

- **Storing plaintext passwords:** Always hash with PBKDF2-SHA256, never store raw passwords
- **Using `alg: 'none'` or omitting algorithm:** Always specify `'HS256'` explicitly in both sign and verify
- **Hardcoding JWT_SECRET:** Must be an environment variable/secret, never committed to code
- **Single long-lived JWT without refresh:** No revocation capability; use dual-token pattern
- **Storing sensitive data in JWT payload:** Only store user_id and role; never passwords or PII
- **Client-side JWT storage in localStorage:** Use HTTP-only cookies; localStorage is vulnerable to XSS

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash function | Web Crypto PBKDF2 | Timing attacks, salt management, iteration calibration are non-trivial |
| JWT creation/verification | Manual base64 + HMAC | hono/jwt sign/verify | Algorithm confusion attacks, timing-safe comparison, header validation |
| Cookie management | Manual Set-Cookie headers | hono/cookie setCookie/getCookie | Correct escaping, flag combinations, path scoping |
| Input validation | Manual if/else checks | zod schemas | Consistent error messages, type inference, composable validation |
| UUID generation | Custom ID scheme | crypto.randomUUID() | Native Workers API, cryptographically random, standard format |

**Key insight:** Authentication is a security-critical domain where subtle bugs (timing attacks, algorithm confusion, improper salt handling) have severe consequences. Using native APIs and battle-tested helpers eliminates entire categories of vulnerabilities.

## Common Pitfalls

### Pitfall 1: PBKDF2 Iteration Count Too High for Workers CPU Limit
**What goes wrong:** 600,000+ PBKDF2 iterations may exceed the Workers 50ms CPU time limit on the bundled plan, causing request timeouts.
**Why it happens:** PBKDF2 is CPU-intensive by design; Workers has strict CPU time limits.
**How to avoid:** Benchmark on Workers: start with 600,000 iterations, measure actual CPU time. If exceeding limits, reduce to 310,000 (still above OWASP minimum). The unbound plan allows more CPU time.
**Warning signs:** Login/register endpoints returning 503 or timing out.

### Pitfall 2: Cookie SameSite Configuration Breaking Auth
**What goes wrong:** Using `SameSite=Strict` prevents cookies from being sent on navigation from external links; `SameSite=None` requires `Secure` and allows CSRF.
**Why it happens:** SameSite cookie semantics are subtle and vary by browser.
**How to avoid:** Use `SameSite=Lax` for both cookies. This allows cookies on top-level navigations (GET) but blocks cross-site POST requests, which is the right balance for a self-hosted app.
**Warning signs:** Users losing session after clicking links from email/Slack.

### Pitfall 3: Refresh Token Not Scoped to Refresh Path
**What goes wrong:** Refresh token cookie sent with every API request, increasing attack surface.
**Why it happens:** Setting cookie `path=/` instead of `path=/api/auth/refresh`.
**How to avoid:** Set refresh token cookie `path=/api/auth/refresh` so it's only sent to the refresh endpoint.
**Warning signs:** Refresh token visible in network tab on non-refresh requests.

### Pitfall 4: Race Condition on Token Refresh
**What goes wrong:** Multiple concurrent requests all try to refresh the token simultaneously, causing duplicate sessions or invalidated tokens.
**Why it happens:** Browser sends multiple requests before refresh completes.
**How to avoid:** Handle refresh on the frontend: when a 401 is received, queue pending requests, refresh once, then replay. Alternatively, accept that sometimes a refresh happens redundantly and handle it gracefully on the backend.
**Warning signs:** Intermittent 401 errors when multiple API calls fire at once.

### Pitfall 5: Not Invalidating Sessions on Password Change
**What goes wrong:** Old sessions remain valid after password change, defeating the purpose.
**Why it happens:** Only the password hash is updated, but existing refresh tokens in D1 are not deleted.
**How to avoid:** On password change, delete all rows in `sessions` table for that user except the current session.
**Warning signs:** User changes password but old browser tabs still work.

## Code Examples

### Database Schema: Users and Sessions Tables

```sql
-- D1 migration: 0002_add_users.sql

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### Registration Endpoint

```typescript
// workers/routes/auth.ts
auth.post('/register', async (c) => {
  const body = await c.req.json()
  // Validate with zod schema

  const existingUser = await getUserByUsername(c.env.DB, body.username)
  if (existingUser) {
    return c.json({ error: 'Username already taken' }, 409)
  }

  const passwordHash = await hashPassword(body.password)
  const userId = crypto.randomUUID()

  await createUser(c.env.DB, {
    id: userId,
    username: body.username,
    displayName: body.displayName || body.username,
    passwordHash,
    role: 'user',
  })

  // Auto-login after registration
  const { accessToken, refreshToken } = await generateTokens(userId, 'user', c.env.JWT_SECRET)
  await createSession(c.env.DB, userId, refreshToken)
  setAuthCookies(c, accessToken, refreshToken)

  return c.json({ user: { id: userId, username: body.username, role: 'user' } }, 201)
})
```

### Frontend Auth Store Update

```typescript
// app/stores/user-info-store.ts (updated shape)
interface UserInfo {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'user'
}
```

### Settings Page: Change Password

```typescript
// workers/routes/auth.ts
auth.post('/change-password', async (c) => {
  const userId = c.get('userId')
  const { currentPassword, newPassword } = await c.req.json()

  const user = await getUserById(c.env.DB, userId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const valid = await verifyPassword(currentPassword, user.passwordHash)
  if (!valid) return c.json({ error: 'Current password is incorrect' }, 400)

  const newHash = await hashPassword(newPassword)
  await updateUserPassword(c.env.DB, userId, newHash)

  // Invalidate all other sessions
  const currentSessionId = c.get('sessionId')
  await deleteUserSessionsExcept(c.env.DB, userId, currentSessionId)

  return c.json({ message: 'Password changed successfully' })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Feishu OAuth via external service | Self-contained username/password | Phase 2 (this phase) | No external dependency; works for any deployment |
| Token presence check (no verification) | JWT signature verification (HS256) | Phase 2 (this phase) | Prevents token forgery |
| Single auth_token cookie (30 days) | Dual-token: access (15min) + refresh (7 days) | Phase 2 (this phase) | Enables server-side revocation |
| Feishu-specific user model (openId, platform) | Simple user model (username, displayName, role) | Phase 2 (this phase) | Open-source friendly |

**Deprecated/outdated:**
- `workers/routes/auth.ts` (Feishu OAuth): Removed in Phase 1, replaced in Phase 2
- `lib/database/permissions.ts` (Feishu user model): feishuId field removed, replaced with username/password_hash
- `lib/types/jwt.ts` (Feishu JWT payload): Replaced with simple { sub, role, exp, iat } payload
- `app/types/user-info.ts` (Feishu-specific fields): Replaced with { id, username, displayName, role }

## Open Questions

1. **PBKDF2 Iteration Count on Workers Bundled Plan**
   - What we know: OWASP recommends 600,000 for SHA-256; Workers bundled plan has 50ms CPU limit
   - What's unclear: Exact CPU time for 600,000 iterations on Workers runtime (needs benchmarking)
   - Recommendation: Start with 600,000; if it exceeds CPU limits, reduce to 310,000 (still strong). Document the chosen value as a constant for easy adjustment.

2. **Simplified vs. Full Dual-Token Pattern**
   - What we know: Full dual-token requires a dedicated `/api/auth/refresh` endpoint and frontend retry logic
   - What's unclear: Whether the complexity is justified for a self-hosted tool management platform
   - Recommendation: Implement the dual-token pattern for correctness but consider a simpler alternative: single JWT cookie with 24-hour expiry, re-issued on each authenticated request (sliding window). The plan will use the simpler approach unless revocation is critical. **Decision: Use single JWT with 24h sliding window for simplicity.** The sessions table still enables server-side revocation on logout and password change.

3. **Frontend Login/Register UI Location**
   - What we know: Existing app uses React Router v7 file-based routing
   - What's unclear: Whether to use full-page routes or modal dialogs for auth
   - Recommendation: Full-page routes (`/login`, `/register`, `/settings`) -- simpler, more standard, SEO-friendly

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `workers/routes/auth.ts`, `workers/middleware/auth.ts`, `workers/utils/auth.ts`, `lib/database/permissions.ts`
- Stack research `.planning/research/STACK.md` -- PBKDF2-SHA256, Hono JWT patterns, D1 schema
- Architecture research `.planning/research/ARCHITECTURE.md` -- Auth flow diagrams, integration points

### Secondary (MEDIUM confidence)
- OWASP Password Storage Cheat Sheet -- PBKDF2 iteration recommendations (600k for SHA-256)
- Hono JWT middleware docs -- algorithm pinning, cookie integration patterns

### Tertiary (LOW confidence)
- Workers CPU time limits for PBKDF2 benchmarking -- needs runtime validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components (Web Crypto, Hono JWT, D1) are well-documented and already partially used in codebase
- Architecture: HIGH - Clear integration points identified in existing codebase; patterns well-established
- Pitfalls: HIGH - Common auth pitfalls well-documented in security literature; Workers-specific CPU limit is a known concern
- Code examples: HIGH - Based on existing codebase patterns and official Hono docs

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable domain; auth patterns change slowly)
