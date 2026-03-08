
import { CollectionConfig } from 'payload'
import { NotificationService } from '../libs/notifications'
import { hasPermission } from '../libs/permissions'
import type { User } from '../payload-types'

export const Registrations: CollectionConfig = {
  slug: 'registrations',
  admin: {
    useAsTitle: 'id',
    group: 'Management',
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req: { payload } }) => {
        // Status changed?
        if (doc.status === previousDoc?.status) return

        try {
            // Fetch full event and user details if they are IDs
            const event = typeof doc.event === 'string'
                ? await payload.findByID({ collection: 'events', id: doc.event })
                : doc.event

            const user = typeof doc.user === 'string'
                ? await payload.findByID({ collection: 'users', id: doc.user })
                : doc.user

            if (!event || !user) {
                payload.logger.error(`[Notification] Missing event or user for registration ${doc.id}`)
                return
            }

            // 1. Accepted -> Send acceptance email
            if (doc.status === 'accepted') {
                await NotificationService.sendRegistrationAccepted({ registration: doc, event, user })
                payload.logger.info(`[Notification] Sent details to ${user.email}`)
            }

            // 2. Rejected -> Send rejection email
            if (doc.status === 'rejected') {
                await NotificationService.sendRegistrationRejected({ registration: doc, event, user })
                payload.logger.info(`[Notification] Sent rejection to ${user.email}`)
            }

            // 3. Confirmed -> Send confirmation
            if (doc.status === 'confirmed') {
                await NotificationService.sendRegistrationConfirmed({ registration: doc, event, user })
                payload.logger.info(`[Notification] Sent confirmation to ${user.email}`)
            }

            // 4. Post-event lifecycle: assign feedback/reflection form to participants
            if (doc.status === 'participant' && previousDoc?.status !== 'participant') {
              const rawReflectionFormId =
                typeof event.reflection_form === 'object' && event.reflection_form !== null
                  ? event.reflection_form.id
                  : event.reflection_form

              const reflectionFormId =
                rawReflectionFormId == null ? null : Number(rawReflectionFormId)

              if (reflectionFormId != null && Number.isFinite(reflectionFormId)) {
                const existingAssignment = await payload.find({
                  collection: 'form-assignments',
                  where: {
                    and: [
                      { user: { equals: user.id } },
                      { form: { equals: reflectionFormId } },
                    ],
                  },
                  limit: 1,
                })

                if (existingAssignment.totalDocs === 0) {
                  await payload.create({
                    collection: 'form-assignments',
                    data: {
                      user: user.id,
                      form: reflectionFormId,
                      completed: false,
                      blocks_registration: false,
                    },
                  })

                  payload.logger.info(
                    `[FeedbackAssignment] Assigned reflection form ${reflectionFormId} to user ${user.id} for event ${event.id}`,
                  )
                }
              }
            }

            // 5. Auto-promote from waiting list
            // If a user declines or withdraws, and auto-promote is enabled, select the next person
            if (['declined', 'withdrawn'].includes(doc.status)) {
                if (event.auto_promote) {
                    // Find next person on waiting list (oldest first)
                    // Status 'subscribed' maps to waiting list in our logic
                    const waitingList = await payload.find({
                        collection: 'registrations',
                        where: {
                            and: [
                                { event: { equals: event.id } },
                                { status: { equals: 'subscribed' } },
                            ],
                        },
                        sort: 'createdAt',
                        limit: 1,
                    })

                    if (waitingList.docs.length > 0) {
                        const nextUserReg = waitingList.docs[0]
                        await payload.update({
                            collection: 'registrations',
                            id: nextUserReg.id,
                            data: { status: 'accepted' },
                        })
                        payload.logger.info(
                            `[AutoPromote] Promoted registration ${nextUserReg.id} for event ${event.id} after user ${doc.user} declined/withdrew`
                        )
                    }
                }
            }

        } catch (error) {
            payload.logger.error(`[Notification] Error in afterChange hook for registration ${doc.id}: ${error}`)
        }
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
       if (!user) return false
       if (hasPermission(user as User, 'manage_events')) return true
       return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => {
      return !!user
    },
    update: ({ req: { user } }) => {
       if (!user) return false
       if (hasPermission(user as User, 'manage_events')) return true
       // Where-query: only match rows owned by this user
       return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
       if (!user) return false
       return hasPermission(user as User, 'manage_events')
    },
  },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }: any) => user?.id,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        'subscribed',
        'applicant',      // Default - in applicant pool
        'accepted',       // Selected by organizer
        'rejected',       // Rejected by organizer
        'confirmed',      // User confirmed attendance
        'declined',       // User declined (Leave of Absence)
        'participant',    // Attended event
        'withdrawn',      // User withdrawn
      ],
      defaultValue: 'applicant',
    },
    {
      name: 'submission',
      type: 'json', // Stores the form answers
    },
    {
      name: 'selected_at',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'selected_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'rejection_reason',
      type: 'textarea',
      admin: {
        condition: (data) => data.status === 'rejected',
      },
    },
  ],
}
