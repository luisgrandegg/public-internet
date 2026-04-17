import { z } from 'zod'

export const OrderItemInputSchema = z.object({
  menuItemId: z.string().min(1, 'menuItemId is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(50),
})

export const CreateOrderSchema = z.object({
  restaurantId: z.string().min(1, 'restaurantId is required'),
  items: z.array(OrderItemInputSchema).min(1, 'At least one item is required'),
  deliveryAddress: z.string().min(5, 'Delivery address must be at least 5 characters'),
  notes: z
    .string()
    .max(500)
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
