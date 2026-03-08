'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { canInteractAsMember } from '@/libs/permissions'

import { headers } from 'next/headers'

export async function submitForm(formId: string | number, data: Record<string, unknown>) {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user || !canInteractAsMember(user as any)) {
    throw new Error('Please sign in as a member to submit forms.')
  }

  try {
      await payload.create({
        collection: 'form-submissions',
        data: {
          form: typeof formId === 'string' ? parseInt(formId) : formId,
          submissionData: Object.entries(data).map(([field, value]) => ({
            field,
            value: String(value),
          })),
          user: user.id,
        },
      })
  } catch (error) {
      console.error('Error submitting form:', error)
      throw new Error('Failed to submit form')
  }
}
