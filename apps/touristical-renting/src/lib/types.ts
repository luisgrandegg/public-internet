export type PropertyType = 'flat' | 'house' | 'room' | 'studio'

export interface Coordinates { lat: number; lng: number }

export interface Host {
  id: string
  name: string
  avatarUrl: string | null
  memberSince: string
  verifiedHost: boolean
}

export interface Listing {
  id: string
  title: string
  description: string
  propertyType: PropertyType
  location: { city: string; country: string; coordinates: Coordinates }
  host: Host
  photos: Array<{ url: string; alt: string }>
  amenities: string[]
  nightlyRate: number        // complete price — no hidden fees ever
  maxGuests: number
  bedrooms: number
  bathrooms: number
  rating: number | null      // null = no reviews yet
  reviewCount: number
}

export interface ListingFilters {
  location: string
  checkIn: string
  checkOut: string
  guests: string
  propertyType: PropertyType | ''
  minPrice: string
  maxPrice: string
}

export interface CreateListingDraft {
  propertyType: PropertyType | ''
  city: string
  country: string
  title: string
  description: string
  photoUrls: string[]
  nightlyRate: string
  maxGuests: string
  bedrooms: string
  bathrooms: string
}
