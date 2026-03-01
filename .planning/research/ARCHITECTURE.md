# Architecture Research

**Domain:** Cloudflare Workers Full-Stack Application (Open-Source)
**Researched:** 2026-03-01
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                      Browser (Client)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  React   │  │  Zustand │  │  React   │  │  shadcn  │      │
│  │  Router  │  │  Store   │  │  Query   │  │  /ui     │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       └─────────────┴─────────────┴──────────────┘            │
│                           │ (HTTPS/JSON)                        │
├───────────────────────────┼─────────────────────────────────────┤
│                Cloudflare Workers (Edge)                       │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                   Hono Middleware                     │      │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │      │
│  │  │ CORS │─→│ Auth │─→│Route │─→│Cache │─→│Error │  │      │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  │      │
│  └───────────────────────┬──────────────────────────────┘      │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                    API Routes                         │      │
│  │  /api/tools  /api/categories  /api/auth  /api/admin  │      │
│  └───────────────────────┬──────────────────────────────┘      │
├───────────────────────────┼─────────────────────────────────────┤
│                  Database & Storage Layer                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │   D1    │  │   KV    │  │   R2    │  │  Cache  │          │
│  │Database │  │ (Cache) │  │(Assets) │  │   API   │          │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘          │
└────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Frontend (React Router v7)** | UI rendering, client routing, state management | SPA with SSR support, file-based routing |
| **API Layer (Hono)** | Request handling, authentication, business logic | Lightweight web framework on Workers runtime |
| **Database Layer** | Data persistence, CRUD operations, field mapping | D1 (SQLite), KV for caching, R2 for file storage |
| **Auth Middleware** | JWT validation, session management, access control | Custom Hono middleware with Web Crypto API |
| **Cache Layer** | Multi-tier caching, invalidation strategy | KV + Cache API + localStorage (client) |

## Recommended Project Structure for Open-Source

```
project-root/
├── app/                        # Frontend React Router v7 application
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components (reusable)
│   │   ├── layout/             # Layout components
│   │   └── [feature]/          # Feature-specific components
│   ├── routes/                 # File-based routing definitions
│   ├── lib/                    # Frontend utilities and API client
│   ├── hooks/                  # Custom React hooks
│   ├── stores/                 # Zustand state stores
│   ├── types/                  # TypeScript type definitions
│   ├── context/                # React context providers
│   ├── root.tsx                # Root layout component
│   └── routes.ts               # Route configuration
├── workers/                    # Cloudflare Workers backend
│   ├── routes/                 # API route handlers
│   │   ├── auth.ts             # Authentication endpoints
│   │   ├── tools.ts            # Tool CRUD endpoints
│   │   └── admin.ts            # Admin endpoints
│   ├── middleware/             # Request middleware
│   │   ├── auth.ts             # JWT authentication
│   │   └── rbac.ts             # Role-based access control
│   ├── utils/                  # Worker utilities
│   └── app.ts                  # Main Hono application
├── lib/                        # Shared database and type logic
│   ├── database/               # D1 database operations
│   │   ├── auth.ts             # User/session operations
│   │   ├── tools.ts            # Tool CRUD with caching
│   │   └── permissions.ts      # RBAC operations
│   └── types/                  # Shared TypeScript types
├── db/                         # Database schema and migrations
│   ├── migrations/             # D1 migration scripts
│   │   ├── 0001_init.sql       # Initial schema
│   │   └── 0002_add_users.sql  # User auth tables
│   └── schema.sql              # Complete schema dump
├── public/                     # Static assets
├── .github/                    # GitHub Actions workflows
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── docs/                       # Documentation
│   ├── CONTRIBUTING.md         # Contribution guide
│   ├── DEPLOYMENT.md           # Deployment instructions
│   └── ARCHITECTURE.md         # Architecture overview
├── wrangler.jsonc              # Cloudflare Workers config
├── package.json                # Dependencies and scripts
├── README.md                   # Project introduction
├── LICENSE                     # Open source license
└── deploy.json                 # Deploy Button configuration
```

