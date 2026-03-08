import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Carousel from '@/components/Carousel'
import EventCard from '@/components/EventCard'
import { mapPayloadEvent } from '@/libs/event'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Events | RASS',
  description: 'Browse upcoming and past events from the Ramathibodi Surgical Society.',
}

export default async function EventsPage() {
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
      <div className="pt-8 text-center">
        <h2 className="text-4xl font-black tracking-tight md:text-5xl">Events</h2>
        <p className="mt-3 text-muted-foreground">Browse upcoming activities and past highlights.</p>
      </div>

      <section className="container px-4 md:px-12">
        <h3 className="mb-8 text-3xl font-bold">Upcoming Events</h3>
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
          <Card className="mx-2">
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">No upcoming events at the moment.</p>
              <p className="mt-2 text-sm text-muted-foreground">More activities are being planned. Stay tuned.</p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="container px-4 md:px-12 pb-16">
        <h3 className="mb-8 text-3xl font-bold">Past Events</h3>
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
          <Card className="mx-2">
            <CardContent className="py-10 text-center text-muted-foreground">No past events found.</CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
