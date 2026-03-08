import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import PayloadForm from '@/components/PayloadForm'
import { submitForm } from './actions'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getDictionary } from '@/i18n/server'
import { Locale } from '@/i18n/config'

export default async function FormPage({ params }: { params: Promise<{ formId: string, locale: string }> }) {
  const { formId, locale } = await params as { formId: string, locale: Locale }
  const dict = await getDictionary(locale)
  const payload = await getPayload({ config })

  const form = await payload.findByID({
    collection: 'forms',
    id: formId,
  })

  if (!form) {
    notFound()
  }

  // Fetch user for prefilling
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in duration-500">
        <Button variant="ghost" asChild className="mb-8 pl-0 hover:pl-2 text-muted-foreground hover:text-primary">
            <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {dict.nav.home}
            </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-8 text-center">{form.title}</h1>
        {form.confirmationMessage && (
            <div className="prose prose-base mb-8 max-w-none">
                {/* Parse rich text if needed */}
            </div>
        )}

        <Card>
            <CardContent className="p-6 md:p-8">
                <PayloadForm form={form as any} onSubmit={submitForm.bind(null, form.id)} user={user} />
            </CardContent>
        </Card>
    </div>
  )
}
