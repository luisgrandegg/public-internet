import type { ListingFilters, PropertyType } from '@/lib/types'
import { ListingsClientShell } from './_components/ListingsClientShell'
import { getListings } from '@/lib/services/listings'

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

  const { listings } = await getListings({
    location: filters.location || undefined,
    propertyType: propertyType as PropertyType | undefined,
    minPrice,
    maxPrice,
    page,
    limit: 20,
  })

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
    rating: null,
    reviewCount: 0,
  }))

  return <ListingsClientShell listings={normalisedListings} filters={filters} />
}
