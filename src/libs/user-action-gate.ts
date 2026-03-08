import type { Payload } from 'payload'
import type { User } from '@/payload-types'
import { FormBlockingService } from './form-blocking'
import { canInteractAsMember } from './permissions'
import { getMissingProfileFields, isProfileComplete } from './profile-completion'

// ─── Types ───────────────────────────────────────────────────────

export type GateCheckResult =
  | { allowed: true }
  | {
      allowed: false
      reason: GateBlockReason
      redirect?: string
      message: string
      details?: unknown
    }

export type GateBlockReason =
  | 'unauthenticated'    // Not logged in
  | 'insufficient_role'  // Logged in but still visitor
  | 'profile_incomplete' // Missing required profile fields
  | 'form_blocked'       // Has incomplete blocking form assignments
  | 'schedule_closed'    // Event/resource not open

// ─── Unified Gate ────────────────────────────────────────────────

export interface GateOptions {
  /** If provided, also check scheduling for this resource */
  resource?: {
    opens_at?: string | null
    closes_at?: string | null
    registration_opens_at?: string | null
    registration_closes_at?: string | null
    status_override?: string | null
  }
  /** If false, skip form-blocking check (default: true) */
  checkFormBlocking?: boolean
}

/**
 * Run the full gating pipeline for a user action.
 *
 * Pipeline order:
 * 1. Authentication — is the user logged in?
 * 2. Profile completion — has the user filled all required fields?
 * 3. Form blocking — does the user have unfinished blocking form assignments?
 * 4. Scheduling — is the resource/event currently open?
 *
 * Each step short-circuits: if step 1 fails, steps 2–4 are skipped.
 */
export async function checkUserActionGate(
  payload: Payload,
  user: User | null | undefined,
  options?: GateOptions,
): Promise<GateCheckResult> {
  const { resource, checkFormBlocking = true } = options ?? {}

  // 1. Authentication
  if (!user) {
    return {
      allowed: false,
      reason: 'unauthenticated',
      redirect: '/login',
      message: 'Please log in to continue.',
    }
  }

  // 2. Profile Completion
  if (!canInteractAsMember(user)) {
    return {
      allowed: false,
      reason: 'insufficient_role',
      message: 'Your account is currently Visitor-only. Member access is required for this action.',
    }
  }

  // 3. Profile Completion
  if (!isProfileComplete(user)) {
    const missing = getMissingProfileFields(user)
    return {
      allowed: false,
      reason: 'profile_incomplete',
      redirect: '/account?complete=true',
      message: `Please complete your profile first: ${missing.join(', ')}.`,
      details: missing,
    }
  }

  // 4. Form Blocking
  if (checkFormBlocking) {
    const blockingForms = await FormBlockingService.getBlockingForms(payload, user.id)
    if (blockingForms.length > 0) {
      const firstForm = blockingForms[0] as unknown as Record<string, unknown>
      const formObj = firstForm?.form as Record<string, unknown> | undefined
      return {
        allowed: false,
        reason: 'form_blocked',
        redirect: `/forms/${formObj?.id ?? ''}`,
        message: `Complete ${blockingForms.length} required form(s) first.`,
        details: blockingForms,
      }
    }
  }

  // 5. Scheduling (optional — only if resource provided)
  if (resource) {
    const { ResourceScheduling } = await import('./resource-scheduling')
    const schedulingResource = {
      opens_at: resource.opens_at ?? resource.registration_opens_at,
      closes_at: resource.closes_at ?? resource.registration_closes_at,
      status_override: resource.status_override,
    }

    const status = ResourceScheduling.isOpen(schedulingResource as Parameters<typeof ResourceScheduling.isOpen>[0])
    if (!status.isOpen) {
      const msg = ResourceScheduling.getStatusMessage(
        schedulingResource as Parameters<typeof ResourceScheduling.getStatusMessage>[0],
      )
      return {
        allowed: false,
        reason: 'schedule_closed',
        message: msg || 'Currently closed.',
      }
    }
  }

  return { allowed: true }
}
