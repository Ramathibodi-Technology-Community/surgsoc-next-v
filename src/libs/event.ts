import { ResourceScheduling } from './resource-scheduling'

export type EventAction =
  | 'register'
  | 'waiting_list'
  | 'rejected'
  | 'participant'
  | 'reflect'
  | 'closed'
  | 'not_open'
  | 'feedback'
  | 'confirm'
  | 'declined'

export type EventUserStatus =
  | 'waiting_list'
  | 'participant'
  | 'rejected'
  | 'subscribed'
  | 'registered'
  | 'accepted'
  | 'confirmed'
  | 'declined'
  | 'withdrawn'
  | null
  | undefined
  | string

export type EventPhase = 'upcoming' | 'live' | 'ended'

export interface EventRegistrationStatus {
  isOpen?: boolean
  reason?: string
}

export interface EventCtaConfig {
  kind: EventAction
  label: string
  href?: string
  disabled?: boolean
  secondaryAction?: {
    label: string
    href: string
    kind: EventAction
  }
}

export interface Event {
  id: string
  name: string
  date: string
  venue: string
  details: string
  posterUri: string
  action: EventAction
  registrationOpen?: boolean
  participantCount?: number
  registrationStatus?: EventRegistrationStatus
  eventPhase?: EventPhase
  reflectionOpen?: boolean
  reflection_form?: string | { id: string }
  reflection_submitted?: boolean
  user_status?: EventUserStatus
  date_begin?: string
  date_end?: string
  subscription_form?: string | { id: string }
  opens_at?: string
  closes_at?: string
  status_override?: 'auto' | 'open' | 'closed'
  description?: string
  eventType?: string
  department?: string
  coordinatorName?: string
  participantLimit?: number
  registrationOpensAt?: string
  registrationClosesAt?: string
  participantDetail?: any
  loa_form?: string | { id: string }
}

export function deriveEventCta(
  event: Event,
  now: Date = new Date(),
): EventCtaConfig | null {
  const eventDate =
    event.date_begin || event.date_end || event.date || now.toISOString()
  const parsedEventDate = new Date(eventDate)
  const isPast =
    event.eventPhase === 'ended' ||
    (parsedEventDate instanceof Date && !isNaN(parsedEventDate.valueOf())
      ? parsedEventDate < now
      : false)

  const userStatus = event.user_status
  const scheduleStatus = ResourceScheduling.isOpen({
    opens_at: event.opens_at ?? event.registrationOpensAt,
    closes_at: event.closes_at ?? event.registrationClosesAt,
    status_override: event.status_override,
  })

  const registrationOpen =
    (event.registrationOpen ?? true) &&
    (event.registrationStatus?.isOpen ?? scheduleStatus.isOpen)
  const reflectionOpen = event.reflectionOpen ?? false
  const reflectionPending =
    userStatus === 'participant' &&
    reflectionOpen &&
    event.reflection_submitted !== true

  const getFormId = (form: string | { id: string } | undefined): string | null => {
    if (!form) return null
    return typeof form === 'object' && form !== null ? form.id : (form as string)
  }

  if (reflectionPending && event.reflection_form) {
    const formId = getFormId(event.reflection_form)
    if (formId) {
      return {
        kind: 'reflect',
        label: 'Reflect',
        href: `/forms/${formId}`,
        disabled: false,
      }
    }
  }

  if (userStatus === 'participant') {
    return { kind: 'participant', label: 'Participant', disabled: true }
  }

  if (userStatus === 'accepted') {
    const loaFormId = getFormId(event.loa_form)
    return {
      kind: 'confirm',
      label: 'Confirm Attendance',
      disabled: false,
      secondaryAction: loaFormId
        ? { label: 'Decline (LOA)', href: `/forms/${loaFormId}`, kind: 'declined' }
        : { label: 'Decline', href: `/events/${event.id}/decline`, kind: 'declined' },
    }
  }

  if (userStatus === 'confirmed') {
    const loaFormId = getFormId(event.loa_form)
    return {
      kind: 'participant',
      label: 'Confirmed ✓',
      disabled: true,
      secondaryAction: loaFormId
        ? { label: 'Submit LOA', href: `/forms/${loaFormId}`, kind: 'declined' }
        : undefined,
    }
  }

  if (userStatus === 'waiting_list' || userStatus === 'subscribed') {
    return { kind: 'waiting_list', label: 'Waiting List', disabled: true }
  }

  if ((userStatus === 'rejected' || userStatus === 'declined') && !isPast) {
    return {
      kind: userStatus === 'rejected' ? 'rejected' : 'declined',
      label: userStatus === 'rejected' ? 'Rejected' : 'Declined',
      disabled: true,
    }
  }

  if (registrationOpen && !isPast) {
    return {
      kind: 'register',
      label: 'Register',
      href: `/events/${event.id}/apply`,
      disabled: false,
    }
  }

  if (userStatus === 'applicant') {
    return { kind: 'waiting_list', label: 'Pending Selection', disabled: true }
  }

  return null
}

