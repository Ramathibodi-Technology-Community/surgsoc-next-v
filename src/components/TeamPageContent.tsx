'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MemberData {
  id: string | number
  position: string
  academic_year: string | number
  is_current: boolean
  sort_order?: number
  user?: TeamUserData | string | number | null
  userData?: {
    name_english?: { first_name?: string; last_name?: string }
    name_thai?: { first_name?: string; last_name?: string }
    image_url?: string
    department?: string
  } | null
}

type TeamUserData = {
  name_english?: { first_name?: string; last_name?: string }
  name_thai?: { first_name?: string; last_name?: string }
  image_url?: string
  department?: string | null
}

function isUserObject(value: MemberData['user']): value is TeamUserData {
  return typeof value === 'object' && value !== null
}

function getMemberUser(member: MemberData): TeamUserData | null {
  if (isUserObject(member.user)) return member.user
  return member.userData ?? null
}

function getYearSortValue(year: string): number {
  const first4DigitMatch = year.match(/\d{4}/)?.[0]
  if (first4DigitMatch) return Number(first4DigitMatch)
  const numericYear = Number(year)
  return Number.isNaN(numericYear) ? 0 : numericYear
}

interface TeamPageContentProps {
  members: MemberData[]
}

export default function TeamPageContent({ members }: TeamPageContentProps) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null)

  // Group by department and year
  const grouped: Record<string, MemberData[]> = {}
  const leadership: MemberData[] = []
  const pastMembersByYear: Record<string, MemberData[]> = {}
  const allYears = new Set<string>()

  for (const m of members) {
    const user = getMemberUser(m)
    const dept = user?.department || 'other'
    const isCurrent = m.is_current === true

    if (isCurrent) {
      if (m.sort_order !== undefined && m.sort_order < 3) {
        leadership.push(m)
      } else {
        if (!grouped[dept]) grouped[dept] = []
        grouped[dept].push(m)
      }
    } else {
      const year = String(m.academic_year || 'Past')
      allYears.add(year)
      if (!pastMembersByYear[year]) pastMembersByYear[year] = []
      pastMembersByYear[year].push(m)
    }
  }

  const years = Array.from(allYears).sort((a, b) => getYearSortValue(b) - getYearSortValue(a))
  const departmentKeys = ['IA', 'EA', 'OD', 'AD', 'CC', 'PR', 'other']

  useEffect(() => {
    if (!selectedYear && years.length > 0) {
      setSelectedYear(years[0])
    }
  }, [selectedYear, years])

  // Filter past members by selected year
  const displayedPastMembers = selectedYear
    ? pastMembersByYear[selectedYear] || []
    : []

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">Our Team</h1>
        <p className="text-muted-foreground text-xl">
          {leadership.length > 0 || Object.keys(grouped).length > 0
            ? `Academic Year ${leadership[0]?.academic_year || Object.values(grouped)[0]?.[0]?.academic_year || new Date().getFullYear() + 543}`
            : 'Meet the current staff of Ramathibodi Surgical Society.'}
        </p>
      </div>

      {leadership.length === 0 && Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/25">
          <p className="text-xl font-medium mb-2">No active team members found.</p>
          <p className="text-sm text-muted-foreground">Add members in the admin dashboard to see them here.</p>
        </div>
      ) : (
        <>
          {/* Leadership */}
          {leadership.length > 0 && (
            <section className="mb-16">
              <div className="flex justify-center gap-8 flex-wrap">
                {leadership.map((m) => (
                  <MemberCard key={m.id} member={m} large />
                ))}
              </div>
            </section>
          )}

          {/* Departments */}
          {departmentKeys.filter((k) => grouped[k]?.length).map((dept) => (
            <section key={dept} className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-primary capitalize">{dept}</h2>
                <div className="h-px bg-border flex-grow"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {grouped[dept].map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {/* Hall of Fame / Past Staff */}
      {years.length > 0 && (
        <div className="mt-24 pt-16 border-t border-border/50">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Hall of Fame</h2>
            <p className="text-muted-foreground text-lg">Honoring the past leaders and staff of the Society.</p>

            {/* Year Selector */}
            <div className="flex justify-center mt-8">
              <Select value={selectedYear || ''} onValueChange={(value) => setSelectedYear(value || null)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      Academic Year {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedYear && displayedPastMembers.length > 0 && (
            <section className="mb-16">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 opacity-80 hover:opacity-100 transition-opacity">
                {displayedPastMembers.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            </section>
          )}

          {selectedYear && displayedPastMembers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No members found for the selected year.</p>
            </div>
          )}

          {!selectedYear && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Select a year above to view past members.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MemberCard({ member, large }: { member: MemberData; large?: boolean }) {
  const user = getMemberUser(member)
  const name = user
    ? `${user.name_english?.first_name || ''} ${user.name_english?.last_name || ''}`.trim()
    : 'Unknown'
  const imageUrl = user?.image_url

  return (
    <Card
      className={`overflow-hidden border-border/50 bg-card hover:shadow-lg transition-all duration-300 group ${
        large ? 'max-w-xs w-full' : ''
      }`}
    >
      <div
        className={`mx-auto rounded-full overflow-hidden bg-muted flex items-center justify-center mt-6 mb-2 box-border border-4 border-background shadow-sm ${
          large ? 'w-32 h-32' : 'w-24 h-24'
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
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
          <p className="text-xs text-muted-foreground mt-1">
            {user.name_thai.first_name} {user.name_thai.last_name}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
