import type { Metadata } from 'next'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Hall of Fame | RASS',
  description: 'History of past staff and leaders of Ramathibodi Surgical Society.',
}

type TeamMemberDoc = {
  id: string | number
  position?: string
  academic_year?: string | number
  user?: {
    name_english?: { first_name?: string; last_name?: string }
    name_thai?: { first_name?: string; last_name?: string }
    image_url?: string
  } | string | number | null
}

function getName(member: TeamMemberDoc): string {
  if (!member.user || typeof member.user !== 'object') return 'Unknown'
  const first = member.user.name_english?.first_name ?? ''
  const last = member.user.name_english?.last_name ?? ''
  const full = `${first} ${last}`.trim()
  return full || 'Unknown'
}

export default async function TeamPastPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'team-members' as any,
    where: { is_current: { equals: false } },
    sort: '-academic_year,sort_order',
    depth: 2,
    limit: 500,
  })

  const members = docs as TeamMemberDoc[]

  return (
    <section className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-8">
        <Link href={`/${locale}/team`} className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4">
          Back to Current Team
        </Link>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-black tracking-tight">Hall of Fame</h1>
        <p className="text-muted-foreground mt-3">Past leaders and staff of Ramathibodi Surgical Society.</p>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/25">
          <p className="text-lg font-medium">No Hall of Fame records yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {members.map((member) => {
            const name = getName(member)
            const user = member.user && typeof member.user === 'object' ? member.user : null
            return (
              <article key={member.id} className="rounded-xl border border-border/50 bg-card p-4 text-center">
                <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                  {user?.image_url ? (
                    <Image
                      src={user.image_url}
                      alt={name}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-primary font-bold text-xl">{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h2 className="font-semibold text-sm leading-tight">{name}</h2>
                <p className="text-xs text-muted-foreground mt-1">{member.position || 'Team Member'}</p>
                <p className="text-xs text-muted-foreground">{member.academic_year ? `AY ${member.academic_year}` : ''}</p>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
