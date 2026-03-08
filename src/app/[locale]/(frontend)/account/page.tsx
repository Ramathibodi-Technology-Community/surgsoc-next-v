import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import Link from 'next/link'
import ProfileEditor from '@/components/ProfileEditor'
import { getDictionary } from '@/i18n/server'
import { Locale } from '@/i18n/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, ClipboardList, CheckCircle2 } from 'lucide-react'
import { getMissingProfileFields, isProfileComplete } from '@/libs/profile-completion'

export const metadata: Metadata = {
  title: 'My Account | RASS',
  description: 'Manage your Ramathibodi Surgical Society profile and registrations.',
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params as { locale: Locale }
  const t = (await getDictionary(locale)).account
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl">{t.not_logged_in}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">{t.please_sign_in}</p>
            <Button asChild className="w-full">
              <Link href="/login">{t.go_to_login}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Task sources: pending form assignments + accepted event registrations awaiting confirmation
  const { docs: assignments } = await payload.find({
    collection: 'form-assignments',
    where: {
      and: [
        { user: { equals: user.id } },
        { completed: { equals: false } },
      ],
    },
    depth: 2,
    sort: '-createdAt',
  })

  const { docs: registrations } = await payload.find({
    collection: 'registrations',
    where: {
      and: [
        { user: { equals: user.id } },
        { status: { equals: 'accepted' } },
      ],
    },
    depth: 2,
    sort: '-createdAt',
  })

  const taskCount = assignments.length + registrations.length
  const profileComplete = isProfileComplete(user as any)
  const missingProfileFields = profileComplete ? [] : getMissingProfileFields(user as any)

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in space-y-6 px-4 py-8 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-destructive">
          <Link href="/admin/logout">
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Link>
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card className="py-0 gap-0 rounded-lg shadow-none">
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-14 w-14 border border-muted">
            <AvatarImage src={user.image_url || ''} alt="Profile" />
            <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
               {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {user.name_english?.first_name || 'User'} {user.name_english?.last_name || ''}
            </h2>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <div className="flex gap-2 mt-1">
                {user.roles?.map(role => (
                    <Badge key={role} variant="outline" className="capitalize text-xs font-normal">
                        {role}
                    </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inline Section Editors */}
      {!profileComplete && (
        <Card className="border-amber-300 bg-amber-50 py-0 gap-0 rounded-lg shadow-none">
          <CardContent className="p-3 text-sm text-amber-900">
            <p className="font-semibold">Please complete your profile to unlock event registration.</p>
            <p className="mt-1">Missing: {missingProfileFields.join(', ')}</p>
          </CardContent>
        </Card>
      )}

      <ProfileEditor user={user} />

      {/* My Tasks */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <ClipboardList className="h-5 w-5" />
            {t.tasks_title}
          </h2>
          {taskCount > 0 && <Badge>{taskCount}</Badge>}
        </div>

        {taskCount === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            {t.no_tasks}
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold">{t.tasks_assigned_forms}</h3>
                <div className="grid gap-3">
                  {assignments.map((assignment: any) => {
                    const form = assignment.form
                    const formTitle = typeof form === 'object' ? form.title : `Form #${form}`
                    const formId = typeof form === 'object' ? form.id : form
                    return (
                      <Card key={assignment.id} className="py-0 gap-0 rounded-lg shadow-none">
                        <CardContent className="flex items-center justify-between gap-3 p-3">
                          <div>
                            <p className="font-semibold">{formTitle}</p>
                            <p className="text-sm text-muted-foreground">{t.tasks_complete_form}</p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/forms/${formId}`}>{t.tasks_open_form}</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {registrations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold">{t.tasks_event_confirmations}</h3>
                <div className="grid gap-3">
                  {registrations.map((reg) => {
                    const event = reg.event as any
                    return (
                      <Card key={reg.id} className="py-0 gap-0 rounded-lg shadow-none">
                        <CardContent className="flex items-center justify-between gap-3 p-3">
                          <div>
                            <p className="font-semibold text-primary">{event?.name || t.unknown_event}</p>
                            <p className="text-sm text-muted-foreground">{t.tasks_confirm_attendance}</p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/events/${event?.id}`}>{t.view_details}</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" />
              {t.tasks_hint}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
