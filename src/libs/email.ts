import { createResendClient, getEmailFromAddress } from './email/config'

/**
 * Singleton Resend client instance.
 * Will be null if RESEND_API_KEY is not set (e.g. in development without keys).
 */
export const resend = createResendClient()

export const emailFrom = getEmailFromAddress()
