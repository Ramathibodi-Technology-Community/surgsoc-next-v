import type { GlobalConfig } from 'payload'
import { hasPermission } from '../libs/permissions'
import type { User } from '@/payload-types'

export const HomeContent: GlobalConfig = {
  slug: 'home-content',
  label: 'Home Content',
  admin: {
    group: 'Content',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => hasPermission(user as User, 'manage_content'),
  },
  fields: [
    {
      name: 'sections',
      type: 'array',
      label: 'Home Sections',
      labels: {
        singular: 'Section',
        plural: 'Sections',
      },
      fields: [
        {
          name: 'kicker',
          type: 'text',
          required: false,
          admin: {
            description: 'Small label shown above the section title.',
          },
        },
        {
          name: 'heading',
          type: 'text',
          required: true,
        },
        {
          name: 'body',
          type: 'textarea',
          required: true,
        },
        {
          name: 'imageUrl',
          type: 'text',
          required: false,
          admin: {
            description: 'Optional image URL for this section.',
          },
        },
      ],
    },
  ],
}
