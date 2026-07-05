import { z } from 'zod'

export const CreateBookingSchema = z.object({
  listingId: z.string().min(1),
  checkIn: z.string().date('Must be a valid date (YYYY-MM-DD)'),
  checkOut: z.string().date('Must be a valid date (YYYY-MM-DD)'),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { message: 'Check-out must be after check-in', path: ['checkOut'] },
)

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>
