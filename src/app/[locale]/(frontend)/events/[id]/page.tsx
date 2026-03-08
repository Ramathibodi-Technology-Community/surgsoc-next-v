import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { mapPayloadEvent } from '@/libs/event'
import { deriveEventCta } from '@/libs/event'
import { formatEventDuration } from '@/libs/event'
import { EventInfoCard } from '@/components/EventInfoCard'
import { getDictionary } from '@/i18n/server'
import { Locale } from '@/i18n/config'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  MapPin,
  Tag,
  Building,
  User,
  Users,
} from 'lucide-react'

import { headers } from 'next/headers'
import { checkUserActionGate } from '@/libs/user-action-gate'
import Image from 'next/image'
import EventActions from './EventActions'
import { RichText } from '@/components/RichText'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const payload = await getPayload({ config })
  const eventDoc = await payload.findByID({ collection: 'events', id }).catch(() => null)
  return {
    title: eventDoc ? `${eventDoc.name} | RASS` : 'Event | RASS',
    description: eventDoc?.description ? String(eventDoc.description).slice(0, 155) : 'Event details',
  }
}

export default async function EventPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id, locale } = await params as { id: string, locale: Locale }
  const t = (await getDictionary(locale)).events
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  const eventDoc = await payload.findByID({
    collection: 'events',
    id: id,
    depth: 2,
  })

  if (!eventDoc) {
    notFound()
  }

  const event = mapPayloadEvent(eventDoc)
  const cta = deriveEventCta(event)

  // Unified gate: auth → profile → form blocking → scheduling
  const gate = await checkUserActionGate(payload, user, {
    resource: {
      opens_at: event.opens_at,
      closes_at: event.closes_at,
      status_override: event.status_override,
    },
    checkFormBlocking: true,
  })

  // Logic for button
  const actionConfig = (() => {
    if (!gate.allowed) {
      const isClickable = gate.reason === 'form_blocked' || gate.reason === 'profile_incomplete'
      return {
        label: gate.message,
        href: gate.redirect ?? null,
        disabled: !isClickable,
        kind: gate.reason === 'form_blocked' || gate.reason === 'profile_incomplete'
          ? 'blocked'
          : 'closed',
      }
    }

    if (cta) {
      return {
        // @ts-ignore
        label: t.actions[cta.kind] || cta.label,
        href: cta.href,
        disabled: cta.disabled ?? false,
        kind: cta.kind,
      }
    }

    if (event.eventPhase === 'ended' || new Date(event.date) < new Date()) {
      return {
        label: t.actions.feedback,
        href: `/events/${event.id}/reviews`,
        disabled: false,
        kind: 'feedback',
      }
    }

    return {
      label: t.actions.see_details,
      href: null,
      disabled: true,
      kind: 'none',
    }
  })()

  const getButtonVariant = (kind: string): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' => {
    switch (kind) {
      case 'register': return 'default'
      case 'reflect': return 'secondary'
      case 'feedback': return 'outline'
      case 'blocked': return 'destructive'
      case 'closed': return 'ghost'
      default: return 'default'
    }
  }

  const localeStr = locale === 'th' ? 'th-TH' : 'en-GB'
  const durationValue = formatEventDuration(event, {
    locale: localeStr,
    timeZone: 'Asia/Bangkok',
    includeWeekday: true,
    fallback: t.tba,
  })

  return (
    <section className="mx-auto max-w-6xl animate-in fade-in px-4 py-6 duration-500 sm:px-6">
      <div className="mb-4">
        <Button variant="ghost" asChild className="pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-primary">
          <Link href="/events">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back_to_events}
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-5 flex flex-col gap-2">
        <h1 className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-2xl font-semibold text-transparent md:text-4xl">
          {event.name}
        </h1>
        <div className="flex flex-wrap gap-2">
          {event.eventType && (
            <Badge variant="secondary" className="capitalize">{event.eventType.replace(/_/g, ' ')}</Badge>
          )}
          {event.department && (
            <Badge variant="outline" className="capitalize">{event.department}</Badge>
          )}
        </div>
      </div>

      <div className="relative mb-6 aspect-[16/6] overflow-hidden rounded-xl border border-border/50 bg-muted">
        <Image
          className="object-cover"
          alt={event.name}
          src={event.posterUri}
          fill
          sizes="(max-width: 1280px) 100vw, 1200px"
        />
      </div>

      <article className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Action */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-center">
            {/* CTA Section */}
            {actionConfig.kind === 'confirm' || actionConfig.kind === 'confirmed' ? (
                <EventActions
                    eventId={event.id}
                    primaryAction={{
                        label: actionConfig.label,
                        kind: actionConfig.kind,
                        disabled: actionConfig.disabled
                    }}
                    secondaryAction={cta?.secondaryAction}
                />
            ) : (
                actionConfig.disabled || !actionConfig.href ? (
                <Button disabled className="h-10 w-full text-base">
                        {actionConfig.label}
                    </Button>
                ) : (
                    <Button
                        asChild
                  className="h-10 w-full text-base"
                        variant={getButtonVariant(actionConfig.kind || 'default')}
                    >
                        <Link href={actionConfig.href}>
                            {actionConfig.label}
                        </Link>
                    </Button>
                )
            )}

            {actionConfig.disabled && actionConfig.kind !== 'confirmed' && (
              <p className="text-xs text-muted-foreground">
                {/* @ts-ignore */}
                {t.actions[actionConfig.kind] || t.actions.closed}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Description */}
          <div className="prose prose-base dark:prose-invert max-w-none">
            <h3 className="mb-3 text-lg font-semibold">{t.about_event}</h3>
            <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{event.details}</p>
          </div>

          {/* Hidden participant details — only for confirmed users */}
          {event.user_status === 'confirmed' && event.participantDetail && (
            <div className="animate-in slide-in-from-bottom-4 fade-in rounded-lg border border-primary/20 bg-primary/5 p-4 duration-700">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary">
                    <User className="w-5 h-5" />
                    Participant Details
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <RichText content={event.participantDetail} />
                </div>
            </div>
          )}

          {/* Key Info Grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <EventInfoCard
              label={t.duration}
              value={
                <time dateTime={event.date_begin || event.date}>
                  {durationValue}
                </time>
              }
              icon={<Calendar className="w-4 h-4" />}
              className="rounded-lg py-0 gap-0 shadow-none"
            />
            <EventInfoCard
              label={t.venue}
              value={event.venue || t.tba}
              icon={<MapPin className="w-4 h-4" />}
              className="rounded-lg py-0 gap-0 shadow-none"
            />
            {event.eventType && (
              <EventInfoCard
                label={t.event_type}
                value={<span className="capitalize">{event.eventType.replace(/_/g, ' ')}</span>}
                icon={<Tag className="w-4 h-4" />}
                className="rounded-lg py-0 gap-0 shadow-none"
              />
            )}
            {event.department && (
              <EventInfoCard
                label={t.department}
                value={<span className="capitalize">{event.department}</span>}
                icon={<Building className="w-4 h-4" />}
                className="rounded-lg py-0 gap-0 shadow-none"
              />
            )}
            {event.coordinatorName && (
              <EventInfoCard
                label={t.coordinator}
                value={event.coordinatorName}
                icon={<User className="w-4 h-4" />}
                className="rounded-lg py-0 gap-0 shadow-none"
              />
            )}
            <EventInfoCard
              label={t.participant_limit}
              value={event.participantLimit ? String(event.participantLimit) : t.unlimited}
              icon={<Users className="w-4 h-4" />}
              className="rounded-lg py-0 gap-0 shadow-none"
            />
            {event.registrationOpensAt && (
              <EventInfoCard
                label={t.registration_opens}
                value={new Date(event.registrationOpensAt).toLocaleString(localeStr, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                  timeZone: 'Asia/Bangkok',
                })}
                icon={<CalendarClock className="w-4 h-4" />}
                className="rounded-lg py-0 gap-0 shadow-none"
              />
            )}
          </div>

        </div>
      </article>
    </section>
  )
}
