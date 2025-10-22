# Stack Research

**Domain:** Self-hosted developer tool management platform on Cloudflare Workers
**Researched:** 2026-03-01
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Hono | 4.8.2 (current) → 4.12+ | Web framework for API routes | Already in use; built-in JWT middleware with algorithm pinning (CVE fixes in 4.11.4+); excellent Cloudflare Workers integration; zero dependencies |
| Web Crypto API | Native (Workers) | Password hashing (PBKDF2) | Native to Cloudflare Workers; no external dependencies; PBKDF2-SHA256/SHA384 support; avoids bcrypt/scrypt compatibility issues |
| Hono JWT Helper | Built-in (hono/jwt) | JWT signing and verification | Integrated with Hono; supports HS256/384/512, RS*, PS*, ES*, EdDSA; cookie-based tokens; algorithm confusion protection (v4.11.4+) |
| Cloudflare D1 | SQLite (native) | User authentication database | Already in use for tools; zero additional cost; native binding; transaction support |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| es-toolkit | Latest | Utility functions (replaces @qlj/common-utils) | safeJsonParse, type guards, string transforms, async utilities |
| zod | ^3.23+ | Schema validation | Request/response validation for auth endpoints (login, register) |
| hono/cookie | Built-in | Cookie management | Session token storage (HttpOnly, Secure, SameSite flags) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Wrangler | Cloudflare deployment | Already configured; required for Deploy Button |
| TypeScript | Type safety | Already at 5.8.3; maintain current version |
| Biome | Linting/formatting | Already in use; keep existing setup |

## Installation

```bash
# Core (already installed)
# hono@4.8.2 (upgrade to 4.12+ recommended for latest JWT security fixes)

# Replace @qlj/common-utils with es-toolkit
pnpm remove @qlj/common-utils
pnpm add es-toolkit@^1.39.8

# Add schema validation
pnpm add zod@^3.23.8

# No additional auth libraries needed - use Web Crypto API + Hono built-ins
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Web Crypto PBKDF2 | bcrypt (Node.js compat) | If enabling `nodejs_compat` flag and willing to use Node.js runtime overhead |
| Web Crypto PBKDF2 | Argon2 WASM | NOT RECOMMENDED - WASM implementations don't work reliably in Workers; CPU time constraints |
| Hono JWT (hono/jwt) | @tsndr/cloudflare-worker-jwt | If using standalone JWT without Hono framework (not applicable here) |
| es-toolkit | radash or lodash-es | Use radash for retry/sleep patterns; lodash-es for legacy compatibility |
| D1 for users | External auth service | If need OAuth providers (GitHub/Google) - out of scope for MVP |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| bcrypt (native) | NOT compatible with Cloudflare Workers runtime; requires Node.js polyfills or nodejs_compat flag | Web Crypto API PBKDF2-SHA256 with 600,000+ iterations |
| argon2 / scrypt | Web Crypto API doesn't support them; WASM versions unreliable in Workers; CPU time limits (50ms bundled plan) | PBKDF2-SHA256/384 with Web Crypto API |
| @qlj/common-utils | Private internal package; blocks open-source distribution | es-toolkit (provides same utilities: safeJsonParse, type guards, string transforms) |
| JWT libraries with 'none' algorithm | Algorithm confusion attacks (CVE-2026-*) | Hono JWT with explicit alg='HS256' (required in 4.11.4+) |
| Long-lived JWTs (30+ days) | Security risk; no revocation capability | Dual-token pattern: 15min access + 7day refresh with D1 sessions table |

## Stack Patterns by Variant

**For password hashing:**
- Algorithm: PBKDF2-SHA256 (or SHA384 for higher security)
- Iterations: 600,000 minimum (OWASP 2023), 800,000+ recommended for 2026
- Salt: 128-bit (16 bytes) random via crypto.getRandomValues()
- Output: 256-bit derived key + salt stored as base64 in D1
- Calibration: Target ~50-150ms on Workers (test with production workload)

**For JWT tokens:**
- Algorithm: HS256 (symmetric) - explicitly specified to prevent algorithm confusion
- Access token: 15 minutes expiration
- Refresh token: 7 days expiration
- Storage: HttpOnly, Secure, SameSite=Strict cookies
- Claims: Include user_id, role, exp, iat, iss
- Revocation: Link to D1 sessions table for server-side invalidation

**For user schema (D1):**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- UUID v4
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- PBKDF2 output + salt (base64)
  role TEXT NOT NULL DEFAULT 'user',  -- 'admin' or 'user'
  created_at INTEGER NOT NULL,  -- Unix timestamp
  updated_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**For Cloudflare Deploy Button:**
- File: `wrangler.jsonc` (already exists)
- Required bindings: D1 database (DB), KV namespace (CACHE_KV optional)
- Secrets: Define in `.dev.vars.example` with format: `JWT_SECRET=your-secret-here`
- D1 migrations: Add to package.json deploy script: `"deploy": "wrangler d1 execute DB --file=db/schema.sql && wrangler deploy"`
- Repository: Must be public on GitHub/GitLab

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| hono@4.12+ | Cloudflare Workers (2025-10-10 compat date) | JWT middleware requires explicit alg since 4.11.4 |
| es-toolkit@1.39+ | TypeScript 5.8+ | Zero breaking changes from radash/lodash for used functions |
| Web Crypto API | Native Workers runtime | No version - platform API; PBKDF2 iteration limit unspecified but tested to 600k+ |
| zod@3.23+ | TypeScript 5.8+ | Schema validation; no known compatibility issues |

## Confidence Assessment

| Technology | Confidence | Source |
|------------|-----------|--------|
| Web Crypto PBKDF2 | HIGH | Official Cloudflare docs + NIST SP 800-132 standard + reference impl (vhscom/private-landing) |
| Hono JWT | HIGH | Official Hono docs + GitHub releases + CVE advisories (4.11.4 security fix) |
| PBKDF2 iterations (600k-800k) | MEDIUM-HIGH | OWASP 2023 (600k) + dev.to article projection (800k for 2025+) |
| Deploy Button config | HIGH | Official Cloudflare Workers Deploy Button docs |
| es-toolkit replacement | HIGH | Package analysis (provides all used @qlj/common-utils functions) |

## Critical Implementation Notes

**Password Hashing (Web Crypto API):**
```typescript
// PBKDF2-SHA256 with 600,000 iterations
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 600000,  // OWASP 2023 minimum
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  // Store: base64(salt) + ":" + base64(derivedBits)
  return btoa(String.fromCharCode(...salt)) + ":" +
         btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
}
```

**JWT with Hono (environment variables):**
```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { sign } from 'hono/jwt'

