import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import PayloadForm from '@/components/PayloadForm'
import { submitForm } from '@/app/(frontend)/forms/[formId]/actions'
import { checkUserActionGate } from '@/libs/user-action-gate'

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })

  // Fetch user early — needed for gate check
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  const event = await payload.findByID({
    collection: 'events',
    id: id,
  })

  if (!event) {
    notFound()
  }

  // Unified gate — auth, profile, form blocking, scheduling
  const gate = await checkUserActionGate(payload, user, {
    resource: event,
    checkFormBlocking: true,
  })

  if (!gate.allowed) {
    if (gate.redirect) {
      redirect(gate.redirect)
    }
    return (
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Cannot Register</h1>
            <p className="mb-8">{gate.message}</p>
            <Link href={`/events/${event.id}`} className="text-primary-1 hover:underline">
                Back to Event Details
            </Link>
        </div>
    )
  }

  const formId = typeof event.subscription_form === 'object'
    ? event.subscription_form?.id
    : event.subscription_form

  if (!formId) {
      // If no form is linked, we can't show a form.
      // Maybe redirect or show error.
      return (
          <div className="max-w-2xl mx-auto py-12 px-4 text-center">
              <h1 className="text-2xl font-bold mb-4">Registration Unavailable</h1>
              <p className="mb-8">No registration form has been linked to this event.</p>
              <Link href={`/events/${event.id}`} className="text-primary-1 hover:underline">
                  Back to Event Details
              </Link>
          </div>
      )
  }

  const form = await payload.findByID({
    collection: 'forms',
    id: formId,
  })

  if (!form) {
      return (
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Form Not Found</h1>
            <p className="mb-8">The registration form could not be found.</p>
            <Link href={`/events/${event.id}`} className="text-primary-1 hover:underline">
                Back to Event Details
            </Link>
        </div>
      )
  }

  // user already fetched above for gate check

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
        <Link
          className="inline-flex items-center gap-2 text-base-5 hover:text-primary-1 transition-colors mb-8"
          href={`/events/${event.id}`}
        >
          <span className="text-xl">&#x27F5;</span> Back to Event
        </Link>

        <h1 className="text-3xl font-bold mb-2">Register for {event.name}</h1>
        <p className="text-base-5 mb-8">Please fill out the form below to register.</p>

        <div className="bg-base-1 p-6 md:p-8 rounded-2xl border border-base-2 shadow-sm">
            <PayloadForm form={form as any} onSubmit={submitForm.bind(null, form.id)} user={user} />
        </div>
    </div>
  )
}
