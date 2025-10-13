<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts the React Router front end; `app/routes/` keeps loaders and screens, `app/components/` shares UI, and `app/lib/` stores client helpers plus the internal tool registry.
- `workers/` contains the Hono worker; place REST handlers in `workers/routes/` and cross-cutting logic in `workers/middleware/`.
- `lib/` exposes shared database accessors and types used by both app loaders and worker routes.
- `db/` keeps schema and seed SQL, `public/` serves static assets, and root configs (`react-router.config.ts`, `wrangler.jsonc`, `tsconfig*.json`) define build targets.

## Build, Test, and Development Commands
- `pnpm install` to sync dependencies; stay on pnpm to maintain the `pnpm-lock.yaml`.
- `pnpm dev` launches the full-stack dev server with hot reload.
- `pnpm lint` / `pnpm lint:fix` run Biome; execute before every commit.
- `pnpm typecheck` generates Cloudflare bindings, React Router matchers, and project-wide type checks.
- `pnpm build` compiles production assets, `pnpm preview` serves them locally, `pnpm deploy` ships the bundle through Wrangler.
- `pnpm cf-typegen` refreshes Worker types after changing environment bindings.

## Coding Style & Naming Conventions
- TypeScript everywhere, ES modules only, and keep exports typed.
- Follow Biome defaults: tab indentation, double quotes, sorted imports; rely on `pnpm lint:fix` for formatting.
- React components export PascalCase symbols while files stay in `kebab-case.tsx`; hooks begin with `use` and live under `app/hooks/`.
- Tailwind utilities should remain purposeful; factor repeated stacks into shared components.

## Testing Guidelines
- No automated tests yet; guard regressions with `pnpm typecheck`, targeted manual QA via `pnpm dev`, and review console output.
- When introducing tests, colocate `.test.ts(x)` files or use `__tests__` folders and wire the runner into `package.json` so CI can discover it.
- For worker code, prefer request-response tests that stub the Cloudflare context and load seed data from `db/seed.sql`.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes (`feat`, `feat(scope)`, `docs`, etc.) with imperative subjects under 72 characters.
- PRs must describe intent, link tracking issues, list manual checks (`pnpm dev`, `pnpm lint`, `pnpm typecheck`), and include UI screenshots for visible changes.
- Route reviews to the owning area (`frontend`, `workers`, `db`) and wait for approval before merging.

## Security & Configuration Tips
- Keep secrets out of git; configure D1 and OAuth credentials via Wrangler or ignored `.env` files.
- After editing bindings, run `pnpm cf-typegen` and confirm updates in `worker-configuration.d.ts`.
