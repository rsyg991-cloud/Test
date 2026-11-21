# Deploying Balbal (Vercel + Neon)

Balbal is a standard Next.js app with a Postgres database (Prisma). The recommended setup is **Vercel** for hosting and **Neon** for Postgres — both have free plans.

## First deployment (about 5 minutes)

1. **Import the repository** — go to <https://vercel.com/new>, pick the `rsyg991-cloud/Test` GitHub repository and click **Import**. Vercel detects Next.js; the build settings come from `vercel.json` (`scripts/vercel-build.mjs`: database migrations, then `next build`). Don't deploy yet if it offers — or let it fail once, that's fine.
2. **Add the database** — in the new project open **Storage → Create Database → Neon** (free plan), and connect it to the project for all environments. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` automatically; you never need to copy the password.
3. **Optional environment variables** (Project → Settings → Environment Variables):
   - `AI_DAILY_LIMIT` = `30`
   - `N8N_EVAL_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET` — once your n8n workflow is ready (see [n8n.md](n8n.md)). Without them, Writing/Speaking feedback uses the clearly-labelled offline demo evaluator.
4. **Deploy** — Deployments → **Redeploy** (or push any commit). The build runs the database migrations, then builds the site. Your site is live at `https://<project>.vercel.app`.

From then on, **every push to the repository's default branch deploys automatically**; other branches get preview URLs.

## Notes

- **Production branch**: Vercel uses the repository's default branch. Change it under Project → Settings → Git if needed.
- **Function time limit**: the free plan stops functions after 60 s, so AI evaluation (`/api/evaluate`) is capped at 60 s and the n8n webhook at 55 s. Keep the n8n workflow fast (a quick model, no long chains).
- **Demo account**: the seed script (`demo@balbal.app`) is for local development only. Don't run it against production — the password is public.
- **Licensed IELTS tests**: keep them out of the repository (see [licensed-tests.md](licensed-tests.md)). On Vercel, host the JSON + audio privately and point `MOCK_TESTS_DIR` / `MOCK_ASSETS_BASE_URL` at them, or add a private build step.
- **Local development**: any Postgres works. Set both `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in `.env`, then `npm run setup && npm run dev`.

## Troubleshooting

**`✗ No database connection found` / `Environment variable not found: DATABASE_URL_UNPOOLED`**
The build can't see a database. This happens when the first deployment starts before the database is added (Vercel deploys right after the import).
1. Project → **Storage** → create or connect a **Neon** database.
2. In the connect dialog, tick **Production** (and **Preview** if you want preview deployments) and leave the **environment variable prefix empty**.
3. **Deployments → ⋯ → Redeploy**.

The build accepts `DATABASE_URL` / `DATABASE_URL_UNPOOLED` (Neon) as well as `POSTGRES_PRISMA_URL` / `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING`. If you connected the database with a custom prefix (e.g. `STORAGE_URL`), add a `DATABASE_URL` variable with the same value under Settings → Environment Variables. The build log lists the database-related variable *names* it can see (never their values).

**`P1001: Can't reach database server`** — the database is paused or the URL is wrong. Open the Neon dashboard to wake it, check the variables, and redeploy.
