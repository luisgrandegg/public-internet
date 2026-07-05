import { defineConfig } from '@prisma/config'

// The Prisma CLI does not load .env when a prisma.config.ts is present.
// Load the app's .env so `pnpm db:migrate` / `db:deploy` work out of the box;
// variables already set in the environment (CI, inline overrides) win.
try {
  process.loadEnvFile('.env')
} catch {
  // No .env file (e.g. CI) — environment variables are provided directly.
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // The Prisma CLI (migrate deploy/dev/reset) must talk to Postgres over a
    // DIRECT connection. On pooled platforms (Supabase/Supavisor, pgbouncer)
    // set DIRECT_URL to the non-pooled connection string; the app itself
    // keeps using DATABASE_URL (which may point at the pooler).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
})
