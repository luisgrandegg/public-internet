'use server'

export type AuthResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string>; globalError?: string }

export async function signIn(
  prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  if (!email || !email.includes('@')) {
    return { ok: false, fieldErrors: { email: 'Enter a valid email address' } }
  }
  if (!password || password.length < 8) {
    return { ok: false, fieldErrors: { password: 'Password must be at least 8 characters' } }
  }
  return { ok: true }
}

export async function signUp(
  prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const errors: Record<string, string> = {}
  if (!name) errors.name = 'Name is required'
  if (!email || !email.includes('@')) errors.email = 'Enter a valid email address'
  if (!password || password.length < 8) errors.password = 'Password must be at least 8 characters'
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors }
  return { ok: true }
}

export async function forgotPassword(
  prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get('email') as string
  if (!email || !email.includes('@')) {
    return { ok: false, fieldErrors: { email: 'Enter a valid email address' } }
  }
  return { ok: true }
}
