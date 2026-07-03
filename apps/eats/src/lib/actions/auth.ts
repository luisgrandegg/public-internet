'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { emailProvider } from '@/lib/email'

export type AuthResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string>; globalError?: string }

export async function signIn(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const fieldErrors: Record<string, string> = {}
  if (!email || !email.includes('@')) fieldErrors.email = 'Enter a valid email address'
  if (!password) fieldErrors.password = 'Password is required'
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    })
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign in failed'
    if (message.toLowerCase().includes('password')) {
      return { ok: false, fieldErrors: { password: 'Incorrect email or password' } }
    }
    return { ok: false, fieldErrors: {}, globalError: 'Incorrect email or password' }
  }
}

export async function signUp(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const name = String(formData.get('name') ?? '')
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  const fieldErrors: Record<string, string> = {}
  if (!name.trim()) fieldErrors.name = 'Name is required'
  if (!email || !email.includes('@')) fieldErrors.email = 'Enter a valid email address'
  if (!password || password.length < 8) fieldErrors.password = 'Password must be at least 8 characters'
  if (password !== confirmPassword) fieldErrors.confirmPassword = 'Passwords do not match'
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  try {
    await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    })
    await emailProvider.sendWelcome({ to: email, name })
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.toLowerCase().includes('email')) {
      return { ok: false, fieldErrors: { email: 'An account with this email already exists' } }
    }
    return { ok: false, fieldErrors: {}, globalError: 'Could not create account. Please try again.' }
  }
}

export async function forgotPassword(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '')
  if (!email || !email.includes('@')) {
    return { ok: false, fieldErrors: { email: 'Enter a valid email address' } }
  }

  // Always return ok to prevent user enumeration — the email is sent asynchronously.
  // Call the better-auth server API directly (the /forget-password endpoint 404s
  // in better-auth 1.6); a relative redirectTo passes trusted-origin validation.
  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: '/auth/reset-password' },
    })
  } catch {
    // Intentionally swallow errors — do not reveal whether the email exists
  }
  return { ok: true }
}

export async function resetPassword(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const token = String(formData.get('token') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  const fieldErrors: Record<string, string> = {}
  if (!newPassword || newPassword.length < 8) {
    fieldErrors.newPassword = 'Password must be at least 8 characters'
  }
  if (newPassword !== confirmPassword) {
    fieldErrors.confirmPassword = 'Passwords do not match'
  }
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  if (!token) {
    return {
      ok: false,
      fieldErrors: {},
      globalError: 'This reset link is invalid or has expired. Please request a new one.',
    }
  }

  try {
    await auth.api.resetPassword({
      body: { newPassword, token },
      headers: await headers(),
    })
    return { ok: true }
  } catch {
    return {
      ok: false,
      fieldErrors: {},
      globalError: 'This reset link is invalid or has expired. Please request a new one.',
    }
  }
}
