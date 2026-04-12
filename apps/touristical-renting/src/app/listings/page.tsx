import { MOCK_LISTINGS } from '@/lib/mock-data'
import type { ListingFilters, PropertyType } from '@/lib/types'
import { ListingsClientShell } from './_components/ListingsClientShell'

interface ListingsPageProps {
  searchParams: Promise<{
    location?: string
    checkIn?: string
    checkOut?: string
    guests?: string
    propertyType?: string
    minPrice?: string
    maxPrice?: string
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

  const filtered = MOCK_LISTINGS.filter((listing) => {
    if (filters.location) {
      const q = filters.location.toLowerCase()
      if (
        !listing.location.city.toLowerCase().includes(q) &&
        !listing.location.country.toLowerCase().includes(q)
      ) {
        return false
      }
    }

    if (filters.propertyType && listing.propertyType !== filters.propertyType) {
      return false
    }

    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice)
      if (!isNaN(min) && listing.nightlyRate < min) return false
    }

    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice)
      if (!isNaN(max) && listing.nightlyRate > max) return false
    }

    return true
  })

  return <ListingsClientShell listings={filtered} filters={filters} />
}
