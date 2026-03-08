import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Image from 'next/image'
import { getDictionary } from '@/i18n/server'
import { Locale } from '@/i18n/config'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const metadata: Metadata = {
  title: 'Our Team | RASS',
  description: 'Meet the current staff of Ramathibodi Surgical Society.',
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params as { locale: Locale }
  const t = (await getDictionary(locale)).team
  const payload = await getPayload({ config })

  const { docs: members } = await payload.find({
    collection: 'team-members' as any,
    where: { is_current: { equals: true } },
    sort: 'sort_order',
    depth: 2,
    limit: 50,
  })

  // Group by department (from the linked user)
  const grouped: Record<string, any[]> = {}
  const leadership: any[] = []

  for (const m of members) {
    const user = typeof m.user === 'object' ? m.user : null
    const dept = user?.department || 'other'
    const entry = { ...m, userData: user }

    // Leadership positions first (President, Vice President)
    // Assuming sort_order 1 & 2 are leadership
    if (m.sort_order !== undefined && m.sort_order < 3) {
      leadership.push(entry)
    } else {
      if (!grouped[dept]) grouped[dept] = []
      grouped[dept].push(entry)
    }
  }

  // Sort department keys if needed, or just iterate generic
  // Pre-defined order from JSON keys could be enforced if needed
  const departmentKeys = ['IA', 'EA', 'OD', 'AD', 'CC', 'PR', 'other']

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground text-xl">
          {members.length > 0 ? t.academic_year.replace('{{year}}', (members[0] as any).academic_year || '') : t.subtitle}
        </p>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/25">
          <p className="text-xl font-medium mb-2">{t.no_members}</p>
           <p className="text-sm text-muted-foreground">{t.admin_dashboard}</p>
        </div>
      ) : (
        <>
          {/* Leadership */}
          {leadership.length > 0 && (
            <section className="mb-16">
              <div className="flex justify-center gap-8 flex-wrap">
                {leadership.map((m: any) => (
                  <MemberCard key={m.id} member={m} large />
                ))}
              </div>
            </section>
          )}

          {/* Departments */}
          {departmentKeys.filter(k => grouped[k]?.length).map((dept) => (
            <section key={dept} className="mb-12">
               <div className="flex items-center gap-4 mb-8">
                 <h2 className="text-2xl font-bold text-primary">
                    {/* @ts-ignore */}
                    {t.departments[dept] || dept}
                 </h2>
                 <div className="h-px bg-border flex-grow"></div>
               </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {grouped[dept].map((m: any) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {/* Link to past team */}
      <div className="text-center mt-16 pt-8 border-t border-border">
        <a href="/team/past" className="text-muted-foreground hover:text-primary underline underline-offset-4 font-medium transition-colors">
          {t.hall_of_fame} →
        </a>
      </div>
    </div>
  )
}

function MemberCard({ member, large }: { member: any; large?: boolean }) {
  const user = member.userData
  const name = user ? `${user.name_english?.first_name || ''} ${user.name_english?.last_name || ''}`.trim() : 'Unknown'
  const imageUrl = user?.image_url

  return (
    <Card className={`overflow-hidden border-border/50 bg-card hover:shadow-lg transition-all duration-300 group ${large ? 'max-w-xs w-full' : ''}`}>
        <div className={`mx-auto rounded-full overflow-hidden bg-muted flex items-center justify-center mt-6 mb-2 box-border border-4 border-background shadow-sm ${large ? 'w-32 h-32' : 'w-24 h-24'}`}>
            {imageUrl ? (
            <Image src={imageUrl} alt={name} width={large ? 128 : 96} height={large ? 128 : 96} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
            <span className={`text-primary font-bold ${large ? 'text-4xl' : 'text-2xl'}`}>
                {name.charAt(0).toUpperCase()}
            </span>
            )}
        </div>
        <CardContent className="text-center p-4">
            <h3 className={`font-bold leading-tight mb-1 ${large ? 'text-lg' : 'text-base'}`}>{name}</h3>
            <Badge variant="secondary" className={`font-normal mb-2 ${large ? 'text-sm' : 'text-xs'}`}>
                {member.position}
            </Badge>
            {user?.name_thai?.first_name && (
                <p className="text-xs text-muted-foreground mt-1">{user.name_thai.first_name} {user.name_thai.last_name}</p>
            )}
        </CardContent>
    </Card>
  )
}
