import { z } from 'zod'

export const CreateMenuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().min(5, 'Description must be at least 5 characters').max(500),
  // Sent in euros (float); converted to cents at the service layer.
  price: z.coerce.number().positive('Price must be greater than 0'),
  category: z.string().min(1, 'Category is required').max(60),
})

export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>

export const UpdateMenuItemSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().min(5).max(500).optional(),
  price: z.coerce.number().positive().optional(),
  category: z.string().min(1).max(60).optional(),
  isAvailable: z.boolean().optional(),
})

export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>