export const mapPayloadEvent = (doc: any): Event => {
  const toDisplayText = (value: unknown): string => {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    if (!value || typeof value !== 'object') return ''

    const record = value as Record<string, unknown>

    const preferred = [
      record.title_english,
      record.title_thai,
      record.name,
      record.label,
      record.slug,
    ]

    for (const candidate of preferred) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate
      }
    }

    return ''
  }

  let venue = ''
  if (doc.location && typeof doc.location === 'object') {
    venue = [doc.location.campus, doc.location.building, doc.location.room]
      .map((part: unknown) => toDisplayText(part))
      .filter(Boolean)
      .join(', ')
  } else if (typeof doc.location === 'string') {
    venue = doc.location
  }

  let coordinatorName = ''
  if (doc.coordinator && typeof doc.coordinator === 'object') {
    coordinatorName = `${doc.coordinator.name_english?.first_name || ''} ${doc.coordinator.name_english?.last_name || ''}`.trim()
  }

  return {
    id: doc.id,
    name: toDisplayText(doc.name) || 'Untitled Event',
    date: doc.date_begin || doc.date_end || doc.date || new Date().toISOString(),
    date_begin: doc.date_begin,
    date_end: doc.date_end,
    venue,
    details: toDisplayText(doc.description) || (typeof doc.info === 'string' ? doc.info : '') || '',
    posterUri: doc.image_url || '/assets/beta.jpg',
    action: 'register',
    registrationOpen: !doc.is_registration_closed,
    participantCount: 0,
    eventPhase: (() => {
      const begin = doc.date_begin ? new Date(doc.date_begin) : null
      const end = doc.date_end ? new Date(doc.date_end) : null
      const now = new Date()
      if (end && now > end) return 'ended'
      if (begin && now >= begin) return 'live'
      return 'upcoming'
    })() as EventPhase,
    reflectionOpen: doc.is_reflection_open,
    reflection_form: doc.reflection_form,
    subscription_form: doc.subscription_form,
    user_status: doc.user_status,
    status_override: doc.status_override,
    description: toDisplayText(doc.description),
    eventType: toDisplayText(doc.event_type),
    department: toDisplayText(doc.department),
    coordinatorName,
    participantLimit: doc.participant_limit,
    registrationOpensAt: doc.registration_opens_at,
    registrationClosesAt: doc.registration_closes_at,
    registrationStatus: {
      isOpen: !doc.is_registration_closed,
    },
    opens_at: doc.registration_opens_at,
    closes_at: doc.registration_closes_at,
    participantDetail: doc.participant_detail,
    loa_form: doc.loa_form,
  }
}

export function formatEventDuration(
  event: Pick<Event, 'date' | 'date_begin' | 'date_end'>,
  options?: {
    locale?: string
    timeZone?: string
    includeWeekday?: boolean
    fallback?: string
  },
): string {
  const locale = options?.locale ?? 'en-GB'
  const timeZone = options?.timeZone ?? 'Asia/Bangkok'
  const fallback = options?.fallback ?? 'TBA'

  const startValue = event.date_begin || event.date
  if (!startValue) return fallback

  const startDate = new Date(startValue)
  if (Number.isNaN(startDate.getTime())) return fallback

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone,
  }

  if (options?.includeWeekday) {
    dateOptions.weekday = 'long'
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }

  const startDateText = startDate.toLocaleDateString(locale, dateOptions)
  const startTimeText = startDate.toLocaleTimeString(locale, timeOptions)

  if (!event.date_end) {
    return `${startDateText}, ${startTimeText}`
  }

  const endDate = new Date(event.date_end)
  if (Number.isNaN(endDate.getTime())) {
    return `${startDateText}, ${startTimeText}`
  }

  const endDateText = endDate.toLocaleDateString(locale, dateOptions)
  const endTimeText = endDate.toLocaleTimeString(locale, timeOptions)

  if (startDateText === endDateText) {
    return `${startDateText}, ${startTimeText} - ${endTimeText}`
  }

  return `${startDateText} ${startTimeText} - ${endDateText} ${endTimeText}`
}
