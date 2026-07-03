import { z } from 'zod'

export const CreateAvailabilityBlockSchema = z
  .object({
    startDate: z.string().date('Must be a valid date (YYYY-MM-DD)'),
    endDate: z.string().date('Must be a valid date (YYYY-MM-DD)'),
    reason: z.string().max(200, 'Reason must be 200 characters or fewer').optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

export type CreateAvailabilityBlockInput = z.infer<typeof CreateAvailabilityBlockSchema>
