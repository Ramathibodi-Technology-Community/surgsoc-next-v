
import type { User, Group } from '@/payload-types'

export type Permission =
  | 'manage_events'
  | 'manage_forms'
  | 'manage_users'
  | 'view_users'
  | 'export_data'
  | 'manage_content' // for CMS

export function hasGroup(user: User | null | undefined, groupSlug: string): boolean {
  if (!user || !user.groups) return false

  return user.groups.some((g) => {
    if (typeof g === 'string') return false // Should be populated
    if (typeof g === 'number') return false
    return (g as Group).slug === groupSlug
  })
}

export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user || !user.groups) return false

  // Superadmin has all permissions
  if (user.roles?.includes('superadmin') || hasGroup(user, 'superadmin')) {
      return true
  }

  // Admin has all permissions? Maybe.
  if (user.roles?.includes('admin') || hasGroup(user, 'admin')) {
      return true
  }

  return user.groups.some((g) => {
    if (typeof g === 'string' || typeof g === 'number') return false
    const group = g as Group
    const perms = group.permissions as Record<string, boolean> | undefined
    return perms?.[permission] === true
  })
}

export function canInteractAsMember(user: User | null | undefined): boolean {
  if (!user || !user.roles || user.roles.length === 0) return false

  return user.roles.some((role) =>
    ['member', 'staff_probation', 'staff', 'deputy_vp', 'vp', 'admin', 'superadmin'].includes(role)
  )
}
