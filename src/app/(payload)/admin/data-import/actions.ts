'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { hasPermission } from '@/libs/permissions'
import type { User } from '@/payload-types'
import { getMissingProfileFieldsFromData } from '@/libs/profile-completion'

type CollectionStats = {
  created: number
  updated: number
  skipped: number
  failed: number
}

type ImportState = {
  ok: boolean
  message: string
  details: string[]
  stats: Record<string, CollectionStats>
}

type ImportEntity = 'users' | 'events' | 'forms' | 'form-submissions'
type InputFormat = 'json' | 'csv'
type RowRecord = Record<string, string>

const INITIAL_STATS: CollectionStats = { created: 0, updated: 0, skipped: 0, failed: 0 }

const ALLOWED_USER_ROLES = new Set([
  'visitor',
  'member',
  'staff_probation',
  'staff',
  'deputy_vp',
  'vp',
  'admin',
  'superadmin',
])

const ALLOWED_EVENT_TYPES = new Set([
  'special_lecture',
  'conference',
  'workshop_observe',
  'workshop_assistant',
  'workshop_full',
  'exchange',
  'volunteer',
  'event',
  'inspirational',
])

const ALLOWED_DEPARTMENTS = new Set(['IA', 'EA', 'OD', 'AD', 'CC', 'PR'])
const ALLOWED_STATUS_OVERRIDE = new Set(['auto', 'open', 'closed'])
const ALLOWED_CONFIRMATION_TYPES = new Set(['message', 'redirect'])

function createInitialState(message = 'Provide JSON and submit import.'): ImportState {
  return {
    ok: true,
    message,
    details: [],
    stats: {},
  }
}

function addStat(stats: Record<string, CollectionStats>, collection: string, patch: Partial<CollectionStats>) {
  const current = stats[collection] || { ...INITIAL_STATS }
  stats[collection] = {
    created: current.created + (patch.created || 0),
    updated: current.updated + (patch.updated || 0),
    skipped: current.skipped + (patch.skipped || 0),
    failed: current.failed + (patch.failed || 0),
  }
}

async function ensureImportPermission(payload: any): Promise<User | null> {
  const headerList = await headers()
  const { user } = await payload.auth({ headers: headerList })

  if (!user || !hasPermission(user as User, 'manage_users')) {
    return null
  }

  return user as User
}

function getImportEntity(formData: FormData): ImportEntity {
  const value = String(formData.get('entityType') || '').trim()
  if (value === 'users' || value === 'events' || value === 'forms' || value === 'form-submissions') {
    return value
  }

  throw new Error('Invalid import type selected.')
}

function getInputFormat(formData: FormData): InputFormat {
  const value = String(formData.get('inputFormat') || '').trim()
  if (value === 'json' || value === 'csv') return value
  throw new Error('Invalid input format selected.')
}

async function getRawTextFromFormData(formData: FormData): Promise<string> {
  const inlineText = String(formData.get('payloadText') || '').trim()
  const file = formData.get('payloadFile')

  let rawText = inlineText

  if (!rawText && file instanceof File && file.size > 0) {
    rawText = await file.text()
  }

  return rawText
}

function cleanDoc(input: Record<string, unknown>): Record<string, unknown> {
  const {
    id,
    _id,
    createdAt,
    updatedAt,
    __v,
    passwordResetToken,
    passwordResetExpiration,
    resetPasswordToken,
    resetPasswordExpiration,
    ...rest
  } = input

  void id
  void _id
  void createdAt
  void updatedAt
  void __v
  void passwordResetToken
  void passwordResetExpiration
  void resetPasswordToken
  void resetPasswordExpiration

  return rest
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return undefined
  const v = value.trim().toLowerCase()
  if (['true', '1', 'yes', 'y'].includes(v)) return true
  if (['false', '0', 'no', 'n'].includes(v)) return false
  return undefined
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  const n = Number(value.trim())
  return Number.isFinite(n) ? n : undefined
}

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean)
  if (typeof value !== 'string') return []
  const separator = value.includes('|') ? '|' : ','
  return value
    .split(separator)
    .map((v) => v.trim())
    .filter(Boolean)
}

function parseJSONValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return undefined

  try {
    return JSON.parse(trimmed)
  } catch {
    return undefined
  }
}

