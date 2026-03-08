'use client'

import React, { useCallback, useState, useEffect } from 'react'
import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import FormField from './FormField'
import { prefillFormData } from '@/libs/forms/prefillUserData'
import { getHiddenFields } from '@/libs/forms/conditionalLogic'

interface Props {
  form: FormType
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  user?: any // Optional user object for prefilling and UserProfileField
}

export default function PayloadForm({ form, onSubmit, user }: Props) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Prefill form data if user is present
  useEffect(() => {
    if (user && form.fields) {
      const prefilled = prefillFormData(user, form.fields)
      if (Object.keys(prefilled).length > 0) {
        setFormData(prev => ({ ...prev, ...prefilled }))
      }
    }
  }, [user, form.fields])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(formData)
      setSuccess(true)
      setFormData({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    }
    setIsSubmitting(false)
  }, [formData, onSubmit])

  if (success) {
      return (
          <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-2">{form.confirmationMessage?.root?.children?.[0]?.children?.[0]?.text || 'Success!'}</h3>
              <p>Your submission has been received.</p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 text-sm font-semibold underline hover:no-underline"
              >
                Submit another response
              </button>
          </div>
      )
  }

  const hiddenFields = getHiddenFields(form.fields || [], formData)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {form.fields?.map((field, i) => {
        const fieldName = (field as { name?: string }).name
        if (fieldName && hiddenFields.has(fieldName)) {
            return null
        }

        return (
            <FormField
                key={i}
                field={field}
                value={formData[(field as { name?: string }).name ?? '']}
                onChange={(v) => setFormData(prev => ({ ...prev, [(field as { name?: string }).name ?? '']: v }))}
                user={user}
            />
        )
      })}
      {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full md:w-auto px-6 py-3 bg-primary-1 text-white font-bold rounded-xl hover:bg-primary-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : form.submitButtonLabel || 'Submit'}
      </button>
    </form>
  )
}
