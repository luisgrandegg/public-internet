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
    //
    // DATABASE_URL_UNPOOLED and POSTGRES_URL_NON_POOLING are the names the
    // Neon and Vercel Postgres integrations inject on their own, so a node
    // deployed with the Vercel deploy button (VERCEL.md) migrates against a
    // direct connection without the operator copying a second string by hand.
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL,
  },
})
