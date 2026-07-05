import { z } from 'zod'

export const CreateRestaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  lat: z.coerce.number().default(0),
  lng: z.coerce.number().default(0),
  phone: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  imageUrl: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val))
    .refine(
      (val) => val === undefined || /^https?:\/\//.test(val),
      'Image URL must start with http:// or https://',
    ),
})

export type CreateRestaurantInput = z.infer<typeof CreateRestaurantSchema>

export const UpdateRestaurantSchema = CreateRestaurantSchema.partial().extend({
  isActive: z.boolean().optional(),
  // Nullable optional fields: '' (and explicit null) clears the stored value —
  // Prisma writes NULL. A key absent from the payload stays undefined, which
  // Prisma ignores (the field is left unchanged).
  phone: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  imageUrl: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val))
    .refine(
      (val) => val == null || /^https?:\/\//.test(val),
      'Image URL must start with http:// or https://',
    ),
})

export type UpdateRestaurantInput = z.infer<typeof UpdateRestaurantSchema>

export const RestaurantsQuerySchema = z.object({
  city: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  q: z
    .string()
    .max(200)
    .optional()
    .transform((val) => (val?.trim() === '' ? undefined : val?.trim())),
  category: z
    .string()
    .max(120)
    .optional()
    .transform((val) => (val?.trim() === '' ? undefined : val?.trim())),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type RestaurantsQuery = z.infer<typeof RestaurantsQuerySchema>
