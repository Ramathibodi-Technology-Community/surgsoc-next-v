import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { hasPermission } from '@/libs/permissions'
import type { User } from '@/payload-types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, registrationIds } = await request.json()

  // Verify user has permission to manage this event
  const event = await payload.findByID({
    collection: 'events',
    id,
  })

  const ownerId = typeof event.owner === 'object' ? event.owner?.id : event.owner
  const isAuthorized =
    ownerId === user.id ||
    hasPermission(user as User, 'manage_events')

  if (!isAuthorized) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Batch update registrations
  const newStatus = action === 'accept' ? 'accepted' : 'rejected'

  // Payload local API doesn't support 'where' in update yet for batch updates in one query easily
  // We'll loop for now or use update with where if supported (Payload 2.0+ supports update({ where: ... }))
  // Let's use loop for safety and hooks execution

  const results = []
  for (const regId of registrationIds) {
    try {
        const result = await payload.update({
          collection: 'registrations',
          id: regId,
          data: {
            status: newStatus,
            selected_at: new Date(),
            selected_by: user.id,
          } as any,
        })
        results.push(result)
    } catch (e) {
        console.error(`Failed to update registration ${regId}`, e)
    }
  }

  return Response.json({
    success: true,
    updated: results.length
  })
}
