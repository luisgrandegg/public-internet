'use server'

import { revalidatePath } from 'next/cache'
import { forwardAuthHeaders, apiUrl } from './_internal'

export async function transitionDeliveryAction(
  deliveryId: string,
  action: 'accept' | 'picked_up' | 'delivered' | 'failed',
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(apiUrl(`/api/courier/deliveries/${deliveryId}`), {
    method: 'PATCH',
    headers: await forwardAuthHeaders(),
    body: JSON.stringify({ action }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    return { ok: false, message: json.error?.message ?? 'Could not update delivery.' }
  }
  revalidatePath('/courier')
  return { ok: true }
}
