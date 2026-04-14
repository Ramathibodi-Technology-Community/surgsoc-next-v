import { getPayload } from 'payload'
import config from '@payload-config'
import { headers, cookies } from 'next/headers'

export async function GET() {
  // Explicit opt-in guard — NODE_ENV can be 'test' in CI, which a NODE_ENV-only
  // check would expose. Require an explicit env var and also block production.
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.ALLOW_DEBUG_ENDPOINTS !== 'true'
  ) {
    return new Response(null, { status: 404 })
  }

  const payload = await getPayload({ config })
  const headersList = await headers()
  const cookieStore = await cookies()

  // Check what cookies we have
  const allCookies = cookieStore.getAll()
  const payloadToken = cookieStore.get('payload-token')

  // Try to authenticate
  const { user } = await payload.auth({ headers: headersList })

  return Response.json({
    authenticated: !!user,
    user: user ? { id: user.id, email: user.email } : null,
    cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
    payloadTokenExists: !!payloadToken,
  })
}
