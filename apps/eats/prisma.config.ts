import { defineConfig } from '@prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Prisma CLI (migrations) uses a direct connection — bypasses pgBouncer on Neon.
    // Runtime PrismaClient in src/lib/db.ts continues to read DATABASE_URL (pooled).
    // Fall back to DATABASE_URL so local/CI (no pooler) keep working unchanged.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
})
