import config from '@payload-config'
import { getPayload } from 'payload'

type HomeSection = {
  kicker?: string
  heading: string
  body: string
  imageUrl?: string
}

type TermsSection = {
  title: string
  content: string
}

const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  {
    kicker: 'About The Society',
    heading: 'Where Passion, Determination, and Teamwork Forge the Future',
    body: 'Ramathibodi Surgical Society is a student-driven community dedicated to growth in surgical knowledge, collaboration, and service.',
    imageUrl: '/assets/beta.jpg',
  },
]

const DEFAULT_TERMS_SECTIONS: TermsSection[] = [
  {
    title: 'Use of Platform',
    content: 'By using this platform, you agree to participate responsibly and comply with applicable society and university policies.',
  },
  {
    title: 'Privacy and Data',
    content: 'We collect and use personal data only for account access, event participation, and internal operational purposes.',
  },
  {
    title: 'Your Rights',
    content: 'You may request correction or removal of personal information by contacting the Ramathibodi Surgical Society administrators.',
  },
]

function isMissingRelationError(error: unknown, relationName: 'home_content' | 'terms_content'): boolean {
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

function sanitizeHomeSections(raw: unknown): HomeSection[] {
  if (!Array.isArray(raw)) return DEFAULT_HOME_SECTIONS

  const sections = raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const section = item as Record<string, unknown>
      const heading = typeof section.heading === 'string' ? section.heading.trim() : ''
      const body = typeof section.body === 'string' ? section.body.trim() : ''

      if (!heading || !body) return null

      return {
        kicker: typeof section.kicker === 'string' ? section.kicker : undefined,
        heading,
        body,
        imageUrl: typeof section.imageUrl === 'string' ? section.imageUrl : undefined,
      }
    })
    .filter(Boolean) as HomeSection[]

  return sections.length > 0 ? sections : DEFAULT_HOME_SECTIONS
}

function sanitizeTermsSections(raw: unknown): TermsSection[] {
  if (!Array.isArray(raw)) return DEFAULT_TERMS_SECTIONS

  const sections = raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const section = item as Record<string, unknown>
      const title = typeof section.title === 'string' ? section.title.trim() : ''
      const content = typeof section.content === 'string' ? section.content.trim() : ''

      if (!title || !content) return null

      return { title, content }
    })
    .filter(Boolean) as TermsSection[]

  return sections.length > 0 ? sections : DEFAULT_TERMS_SECTIONS
}

export async function getHomeContent() {
  const payload = await getPayload({ config })
  let global: Record<string, unknown> = {}

  try {
    global = (await (payload as any).findGlobal({
      slug: 'home-content',
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>
  } catch (error) {
    // During rollout, globals tables may not exist yet; use baked defaults instead of crashing.
    if (!isMissingRelationError(error, 'home_content')) {
      throw error
    }
  }

  return {
    sections: sanitizeHomeSections(global?.sections),
  }
}

export async function getTermsContent() {
  const payload = await getPayload({ config })
  let global: Record<string, unknown> = {}

  try {
    global = (await (payload as any).findGlobal({
      slug: 'terms-content',
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>
  } catch (error) {
    // During rollout, globals tables may not exist yet; use baked defaults instead of crashing.
    if (!isMissingRelationError(error, 'terms_content')) {
      throw error
    }
  }

  return {
    intro:
      typeof global?.intro === 'string' && global.intro.trim().length > 0
        ? global.intro
        : 'This page unifies terms of use and privacy commitments. Continued use of the platform means you agree to these policies.',
    sections: sanitizeTermsSections(global?.sections),
  }
}
