/**
 * Production build used by Vercel (see vercel.json).
 * Resolves the database URLs from whichever variables the Postgres integration provides,
 * runs the migrations, then builds Next.js. Prints variable NAMES only, never values.
 */
import { spawnSync } from "node:child_process";

const first = (...names) => names.find((n) => process.env[n] && process.env[n].trim());

const pooledName = first("DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL");
const directName = first("DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_URL");

if (!pooledName) {
  const seen = Object.keys(process.env).filter((k) => /(DATABASE|POSTGRES|PG)/.test(k)).sort();
  console.error(`
✗ No database connection found.

Balbal needs a Postgres database. In your Vercel project:
  1. Open Storage → Create Database → Neon (free) — or connect your existing Neon database.
  2. Make sure it is connected to the "Production" environment (and "Preview" if you use previews).
  3. Leave the environment-variable prefix EMPTY, so the variables are called DATABASE_URL and DATABASE_URL_UNPOOLED.
     (If you used a prefix such as STORAGE_, add DATABASE_URL yourself under Settings → Environment Variables.)
  4. Deployments → Redeploy.

Database-related variable names currently visible to the build: ${seen.length ? seen.join(", ") : "(none)"}
`);
  process.exit(1);
}

const env = {
  ...process.env,
  DATABASE_URL: process.env[pooledName],
  DATABASE_URL_UNPOOLED: process.env[directName],
};
console.log(`Using ${pooledName} for the app and ${directName} for migrations.`);

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", env, shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["next", "build"]);
