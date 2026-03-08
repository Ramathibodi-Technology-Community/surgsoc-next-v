'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

export async function confirmAttendance(eventId: string) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return { success: false, message: 'Not authenticated' }

  // Find user's registration for this event
  const regs = await payload.find({
    collection: 'registrations',
    where: {
      and: [
        { event: { equals: eventId } },
        { user: { equals: user.id } },
        { status: { equals: 'accepted' } }, // Can only confirm if accepted
      ],
    },
  })

  if (regs.totalDocs === 0) {
    return { success: false, message: 'No accepted registration found.' }
  }

  await payload.update({
    collection: 'registrations',
    id: regs.docs[0].id,
    data: { status: 'confirmed' },
  })

  return { success: true, message: 'Attendance confirmed!' }
}

export async function declineAttendance(eventId: string) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return { success: false, message: 'Not authenticated' }

  const regs = await payload.find({
    collection: 'registrations',
    where: {
      and: [
        { event: { equals: eventId } },
        { user: { equals: user.id } },
        { status: { in: ['accepted', 'confirmed'] } }, // Can decline if accepted or confirmed (via LOA technically) here we just set status
      ],
    },
  })

  if (regs.totalDocs === 0) {
    return { success: false, message: 'No active registration found.' }
  }

  await payload.update({
    collection: 'registrations',
    id: regs.docs[0].id,
    data: { status: 'declined' },
  })

  return { success: true, message: 'Registration declined.' }
}