### Structure Rationale

- **app/**: Clear separation of frontend concerns with feature-based organization for scalability
- **workers/**: Backend API layer with modular route handlers, enabling independent development and testing
- **lib/**: Shared code between frontend and backend prevents duplication and ensures consistency
- **db/**: Migration-based schema management allows version control and reproducible deployments
- **docs/**: Essential documentation for open-source contributors and self-deployers
- **deploy.json**: Cloudflare Deploy Button config enables one-click deployment

## Architectural Patterns for Open-Source Conversion

### Pattern 1: JWT-Based Authentication with Web Crypto API

**What:** Replace OAuth (Feishu) with self-contained username/password authentication using JWT tokens signed with Web Crypto API.

**When to use:** When converting from enterprise SSO to self-hosted open-source application requiring zero external dependencies.

**Trade-offs:**
- **Pros:** No third-party service dependencies, fully self-contained, works offline in dev mode, standard JWT flow
- **Cons:** Must implement password hashing (PBKDF2 due to Web Crypto limitations), session management complexity, no OAuth social login

**Example:**
```typescript
// workers/lib/auth.ts
import { sign, verify } from 'hono/jwt'

export async function hashPassword(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    256
  )
}

export async function createJWT(userId: string, secret: string): Promise<string> {
  return sign(
    {
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 days
    },
    secret
  )
}
```

**Integration with Hono middleware:**
```typescript
// workers/middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    // Public paths or read-only access
    if (c.req.method === 'GET' && c.req.path.startsWith('/api/')) {
      return next()
    }
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET)
    c.set('userId', payload.sub)
    return next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
```

### Pattern 2: First-Run Setup with Admin Account Initialization

**What:** On first deployment, automatically create an admin account using environment variables, enabling immediate access without manual database seeding.

**When to use:** Open-source applications deployed via Cloudflare Deploy Button requiring zero-configuration first-run experience.

**Trade-offs:**
- **Pros:** Seamless onboarding, no manual SQL needed, Deploy Button compatible
- **Cons:** Admin credentials in environment variables (must change on first login), one-time initialization complexity

**Example:**
```typescript
// workers/routes/setup.ts
import { Hono } from 'hono'
import { getUserByUsername, createUser } from '../../lib/database/auth'
import { hashPassword } from '../lib/auth'

const setup = new Hono<{ Bindings: Cloudflare.Env }>()

setup.post('/initialize', async (c) => {
  // Check if already initialized
  const existingAdmin = await getUserByUsername(c.env.DB, 'admin')
  if (existingAdmin) {
    return c.json({ error: 'Already initialized' }, 400)
  }

  // Get admin credentials from environment
  const adminUsername = c.env.ADMIN_USERNAME || 'admin'
  const adminPassword = c.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return c.json({ error: 'ADMIN_PASSWORD not configured' }, 500)
  }

  // Create admin user
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const passwordHash = await hashPassword(adminPassword, salt)

  await createUser(c.env.DB, {
    username: adminUsername,
    passwordHash: new Uint8Array(passwordHash),
    salt: salt,
    role: 'admin'
  })

  return c.json({ message: 'Admin user created. Please change password immediately.' })
})

export { setup }
```

### Pattern 3: Cloudflare Deploy Button with Automated Resource Provisioning

**What:** Configure deploy.json to automatically provision D1 database, KV namespace, and R2 bucket during one-click deployment.

**When to use:** Open-source projects targeting non-technical users or simplifying deployment to Cloudflare Workers.

**Trade-offs:**
- **Pros:** Zero-configuration deployment, automatic binding creation, guided setup UI
- **Cons:** Cloudflare-specific (not portable), limited customization during deploy, resource naming constraints

**Example:**
```json
// deploy.json
{
  "$schema": "https://schemas.cloudflare.com/deploy-config.json",
  "name": "devhub-open-source",
  "repository": "https://github.com/username/devhub-open-source",
  "framework": "react",
  "build": {
    "command": "npm run build",
    "cwd": ".",
    "output_directory": "build/client"
  },
  "deploy": {
    "command": "npm run deploy"
  },
  "bindings": {
    "d1_databases": [
      {
        "binding": "DB",
        "database_name": "devhub-database"
      }
    ],
    "kv_namespaces": [
      {
        "binding": "CACHE_KV"
      }
    ],
    "r2_buckets": [
      {
        "binding": "ASSETS_BUCKET",
        "bucket_name": "devhub-assets"
      }
    ]
  },
  "env": {
    "JWT_SECRET": {
      "type": "secret",
      "description": "Secret key for JWT token signing (generate with: openssl rand -base64 32)"
    },
    "ADMIN_PASSWORD": {
      "type": "secret",
      "description": "Initial admin password (change after first login)"
    }
  },
  "migrations": {
    "path": "db/migrations",
    "auto_apply": true
  }
}
```

### Pattern 4: Database Field Mapping Layer (snake_case ↔ camelCase)

**What:** Maintain existing database field mapping pattern that translates between SQL snake_case and JavaScript camelCase at the database layer boundary.

**When to use:** When preserving SQL naming conventions while exposing idiomatic JavaScript APIs, especially in full-stack TypeScript projects.

**Trade-offs:**
- **Pros:** Clean separation of concerns, idiomatic code in both layers, explicit transformation point
- **Cons:** Performance overhead (minor), mapping code duplication, potential for field name bugs

**Example:**
```typescript
// lib/database/users.ts
interface UserRow {
  id: string
  username: string
  password_hash: Uint8Array
  salt: Uint8Array
  role: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  username: string
  passwordHash: Uint8Array
  salt: Uint8Array
  role: string
  createdAt: string
  updatedAt: string
}

function mapUserFromDb(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    salt: row.salt,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<UserRow>()

  return result ? mapUserFromDb(result) : null
}
```

## Data Flow

### Authentication Flow (New Pattern)

```
[Login Request]
    ↓
[POST /api/auth/login] → [Validate username/password]
    ↓                          ↓
[Query users table]    [PBKDF2 hash with salt]
    ↓                          ↓
[Compare password hashes] → [Match?]
    ↓                          ↓
[Generate JWT with Hono] ← [YES]
    ↓
[Set HTTP-only cookie] → [Return user info]
    ↓
[Client stores in Zustand]


[Authenticated Request]
    ↓
[Auth Middleware] → [Extract JWT from cookie/header]
    ↓                          ↓
[Verify with Hono JWT] → [Valid?]
    ↓                          ↓
[Set userId in context] ← [YES]
    ↓
[Route handler accesses c.get('userId')]
```

### Tool CRUD Flow (Existing Pattern)

```
[User Action in UI]
    ↓
[React Component] → [API Client (app/lib/api.ts)]
    ↓                          ↓
[POST /api/tools] ← [React Query mutation]
    ↓
[Auth Middleware] → [Validate JWT]
    ↓                          ↓
[Route Handler] ← [Check user permissions]
    ↓
[Database Layer (lib/database/tools.ts)]
    ↓                          ↓
[D1 Batch Transaction] → [Insert tools, environments, tags]
    ↓                          ↓
[Increment KV cache version] ← [Success]
    ↓
[Return mapped result (camelCase)]
    ↓
[Frontend updates Zustand store + React Query cache]
```

### First-Time Deployment Flow (New Pattern)

```
[User clicks Deploy Button]
    ↓
[Cloudflare Dashboard] → [Parse deploy.json]
    ↓                          ↓
[Provision D1, KV, R2] ← [Create bindings]
    ↓
[Prompt for secrets] → [ADMIN_PASSWORD, JWT_SECRET]
    ↓                          ↓
[Fork repository] ← [User customizes names]
    ↓
[Run migrations] → [wrangler d1 migrations apply]
    ↓                          ↓
[Execute build command] ← [npm run build]
    ↓
[Deploy to Workers] → [Bind resources to worker]
    ↓
[First request triggers setup] → [Create admin user]
    ↓                          ↓
[Admin login] ← [Change password]
```

## Integration Points for Open-Source Conversion

### Remove Business Integrations

| Current Integration | Action | Replacement |
|---------------------|--------|-------------|
| Feishu OAuth (`OAUTH_BASE_URL`, `FEISHU_CLIENT_ID`) | Remove | Built-in username/password auth |
| R2 log storage (`CF_ALL_LOG`) | Remove | Optional: environment variable for logging |
| `@qlj/common-utils` package | Inline code | Copy necessary utilities to `lib/utils/` |
| DeepClick quick login module | Remove | N/A (business-specific) |

### Add Open-Source Infrastructure

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| `deploy.json` | Deploy Button config | Define bindings, secrets, migrations |
| `CONTRIBUTING.md` | Contributor guide | Code style, PR process, development setup |
| `LICENSE` | Open source license | MIT or Apache 2.0 recommended |
| GitHub Actions | CI/CD pipeline | Automated testing, linting, deployment |
| User auth tables | D1 schema migration | `users`, `sessions`, `password_resets` tables |

### External Services (Optional Extensions)

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OAuth providers (GitHub, Google) | Workers OAuth routes with PKCE flow | Post-MVP feature for easier login |
| Email service (for password reset) | Cloudflare Email Workers or external SMTP | Requires email binding configuration |
| Analytics | Workers Analytics Engine or external | Privacy-focused alternatives preferred |

### Internal Boundaries (Existing Architecture)

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ Backend | REST API (JSON) via `/api/*` routes | Keep existing pattern, well-defined contract |
| Backend ↔ Database | D1 SQL queries via `lib/database/*` | Maintain field mapping layer |
| Auth Middleware ↔ Routes | Hono context (`c.set('userId')`) | Standard Hono pattern for request context |
| Cache Layer ↔ Database | KV version-based invalidation | Keep existing cache strategy |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Existing architecture sufficient. D1 handles SQLite well at this scale. Single Worker instance per region. |
| 1k-100k users | Optimize D1 queries with proper indexes. Enable Cloudflare Cache API for static assets. Consider read replicas if D1 supports in future. |
| 100k+ users | Evaluate D1 limitations (10GB database size). Consider sharding tools by category. Move heavy analytics to Workers Analytics Engine. Use Durable Objects for real-time features. |

### Scaling Priorities

1. **First bottleneck:** D1 read performance on tool listings. **Fix:** Multi-tier caching already implemented (KV + Cache API + client localStorage). Ensure indexes on `category`, `status`, `is_internal`.

2. **Second bottleneck:** Authentication token validation overhead. **Fix:** Cache JWT verification results in KV with short TTL (5 minutes). Implement session token rotation to reduce re-verification.

3. **Third bottleneck:** R2 asset serving bandwidth. **Fix:** Already using Cache-Control headers. Consider Cloudflare Images for icon optimization. Enable R2 public buckets with custom domain for CDN.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Passwords in Environment Variables Long-Term

**What people do:** Configure `ADMIN_PASSWORD` in Deploy Button and never change it, storing production passwords in Cloudflare environment variables indefinitely.

**Why it's wrong:** Environment variables are visible to anyone with Workers access, logged in deployment history, and not designed for credential storage. Violates security best practices.

**Do this instead:** Use `ADMIN_PASSWORD` only for first-run initialization. Force password change on first login. Implement password reset flow. Store only password hashes in D1 database.

### Anti-Pattern 2: Bypassing Field Mapping Layer

**What people do:** Directly return database snake_case fields to frontend or accept camelCase fields in SQL queries to "save code."

**Why it's wrong:** Breaks separation of concerns, leaks database schema to API clients, makes refactoring harder, causes inconsistent API responses.

**Do this instead:** Always use field mapping functions in `lib/database/*.ts`. Keep database schema and API schema independent. Use TypeScript interfaces to enforce mapping at compile time.

### Anti-Pattern 3: Hardcoding JWT Secret in Code

**What people do:** Use a default JWT secret like `"my-secret-key"` or generate one and commit it to version control.

**Why it's wrong:** Compromises all user sessions immediately upon repository publication. Cannot rotate secret without invalidating all tokens. Critical security vulnerability.

**Do this instead:** Require `JWT_SECRET` as a secret environment variable in Deploy Button config. Generate with `openssl rand -base64 32`. Document secret rotation process. Never commit secrets to git.

### Anti-Pattern 4: Mixing OAuth and Local Auth in Same Codebase

**What people do:** Keep Feishu OAuth routes alongside new username/password auth, creating two parallel authentication systems.

**Why it's wrong:** Confusing for contributors, increases attack surface, complicates session management, makes RBAC inconsistent.

**Do this instead:** Completely remove OAuth integration for open-source version. Document OAuth as a potential extension in `CONTRIBUTING.md`. If adding OAuth later, use OAuth as SSO on top of local accounts (link accounts), not parallel system.

### Anti-Pattern 5: Manual Database Schema Updates

**What people do:** Modify `db/schema.sql` and expect users to manually run SQL commands to update their databases.

**Why it's wrong:** No version tracking, error-prone manual process, breaks Deploy Button automation, difficult to rollback.

**Do this instead:** Use D1 migrations (`db/migrations/*.sql`) with sequential numbering. Apply migrations automatically during deployment via `wrangler d1 migrations apply`. Track applied migrations in `d1_migrations` table.

## Build Order for Open-Source Conversion

### Phase 1: Remove Business Dependencies (Week 1)
**Why first:** Cleanest codebase before adding new auth. Prevents confusion about which auth system to use.

1. Remove Feishu OAuth routes and middleware
2. Remove `@qlj/common-utils` dependency (inline necessary code)
3. Remove DeepClick quick-login components
4. Remove `CF_ALL_LOG` R2 binding and log upload routes
5. Clean `wrangler.jsonc` environment variables

**Dependency:** None. Can start immediately.

### Phase 2: Implement User Authentication (Week 2)
**Why second:** Foundation for all access control. Must exist before RBAC.

1. Create user tables migration (`db/migrations/0001_create_users.sql`)
2. Implement password hashing with Web Crypto API (`lib/auth.ts`)
3. Add user database operations (`lib/database/auth.ts`)
4. Create auth routes (`workers/routes/auth.ts`): login, logout, change password
5. Update auth middleware to use JWT validation

**Dependency:** Phase 1 complete (no conflicting auth systems).

### Phase 3: First-Run Setup & Admin (Week 2)
**Why third:** Enables zero-config deployment. Requires auth system from Phase 2.

1. Create admin initialization endpoint (`/api/setup/initialize`)
2. Add `ADMIN_PASSWORD` to environment variables
3. Implement role-based access control middleware (`workers/middleware/rbac.ts`)
4. Protect admin routes with role check
5. Build admin user management UI

**Dependency:** Phase 2 complete (user auth system exists).

### Phase 4: Deploy Button Configuration (Week 3)
**Why fourth:** Requires complete auth and database schema from Phases 2-3.

1. Create `deploy.json` with all bindings
2. Finalize D1 migrations (schema complete)
3. Add environment variable documentation (JWT_SECRET, ADMIN_PASSWORD)
4. Test Deploy Button flow end-to-end
5. Write deployment guide (`docs/DEPLOYMENT.md`)

**Dependency:** Phases 1-3 complete (stable database schema and auth).

### Phase 5: Open Source Infrastructure (Week 3)
**Why fifth:** Polish for public release. Can proceed in parallel with Phase 4.

1. Write `CONTRIBUTING.md` guide
2. Add MIT or Apache 2.0 `LICENSE`
3. Update `README.md` with Deploy Button badge and self-hosting guide
4. Set up GitHub Actions for CI/CD (linting, type checking)
5. Create GitHub issue templates

**Dependency:** None (documentation task, parallel with Phase 4).

### Critical Path Dependencies

```
Phase 1 (Remove Business)
    ↓
Phase 2 (Auth System)
    ↓
Phase 3 (Admin Setup)
    ↓
Phase 4 (Deploy Button)

Phase 5 (Open Source Docs) can run in parallel with Phase 4
```

**Total Timeline:** 3 weeks (can compress to 2 weeks if single developer focused).

## Sources

### Cloudflare Workers & Authentication
- [Configure the Worker for JWT validation - Cloudflare API Shield docs](https://developers.cloudflare.com/api-shield/security/jwt-validation/jwt-worker/)
- [Validate JWTs - Cloudflare One docs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Protecting APIs with JWT Validation - Cloudflare Blog](https://blog.cloudflare.com/protecting-apis-with-jwt-validation/)
- [Simple JWT Authentication with Cloudflare Workers - Chapi Menge Blog](https://blog.chapimenge.com/blog/programming/simple-jwt-authentication-with-cloudflare-workers/)

### Cloudflare Deploy Button
- [Deploy to Cloudflare buttons - Cloudflare Workers docs](https://developers.cloudflare.com/workers/platform/deploy-buttons/)
- [Skip the setup: deploy a Workers application in seconds - Cloudflare Blog](https://blog.cloudflare.com/deploy-workers-applications-in-seconds/)
- [Deploy to Cloudflare buttons now support Worker environment variables, secrets - Changelog](https://developers.cloudflare.com/changelog/2025-07-01-workers-deploy-button-supports-environment-variables-and-secrets/)

### Hono Framework
- [Cloudflare Workers - Hono](https://hono.dev/docs/getting-started/cloudflare-workers)
- [JWT Auth Middleware - Hono](https://hono.dev/docs/middleware/builtin/jwt)
- [Basic Auth Middleware - Hono](https://hono.dev/docs/middleware/builtin/basic-auth)
- [Better Auth on Cloudflare - Hono](https://hono.dev/docs/examples/better-auth-on-cloudflare)

### Password Hashing & Web Crypto API
- [Options for Password Hashing? - Cloudflare Workers Community](https://community.cloudflare.com/t/options-for-password-hashing/138077)
- [Uses the SubtleCrypto interface of the Web Cryptography API to hash a password using PBKDF2 - GitHub Gist](https://gist.github.com/chrisveness/770ee96945ec12ac84f134bf538d89fb)
- [Password Hashing Guide 2025: Argon2 vs Bcrypt vs Scrypt vs PBKDF2 - Complete Comparison](https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/)

### D1 Database & Migrations
- [Migrations - Cloudflare D1 docs](https://developers.cloudflare.com/d1/reference/migrations/)
- [Getting started - Cloudflare D1 docs](https://developers.cloudflare.com/d1/get-started/)
- [Local development - Cloudflare D1 docs](https://developers.cloudflare.com/d1/best-practices/local-development/)
- [D1 SQLite: Schema, migrations and seeds - This Dot Labs](https://www.thisdot.co/blog/d1-sqlite-schema-migrations-and-seeds)

### Full-Stack Architecture
- [Your frontend, backend, and database — now in one Cloudflare Worker - Cloudflare Blog](https://blog.cloudflare.com/full-stack-development-on-cloudflare-workers/)
- [Unified Architecture – A Simpler Way to Build Full-Stack Apps - freeCodeCamp](https://www.freecodecamp.org/news/full-stack-unified-architecture/)
- [What Backend for Frontend (BFF) - All You Need to Know - Alokai](https://alokai.com/blog/backend-for-frontend)

### Open Source Best Practices
- [How to Contribute to Open Source - Open Source Guides](https://opensource.guide/how-to-contribute/)
- [10 Best Practices for Contributing to Open Source Projects - Daytona](https://www.daytona.io/dotfiles/10-best-practices-for-contributing-to-open-source-projects)
- [What to expect for open source in 2026 - The GitHub Blog](https://github.blog/open-source/maintainers/what-to-expect-for-open-source-in-2026/)

---
*Architecture research for: DevHub Open Source Edition - Cloudflare Workers Full-Stack Application*
*Researched: 2026-03-01*
