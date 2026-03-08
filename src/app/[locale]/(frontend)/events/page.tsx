import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Carousel from '@/components/Carousel'
import EventCard from '@/components/EventCard'
import { mapPayloadEvent } from '@/libs/event'
import { getDictionary } from '@/i18n/server'
import { Locale } from '@/i18n/config'

export const metadata: Metadata = {
  title: 'Events | RASS',
  description: 'Browse upcoming and past events from the Ramathibodi Surgical Society.',
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params as { locale: Locale }
  const t = (await getDictionary(locale)).events
  const payload = await getPayload({ config })
  const now = new Date().toISOString()

  // Fetch upcoming events
  const { docs: upcomingEvents } = await payload.find({
    collection: 'events',
    where: {
      date_begin: {
        greater_than_equal: now,
      },
      is_visible: {
        equals: true,
      },
    },
    sort: 'date_begin',
    limit: 20,
  })

  // Fetch past events
  const { docs: pastEvents } = await payload.find({
    collection: 'events',
    where: {
      date_begin: {
        less_than: now,
      },
      is_visible: {
        equals: true,
      },
    },
    sort: '-date_begin',
    limit: 20,
  })

  const mappedUpcomingEvents = upcomingEvents.map(mapPayloadEvent)
  const mappedPastEvents = pastEvents.map(mapPayloadEvent)

  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-center items-center relative mb-8 pt-8">
        <h2 className="text-5xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-300% animate-gradient">
          Events
        </h2>
      </div>

      <section className="container px-4 md:px-12">
        <h3 className="text-3xl font-bold mb-8 pl-2 border-l-4 border-primary">{t.upcoming}</h3>
        {mappedUpcomingEvents.length > 0 ? (
          <Carousel
            slides={mappedUpcomingEvents.map((event) => (
              <div key={event.id} className="h-full">
                <EventCard event={event} />
              </div>
            ))}
            options={{ align: 'start', loop: false }}
            slideClassName="md:basis-1/2 lg:basis-1/3 p-2"
          />
        ) : (
          <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/25 mx-2">
            <p className="text-muted-foreground text-xl font-medium">{t.no_upcoming}</p>
            <p className="text-muted-foreground/80 mt-2">{t.stay_tuned}</p>
          </div>
        )}
      </section>

      <section className="container px-4 md:px-12 pb-16">
        <h3 className="text-3xl font-bold mb-8 pl-2 border-l-4 border-muted-foreground">{t.past}</h3>
        {mappedPastEvents.length > 0 ? (
          <Carousel
            slides={mappedPastEvents.map((event) => (
              <div key={event.id} className="h-full">
                <EventCard event={event} />
              </div>
            ))}
            options={{ align: 'start', loop: false }}
            slideClassName="md:basis-1/2 lg:basis-1/3 p-2"
          />
        ) : (
           <div className="text-center py-16 bg-muted/10 rounded-2xl border border-dashed border-muted-foreground/25 mx-2">
            <p className="text-muted-foreground text-lg">{t.no_past}</p>
          </div>
        )}
      </section>
    </div>
  )
}
