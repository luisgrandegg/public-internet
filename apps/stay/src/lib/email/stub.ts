import type { EmailProvider, PasswordResetEmailData, WelcomeEmailData } from './types'

/**
 * Stub email provider — logs emails to console instead of sending them.
 * Replace this with a real provider (Resend, SendGrid, etc.) when ready.
 * The EmailProvider interface guarantees the swap is a one-line change in index.ts.
 */
export class StubEmailProvider implements EmailProvider {
  async sendWelcome(data: WelcomeEmailData): Promise<void> {
    console.log('[StubEmail] Welcome email', {
      to: data.to,
      subject: 'Welcome to Stay',
      body: `Hi ${data.name}, your account has been created.`,
    })
  }

  async sendPasswordReset(data: PasswordResetEmailData): Promise<void> {
    console.log('[StubEmail] Password reset email', {
      to: data.to,
      subject: 'Reset your password',
      resetLink: data.resetLink,
    })
  }
}