function textToLexical(text: string) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: text
            ? [
                {
                  type: 'text',
                  text,
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  version: 1,
                },
              ]
            : [],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  const pushCell = () => {
    row.push(cell)
    cell = ''
  }

  const pushRow = () => {
    if (row.length === 1 && row[0].trim() === '') {
      row = []
      return
    }
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    const next = text[i + 1]

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && ch === ',') {
      pushCell()
      continue
    }

    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      pushCell()
      pushRow()
      if (ch === '\r' && next === '\n') i += 1
      continue
    }

    cell += ch
  }

  if (cell.length > 0 || row.length > 0) {
    pushCell()
    pushRow()
  }

  return rows
}

function csvRowsToObjects(text: string): RowRecord[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []

  const rawHeaders = rows[0]
  const headers = rawHeaders.map((h, idx) => {
    const header = h.trim().replace(/^\uFEFF/, '')
    return header || `column_${idx + 1}`
  })

  const docs: RowRecord[] = []
  for (let i = 1; i < rows.length; i += 1) {
    const values = rows[i]
    const record: RowRecord = {}

    headers.forEach((header, idx) => {
      record[header] = (values[idx] || '').trim()
    })

    const hasValue = Object.values(record).some((v) => v.length > 0)
    if (hasValue) docs.push(record)
  }

  return docs
}

function parseJSONDocsByEntity(raw: unknown, entity: ImportEntity): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter((row) => row && typeof row === 'object' && !Array.isArray(row)) as Record<string, unknown>[]
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('JSON input must be an array or an object containing an array.')
  }

  const root = raw as Record<string, unknown>
  const aliases = {
    users: ['users'],
    events: ['events'],
    forms: ['forms'],
    'form-submissions': ['formSubmissions', 'form-submissions'],
  }[entity]

  for (const key of aliases) {
    const value = root[key]
    if (Array.isArray(value)) {
      return value.filter((row) => row && typeof row === 'object' && !Array.isArray(row)) as Record<string, unknown>[]
    }
  }

  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    const dataRoot = root.data as Record<string, unknown>
    for (const key of aliases) {
      const value = dataRoot[key]
      if (Array.isArray(value)) {
        return value.filter((row) => row && typeof row === 'object' && !Array.isArray(row)) as Record<string, unknown>[]
      }
    }
  }

  throw new Error(`Could not find a JSON array for ${entity}.`)
}

function normalizeUsersFromCSV(rows: RowRecord[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const roles = parseList(row.roles)
    const doc: Record<string, unknown> = {
      email: row.email,
      password: row.password || undefined,
      roles: roles.length > 0 ? roles : ['visitor'],
      department: row.department || undefined,
      dob: row.dob || undefined,
      image_url: row.image_url || undefined,
      google_id: row.google_id || undefined,
    }

    const nameThai = {
      first_name: row.name_thai_first_name || undefined,
      last_name: row.name_thai_last_name || undefined,
      nickname: row.name_thai_nickname || undefined,
    }
    if (nameThai.first_name || nameThai.last_name || nameThai.nickname) doc.name_thai = nameThai

    const nameEnglish = {
      first_name: row.name_english_first_name || undefined,
      last_name: row.name_english_last_name || undefined,
      nickname: row.name_english_nickname || undefined,
    }
    if (nameEnglish.first_name || nameEnglish.last_name || nameEnglish.nickname) doc.name_english = nameEnglish

    const academic = {
      student_id: row.student_id || undefined,
      track: row.track || undefined,
      year: row.year || undefined,
    }
    if (academic.student_id || academic.track || academic.year) doc.academic = academic

    const contact = {
      line_id: row.line_id || undefined,
      phone_number: row.phone_number || undefined,
    }
    if (contact.line_id || contact.phone_number) doc.contact = contact

    return cleanDoc(doc)
  })
}

