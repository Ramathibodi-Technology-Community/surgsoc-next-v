import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import Carousel from '@/components/Carousel'
import EventCard from '@/components/EventCard'
import { mapPayloadEvent } from '@/libs/event'
import { Button } from '@/components/ui/button'
import { getHomeContent } from '@/libs/site-content'

import { getDictionary } from '@/i18n/server'
import { Locale } from '@/i18n/config'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params as { locale: Locale }
  const t = (await getDictionary(locale)).events
  const payload = await getPayload({ config })
  const homeContent = await getHomeContent()

  // Fetch upcoming events (seed data is future-dated)
  const { docs: upcomingEvents } = await payload.find({
    collection: 'events',
    where: {
      is_visible: {
        equals: true,
      },
    },
    sort: '-date_begin',
    limit: 9,
    depth: 2,
  })

  const mappedEvents = upcomingEvents.map(mapPayloadEvent)

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex justify-center items-center py-20 md:py-28 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center max-w-4xl">
          <p className="text-muted-foreground text-sm md:text-base mb-4 tracking-[0.2em] uppercase font-medium">
            {t.welcome_to}
          </p>
          <h1 className="font-script text-5xl md:text-7xl lg:text-8xl text-primary drop-shadow-md mb-6">Ramathibodi Surgical Society</h1>

          <p className="mx-auto max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
            A home for learners and leaders in surgery, built around excellence, service, and collaboration.
          </p>

          <div className="flex justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards">
            <Button asChild size="lg">
              <Link href="/events">Explore Events</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/team">Meet the Team</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Story Sections */}
      <section className="py-10 md:py-14 mb-16 px-4">
        <div className="container space-y-6">
          {homeContent.sections.map((section, index) => {
            const imageSrc = section.imageUrl?.trim() || '/assets/beta.jpg'
            const reverse = index % 2 === 1

            return (
              <article
                key={`${section.heading}-${index}`}
                className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center rounded-3xl border border-border/70 bg-card/70 p-6 md:p-10 backdrop-blur-sm ${
                  reverse ? 'md:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-border/60 shadow-xl">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    src={imageSrc}
                    alt={section.heading}
                  />
                </div>
                <div className="space-y-4">
                  {section.kicker && (
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{section.kicker}</p>
                  )}
                  <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-tight">{section.heading}</h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">{section.body}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* Events Gallery */}
      <section className="container px-4 md:px-12 mb-16">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Section</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Events</h2>
          </div>
          <Button asChild variant="ghost" className="text-primary">
            <Link href="/events">{t.see_more} &rarr;</Link>
          </Button>
        </div>

        {mappedEvents.length > 0 ? (
          <Carousel
            slides={mappedEvents.map((event) => (
              <div key={event.id} className="h-full p-2">
                <EventCard event={event} />
              </div>
            ))}
            options={{ align: 'start', loop: false }}
            slideClassName="md:basis-1/2 lg:basis-1/3 p-2"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/25">
             <p className="text-muted-foreground text-lg">{t.no_upcoming}</p>
          </div>
        )}
      </section>
    </div>
  )
}

