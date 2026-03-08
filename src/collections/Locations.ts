import { CollectionConfig } from 'payload'
import { hasPermission } from '../libs/permissions'
import { User } from '@/payload-types'

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'name',
    group: 'Utilities',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasPermission(user as User, 'manage_events'),
    update: ({ req: { user } }) => hasPermission(user as User, 'manage_events'),
    delete: ({ req: { user } }) => hasPermission(user as User, 'manage_events'),
  },
  fields: [
    {
      name: 'campus',
      type: 'text',
      label: 'Campus',
      required: true,
      admin: {
        placeholder: 'e.g. Ramathibodi Hospital',
      },
    },
    {
      name: 'building',
      type: 'text',
      label: 'Building',
      admin: {
        placeholder: 'e.g. Building 1',
      },
    },
    {
      name: 'room',
      type: 'text',
      label: 'Room',
      admin: {
        placeholder: 'e.g. Room 301',
      },
    },
    // Virtual display name
    {
      name: 'name',
      type: 'text',
      label: 'Display Name',
      admin: {
        readOnly: true,
        description: 'Auto-generated from campus, building, room',
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const parts = [siblingData.campus, siblingData.building, siblingData.room].filter(Boolean)
            return parts.join(', ')
          },
        ],
      },
    },
  ],
}
