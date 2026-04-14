
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

const ALLOWED_ROLES = [
  'visitor',
  'member',
  'staff_probation',
  'staff',
  'deputy_vp',
  'vp',
  'admin',
  'superadmin',
]
const ALLOWED_DEPARTMENTS = ['IA', 'EA', 'OD', 'AD', 'CC', 'PR']
const BULK_ASSIGN_LIMIT = 1000

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user || !user.roles?.some((r) => ['admin', 'superadmin', 'vp', 'deputy_vp'].includes(r))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { mode, groupId, userIds, filters } = await req.json()

    if (!groupId) {
      return NextResponse.json({ error: 'Missing Group ID' }, { status: 400 })
    }

    // Fetch target user docs in ONE query instead of N+1 round-trips
    let targetUsers: Array<{ id: string | number; groups?: unknown }> = []

    if (mode === 'selected' && Array.isArray(userIds) && userIds.length > 0) {
      const result = await payload.find({
        collection: 'users',
        where: { id: { in: userIds } },
        limit: Math.min(userIds.length, BULK_ASSIGN_LIMIT),
        depth: 0,
      })
      targetUsers = result.docs
    } else if (mode === 'all') {
      // Build query based on (validated) filters
      const where: any = {}
      if (
        filters?.role &&
        typeof filters.role === 'string' &&
        ALLOWED_ROLES.includes(filters.role)
      ) {
        where.roles = { contains: filters.role }
      }
      if (
        filters?.department &&
        typeof filters.department === 'string' &&
        ALLOWED_DEPARTMENTS.includes(filters.department)
      ) {
        where.department = { equals: filters.department }
      }

      const users = await payload.find({
        collection: 'users',
        where,
        limit: BULK_ASSIGN_LIMIT,
        depth: 0,
      })
      targetUsers = users.docs
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ message: 'No users to update', count: 0 }, { status: 200 })
    }

    // Filter out users who already have this group (no DB calls needed — we have the docs)
    const usersNeedingUpdate = targetUsers.filter((u) => {
      const raw = Array.isArray(u.groups) ? u.groups : []
      const currentGroups = raw.map((g) =>
        typeof g === 'object' && g !== null ? String((g as { id: unknown }).id) : String(g),
      )
      return !currentGroups.includes(String(groupId))
    })

    // Run updates in bounded parallel batches to respect Postgres connection pool
    const BATCH_SIZE = 10
    const failedIds: Array<{ id: string | number; error: string }> = []
    let successCount = 0

    for (let i = 0; i < usersNeedingUpdate.length; i += BATCH_SIZE) {
      const batch = usersNeedingUpdate.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map((u) => {
          const raw = Array.isArray(u.groups) ? u.groups : []
          const currentGroups = raw.map((g) =>
            typeof g === 'object' && g !== null ? String((g as { id: unknown }).id) : String(g),
          )
          return payload.update({
            collection: 'users',
            id: u.id,
            data: {
              groups: [...currentGroups, groupId],
            } as any,
            context: { skipGroupSync: true },
          })
        }),
      )
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          successCount += 1
        } else {
          failedIds.push({
            id: batch[idx].id,
            error: r.reason?.message ?? 'Unknown error',
          })
        }
      })
    }

    return NextResponse.json({
      success: failedIds.length === 0,
      message: `Assigned group to ${successCount} of ${targetUsers.length} users.`,
      count: successCount,
      skipped: targetUsers.length - usersNeedingUpdate.length,
      failedIds,
    })
  } catch (error) {
    payload.logger.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
