import { NextResponse } from 'next/server'

type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'

interface ErrorBody {
  code: ErrorCode
  message: string
  fields?: Record<string, string>
}

export function ok<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 200 })
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 })
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export function errorResponse(status: number, body: ErrorBody): NextResponse {
  return NextResponse.json({ error: body }, { status })
}

export function unauthorized(message = 'Sign in required'): NextResponse {
  return errorResponse(401, { code: 'UNAUTHORIZED', message })
}

export function forbidden(message = 'Access denied'): NextResponse {
  return errorResponse(403, { code: 'FORBIDDEN', message })
}

export function notFound(message = 'Not found'): NextResponse {
  return errorResponse(404, { code: 'NOT_FOUND', message })
}

export function conflict(message = 'Already exists'): NextResponse {
  return errorResponse(409, { code: 'CONFLICT', message })
}

export function validationError(fields: Record<string, string>, message = 'Validation failed'): NextResponse {
  return errorResponse(422, { code: 'VALIDATION_ERROR', message, fields })
}

export function internalError(message = 'Internal server error'): NextResponse {
  return errorResponse(500, { code: 'INTERNAL_ERROR', message })
}
