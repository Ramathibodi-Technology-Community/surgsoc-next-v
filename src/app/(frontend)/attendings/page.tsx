import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Attending Physicians | RASS',
  description: 'Our advisor physicians at Ramathibodi Surgical Society.',
}

export default async function AttendingsPage() {
  const locale: string = 'en'
  const payload = await getPayload({ config })

  const getAttendingTitle = (title: unknown): string => {
    if (typeof title === 'string') return title
    if (!title || typeof title !== 'object') return ''

    const record = title as Record<string, unknown>
    if (locale === 'th' && typeof record.title_thai === 'string' && record.title_thai.trim()) {
      return record.title_thai
    }
    if (locale !== 'th' && typeof record.title_english === 'string' && record.title_english.trim()) {
      return record.title_english
    }

    if (typeof record.name === 'string') return record.name
    if (typeof record.title_english === 'string') return record.title_english
    if (typeof record.title_thai === 'string') return record.title_thai
    return ''
  }

  const { docs: attendings } = await payload.find({
    collection: 'attendings' as any,
    where: { is_visible: { equals: true } },
    sort: 'sort_order',
    limit: 50,
  })

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-black">Attending Physicians</h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Meet our esteemed advisor physicians at Ramathibodi Surgical Society.</p>
      </div>

      {attendings.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/25">
          <p className="text-xl font-medium mb-2">No attendings found.</p>
          <p className="text-sm text-muted-foreground">Add attending physicians in the admin dashboard to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {attendings.map((att: any) => (
            <Card key={att.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-card group">
              {/* Photo */}
              <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                {att.image_url ? (
                  <img src={att.image_url} alt={att.display_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center text-primary text-4xl font-bold">
                    {att.name_english?.first_name?.charAt(0) || att.name_thai?.first_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">
                  {getAttendingTitle(att.title) || 'Attending Physician'}
                </p>
                <h3 className="text-xl font-bold leading-tight mb-1 text-card-foreground">
                  {att.name_english?.first_name} {att.name_english?.last_name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 font-medium">
                  {att.name_thai?.first_name} {att.name_thai?.last_name}
                </p>

                {att.specialty && (
                  <Badge variant="secondary" className="mb-4 font-normal">
                    {att.specialty.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </Badge>
                )}

                {att.contact?.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-4 border-t border-border/50">
                    <Mail className="w-3.5 h-3.5" />
                    {att.contact.email}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
