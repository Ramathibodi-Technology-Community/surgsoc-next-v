import { Resend } from 'resend'

export const DEFAULT_EMAIL_FROM = 'SurgSoc <noreply@surgsoc.mahidol.edu>'

export function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY
}

export function getEmailFromAddress(override?: string): string {
  return override || process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM
}

export function createResendClient(apiKey = getResendApiKey()): Resend | null {
  if (!apiKey) {
    return null
  }

  return new Resend(apiKey)
}

export function isResendConfigured(): boolean {
  return Boolean(getResendApiKey())
}
