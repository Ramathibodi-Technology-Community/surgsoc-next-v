import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import ApplicantPoolManager from '@/components/ApplicantPoolManager'

export default async function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    redirect('/login')
  }

  // Fetch event
  const event = await payload.findByID({
    collection: 'events',
    id,
  })

  // Check if user is event owner or admin.
  // Unwrap the owner relationship — Payload may return it as an ID or a populated object.
  const ownerId = typeof event.owner === 'object' && event.owner !== null
    ? (event.owner as { id: string | number }).id
    : event.owner
  const isAuthorized =
    String(ownerId) === String(user.id) ||
    ['admin', 'superadmin', 'vp'].some(r => (user as any).roles?.includes(r))

  if (!isAuthorized) {
    redirect(`/events/${id}`)
  }

  const participantLimit =
    typeof (event as { participant_limit?: unknown }).participant_limit === 'number'
      ? ((event as { participant_limit?: number }).participant_limit ?? 0)
      : 0

  // Fetch applicants
  // payload.find returns paginated docs
  const { docs: applicants } = await payload.find({
    collection: 'registrations',
    where: {
      event: { equals: id },
      status: { in: ['applicant', 'accepted', 'rejected', 'subscribed'] },
    },
    depth: 2, // Populate user details
    limit: 1000, // Fetch up to 1000 applicants
  })

  // Transform to simpler interface for client component if needed,
  // currently passing docs directly as they match expectations mostly
  const formattedApplicants = applicants.map(app => ({
      id: String(app.id),
      user: app.user,
      status: app.status ?? 'applicant',
      createdAt: app.createdAt,
      submission: app.submission
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-9">
                Applicant Pool
            </h1>
            <p className="text-base-6 mt-1 text-lg">{event.name}</p>
          </div>
          <div className="text-right">
              <span className="text-sm text-base-5 block">Participant Limit</span>
              <span className="text-xl font-bold text-base-9">
                  {participantLimit > 0 ? participantLimit : 'Unlimited'}
              </span>
          </div>
      </div>

      <ApplicantPoolManager
        eventId={id}
        applicants={formattedApplicants}
        participantLimit={participantLimit}
      />
    </div>
  )
}
