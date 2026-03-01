# DevHub

A self-hosted developer tool management platform. Deploy to Cloudflare Workers with one click.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/qiliangjia/qlj-devhub-homepage)

## Features

- Tool management with categories, tags, and multi-environment links
- Command palette (Cmd/Ctrl+K) for quick navigation
- Role-based access control (admin/user) with first-run setup wizard
- Built-in developer utilities (JSON formatter, Base64 converter, URL parser)
- Light/dark theme support
- Edge-deployed on Cloudflare Workers with D1 database

## Quick Start

Click the **Deploy to Cloudflare** button above for one-click deployment, or deploy manually:

```bash
git clone https://github.com/qiliangjia/qlj-devhub-homepage.git
cd qlj-devhub-homepage
pnpm install
cp .dev.vars.example .dev.vars  # Edit with your secrets
pnpm run dev
```

## Tech Stack

- **Frontend:** React Router v7, shadcn/ui, Tailwind CSS, TypeScript
- **Backend:** Hono on Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite at the edge)
- **Storage:** Cloudflare R2, KV

## License

MIT
