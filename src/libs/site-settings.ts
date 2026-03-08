import config from '@payload-config'
import { getPayload } from 'payload'

function isMissingRelationError(error: unknown, relationName: 'site_settings'): boolean {
  const e = error as {
    message?: string
    code?: string
    cause?: {
      code?: string
      message?: string
    }
  }

  const code = e?.code || e?.cause?.code || ''
  if (code === '42P01') {
    return true
  }

  const message = `${e?.message || ''} ${e?.cause?.message || ''}`.toLowerCase()
  return message.includes('does not exist') && message.includes(relationName)
}

export async function getSiteSettings() {
  const payload = await getPayload({ config })
  let global: Record<string, unknown> = {}

  try {
    global = (await (payload as any).findGlobal({
      slug: 'site-settings',
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>
  } catch (error) {
    // During rollout, globals tables may not exist yet; use defaults instead of crashing.
    if (!isMissingRelationError(error, 'site_settings')) {
      throw error
    }
  }

  return {
    enableI18n: typeof global.enableI18n === 'boolean' ? global.enableI18n : true,
  }
}
