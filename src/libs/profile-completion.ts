import type { User } from '@/payload-types'

const REQUIRED_PROFILE_FIELDS = [
  { path: 'name_thai.first_name', label: 'Thai First Name' },
  { path: 'name_thai.last_name', label: 'Thai Last Name' },
  { path: 'academic.student_id', label: 'Student ID' },
] as const

function getFieldValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (current, key) =>
      current != null && typeof current === 'object'
        ? (current as Record<string, unknown>)[key]
        : undefined,
    obj,
  )
}

function isFieldFilled(value: unknown): boolean {
  if (value == null || value === '') return false
  if (typeof value === 'string' && value.startsWith('TEMP_')) return false
  return true
}

export function isProfileComplete(user: User | null | undefined): boolean {
  if (!user) return false
  return REQUIRED_PROFILE_FIELDS.every(({ path }) =>
    isFieldFilled(getFieldValue(user as unknown as Record<string, unknown>, path)),
  )
}

export function getMissingProfileFields(user: User): string[] {
  const missing: string[] = []
  for (const { path, label } of REQUIRED_PROFILE_FIELDS) {
    if (!isFieldFilled(getFieldValue(user as unknown as Record<string, unknown>, path))) {
      missing.push(label)
    }
  }
  return missing
}

export function getMissingProfileFieldsFromData(data: Record<string, unknown>): string[] {
  const missing: string[] = []
  for (const { path, label } of REQUIRED_PROFILE_FIELDS) {
    if (!isFieldFilled(getFieldValue(data, path))) {
      missing.push(label)
    }
  }
  return missing
}
