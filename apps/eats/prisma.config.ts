import { defineConfig } from '@prisma/config'

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
