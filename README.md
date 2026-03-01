# DevHub

A self-hosted developer tool management platform, deployed on Cloudflare Workers.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/qiliangjia/qlj-devhub-homepage)

## Features

- **Tool management** -- Full CRUD with categories, tags, and status tracking
- **Multi-environment support** -- Dev, Test, and Prod URLs per tool
- **Command palette** -- Cmd/Ctrl+K for keyboard-first navigation
- **Built-in utilities** -- JSON formatter, Base64 encoder, URL parser, and more
- **Role-based access control** -- Admin and User roles with protected operations
- **First-run setup wizard** -- Zero-config initial deployment creates admin account automatically
- **Light/dark theme** -- System-aware theme switching
- **Responsive design** -- Works on desktop and mobile
- **Edge-deployed** -- Runs on Cloudflare Workers with D1 database for low-latency worldwide

## Quick Start: One-Click Deploy

The fastest way to get DevHub running is the Cloudflare Deploy Button. It automatically provisions a Cloudflare Workers application, a D1 database, and a KV namespace.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/qiliangjia/qlj-devhub-homepage)

**After deployment:**

1. Visit your deployed URL (shown in the Cloudflare dashboard after deploy completes)
2. The first-run setup wizard will appear -- create your admin account
3. Log in and start managing your development tools

**Note:** You may need to set the JWT secret for authentication to work:

```bash
wrangler secret put JWT_SECRET
```

When prompted, enter a strong random string. You can generate one with:

```bash
openssl rand -hex 32
```

## Manual Deployment

If you prefer to deploy manually using the Wrangler CLI, follow these steps.

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/installation)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/): `npm install -g wrangler`

### Steps

1. **Clone the repository**

```bash
git clone https://github.com/qiliangjia/qlj-devhub-homepage.git
cd qlj-devhub-homepage
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Authenticate with Cloudflare**

```bash
wrangler login
```

4. **Create the D1 database**

```bash
wrangler d1 create devhub-database
```

Copy the `database_id` from the output and update the `d1_databases` section in `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "devhub-database",
    "database_id": "<your-database-id>",
    "migrations_dir": "migrations"
  }
]
```

5. **Apply database migrations**

```bash
wrangler d1 migrations apply DB --remote
```

This creates all tables (tools, users, categories, environments, tags) and seeds default categories.

6. **Set the JWT secret**

```bash
wrangler secret put JWT_SECRET
```

Enter a strong random string when prompted (generate one with `openssl rand -hex 32`).

7. **Deploy**

```bash
pnpm run deploy
```

This builds the application and deploys it to Cloudflare Workers. The deploy script also applies any pending D1 migrations automatically.

8. **Visit your deployment** and complete the first-run setup wizard to create your admin account.

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/installation) (v10+)

### Setup

1. **Clone and install**

```bash
git clone https://github.com/qiliangjia/qlj-devhub-homepage.git
cd qlj-devhub-homepage
pnpm install
```

2. **Configure environment variables**

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set your JWT secret:

```
JWT_SECRET=any-local-dev-secret
```

3. **Set up the local database**

```bash
pnpm run db:migrate:local
```

This applies all D1 migrations to a local SQLite database used by the Wrangler dev server.

4. **Start the development server**

```bash
pnpm run dev
```

5. **Open** [http://localhost:5173](http://localhost:5173) in your browser. The first-run setup wizard will guide you through creating an admin account.

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start development server with hot reload |
| `pnpm run build` | Build for production |
| `pnpm run preview` | Preview production build locally |
| `pnpm run deploy` | Build, apply migrations, and deploy to Cloudflare Workers |
| `pnpm run typecheck` | Generate types and run TypeScript compiler |
| `pnpm run lint` | Run Biome linter to check code quality |
| `pnpm run lint:fix` | Run Biome linter and auto-fix issues |
| `pnpm run cf-typegen` | Generate Cloudflare D1 binding types |
| `pnpm run db:migrate` | Apply D1 migrations to remote database |
| `pnpm run db:migrate:local` | Apply D1 migrations to local database |

## Environment Variables

DevHub uses two types of configuration: **vars** (non-sensitive, set in `wrangler.jsonc`) and **secrets** (sensitive, set via `wrangler secret put`).

### Secrets

Set these using `wrangler secret put <NAME>` for production, or in `.dev.vars` for local development. See [`.dev.vars.example`](.dev.vars.example) for a template.

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `JWT_SECRET` | Secret key for signing JWT authentication tokens. Generate with `openssl rand -hex 32`. | Yes | `a1b2c3d4e5f6...` |

### Vars

These are configured in `wrangler.jsonc` under the `vars` section.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `API_BASE_URL` | Public URL of the deployed application. Used for API requests. Leave empty for auto-detection. | No | `""` (empty) |

### Cloudflare Bindings

These are automatically provisioned when using the Deploy Button, or must be created manually for manual deployments.

| Binding | Type | Description |
|---------|------|-------------|
| `DB` | D1 Database | Application database for tools, users, categories, and preferences |
| `CACHE_KV` | KV Namespace | Cache storage for API responses (improves performance) |
| `ASSETS_BUCKET` | R2 Bucket | Storage for uploaded assets (tool icons, etc.) |

## Tech Stack

- **Frontend:** [React](https://react.dev/) 19, [React Router](https://reactrouter.com/) 7, [Tailwind CSS](https://tailwindcss.com/) 4, [shadcn/ui](https://ui.shadcn.com/)
- **Backend:** [Hono](https://hono.dev/) on [Cloudflare Workers](https://workers.cloudflare.com/)
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite at the edge)
- **Storage:** [Cloudflare R2](https://developers.cloudflare.com/r2/), [Cloudflare KV](https://developers.cloudflare.com/kv/)
- **Language:** [TypeScript](https://www.typescriptlang.org/) 5.8
- **Package Manager:** [pnpm](https://pnpm.io/) 10
- **Linting:** [Biome](https://biomejs.dev/)

## Project Structure

```
qlj-devhub-homepage/
├── app/                    # Frontend (React Router v7)
│   ├── components/         # UI components (shadcn/ui, layout, admin)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Client utilities and API helpers
│   ├── routes/             # Page routes (home, admin, tools, auth)
│   ├── stores/             # Zustand state management
│   ├── types/              # TypeScript type definitions
│   ├── root.tsx            # Root component with providers
│   └── routes.ts           # Route definitions
├── workers/                # Backend (Hono API)
│   ├── middleware/          # Auth and RBAC middleware
│   ├── routes/             # API route handlers
│   └── app.ts              # Hono application entry point
├── lib/                    # Shared code
│   └── database/           # D1 database operations
├── migrations/             # D1 database migrations
│   └── 0001_initial_schema.sql
├── public/                 # Static assets
├── wrangler.jsonc          # Cloudflare Workers configuration
├── package.json            # Dependencies and scripts
└── .dev.vars.example       # Environment variable template
```

## License

MIT
