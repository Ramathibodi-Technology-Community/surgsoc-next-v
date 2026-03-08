import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import TeamPageContent from '@/components/TeamPageContent'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Our Team | RASS',
  description: 'Meet the current staff of Ramathibodi Surgical Society.',
}

export default async function TeamPage() {
  const payload = await getPayload({ config })

  const { docs: members } = await payload.find({
    collection: 'team-members' as any,
    overrideAccess: true,
    sort: '-academic_year,sort_order',
    depth: 2,
    limit: 100,
  })

  return <TeamPageContent members={members} />
}
