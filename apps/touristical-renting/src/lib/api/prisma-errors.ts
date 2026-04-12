import { Prisma } from '@prisma/client'
import { conflict, notFound } from './response'
import type { NextResponse } from 'next/server'

/**
 * Map Prisma known request errors to appropriate HTTP responses.
 * Returns null if the error is not a known Prisma error (let the caller handle it).
 */
export function handlePrismaError(error: unknown): NextResponse | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return conflict('A record with this value already exists')
      case 'P2025':
        return notFound('Record not found')
      default:
        return null
    }
  }
  return null
}
