'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { CreateListingSchema } from '@/lib/schemas/listings'
import { createListing as createListingService } from '@/lib/services/listings'
import { flattenZodErrors } from '@/lib/api/zod'

export type ListingActionResult =
  | { ok: true; listingId: string }
  | { ok: false; fieldErrors: Record<string, string>; globalError?: string }

export async function createListing(
  _prev: ListingActionResult | null,
  formData: FormData,
): Promise<ListingActionResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, fieldErrors: {}, globalError: 'You must be signed in to create a listing' }
  }

  // Parse photos from formData (submitted as photo-0-url, photo-0-alt, photo-1-url, ...)
  const photos: Array<{ url: string; alt: string }> = []
  for (let i = 0; i < 10; i++) {
    const url = formData.get(`photo-${i}-url`)
    const alt = formData.get(`photo-${i}-alt`)
    if (url && String(url).trim()) {
      photos.push({ url: String(url).trim(), alt: String(alt ?? '').trim() })
    }
  }

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    propertyType: formData.get('propertyType'),
    city: formData.get('city'),
    country: formData.get('country'),
    lat: Number(formData.get('lat') ?? 0),
    lng: Number(formData.get('lng') ?? 0),
    nightlyRate: Number(formData.get('nightlyRate')),
    maxGuests: Number(formData.get('maxGuests')),
    bedrooms: Number(formData.get('bedrooms')),
    bathrooms: Number(formData.get('bathrooms')),
    photos,
  }

  const parsed = CreateListingSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenZodErrors(parsed.error) }
  }

  try {
    const listing = await createListingService(session.user.id, parsed.data)
    revalidatePath('/host/listings')
    revalidatePath('/listings')
    return { ok: true, listingId: listing.id }
  } catch {
    return { ok: false, fieldErrors: {}, globalError: 'Could not create listing. Please try again.' }
  }
}
