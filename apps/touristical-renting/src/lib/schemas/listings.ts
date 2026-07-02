import { z } from 'zod'

const PROPERTY_TYPES = ['flat', 'house', 'room', 'studio'] as const

export const CreateListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  propertyType: z.enum(PROPERTY_TYPES),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  lat: z.number().default(0),
  lng: z.number().default(0),
  // nightlyRate is sent in euros (float) by the form, stored in cents
  nightlyRate: z.number().positive('Nightly rate must be greater than 0'),
  maxGuests: z.number().int().min(1).max(50),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().int().min(1).max(50),
  photos: z
    .array(z.object({ url: z.string().url('Must be a valid URL'), alt: z.string() }))
    .min(1, 'At least one photo is required'),
})

export type CreateListingInput = z.infer<typeof CreateListingSchema>

export const UpdateListingSchema = CreateListingSchema.partial()

export type UpdateListingInput = z.infer<typeof UpdateListingSchema>

export const ListingsQuerySchema = z
  .object({
    location: z.string().optional(),
    propertyType: z.enum(PROPERTY_TYPES).optional(),
    minPrice: z.coerce.number().int().optional(), // cents
    maxPrice: z.coerce.number().int().optional(), // cents
    checkIn: z.string().date('Must be a valid date (YYYY-MM-DD)').optional(),
    checkOut: z.string().date('Must be a valid date (YYYY-MM-DD)').optional(),
    guests: z.coerce.number().int().min(1, 'Guests must be at least 1').optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .superRefine((data, ctx) => {
    // A date-range search needs both ends of the range
    if (data.checkIn && !data.checkOut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'checkOut is required when checkIn is provided',
        path: ['checkOut'],
      })
    }
    if (data.checkOut && !data.checkIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'checkIn is required when checkOut is provided',
        path: ['checkIn'],
      })
    }
    if (data.checkIn && data.checkOut && new Date(data.checkIn) >= new Date(data.checkOut)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Check-out must be after check-in',
        path: ['checkOut'],
      })
    }
  })

export type ListingsQuery = z.infer<typeof ListingsQuerySchema>
