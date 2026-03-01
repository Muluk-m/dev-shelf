# Roadmap: DevHub Open Source Edition

## Overview

Transform the internal DevHub tool management platform into a self-deployable open-source project. The journey follows a clear dependency chain: strip business-specific integrations from the codebase, build a self-contained authentication system to replace Feishu OAuth, layer on role-based access control with first-run admin setup, configure Cloudflare Deploy Button for one-click deployment, document the entire process, and add data portability. The end state: anyone can click one button and have a fully functional developer tool management platform running on Cloudflare Workers.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Codebase Cleanup** - Remove all business-specific integrations, private dependencies, and internal URLs
- [ ] **Phase 2: Authentication** - Build self-contained username/password auth with JWT sessions
- [ ] **Phase 3: User Management & RBAC** - Implement roles, access control, first-run admin setup, and user management
- [ ] **Phase 4: Deployment Configuration** - Configure Cloudflare Deploy Button with auto-provisioning and migrations
- [ ] **Phase 5: Documentation** - Write comprehensive README with deploy, setup, and development instructions
- [ ] **Phase 6: Data Portability** - Enable admin data export for tool portability and backup

## Phase Details

### Phase 1: Codebase Cleanup
**Goal**: The codebase contains no business-specific code, private dependencies, or internal URLs -- it builds and runs as a standalone open-source project
**Depends on**: Nothing (first phase)
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05, CLEAN-06, CLEAN-07, CLEAN-08
**Success Criteria** (what must be TRUE):
  1. Running `pnpm install` succeeds without access to any private NPM registry
  2. Running `pnpm build` produces a working application with zero references to Feishu, DeepClick, qiliangjia.org, or deepclick.com
  3. The wrangler.jsonc file contains no hardcoded database IDs, KV namespace IDs, or business-specific secrets
  4. No Feishu OAuth routes, DeepClick login modules, or business-specific tool routes exist in the codebase
  5. The application starts and serves the tool dashboard (without auth -- that comes in Phase 2)
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Remove Feishu OAuth auth system and business backend routes
- [x] 01-02-PLAN.md -- Remove business frontend routes, components, libs, and private package
- [x] 01-03-PLAN.md -- Clean config files, database schema, and final build verification

### Phase 2: Authentication
**Goal**: Users can create accounts and securely log in with username/password, with sessions persisted via JWT cookies
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07
**Success Criteria** (what must be TRUE):
  1. User can register a new account with username and password, and the password is stored as a PBKDF2-SHA256 hash (never plaintext)
  2. User can log in with correct credentials and receives a JWT session cookie that persists across browser sessions
  3. User can log out from any page in the application and the session is invalidated
  4. User can change their own password from a personal settings page
  5. User can update their display name from the personal settings page
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md -- Backend auth: D1 migration, PBKDF2 password hashing, user DB operations, auth API (register/login/logout/me), JWT middleware
- [ ] 02-02-PLAN.md -- Frontend auth: login/register/settings pages, updated stores/types, user profile component

### Phase 3: User Management & RBAC
**Goal**: The system enforces role-based access control and provides a zero-config first-run experience for creating the initial admin
**Depends on**: Phase 2
**Requirements**: USER-01, USER-02, USER-03, USER-04, USER-05, USER-06
**Success Criteria** (what must be TRUE):
  1. On first deployment with an empty database, the application presents a setup wizard that creates the initial admin account
  2. Admin users can create, edit, and delete tools; non-admin users cannot access these operations
  3. Non-admin users can browse tools, use favorites, and manage their own preferences
  4. Admin users can reset passwords for other users
  5. The D1 database contains a users table with username, password_hash, role, and created_at columns
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md -- Backend RBAC middleware, first-run setup API, admin user management API, protect tool/category endpoints
- [ ] 03-02-PLAN.md -- Frontend setup wizard, admin user management page, update ProtectedRoute and permissions for simplified role model

### Phase 4: Deployment Configuration
**Goal**: The project can be deployed to Cloudflare Workers via a single Deploy Button click with zero manual configuration
**Depends on**: Phase 3
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05
**Success Criteria** (what must be TRUE):
  1. Clicking the Cloudflare Deploy Button in the GitHub repo creates a working deployment with D1 database and KV namespace auto-provisioned
  2. The database schema (including users, tools, categories, environments, tags tables) is automatically initialized during deployment
  3. A `.dev.vars.example` file documents all required secrets with clear descriptions
  4. The project lives in its own public GitHub repository, independent of the internal version
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md -- Configure deployment infrastructure (wrangler.jsonc, D1 migrations, package.json, .dev.vars.example)
- [ ] 04-02-PLAN.md -- Add Deploy Button to README and create public GitHub repository

### Phase 5: Documentation
**Goal**: A developer or team can deploy and use DevHub by following the README alone, with no external documentation needed
**Depends on**: Phase 4
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04
**Success Criteria** (what must be TRUE):
  1. The README contains a visible Deploy Button badge that links to one-click deployment
  2. The README includes step-by-step manual deployment instructions using wrangler
  3. A developer can set up a local development environment by following the README instructions
  4. All environment variables and configuration options are documented with descriptions and example values
**Plans**: 1 plan

Plans:
- [ ] 05-01-PLAN.md -- Write comprehensive README with deploy button, manual deployment, local dev setup, and env var documentation

### Phase 6: Data Portability
**Goal**: Admin users can export their complete tool data for backup or migration purposes
**Depends on**: Phase 3
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Admin can trigger a full data export from the admin interface and receive a JSON file
  2. The exported JSON includes tools, categories, environments, and tags as a complete, self-contained dataset
**Plans**: 1 plan

Plans:
- [ ] 06-01-PLAN.md -- Backend export endpoint + admin UI export button

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6
Note: Phase 6 depends only on Phase 3 and could execute in parallel with Phases 4-5 if desired.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Codebase Cleanup | 3/3 | Complete | 2026-03-01 |
| 2. Authentication | 0/2 | Planned | - |
| 3. User Management & RBAC | 0/2 | Planned | - |
| 4. Deployment Configuration | 0/2 | Planned | - |
| 5. Documentation | 0/1 | Planned | - |
| 6. Data Portability | 0/1 | Planned | - |
