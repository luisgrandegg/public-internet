export interface WelcomeEmailData {
  to: string
  name: string
}

export interface PasswordResetEmailData {
  to: string
  name: string
  resetLink: string
}

export interface EmailProvider {
  sendWelcome(data: WelcomeEmailData): Promise<void>
  sendPasswordReset(data: PasswordResetEmailData): Promise<void>
}
