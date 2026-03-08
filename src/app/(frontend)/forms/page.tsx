import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Forms | RASS',
  description: 'View your assigned forms and submission history.',
}

export default async function FormsPage() {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in Required</CardTitle>
            <CardDescription>Please sign in to view your assigned forms.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/api/auth/google">
                Sign in with Google
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch assigned forms (pending)
  const { docs: assignments } = await payload.find({
    collection: 'form-assignments',
    where: {
      user: { equals: user.id },
    },
    depth: 2,
    sort: '-createdAt',
  })

  const pending = assignments.filter((a: any) => !a.completed)
  const completed = assignments.filter((a: any) => a.completed)

  // Fetch user's form submissions
  const { docs: submissions } = await payload.find({
    collection: 'form-submissions',
    where: {
      user: { equals: user.id },
    },
    depth: 2,
    sort: '-createdAt',
  })

  // Helper date formatter
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US')

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight">Forms</h1>

      {/* Pending Assigned Forms */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Assigned Forms
            </h2>
            {pending.length > 0 && (
                <Badge variant="default">{pending.length}</Badge>
            )}
        </div>

        {pending.length === 0 ? (
          <div className="bg-muted/20 p-8 rounded-xl border border-dashed text-center text-muted-foreground">
            No pending forms.
          </div>
        ) : (
          <div className="grid gap-3">
            {pending.map((assignment: any) => {
              const form = assignment.form
              const formTitle = typeof form === 'object' ? form.title : `Form #${form}`
              const formId = typeof form === 'object' ? form.id : form
              return (
                <Link
                  key={assignment.id}
                  href={`/forms/${formId}`}
                  className="block group"
                >
                    <Card className="hover:border-primary/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{formTitle}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Assigned on {formatDate(assignment.createdAt)}
                            </p>
                            </div>
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">
                                Pending
                            </Badge>
                        </CardContent>
                    </Card>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Completed Submissions */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          Completed Submissions
        </h2>

        {submissions.length === 0 && completed.length === 0 ? (
          <div className="bg-muted/20 p-8 rounded-xl border border-dashed text-center text-muted-foreground">
            No completed submissions found.
          </div>
        ) : (
          <div className="grid gap-3">
            {submissions.map((sub: any) => {
              const form = sub.form
              const formTitle = typeof form === 'object' ? form.title : `Form #${form}`
              return (
                <Card key={sub.id} className="bg-muted/10 border-muted">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{formTitle}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Submitted on {formatDate(sub.createdAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-500/5">
                      Completed
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