function normalizeEventsFromCSV(rows: RowRecord[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const parsedVisible = parseBoolean(row.is_visible)
    const parsedClosed = parseBoolean(row.is_registration_closed)
    const parsedAutoPromote = parseBoolean(row.auto_promote)
    const parsedReflectionOpen = parseBoolean(row.is_reflection_open)
    const parsedParticipantLimit = parseNumber(row.participant_limit)
    const parsedMaxWaitingList = parseNumber(row.max_waiting_list)
    const parsedLocation = parseNumber(row.location)
    const parsedSubscriptionForm = parseNumber(row.subscription_form)
    const parsedReflectionForm = parseNumber(row.reflection_form)
    const parsedLoaForm = parseNumber(row.loa_form)
    const parsedOwner = parseNumber(row.owner)
    const parsedCoordinator = parseNumber(row.coordinator)
    const locationValue = parsedLocation ?? (row.location || undefined)
    const subscriptionFormValue = parsedSubscriptionForm ?? (row.subscription_form || undefined)
    const reflectionFormValue = parsedReflectionForm ?? (row.reflection_form || undefined)
    const loaFormValue = parsedLoaForm ?? (row.loa_form || undefined)
    const ownerValue = parsedOwner ?? (row.owner || undefined)
    const coordinatorValue = parsedCoordinator ?? (row.coordinator || undefined)

    return cleanDoc({
      name: row.name,
      event_type: row.event_type || undefined,
      department: row.department || undefined,
      date_begin: row.date_begin || undefined,
      date_end: row.date_end || undefined,
      location: locationValue,
      image_url: row.image_url || undefined,
      description: row.description || undefined,
      is_visible: parsedVisible,
      subscription_form: subscriptionFormValue,
      registration_opens_at: row.registration_opens_at || undefined,
      registration_closes_at: row.registration_closes_at || undefined,
      participant_limit: parsedParticipantLimit,
      is_registration_closed: parsedClosed,
      status_override: row.status_override || undefined,
      auto_promote: parsedAutoPromote,
      max_waiting_list: parsedMaxWaitingList,
      is_reflection_open: parsedReflectionOpen,
      reflection_form: reflectionFormValue,
      loa_form: loaFormValue,
      owner: ownerValue,
      coordinator: coordinatorValue,
    })
  })
}

function normalizeFormsFromCSV(rows: RowRecord[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const fields = parseJSONValue(row.fields_json)
    const emails = parseJSONValue(row.emails_json)
    const closedMessage = parseJSONValue(row.closed_message_json)
    const responseLimit = parseNumber(row.response_limit)
    const acceptResponses = parseBoolean(row.accept_responses)

    const confirmationType = row.confirmation_type || undefined
    const confirmationMessageText = row.confirmation_message_text || ''
    const redirectURL = row.redirect_url || ''

    return cleanDoc({
      title: row.title,
      submitButtonLabel: row.submit_button_label || undefined,
      confirmationType,
      confirmationMessage: confirmationMessageText ? textToLexical(confirmationMessageText) : undefined,
      redirect: redirectURL ? { url: redirectURL } : undefined,
      fields: Array.isArray(fields) ? fields : undefined,
      emails: Array.isArray(emails) ? emails : undefined,
      accept_responses: acceptResponses,
      response_deadline: row.response_deadline || undefined,
      response_limit: responseLimit,
      closed_message: closedMessage,
    })
  })
}

function normalizeFormSubmissionsFromCSV(rows: RowRecord[]): Record<string, unknown>[] {
  const grouped = new Map<string, Record<string, unknown>>()

  rows.forEach((row, index) => {
    const submissionGroup = row.submission_group || `row-${index + 1}`
    const existing = grouped.get(submissionGroup)

    const parsedForm = parseNumber(row.form)
    const parsedUser = parseNumber(row.user)
    const parsedSubmissionData = parseJSONValue(row.submissionData_json)

    if (existing) {
      const submissionData = (existing.submissionData as Array<{ field: string; value: string }>) || []
      if (!Array.isArray(parsedSubmissionData) && row.field) {
        submissionData.push({ field: row.field, value: row.value || '' })
      }
      existing.submissionData = submissionData
      return
    }

    const formValue = parsedForm ?? (row.form || undefined)
    const userValue = parsedUser ?? (row.user || undefined)

    const doc: Record<string, unknown> = {
      form: formValue,
      user: userValue,
      submissionData: [],
    }

    if (Array.isArray(parsedSubmissionData)) {
      doc.submissionData = parsedSubmissionData
    } else if (row.field) {
      doc.submissionData = [{ field: row.field, value: row.value || '' }]
    }

    grouped.set(submissionGroup, cleanDoc(doc))
  })

  return Array.from(grouped.values())
}

