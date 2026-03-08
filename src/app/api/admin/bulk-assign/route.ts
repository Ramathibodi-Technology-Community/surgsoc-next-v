
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

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

    let targetUserIds: string[] = []

    if (mode === 'selected' && Array.isArray(userIds)) {
      targetUserIds = userIds
    } else if (mode === 'all') {
      // Build query based on filters
      const where: any = {}
      if (filters?.role) where.roles = { contains: filters.role }
      if (filters?.department) where.department = { equals: filters.department }

      const users = await payload.find({
        collection: 'users',
        where,
        limit: 1000,
        depth: 0,
      })
      targetUserIds = users.docs.map((u) => String(u.id))
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ message: 'No users to update' }, { status: 200 })
    }

    // Perform updates
    const results = await Promise.allSettled(
      targetUserIds.map(async (uid) => {
        const userDoc = await payload.findByID({ collection: 'users', id: uid, depth: 0 })
        const rawGroups = userDoc.groups || []
        const currentGroups = rawGroups.map((g: any) => typeof g === 'object' && g !== null ? String(g.id) : String(g))

        // Avoid duplicates
        if (currentGroups.includes(groupId)) return

        await payload.update({
          collection: 'users',
          id: uid,
          data: {
            groups: [...currentGroups, groupId],
          },
          context: { skipGroupSync: true }, // Prevent infinite loops or redundant syncs
        })
      })
    )

    const successCount = results.filter((r) => r.status === 'fulfilled').length

    return NextResponse.json({
        success: true,
        message: `Successfully assigned group to ${successCount} users.`,
        count: successCount
    })

  } catch (error) {
    payload.logger.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
