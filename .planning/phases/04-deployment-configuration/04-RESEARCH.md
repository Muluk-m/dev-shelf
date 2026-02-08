# Phase 4: Deployment Configuration - Research

**Researched:** 2026-03-01
**Domain:** Cloudflare Workers Deploy Button, D1 migrations, zero-config deployment
**Confidence:** HIGH

## Summary

Phase 4 transforms the cleaned, authenticated DevHub application into a one-click deployable project via Cloudflare's Deploy Button. The Deploy Button reads the project's `wrangler.jsonc` to auto-provision D1 databases, KV namespaces, and other bindings. Environment variables and secrets defined in wrangler config are presented to users during deployment for configuration. D1 migrations must be set up in a `migrations/` directory so schema auto-initializes. A `.dev.vars.example` file documents required secrets, and the project must live in its own public GitHub repository.

The key technical challenge is ensuring database schema auto-initializes after Deploy Button provisioning. Cloudflare's Deploy Button provisions empty D1 databases but does not automatically run migrations. The deploy script in `package.json` must chain migration application before `wrangler deploy`. Wrangler 4.68+ supports automatic resource provisioning -- when bindings are defined in `wrangler.jsonc` with empty IDs, Deploy Button fills them during deployment.

**Primary recommendation:** Configure `wrangler.jsonc` with clean binding definitions (empty IDs), create a `migrations/` directory with numbered SQL files, chain `wrangler d1 migrations apply DB --remote` into the deploy script, create `.dev.vars.example` with documented secrets, and add Deploy Button markdown to the README.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEPLOY-01 | Project supports Cloudflare Deploy Button one-click deployment | Deploy Button URL format documented; requires public GitHub repo + wrangler.jsonc with binding definitions + package.json deploy script |
| DEPLOY-02 | deploy.json/wrangler config auto-creates D1 database and KV namespace | Deploy Button reads wrangler.jsonc and auto-provisions D1, KV, R2 bindings listed there; IDs should be empty strings for auto-provisioning |
| DEPLOY-03 | Database schema auto-initializes via D1 migrations | D1 migrations stored in `migrations/` directory; deploy script must chain `wrangler d1 migrations apply DB --remote` before `wrangler deploy` |
| DEPLOY-04 | `.dev.vars.example` file documents all required secrets | Secrets in `.dev.vars.example` or `.env.example` are presented to users during Deploy Button deployment for configuration |
| DEPLOY-05 | New repo published to GitHub as public repository | Deploy Button requires public GitHub/GitLab repository; project needs independent repo separate from internal version |
</phase_requirements>

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Wrangler | 4.21.x+ (project) / 4.68+ (latest) | Cloudflare deployment CLI | Required for Deploy Button; handles resource provisioning, migrations, deployment |
| D1 Migrations | Built-in (wrangler) | Database schema versioning | Standard Cloudflare approach; `wrangler d1 migrations apply` with numbered SQL files |
| Deploy Button | N/A (Cloudflare service) | One-click deployment | Official Cloudflare mechanism for template repos |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| GitHub CLI (gh) | Latest | Repository creation | Creating public repo from cleaned codebase |
| Git | Latest | Version control | Repository management, history cleanup |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| D1 migrations (wrangler) | Manual SQL in deploy script | Migrations provide versioning, rollback tracking, and incremental updates; manual SQL is fragile |
| Deploy Button | Manual wrangler deploy docs | Deploy Button gives zero-config UX; manual docs require user to run CLI commands |
| `.dev.vars.example` | README-only docs | Example file is auto-detected by Deploy Button UI; README alone requires manual copy-paste |

## Architecture Patterns

### Deploy Button Configuration Pattern

**What:** The Deploy Button reads `wrangler.jsonc` bindings and `package.json` scripts to determine what to provision and how to build/deploy.

**When to use:** Any Cloudflare Workers project intended for public distribution.

