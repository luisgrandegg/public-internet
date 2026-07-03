// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate

/** Lifecycle status of an order */
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'IN_DELIVERY' | 'DELIVERED' | 'CANCELLED'

/** Lifecycle status of a delivery */
export type DeliveryStatus = 'UNASSIGNED' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'FAILED'

export interface RestaurantSummary {
  id: string
  name: string
  city: string
  imageUrl?: string | null
}

export interface Restaurant {
  id: string
  name: string
  description: string
  address: string
  city: string
  country: string
  lat: number
  lng: number
  phone?: string | null
  imageUrl?: string | null
  isActive: boolean
  ownerId: string
  /** Average review rating (1–5) rounded to one decimal, or null when the restaurant has no reviews */
  avgRating?: number | null
  /** Number of verified-order reviews for this restaurant */
  reviewCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateRestaurantInput {
  name: string
  description: string
  address: string
  city: string
  country: string
  lat?: number
  lng?: number
  phone?: string
  imageUrl?: string
}

/** All fields are optional. Only provided fields are updated. */
export interface UpdateRestaurantInput {
  name?: string
  description?: string
  address?: string
  city?: string
  country?: string
  lat?: number
  lng?: number
  phone?: string
  imageUrl?: string
  isActive?: boolean
}

export interface MenuItem {
  id: string
  name: string
  description: string
  /** Price in cents. Display as (price / 100).toFixed(2) */
  price: number
  category: string
  isAvailable: boolean
  restaurantId: string
  createdAt: string
  updatedAt: string
}

export interface CreateMenuItemInput {
  name: string
  description: string
  /** Price in euros (float). Service converts to cents. */
  price: number
  category: string
}

/** All fields are optional. Only provided fields are updated. */
export interface UpdateMenuItemInput {
  name?: string
  description?: string
  /** Price in euros (float). */
  price?: number
  category?: string
  isAvailable?: boolean
}

export interface OrderItemInput {
  menuItemId: string
  quantity: number
}

export interface OrderItem {
  id: string
  orderId: string
  menuItemId: string
  /** Menu item name snapshotted at order time */
  nameSnapshot?: string | null
  quantity: number
  /** Unit price in cents, snapshotted at order time */
  unitPrice: number
}

export interface Order {
  id: string
  status: OrderStatus
  customerId: string
  restaurantId: string
  restaurant?: RestaurantSummary
  items: Array<OrderItem>
  /** Delivery record for the order, when one exists */
  delivery?: Delivery | null
  /** Sum of all item costs in cents */
  itemsCost: number
  /** Flat infrastructure fee in cents — transparent and published. Not a commission. */
  infrastructureFee: number
  /** Total cost in cents = itemsCost + infrastructureFee. Complete price — no hidden fees. */
  totalCost: number
  deliveryAddress: string
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateOrderInput {
  restaurantId: string
  items: Array<OrderItemInput>
  deliveryAddress: string
  notes?: string
}

export interface Delivery {
  id: string
  orderId: string
  courierId?: string | null
  status: DeliveryStatus
  /** Base pay in cents — flat per-delivery amount shown to courier before accepting */
  basePay: number
  /** Distance pay in cents — per-km rate × estimated km shown to courier before accepting */
  distancePay: number
  pickedUpAt?: string | null
  deliveredAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface MenuCategories {
  /** Distinct categories of available menu items across active restaurants, sorted alphabetically */
  categories: Array<string>
}

export interface Review {
  id: string
  /** The delivered order this review belongs to — one review per order */
  orderId: string
  restaurantId: string
  authorId: string
  /** The reviewing customer */
  author?: {
    name: string
  }
  /** Star rating from 1 to 5 */
  rating: number
  /** Optional free-text feedback — empty string when the customer left none */
  body: string
  createdAt: string
}

export interface CreateReviewInput {
  /** Star rating from 1 to 5 */
  rating: number
  /** Optional free-text feedback */
  body?: string
}

export interface PaginatedReviews {
  reviews: Array<Review>
  total: number
  page: number
  limit: number
}

export interface PaginatedRestaurants {
  restaurants: Array<Restaurant>
  total: number
  page: number
  limit: number
}

export interface ApiError {
  error: {
    code: string
    message: string
  /** Per-field validation errors */
    fields?: Record<string, string>
  }
}
