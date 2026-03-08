import { getPayload } from 'payload'
import config from '@payload-config'

type HydratedPageSlug = 'home' | 'terms'
type PageContent = {
  root: {
    type: 'root'
    children: Array<{
      type: 'paragraph'
      version: number
      children: Array<{
        type: 'text'
        version: number
        text: string
      }>
      direction: string
      format: string
      indent: number
    }>
    direction: string
    format: string
    indent: number
    version: number
  }
}

export type PageDoc = {
  id: string | number
  title?: string | null
  slug?: string | null
  content?: PageContent | null
}

function buildRichText(paragraphs: string[]): PageContent {
  return {
    root: {
      type: 'root',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        version: 1,
        children: [
          {
            type: 'text',
            version: 1,
            text,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

const DEFAULT_PAGES: Record<HydratedPageSlug, { title: string; content: PageContent }> = {
  home: {
    title: 'Ramathibodi Surgical Society',
    content: buildRichText([
      'Where passion, determination, and teamwork forge the future.',
      'Welcome to the official platform of the Ramathibodi Surgical Society.',
    ]),
  },
  terms: {
    title: 'Terms & Privacy Policy',
    content: buildRichText([
      'By using this platform, you agree to our terms and acknowledge our privacy practices.',
      'We collect only the data required for account access, event participation, and society operations.',
      'You may request data correction or deletion through the Ramathibodi Surgical Society administrators.',
      'We maintain reasonable safeguards to protect personal data and comply with applicable laws.',
    ]),
  },
}

export async function getPageBySlug(slug: string): Promise<PageDoc | null> {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages' as any,
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 0,
  })

  return (docs[0] as PageDoc | undefined) ?? null
}

export async function getOrHydrateDefaultPage(slug: HydratedPageSlug): Promise<PageDoc | null> {
  const payload = await getPayload({ config })
  const defaults = DEFAULT_PAGES[slug]

  const { docs } = await payload.find({
    collection: 'pages' as any,
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 0,
  })

  const existing = docs[0] as PageDoc | undefined

  if (existing) {
    const needsTitle = !existing.title?.trim()
    const needsContent = !existing.content

    if (!needsTitle && !needsContent) {
      return existing
    }

    const updated = await payload.update({
      collection: 'pages' as any,
      id: existing.id,
      data: {
        title: needsTitle ? defaults.title : existing.title,
        content: needsContent ? defaults.content : existing.content,
      },
      overrideAccess: true,
    })

    return updated as PageDoc
  }

  const created = await payload.create({
    collection: 'pages' as any,
    data: {
      title: defaults.title,
      slug,
      content: defaults.content,
    },
    overrideAccess: true,
  })

  return created as PageDoc
}