function normalizeDocsByEntity(entity: ImportEntity, format: InputFormat, rawText: string): Record<string, unknown>[] {
  if (format === 'json') {
    const parsed = JSON.parse(rawText)
    return parseJSONDocsByEntity(parsed, entity).map((doc) => cleanDoc(doc))
  }

  const rows = csvRowsToObjects(rawText)
  if (entity === 'users') return normalizeUsersFromCSV(rows)
  if (entity === 'events') return normalizeEventsFromCSV(rows)
  if (entity === 'forms') return normalizeFormsFromCSV(rows)
  return normalizeFormSubmissionsFromCSV(rows)
}

function validateUsers(rows: Record<string, unknown>[], details: string[], stats: Record<string, CollectionStats>): boolean {
  let hasFailures = false

  rows.forEach((row, index) => {
    addStat(stats, 'users', { skipped: 1 })
    const rowLabel = `users row ${index + 1}`

    const email = typeof row.email === 'string' ? row.email.trim() : ''
    if (!email) {
      addStat(stats, 'users', { skipped: -1, failed: 1 })
      details.push(`${rowLabel}: missing required \`email\`.`)
      hasFailures = true
      return
    }

    const roles = parseList(row.roles)
    for (const role of roles) {
      if (!ALLOWED_USER_ROLES.has(role)) {
        addStat(stats, 'users', { skipped: -1, failed: 1 })
        details.push(`${rowLabel}: invalid role \`${role}\`.`)
        hasFailures = true
        return
      }
    }

    const missing = getMissingProfileFieldsFromData(row)
    if (missing.length > 0 && roles.some((role) => role !== 'visitor')) {
      addStat(stats, 'users', { skipped: -1, failed: 1 })
      details.push(`${rowLabel}: incomplete non-visitor profile (${missing.join(', ')}).`)
      hasFailures = true
      return
    }
  })

  return !hasFailures
}

function validateEvents(rows: Record<string, unknown>[], details: string[], stats: Record<string, CollectionStats>): boolean {
  let hasFailures = false

  rows.forEach((row, index) => {
    addStat(stats, 'events', { skipped: 1 })
    const rowLabel = `events row ${index + 1}`

    const name = typeof row.name === 'string' ? row.name.trim() : ''
    const dateBegin = typeof row.date_begin === 'string' ? row.date_begin.trim() : ''
    const eventType = typeof row.event_type === 'string' ? row.event_type.trim() : ''
    const department = typeof row.department === 'string' ? row.department.trim() : ''
    const statusOverride = typeof row.status_override === 'string' ? row.status_override.trim() : ''

    if (!name || !dateBegin || !eventType) {
      addStat(stats, 'events', { skipped: -1, failed: 1 })
      details.push(`${rowLabel}: missing required \`name\`, \`event_type\`, or \`date_begin\`.`)
      hasFailures = true
      return
    }

    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      addStat(stats, 'events', { skipped: -1, failed: 1 })
      details.push(`${rowLabel}: invalid \`event_type\` \`${eventType}\`.`)
      hasFailures = true
      return
    }

    if (department && !ALLOWED_DEPARTMENTS.has(department)) {
      addStat(stats, 'events', { skipped: -1, failed: 1 })
      details.push(`${rowLabel}: invalid \`department\` \`${department}\`.`)
      hasFailures = true
      return
    }

    if (statusOverride && !ALLOWED_STATUS_OVERRIDE.has(statusOverride)) {
      addStat(stats, 'events', { skipped: -1, failed: 1 })
      details.push(`${rowLabel}: invalid \`status_override\` \`${statusOverride}\`.`)
      hasFailures = true
      return
    }
  })

  return !hasFailures
}

function validateForms(rows: Record<string, unknown>[], details: string[], stats: Record<string, CollectionStats>): boolean {
  let hasFailures = false

  rows.forEach((row, index) => {
    addStat(stats, 'forms', { skipped: 1 })
    const rowLabel = `forms row ${index + 1}`

    const title = typeof row.title === 'string' ? row.title.trim() : ''
    const confirmationType = typeof row.confirmationType === 'string' ? row.confirmationType : undefined
    const redirectURL =
      row.redirect && typeof row.redirect === 'object'
        ? String((row.redirect as Record<string, unknown>).url || '')
        : ''

    if (!title) {
      addStat(stats, 'forms', { skipped: -1, failed: 1 })
      details.push(`${rowLabel}: missing required \`title\`.`)
      hasFailures = true
      return
    }

    if (confirmationType && !ALLOWED_CONFIRMATION_TYPES.has(confirmationType)) {
      addStat(stats, 'forms', { skipped: -1, failed: 1 })
      details.push(`${rowLabel}: invalid \`confirmationType\` \`${confirmationType}\`.`)
      hasFailures = true
      return
    }

    if (confirmationType === 'redirect' && !redirectURL) {
      addStat(stats, 'forms', { skipped: -1, failed: 1 })
      details.push(`${rowLabel}: \`redirect.url\` is required when \`confirmationType\` is \`redirect\`.`)
      hasFailures = true
      return
    }
  })

  return !hasFailures
}