**Key files:**
```
project-root/
├── wrangler.jsonc          # Binding definitions (D1, KV) with empty IDs
├── package.json            # build + deploy scripts, cloudflare.bindings descriptions
├── .dev.vars.example       # Secret template (JWT_SECRET, etc.)
├── .gitignore              # Must ignore .dev.vars (already does)
└── migrations/
    └── 0001_initial_schema.sql  # D1 migration files
```

### Pattern 1: Clean wrangler.jsonc for Deploy Button

**What:** Remove all hardcoded IDs, business-specific vars, internal routes. Leave binding definitions with empty IDs for auto-provisioning.

**Example:**
```jsonc
// Source: Cloudflare Deploy Button docs
{
  "name": "devhub",
  "compatibility_date": "2025-10-10",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./workers/app.ts",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "devhub-database",
      "database_id": "",
      "migrations_dir": "migrations"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "CACHE_KV",
      "id": ""
    }
  ],
  "vars": {
    "APP_NAME": "DevHub"
  }
}
```

### Pattern 2: D1 Migration Files

**What:** Numbered SQL files in `migrations/` that wrangler applies sequentially, tracked in `d1_migrations` table.

**Example:**
```sql
-- migrations/0001_initial_schema.sql
-- Creates all application tables

CREATE TABLE IF NOT EXISTS tool_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'deprecated')),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category) REFERENCES tool_categories (id)
);

-- ... plus tool_environments, tool_tags, tool_usage_events, users, sessions tables
-- ... plus indexes
```

### Pattern 3: Deploy Script Chaining

**What:** The `deploy` script in package.json chains migration application before wrangler deploy.

**Example:**
```json
{
  "scripts": {
    "build": "react-router build",
    "deploy": "npm run build && wrangler d1 migrations apply DB --remote && wrangler deploy",
    "db:migrate": "wrangler d1 migrations apply DB --remote",
    "db:migrate:local": "wrangler d1 migrations apply DB --local"
  }
}
```

### Pattern 4: Binding Descriptions in package.json

**What:** The `cloudflare.bindings` section in package.json provides user-facing descriptions shown during Deploy Button setup.

**Example:**
```json
{
  "cloudflare": {
    "bindings": {
      "DB": {
        "type": "d1",
        "description": "Application database for tools, users, and categories"
      },
      "CACHE_KV": {
        "type": "kv",
        "description": "Cache storage for API responses (improves performance)"
      },
      "JWT_SECRET": {
        "type": "secret",
        "description": "Secret key for JWT token signing. Generate with: `openssl rand -hex 32`"
      }
    }
  }
}
```

### Anti-Patterns to Avoid

- **Hardcoded database IDs in wrangler.jsonc:** Deploy Button fills these; hardcoded IDs from internal deployment will break for new users.
- **Business-specific routes/domains in config:** Custom domain routes (`qlj-devhub-homepage.qiliangjia.one`) must be removed; Deploy Button assigns its own domain.
- **Missing migration chain in deploy script:** If deploy script does not apply migrations, database is empty on first request.
- **Using database name instead of binding name in migration commands:** Binding name (`DB`) is stable; database name can change per deployment.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database schema versioning | Custom SQL execution scripts | D1 migrations (`wrangler d1 migrations create/apply`) | Built-in versioning, rollback tracking, d1_migrations table |
| Resource provisioning | Manual create-then-configure instructions | Deploy Button auto-provisioning via wrangler.jsonc | Zero-config for end users; auto-fills IDs |
| Secret documentation | Inline code comments | `.dev.vars.example` file | Auto-detected by Deploy Button UI; standard Cloudflare convention |
| Deploy Button URL | Custom deploy scripts/pages | Official `deploy.workers.cloudflare.com/?url=` format | Maintained by Cloudflare; handles auth, provisioning, building |

**Key insight:** The entire Deploy Button ecosystem is designed around convention -- `wrangler.jsonc` bindings with empty IDs, `migrations/` directory, `.dev.vars.example` file, `package.json` deploy script. Follow the conventions and auto-provisioning works. Deviate and users must manually configure.

## Common Pitfalls

### Pitfall 1: Empty Database After Deploy

