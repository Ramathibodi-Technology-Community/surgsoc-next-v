import type { GlobalConfig } from 'payload'
import { hasPermission } from '../libs/permissions'
import type { User } from '@/payload-types'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => hasPermission(user as User, 'manage_content'),
  },
  fields: [
    {
      name: 'enableI18n',
      type: 'checkbox',
      label: 'Enable i18n',
      defaultValue: true,
      admin: {
        description: 'Controls whether language switching is enabled on the public site.',
      },
    },
  ],
}
