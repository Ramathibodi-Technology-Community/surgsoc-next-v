import { CollectionConfig } from 'payload'
import { hasPermission } from '../libs/permissions'
import { User } from '@/payload-types'

export const AcademicTitles: CollectionConfig = {
  slug: 'academic_titles',
  admin: {
    useAsTitle: 'name',
    group: 'Utilities',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasPermission(user as User, 'manage_content'),
    update: ({ req: { user } }) => hasPermission(user as User, 'manage_content'),
    delete: ({ req: { user } }) => hasPermission(user as User, 'manage_content'),
  },
  fields: [
    {
      name: 'title_thai',
      type: 'text',
      label: 'Title (Thai)',
      required: true,
      admin: {
        placeholder: 'e.g. ศ.นพ.',
      },
    },
    {
      name: 'title_english',
      type: 'text',
      label: 'Title (English)',
      required: true,
      admin: {
        placeholder: 'e.g. Prof. Dr.',
      },
    },
    // Virtual display name
    {
      name: 'name',
      type: 'text',
      label: 'Display Name',
      admin: {
        readOnly: true,
        description: 'Auto-generated from Thai and English titles',
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const th = siblingData.title_thai
            const en = siblingData.title_english
            if (en && th) return `${en} (${th})`
            return th || en || ''
          },
        ],
      },
    },
  ],
}