**What goes wrong:** Deploy Button provisions D1 database but schema is not applied. First request crashes with "table not found" errors.
**Why it happens:** Deploy Button does NOT automatically run D1 migrations after provisioning. Developers assume database setup is automatic.
**How to avoid:** Chain `wrangler d1 migrations apply DB --remote` in the `deploy` script in `package.json`, BEFORE `wrangler deploy`. The deploy script runs during Deploy Button execution.
**Warning signs:** `deploy` script in package.json only contains `wrangler deploy` without migration step.

### Pitfall 2: Hardcoded Internal IDs in Config

**What goes wrong:** New users deploy and get binding errors because wrangler.jsonc contains the original developer's database_id, KV id, etc.
**Why it happens:** Internal deployment uses real resource IDs; these must be emptied for Deploy Button.
**How to avoid:** Set all `database_id`, KV `id`, and `preview_id` to empty strings `""`. Deploy Button auto-fills them. Remove `routes` with custom domains entirely.
**Warning signs:** `wrangler.jsonc` contains UUIDs in database_id or KV namespace id fields.

### Pitfall 3: Business-Specific Environment Variables

**What goes wrong:** Deploy Button presents `FEISHU_CLIENT_ID`, `OAUTH_BASE_URL`, and other irrelevant vars to users who have no idea what they are.
**Why it happens:** Internal vars from Phases 1-3 cleanup may leave residue in wrangler.jsonc.
**How to avoid:** After Phase 1-3 cleanup, verify `vars` section only contains variables relevant to the open-source version (e.g., `APP_NAME`, no business-specific vars). Business vars should have been removed in Phase 1.
**Warning signs:** `vars` section contains Feishu, DeepClick, or OAuth references.

### Pitfall 4: .dev.vars.example Gitignored

**What goes wrong:** `.dev.vars.example` is caught by the `.dev.vars*` gitignore pattern and never committed.
**Why it happens:** Current `.gitignore` has `.dev.vars*` which matches both `.dev.vars` (secrets, should be ignored) and `.dev.vars.example` (template, must be committed).
**How to avoid:** Add `!.dev.vars.example` negation to `.gitignore` so the example file is tracked.
**Warning signs:** `git status` does not show `.dev.vars.example` as tracked/untracked after creation.

### Pitfall 5: R2 Buckets Without Graceful Degradation

**What goes wrong:** Deploy Button may not provision R2 buckets, or users might not want them. App crashes when trying to access `c.env.ASSETS_BUCKET`.
**Why it happens:** R2 bucket auto-provisioning depends on binding being in wrangler.jsonc. If removed during cleanup (CF_ALL_LOG was business-specific), ASSETS_BUCKET may still be needed for uploads.
**How to avoid:** Add binding validation middleware that returns graceful errors if optional bindings are missing. Make ASSETS_BUCKET optional or clearly documented.
**Warning signs:** No null check before accessing `c.env.ASSETS_BUCKET` in workers/app.ts.

## Code Examples

### Deploy Button Markdown (for README)

```markdown
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_USERNAME/devhub)
```

### .dev.vars.example File

```bash
# JWT signing secret - generate with: openssl rand -hex 32
JWT_SECRET=your-jwt-secret-here
```

### .gitignore Update for .dev.vars.example

```gitignore
# Cloudflare
.mf
.wrangler
.dev.vars*
!.dev.vars.example
```

### Migration Creation Command

```bash
# Create a new migration
wrangler d1 migrations create DB initial_schema

# Apply migrations locally
wrangler d1 migrations apply DB --local

# Apply migrations to remote (production)
wrangler d1 migrations apply DB --remote
```

