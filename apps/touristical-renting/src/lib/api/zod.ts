import type { z } from 'zod'

/**
 * Flatten a Zod v4 ZodError into a simple { field: message } map.
 * Nested paths are joined with dots: "location.city" → "location.city".
 */
export function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    if (!result[key]) {
      result[key] = issue.message
    }
  }
  return result
}
