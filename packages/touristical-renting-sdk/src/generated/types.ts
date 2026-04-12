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
}

export type HostListing = Listing & {
  _count?: {
    bookings?: number
  }
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

export interface ApiError {
  error: {
    code: string
    message: string
  /** Per-field validation errors */
    fields?: Record<string, string>
  }
}
