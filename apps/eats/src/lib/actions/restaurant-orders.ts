'use server'

import { revalidatePath } from 'next/cache'
import { forwardAuthHeaders, apiUrl } from './_internal'

export async function updateOrderStatusAction(
  orderId: string,
  status: 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP',
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(apiUrl(`/api/restaurant/orders/${orderId}`), {
    method: 'PATCH',
    headers: await forwardAuthHeaders(),
    body: JSON.stringify({ status }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    return { ok: false, message: json.error?.message ?? 'Could not update order.' }
  }
  revalidatePath('/restaurant')
  return { ok: true }
}