const app = new Hono<{ Bindings: Cloudflare.Env }>()

// Middleware - wrap to access c.env
app.use('/api/*', async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    alg: 'HS256',  // Explicit algorithm required (4.11.4+)
  })
  return jwtMiddleware(c, next)
})

// Sign token
const token = await sign(
  { user_id: userId, role: 'user', exp: Math.floor(Date.now() / 1000) + 900 },
  c.env.JWT_SECRET,
  'HS256'  // Must match middleware
)
```

**Replace @qlj/common-utils:**
```typescript
// Before:
import { safeJsonParse } from "@qlj/common-utils/common";

// After:
import { attemptAsync } from "es-toolkit/util";

function safeJsonParse(json: string): any {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
// Or use directly: attemptAsync(() => JSON.parse(json))
```

## Sources

### Password Hashing & Web Crypto
- [Options for Password Hashing? - Cloudflare Community](https://community.cloudflare.com/t/options-for-password-hashing/138077) — MEDIUM confidence
- [Web Crypto API - Cloudflare Workers docs](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/) — HIGH confidence
- [Password hashing on Cloudflare Workers - Jamie Lord](https://lord.technology/2024/02/21/hashing-passwords-on-cloudflare-workers.html) — MEDIUM confidence
- [private-landing reference implementation](https://github.com/vhscom/private-landing) — HIGH confidence (PBKDF2-SHA384, 128-bit salts, NIST compliant)
- [Why 310,000+ Iterations with PBKDF2 in 2025](https://dev.to/securebitchat/why-you-should-use-310000-iterations-with-pbkdf2-in-2025-3o1e) — MEDIUM confidence

### JWT & Hono
- [JWT Auth Middleware - Hono](https://hono.dev/docs/middleware/builtin/jwt) — HIGH confidence
- [JWT Authentication Helper - Hono](https://hono.dev/docs/helpers/jwt) — HIGH confidence
- [Hono JWT Algorithm Confusion CVE](https://dev.to/hari_prakash_b0a882ec9225/jwt-algorithm-confusion-attack-two-active-cves-in-2026-7bc) — HIGH confidence (CVE-2026 fix in 4.11.4)
- [Hono Releases](https://github.com/honojs/hono/releases) — HIGH confidence

### Cloudflare Deploy Button
- [Deploy to Cloudflare buttons - Official docs](https://developers.cloudflare.com/workers/platform/deploy-buttons/) — HIGH confidence
- [Deploy Button supports environment variables & secrets](https://developers.cloudflare.com/changelog/2025-07-01-workers-deploy-button-supports-environment-variables-and-secrets/) — HIGH confidence

### D1 Database
- [Implementing Register and Login in Workers with D1](https://massadas.com/posts/implementing-register-and-login-in-workers-d1/) — MEDIUM confidence
- [authentication-using-d1-example](https://github.com/G4brym/authentication-using-d1-example) — MEDIUM confidence

### Utilities
- es-toolkit package analysis — HIGH confidence (direct source code inspection)
- @qlj/common-utils package.json — HIGH confidence (node_modules inspection)

---
*Stack research for: DevHub Open Source Edition*
*Researched: 2026-03-01*