function validateFormSubmissions(rows: Record<string, unknown>[], details: string[], stats: Record<string, CollectionStats>): boolean {
  let hasFailures = false

  rows.forEach((row, index) => {
    addStat(stats, 'form-submissions', { skipped: 1 })
    const rowLabel = `form-submissions row ${index + 1}`

    if (!row.form) {
      addStat(stats, 'form-submissions', { skipped: -1, failed: 1 })
      details.push(`${rowLabel}: missing required \`form\`.`)
      hasFailures = true
      return
    }

    const submissionData = row.submissionData
    if (!Array.isArray(submissionData) || submissionData.length === 0) {
      addStat(stats, 'form-submissions', { skipped: -1, failed: 1 })
      details.push(`${rowLabel}: \`submissionData\` must be a non-empty array.`)
      hasFailures = true
      return
    }
  })

  return !hasFailures
}

function validateDocsByEntity(entity: ImportEntity, rows: Record<string, unknown>[], details: string[], stats: Record<string, CollectionStats>) {
  if (entity === 'users') return validateUsers(rows, details, stats)
  if (entity === 'events') return validateEvents(rows, details, stats)
  if (entity === 'forms') return validateForms(rows, details, stats)
  return validateFormSubmissions(rows, details, stats)
}

async function importUsers(payload: any, docs: Record<string, unknown>[], stats: CollectionStats, details: string[]) {
  for (const rawDoc of docs) {
    try {
      const doc = cleanDoc(rawDoc)
      const email = typeof doc.email === 'string' ? doc.email.trim() : ''

      if (!email) {
        stats.skipped += 1
        details.push('users: skipped row without email.')
        continue
      }

      const existing = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
      })

      if (existing.totalDocs > 0) {
        const updateData = { ...doc }
        if (!updateData.password) {
          delete updateData.password
        }

        await payload.update({
          collection: 'users',
          id: existing.docs[0].id,
          data: updateData,
          overrideAccess: true,
        })

        stats.updated += 1
      } else {
        const createData = { ...doc }
        if (!createData.password) {
          createData.password = 'imported-account-password'
        }

        await payload.create({
          collection: 'users',
          data: createData,
          overrideAccess: true,
        })

        stats.created += 1
      }
    } catch (error) {
      stats.failed += 1
      details.push(`users: ${(error as Error).message}`)
    }
  }
}

async function importEvents(payload: any, docs: Record<string, unknown>[], stats: CollectionStats, details: string[]) {
  for (const rawDoc of docs) {
    try {
      const doc = cleanDoc(rawDoc)
      const name = typeof doc.name === 'string' ? doc.name.trim() : ''
      const dateBegin = typeof doc.date_begin === 'string' ? doc.date_begin : null

      if (!name || !dateBegin) {
        stats.skipped += 1
        details.push('events: skipped row missing name or date_begin.')
        continue
      }

      const existing = await payload.find({
        collection: 'events',
        where: {
          and: [{ name: { equals: name } }, { date_begin: { equals: dateBegin } }],
        },
        limit: 1,
      })

      if (existing.totalDocs > 0) {
        await payload.update({
          collection: 'events',
          id: existing.docs[0].id,
          data: doc,
          overrideAccess: true,
        })
        stats.updated += 1
      } else {
        await payload.create({
          collection: 'events',
          data: doc,
          overrideAccess: true,
        })
        stats.created += 1
      }
    } catch (error) {
      stats.failed += 1
      details.push(`events: ${(error as Error).message}`)
    }
  }
}

