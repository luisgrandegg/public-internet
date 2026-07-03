import { headers } from 'next/headers'
import type { ListingFilters, PropertyType } from '@/lib/types'
import { auth } from '@/lib/auth'
import { ListingsClientShell } from './_components/ListingsClientShell'
import { getListings } from '@/lib/services/listings'
import { getFavoritedListingIds } from '@/lib/services/favorites'

interface ListingsPageProps {
  searchParams: Promise<{
    location?: string
    checkIn?: string
    checkOut?: string
    guests?: string
    propertyType?: string
    minPrice?: string
    maxPrice?: string
    page?: string
  }>
}

function isPropertyType(value: string): value is PropertyType {
  return ['flat', 'house', 'room', 'studio'].includes(value)
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams

  const filters: ListingFilters = {
    location: params.location ?? '',
    checkIn: params.checkIn ?? '',
    checkOut: params.checkOut ?? '',
    guests: params.guests ?? '',
    propertyType: params.propertyType && isPropertyType(params.propertyType) ? params.propertyType : '',
    minPrice: params.minPrice ?? '',
    maxPrice: params.maxPrice ?? '',
  }

  const propertyType = filters.propertyType || undefined
  const minPrice = filters.minPrice ? Math.round(parseFloat(filters.minPrice) * 100) : undefined
  const maxPrice = filters.maxPrice ? Math.round(parseFloat(filters.maxPrice) * 100) : undefined
  const page = params.page ? parseInt(params.page, 10) : 1

  // Only apply the availability filter when both dates form a valid range.
  // A half-filled range (user still picking dates in the sidebar) is ignored, not an error.
  const isIsoDate = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
  const hasValidDateRange =
    isIsoDate(filters.checkIn) && isIsoDate(filters.checkOut) && filters.checkIn < filters.checkOut

  const parsedGuests = filters.guests ? parseInt(filters.guests, 10) : NaN
  const guests = Number.isInteger(parsedGuests) && parsedGuests >= 1 ? parsedGuests : undefined

  const [{ listings }, session] = await Promise.all([
    getListings({
      location: filters.location || undefined,
      propertyType: propertyType as PropertyType | undefined,
      minPrice,
      maxPrice,
      checkIn: hasValidDateRange ? filters.checkIn : undefined,
      checkOut: hasValidDateRange ? filters.checkOut : undefined,
      guests,
      page,
      limit: 20,
    }),
    auth.api.getSession({ headers: await headers() }),
  ])

  const favoritedListingIds = session
    ? await getFavoritedListingIds(session.user.id, listings.map((l) => l.id))
    : null

  // Normalise DB listings to the Listing type expected by components
  const normalisedListings = listings.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    propertyType: l.propertyType as PropertyType,
    location: {
      city: l.city,
      country: l.country,
      coordinates: { lat: l.lat, lng: l.lng },
    },
    host: {
      id: l.host.id,
      name: l.host.name,
      avatarUrl: l.host.image ?? null,
      memberSince: '',
      verifiedHost: false,
    },
    photos: l.photos.map((p) => ({ url: p.url, alt: p.alt })),
    amenities: [],
    nightlyRate: l.nightlyRate / 100, // cents → euros for display
    maxGuests: l.maxGuests,
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    rating: l.rating,
    reviewCount: l.reviewCount,
  }))

  return (
    <ListingsClientShell
      listings={normalisedListings}
      filters={filters}
      favoritedListingIds={favoritedListingIds}
    />
  )
}
