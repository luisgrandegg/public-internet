'use server'

export async function createListing(
  prev: { ok: boolean } | null,
  formData: FormData
): Promise<{ ok: boolean }> {
  // Placeholder — validate presence of required fields
  const title = formData.get('title') as string
  if (!title) return { ok: false }
  return { ok: true }
}
