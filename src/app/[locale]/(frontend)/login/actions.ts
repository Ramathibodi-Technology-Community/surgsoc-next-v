'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'

export async function loginWithEmail(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, message: 'Email and password are required.' }
  }

  try {
    const payload = await getPayload({ config })

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    if (result.token) {
      // Set the auth cookie so subsequent requests are authenticated
      const cookieStore = await cookies()
      cookieStore.set('payload-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return { success: true, message: 'Login successful' }
    }

    return { success: false, message: 'Invalid email or password.' }
  } catch (error: any) {
    console.error('Email login error:', error?.message || error)
    return { success: false, message: 'Invalid email or password.' }
  }
}
