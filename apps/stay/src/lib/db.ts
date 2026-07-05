import { Prisma, PrismaClient } from '@/__generated__/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
export const db = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Run `fn` inside a SERIALIZABLE transaction, retrying when PostgreSQL aborts
 * it with a serialization failure (Prisma error P2034).
 *
 * Read-then-write guards (e.g. "no overlapping booking exists → create the
 * booking") are only race-free when the check and the write run in the same
 * serializable transaction: of two racing transactions the database commits
 * one and aborts the other, which is retried here and then re-runs the check
 * against the winner's committed row — surfacing the normal conflict error
 * instead of double-booking.
 */
export async function serializableTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await db.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      const isSerializationFailure =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error as Prisma.PrismaClientKnownRequestError).code === 'P2034'
      if (!isSerializationFailure || attempt >= maxAttempts) throw error
    }
  }
}
