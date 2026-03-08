
import type { CollectionBeforeChangeHook } from 'payload'

// ── Role → group slug mapping ────────────────────────
// A single user role may map to multiple group slugs
const ROLE_GROUP_SLUGS: Record<string, string[]> = {
  visitor:         ['visitor'],
  member:          ['member'],
  staff_probation: ['staff'],
  staff:           ['staff'],
  vp:              ['staff'],
  admin:           ['admin'],
  superadmin:      ['superadmin'],
}

// ── Department → group slug mapping ──────────────────
const DEPT_SLUG_MAP: Record<string, string> = {
  IA: 'dept-ia', EA: 'dept-ea', OD: 'dept-od',
  AD: 'dept-ad', CC: 'dept-cc', PR: 'dept-pr',
}

// ── Year → group slug mapping ────────────────────────
const YEAR_SLUG_MAP: Record<string, string> = {
  M_Eng_M_M: 'year-m-eng-m-m',
  Year_1: 'year-1', Year_2: 'year-2', Year_3: 'year-3',
  Year_4: 'year-4', Year_5: 'year-5', Year_6: 'year-6',
}

// ── Track → group slug mapping ───────────────────────
const TRACK_SLUG_MAP: Record<string, string> = {
  MD: 'track-md',
  MD_MEng: 'track-md-meng',
  MD_MM: 'track-md-mm',
  RAK: 'track-rak',
}

// All auto-managed group types (everything except 'access')
const AUTO_GROUP_TYPES = ['system', 'role', 'department', 'year', 'track']

export const syncUserGroups: CollectionBeforeChangeHook = async ({
  data, originalDoc, req: { payload, context }, operation,
}) => {
  if (operation !== 'update' && operation !== 'create') return data
  if (context?.skipGroupSync) return data

  // For partial updates, merge data with originalDoc
  const roles = data.roles !== undefined ? data.roles : (originalDoc?.roles || [])
  const department = data.department !== undefined ? data.department : originalDoc?.department
  const academicYear = data.academic?.year !== undefined ? data.academic?.year : originalDoc?.academic?.year
  const academicTrack = data.academic?.track !== undefined ? data.academic?.track : originalDoc?.academic?.track

  const inputGroups = data.groups !== undefined ? data.groups : (originalDoc?.groups || [])

  // 1. Current group IDs on the user
  const currentGroupIds: number[] = (inputGroups || []).map(
    (g: any) => typeof g === 'object' ? g.id : g
  )

  // 2. Fetch ALL auto-managed groups (system, role, department, year)
  // using find to get their IDs
  const autoGroups = await payload.find({
    collection: 'groups',
    where: { type: { in: AUTO_GROUP_TYPES } },
    limit: 100,
  })

  // 3. Keep only "manual" groups (type: 'access' or any future custom type)
  const manualGroupIds = currentGroupIds.filter(
    id => !autoGroups.docs.some(g => g.id === id)
  )

  // 4. Build target slugs from user fields
  const targetSlugs: string[] = []

  if (roles && Array.isArray(roles)) {
    for (const role of roles) {
      const slugs = ROLE_GROUP_SLUGS[role]
      if (slugs) targetSlugs.push(...slugs)
    }
  }

  if (department && DEPT_SLUG_MAP[department]) {
    targetSlugs.push(DEPT_SLUG_MAP[department])
  }

  if (academicYear && YEAR_SLUG_MAP[academicYear]) {
    targetSlugs.push(YEAR_SLUG_MAP[academicYear])
  }

  if (academicTrack && TRACK_SLUG_MAP[academicTrack]) {
    targetSlugs.push(TRACK_SLUG_MAP[academicTrack])
  }

  // Deduplicate
  const uniqueSlugs = [...new Set(targetSlugs)]

  // 5. Resolve slugs → group IDs
  const newAutoGroupIds = autoGroups.docs
    .filter(g => uniqueSlugs.includes(g.slug))
    .map(g => g.id)

  const finalGroupIds = [...manualGroupIds, ...newAutoGroupIds]

  // Add the synced groups to the document data before it is saved
  data.groups = finalGroupIds

  return data
}

