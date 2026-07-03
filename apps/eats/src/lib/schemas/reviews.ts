import { z } from 'zod'

export const CreateReviewSchema = z.object({
  rating: z.coerce
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  // Optional free-text feedback — an empty string is fine.
  body: z
    .string()
    .max(2000, 'Review text must be 2000 characters or fewer')
    .optional()
    .default(''),
})

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>

export const ReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export type ReviewsQuery = z.infer<typeof ReviewsQuerySchema>
