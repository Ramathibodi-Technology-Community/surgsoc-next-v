import { getAuthorizationUrl } from '@/libs/auth/google'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { url, code_verifier, state } = await getAuthorizationUrl()

  const cookieStore = await cookies()

  // Security cookies for PKCE & CSRF
  cookieStore.set('code_verifier', code_verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })

  cookieStore.set('state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })

  redirect(url)
}