async function importForms(payload: any, docs: Record<string, unknown>[], stats: CollectionStats, details: string[]) {
  for (const rawDoc of docs) {
    try {
      const doc = cleanDoc(rawDoc)
      const title = typeof doc.title === 'string' ? doc.title.trim() : ''

      if (!title) {
        stats.skipped += 1
        details.push('forms: skipped row missing title.')
        continue
      }

      const existing = await payload.find({
        collection: 'forms',
        where: { title: { equals: title } },
        limit: 1,
      })

      if (existing.totalDocs > 0) {
        await payload.update({
          collection: 'forms',
          id: existing.docs[0].id,
          data: doc,
          overrideAccess: true,
        })
        stats.updated += 1
      } else {
        await payload.create({
          collection: 'forms',
          data: doc,
          overrideAccess: true,
        })
        stats.created += 1
      }
    } catch (error) {
      stats.failed += 1
      details.push(`forms: ${(error as Error).message}`)
    }
  }
}

async function importFormSubmissions(payload: any, docs: Record<string, unknown>[], stats: CollectionStats, details: string[]) {
  for (const rawDoc of docs) {
    try {
      const doc = cleanDoc(rawDoc)
      await payload.create({
        collection: 'form-submissions',
        data: doc,
        overrideAccess: true,
      })
      stats.created += 1
    } catch (error) {
      stats.failed += 1
      details.push(`form-submissions: ${(error as Error).message}`)
    }
  }
}

export async function importDataAction(_prevState: ImportState, formData: FormData): Promise<ImportState> {
  const payload = await getPayload({ config })
  const user = await ensureImportPermission(payload)

  if (!user) {
    return {
      ok: false,
      message: 'Unauthorized. Only admins can import data.',
      details: [],
      stats: {},
    }
  }

  try {
    const entity = getImportEntity(formData)
    const format = getInputFormat(formData)
    const rawText = await getRawTextFromFormData(formData)

    if (!rawText) {
      return {
        ok: false,
        message: 'Provide data in the textarea or upload a file.',
        details: [],
        stats: {},
      }
    }

    const rows = normalizeDocsByEntity(entity, format, rawText)
    const details: string[] = []
    const stats: Record<string, CollectionStats> = {}
    const collectionStats: CollectionStats = { ...INITIAL_STATS }
    stats[entity] = collectionStats

    const validationPassed = validateDocsByEntity(entity, rows, details, {})

    if (!validationPassed) {
      return {
        ok: false,
        message: `Import halted. ${entity} payload has schema errors.`,
        details,
        stats,
      }
    }

    if (entity === 'users') await importUsers(payload, rows, collectionStats, details)
    if (entity === 'events') await importEvents(payload, rows, collectionStats, details)
    if (entity === 'forms') await importForms(payload, rows, collectionStats, details)
    if (entity === 'form-submissions') await importFormSubmissions(payload, rows, collectionStats, details)

    const hasFailures = Object.values(stats).some((entry) => entry.failed > 0)

    return {
      ok: !hasFailures,
      message: hasFailures
        ? 'Import completed with some failures. Check details below.'
        : 'Import completed successfully.',
      details,
      stats,
    }
  } catch (error) {
    return {
      ok: false,
      message: `Import failed: ${(error as Error).message}`,
      details: [],
      stats: {},
    }
  }
}

export async function validateDataAction(_prevState: ImportState, formData: FormData): Promise<ImportState> {
  const payload = await getPayload({ config })
  const user = await ensureImportPermission(payload)

  if (!user) {
    return {
      ok: false,
      message: 'Unauthorized. Only admins can validate import payloads.',
      details: [],
      stats: {},
    }
  }

  try {
    const entity = getImportEntity(formData)
    const format = getInputFormat(formData)
    const rawText = await getRawTextFromFormData(formData)

    if (!rawText) {
      return {
        ok: false,
        message: 'Provide data in the textarea or upload a file.',
        details: [],
        stats: {},
      }
    }

    const rows = normalizeDocsByEntity(entity, format, rawText)
    const details: string[] = []
    const stats: Record<string, CollectionStats> = {}

    const passed = validateDocsByEntity(entity, rows, details, stats)

    const hasFailures = !passed || Object.values(stats).some((entry) => entry.failed > 0)

    return {
      ok: !hasFailures,
      message: hasFailures
        ? 'Validation completed with issues. Fix rows listed below before importing.'
        : 'Validation passed. Payload looks ready for import.',
      details,
      stats,
    }
  } catch (error) {
    return {
      ok: false,
      message: `Validation failed: ${(error as Error).message}`,
      details: [],
      stats: {},
    }
  }
}
