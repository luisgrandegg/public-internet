'use server'

import { revalidatePath } from 'next/cache'
import { forwardAuthHeaders, apiUrl } from './_internal'

export interface PlaceOrderInput {
  restaurantId: string
  items: { menuItemId: string; quantity: number }[]
  deliveryAddress: string
  notes?: string
}

export type PlaceOrderResult =
  | {
      ok: true
      orderId: string
      /**
       * Provider-hosted checkout URL when this node takes online payments —
       * the client redirects here instead of the internal confirmation route.
       * Null on offline-settlement nodes (ADR-006).
       */
      checkoutUrl: string | null
    }
  | { ok: false; fieldErrors: Record<string, string>; globalError?: string }

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  try {
    const res = await fetch(apiUrl('/api/orders'), {
      method: 'POST',
      headers: await forwardAuthHeaders(),
      body: JSON.stringify(input),
      cache: 'no-store',
    })

    if (res.status === 401) {
      return {
        ok: false,
        fieldErrors: {},
        globalError: 'You must be signed in to place an order.',
      }
    }

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      return {
        ok: false,
        fieldErrors: json.error?.fields ?? {},
        globalError: json.error?.message ?? 'Could not place order.',
      }
    }

    const { data } = await res.json()
    revalidatePath('/orders')
    return { ok: true, orderId: data.id, checkoutUrl: data.checkoutUrl ?? null }
  } catch {
    return {
      ok: false,
      fieldErrors: {},
      globalError: 'Network error. Please try again.',
    }
  }
}
