'use server'

import { revalidatePath } from 'next/cache'
import { forwardAuthHeaders, apiUrl } from './_internal'

export type MenuActionResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string>; globalError?: string }

export async function createMenuItemAction(
  restaurantId: string,
  _prev: MenuActionResult | null,
  formData: FormData,
): Promise<MenuActionResult> {
  const body = {
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    price: String(formData.get('price') ?? ''),
    category: String(formData.get('category') ?? ''),
  }

  const res = await fetch(apiUrl(`/api/restaurant/restaurants/${restaurantId}/menu`), {
    method: 'POST',
    headers: await forwardAuthHeaders(),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    return {
      ok: false,
      fieldErrors: json.error?.fields ?? {},
      globalError: json.error?.message ?? 'Could not add menu item.',
    }
  }

  revalidatePath(`/restaurant/${restaurantId}/menu`)
  return { ok: true }
}

export async function toggleMenuItemAvailability(
  restaurantId: string,
  itemId: string,
  isAvailable: boolean,
): Promise<void> {
  await fetch(apiUrl(`/api/restaurant/menu/${itemId}`), {
    method: 'PATCH',
    headers: await forwardAuthHeaders(),
    body: JSON.stringify({ isAvailable }),
    cache: 'no-store',
  })
  revalidatePath(`/restaurant/${restaurantId}/menu`)
}

export async function updateMenuItemAction(
  restaurantId: string,
  itemId: string,
  _prev: MenuActionResult | null,
  formData: FormData,
): Promise<MenuActionResult> {
  const body: Record<string, unknown> = {
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    price: String(formData.get('price') ?? ''),
    category: String(formData.get('category') ?? ''),
  }

  const res = await fetch(apiUrl(`/api/restaurant/menu/${itemId}`), {
    method: 'PATCH',
    headers: await forwardAuthHeaders(),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    return {
      ok: false,
      fieldErrors: json.error?.fields ?? {},
      globalError: json.error?.message ?? 'Could not update menu item.',
    }
  }

  revalidatePath(`/restaurant/${restaurantId}/menu`)
  return { ok: true }
}

export async function deleteMenuItemAction(
  restaurantId: string,
  itemId: string,
): Promise<void> {
  await fetch(apiUrl(`/api/restaurant/menu/${itemId}`), {
    method: 'DELETE',
    headers: await forwardAuthHeaders(),
    cache: 'no-store',
  })
  revalidatePath(`/restaurant/${restaurantId}/menu`)
}