### Clean wrangler.jsonc (Post Phase 1-3 Cleanup)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "devhub",
  "compatibility_date": "2025-10-10",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./workers/app.ts",
  "upload_source_maps": true,
  "observability": { "enabled": true },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "devhub-database",
      "database_id": "",
      "migrations_dir": "migrations"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "CACHE_KV",
      "id": ""
    }
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `wrangler d1 execute --file=schema.sql` | D1 migrations with `wrangler d1 migrations apply` | Wrangler 3.x+ | Versioned, trackable schema changes |
| Hardcode resource IDs in config | Empty IDs with Deploy Button auto-provisioning | 2025 Deploy Button update | Zero-config for end users |
| Secrets documented in README only | `.dev.vars.example` auto-detected by Deploy Button | July 2025 changelog | Users see secrets in deployment UI |
| Manual `wrangler deploy` only | `wrangler deploy` with autoconfig (4.68+, Feb 2026) | Feb 2026 | Auto-detects framework, installs adapters |

**Deprecated/outdated:**
- `deploy.json` file: Not used by Cloudflare Workers Deploy Button. The button reads `wrangler.jsonc`/`wrangler.toml` and `package.json` directly.
- `wrangler.toml` for new projects: `wrangler.jsonc` is preferred (project already uses this).

## Open Questions

1. **Migration auto-apply during Deploy Button execution**
   - What we know: Deploy Button runs the `deploy` script from package.json. If that script includes migration application, it should work.
   - What's unclear: Whether the D1 database is fully provisioned and bound by the time the deploy script runs migration commands.
   - Recommendation: Include migrations in the deploy script. If timing issues arise, provide a separate `npm run db:migrate` command as fallback, documented in README.

2. **R2 ASSETS_BUCKET necessity**
   - What we know: The R2 bucket serves tool icons via `/assets/*` route. Phase 1 removes `CF_ALL_LOG` bucket.
   - What's unclear: Whether tool icons should be stored in R2 (requiring bucket) or served from external URLs only (no bucket needed).
   - Recommendation: Make ASSETS_BUCKET optional. If present, enable uploads. If absent, gracefully skip upload functionality. This reduces Deploy Button resource requirements.

3. **Wrangler version compatibility**
   - What we know: Project uses wrangler 4.21.x. Latest is 4.68+ with autoconfig.
   - What's unclear: Whether Deploy Button uses the project's wrangler version or Cloudflare's server-side version.
   - Recommendation: Keep current wrangler version in package.json. Deploy Button runs builds server-side with its own tooling. The project's wrangler is for local development.

## Sources

### Primary (HIGH confidence)
- [Deploy to Cloudflare buttons - Official docs](https://developers.cloudflare.com/workers/platform/deploy-buttons/) - Button URL format, resource auto-provisioning, configuration requirements
- [D1 Migrations - Official docs](https://developers.cloudflare.com/d1/reference/migrations/) - Migration directory structure, apply commands, wrangler.jsonc configuration
- [Deploy Button supports env vars & secrets - Changelog](https://developers.cloudflare.com/changelog/post/2025-07-01-workers-deploy-button-supports-environment-variables-and-secrets/) - `.dev.vars.example` detection, secret presentation during deployment
- [Wrangler autoconfig GA - Changelog](https://developers.cloudflare.com/changelog/post/2026-02-25-wrangler-autoconfig-ga/) - Automatic resource provisioning behavior

### Secondary (MEDIUM confidence)
- [Wrangler Configuration docs](https://developers.cloudflare.com/workers/wrangler/configuration/) - Binding configuration format, migrations_dir option
- Existing `.planning/research/STACK.md` - Deploy Button section with binding configuration patterns
- Existing `.planning/research/PITFALLS.md` - Pitfalls 4 and 6 (D1 migrations and resource provisioning)

### Tertiary (LOW confidence)
- [Community: Deploy Button resource provisioning](https://community.cloudflare.com/t/deploy-to-cloudflare-button-not-provisioning-resources-correctly/854128) - Edge cases in provisioning timing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Cloudflare documentation directly covers Deploy Button, D1 migrations, and wrangler configuration
- Architecture: HIGH - Patterns are well-documented convention (wrangler.jsonc bindings + migrations/ directory + .dev.vars.example)
- Pitfalls: HIGH - Verified against existing PITFALLS.md research (Pitfalls 4 and 6) and official docs

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable Cloudflare platform features)
