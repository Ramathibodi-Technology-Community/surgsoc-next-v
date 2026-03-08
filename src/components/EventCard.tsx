'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@/libs/event'
import { deriveEventCta } from '@/libs/event'
import { formatEventDuration } from '@/libs/event'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/libs/utils'
import { Calendar, Clock3, MapPin, Users } from 'lucide-react'

export default function EventCard({
  event,
  className,
  ...props
}: { event: Event } & React.HTMLAttributes<HTMLElement>) {
  const cta = deriveEventCta(event)
  const hasAction = Boolean(cta)
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const durationLabel = formatEventDuration(event, {
    locale: 'en-GB',
    timeZone: 'Asia/Bangkok',
  })

  const getCtaLabel = (label: string) => {
      if (label === 'Register Now') return 'Register'
      if (label === 'Waiting List') return 'Waitlist'
      if (label === 'Registration Closed') return 'Closed'
      if (label === 'Full') return 'Full'
      if (label === 'Registered') return 'Registered'
      if (label === 'Submit Reflection') return 'Submit Reflection'
      return label
  }

  const registrationOpensAt = event.registrationOpensAt || event.opens_at
  const opensAtMs = registrationOpensAt ? new Date(registrationOpensAt).getTime() : NaN
  const isOpeningInFuture = Number.isFinite(opensAtMs) && opensAtMs > now
  const shouldShowCountdown = isOpeningInFuture && cta?.kind !== 'register'

  const formatCountdown = (targetMs: number) => {
    const diff = Math.max(0, targetMs - now)
    const totalSeconds = Math.floor(diff / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    return `${minutes}m ${seconds}s`
  }

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden border-border/50 bg-card !py-0 gap-0 transition-all duration-300 hover:shadow-lg",
        className
      )}
      {...props}
    >
      {/* Photo */}
      <div className="group relative w-full overflow-hidden aspect-video">
        {event.posterUri ? (
          <Image
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            alt={event.name}
            src={event.posterUri}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
            No Image
          </div>
        )}

        {/* Participant count badge */}
        {event.participantCount !== undefined && event.participantCount > 0 && (
          <Badge variant="secondary" className="absolute bottom-2 right-2 backdrop-blur-md bg-black/60 text-white border-none hover:bg-black/70">
            <Users className="w-3 h-3 mr-1" />
            {event.participantCount}
          </Badge>
        )}
      </div>

      <div className="flex flex-col flex-1">
        <CardHeader className="p-4 pb-2 space-y-2">
          {event.eventType && (
            <Badge variant="secondary" className="w-fit text-xs font-medium">
              {event.eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          )}
          <h4 className="text-xl font-bold leading-tight line-clamp-2 text-card-foreground">
            {event.name}
          </h4>
        </CardHeader>

        <CardContent className="p-4 py-2 flex-1 flex flex-col gap-3">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <time dateTime={event.date_begin || event.date}>{durationLabel}</time>
          </div>

          {/* Venue */}
          {event.venue && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}

          {/* Details */}
          <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
            {event.details}
          </p>

          {shouldShowCountdown && (
            <div className="mt-auto pt-2 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
              <Clock3 className="w-4 h-4" />
              <span>
                Opens in <strong>{formatCountdown(opensAtMs)}</strong>
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className={cn("p-4 pt-0 grid gap-2", hasAction ? 'grid-cols-2' : 'grid-cols-1')}>
          {cta && (
            cta.disabled ? (
              <Button disabled variant="secondary" className="w-full">
                {getCtaLabel(cta.label)}
              </Button>
            ) : (
              <Button asChild className="w-full" variant={cta.kind === 'register' ? 'default' : 'secondary'}>
                <Link href={cta.href ?? `/events/${event.id}`}>
                   {getCtaLabel(cta.label)}
                </Link>
              </Button>
            )
          )}
          <Button asChild variant="outline" className="w-full hover:bg-secondary/50">
            <Link href={`/events/${event.id}`}>
               See More
            </Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  )
}
