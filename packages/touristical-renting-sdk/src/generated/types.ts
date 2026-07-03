// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate

/** Type of rental property */
export type PropertyType = 'flat' | 'house' | 'room' | 'studio'

export interface PhotoInput {
  /** Publicly accessible photo URL */
  url: string
  /** Accessible alt text */
  alt?: string
}

export interface Photo {
  id: string
  url: string
  alt: string
  listingId: string
}

export interface HostSummary {
  id: string
  name: string
  image?: string | null
}

export type HostSummaryWithCreatedAt = HostSummary & {
  createdAt?: string
}

export interface GuestSummary {
  id: string
  name: string
  email: string
}

export interface ListingSummary {
  id: string
  title: string
  /** Nightly rate in cents */
  nightlyRate: number
}

export interface Listing {
  id: string
  title: string
  description: string
  propertyType: PropertyType
  city: string
  country: string
  lat: number
  lng: number
  /** Nightly rate in cents. Display as (nightlyRate / 100).toFixed(2) */
  nightlyRate: number
  maxGuests: number
  bedrooms: number
  bathrooms: number
  hostId: string
  photos: Array<Photo>
  host: HostSummary
  createdAt: string
  updatedAt: string
  /** Average rating (1–5) across published reviews. Null when the listing has no published reviews. Present on list responses (listings_list). */
  rating?: number | null
  /** Number of published reviews. Present on list responses (listings_list). */
  reviewCount?: number
}

export type HostListing = Listing & {
  _count?: {
    bookings?: number
  }
}

/** Payment settlement status (ADR-006). Offline payments are created SUCCEEDED; online payments start PENDING and are confirmed by the provider's webhook. */
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED'

/** Payment record accompanying every booking (ADR-006). provider is the PaymentProvider id (e.g. 'stripe') for payments settled online via the provider's hosted checkout, or 'offline' when settled directly with the host (pay at the property). */
export interface Payment {
  id: string
  bookingId: string
  /** PaymentProvider id ('stripe', a custom id, …) or 'offline' */
  provider: string
  status: PaymentStatus
  /** Amount in cents — exactly the pre-confirmation total. Never recomputed. */
  amount: number
  currency: string
  /** The provider's hosted checkout session id */
  providerSessionId?: string | null
  /** The provider's settlement reference (e.g. a Stripe payment intent id), set when the payment succeeds */
  providerPaymentReference?: string | null
  /** Hosted checkout URL stored at creation so a pending payment can be resumed */
  providerCheckoutUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  listingId: string
  guestId: string
  checkIn: string
  checkOut: string
  /** Total booking cost in cents */
  totalCost: number
  createdAt: string
  updatedAt: string
  listing: ListingSummary & {
    photos?: Array<Photo>
  }
  guest: GuestSummary
  /** The 1:1 payment record for this booking (ADR-006). */
  payment?: Payment | null
}

/** Response of bookings_create: the booking plus its payment record. checkoutUrl is the configured payment provider's hosted checkout URL to redirect the guest to, or null (offline settlement). */
export type BookingCreated = Booking & {
  checkoutUrl: string | null
}

export interface CreateListingInput {
  title: string
  description: string
  propertyType: PropertyType
  city: string
  country: string
  lat?: number
  lng?: number
  /** Nightly rate in euros (float). Service converts to cents. */
  nightlyRate: number
  maxGuests: number
  bedrooms: number
  bathrooms: number
  photos: Array<PhotoInput>
}

/** All fields are optional. Only provided fields are updated. */
export interface UpdateListingInput {
  title?: string
  description?: string
  propertyType?: PropertyType
  city?: string
  country?: string
  lat?: number
  lng?: number
  /** Nightly rate in euros (float). */
  nightlyRate?: number
  maxGuests?: number
  bedrooms?: number
  bathrooms?: number
  photos?: Array<PhotoInput>
}

/** Response of bookings_pay: a live hosted-checkout URL for the booking's pending online payment. The session is resumed when still open, or freshly created when the stored one expired. */
export interface BookingPaymentResume {
  /** The payment provider's hosted checkout URL to redirect the guest to */
  checkoutUrl: string
}

export interface CreateBookingInput {
  listingId: string
  /** ISO date YYYY-MM-DD */
  checkIn: string
  /** ISO date YYYY-MM-DD. Must be after checkIn. */
  checkOut: string
}

export interface PaginatedListings {
  listings: Array<Listing>
  total: number
  page: number
  limit: number
}

export interface UserProfile {
  id: string
  name: string
  email: string
  image?: string | null
  isHost: boolean
  createdAt: string
}

export interface UserProfileSummary {
  id: string
  name: string
  email: string
  image?: string | null
  isHost: boolean
}

/** All fields are optional. Only provided fields are updated. */
export interface UpdateProfileInput {
  name?: string
  /** Public avatar URL */
  image?: string
}

export interface UserDataExport {
  user: UserProfile
  listings: Array<Listing>
  bookings: Array<Booking>
}

export interface Enquiry {
  id: string
  listingId: string
  guestId: string
  hostId: string
  message: string
  reply?: string | null
  createdAt: string
  repliedAt?: string | null
}

/** An enquiry as seen by the guest who sent it, including the listing it concerns. reply and repliedAt are null until the host replies. */
export type GuestEnquiry = Enquiry & {
  listing: {
    id: string
    title: string
  }
}

export interface Review {
  id: string
  bookingId: string
  listingId: string
  authorId: string
  targetId: string
  targetRole: 'guest' | 'host'
  rating: number
  body: string
  submittedAt: string
  publishedAt?: string | null
}

export interface CreateReviewInput {
  targetId: string
  targetRole: 'guest' | 'host'
  rating: number
  body: string
}

export interface AvailabilityBlock {
  id: string
  listingId: string
  /** First blocked day (inclusive) */
  startDate: string
  /** First available day after the block (exclusive) */
  endDate: string
  /** Optional host-facing note, e.g. "Personal use" */
  reason?: string | null
  createdAt: string
}

export interface CreateAvailabilityBlockInput {
  /** ISO date YYYY-MM-DD — first blocked day (inclusive) */
  startDate: string
  /** ISO date YYYY-MM-DD — first available day after the block (exclusive). Must be after startDate. */
  endDate: string
  /** Optional host-facing note */
  reason?: string
}

export interface FavoriteStatus {
  listingId: string
  favorited: boolean
}

export interface ApiError {
  error: {
    code: string
    message: string
  /** Per-field validation errors */
    fields?: Record<string, string>
  }
}
