import { CollectionConfig } from 'payload'
import { hasPermission } from '../libs/permissions'
import { User } from '@/payload-types'

export const Attendings: CollectionConfig = {
  slug: 'attendings',
  admin: {
    useAsTitle: 'display_name',
    group: 'Content',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => hasPermission(user as User, 'manage_content'),
    update: ({ req: { user } }) => hasPermission(user as User, 'manage_content'),
    delete: ({ req: { user } }) => hasPermission(user as User, 'manage_content'),
  },
  fields: [
    {
      name: 'name_thai',
      type: 'group',
      label: 'Thai Name',
      fields: [
        { name: 'first_name', type: 'text', required: true },
        { name: 'last_name', type: 'text', required: true },
      ],
    },
    {
      name: 'name_english',
      type: 'group',
      label: 'English Name',
      fields: [
        { name: 'first_name', type: 'text', required: true },
        { name: 'last_name', type: 'text', required: true },
      ],
    },
    {
      name: 'title',
      type: 'relationship',
      relationTo: 'academic_titles',
      label: 'Academic Title',
    },
    {
      name: 'specialty',
      type: 'select',
      label: 'Specialty',
      options: [
        { label: 'General Surgery', value: 'general_surgery' },
        { label: 'Cardiothoracic Surgery', value: 'cardiothoracic' },
        { label: 'Neurosurgery', value: 'neurosurgery' },
        { label: 'Orthopedic Surgery', value: 'orthopedic' },
        { label: 'Plastic Surgery', value: 'plastic' },
        { label: 'Pediatric Surgery', value: 'pediatric' },
        { label: 'Urology', value: 'urology' },
        { label: 'Vascular Surgery', value: 'vascular' },
        { label: 'Surgical Oncology', value: 'oncology' },
        { label: 'Trauma Surgery', value: 'trauma' },
        { label: 'Transplant Surgery', value: 'transplant' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'image_url',
      type: 'text',
      label: 'Profile Photo URL',
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Contact',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone_number', type: 'text', label: 'Phone' },
      ],
    },
    {
      name: 'bio',
      type: 'richText',
      label: 'Biography',
    },
    {
      name: 'is_visible',
      type: 'checkbox',
      label: 'Visible on Website',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sort_order',
      type: 'number',
      label: 'Sort Order',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first',
      },
    },
    // Virtual display name
    {
      name: 'display_name',
      type: 'text',
      admin: { hidden: true },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            let titleStr = ''

            if (data?.title) {
              if (typeof data.title === 'string') {
                // If it's just an ID, we might need to fetch it (though usually it's populated in afterRead)
                try {
                  const titleDoc = await req.payload.findByID({
                    collection: 'academic_titles',
                    id: data.title,
                  })
                  titleStr = titleDoc.name || ''
                } catch (e) {
                  // Ignore if missing
                }
              } else if (typeof data.title === 'object') {
                // If populated
                titleStr = data.title.name || ''
              }
            }

            const first = data?.name_english?.first_name || data?.name_thai?.first_name || ''
            const last = data?.name_english?.last_name || data?.name_thai?.last_name || ''
            return [titleStr, first, last].filter(Boolean).join(' ')
          },
        ],
      },
    },
  ],
}
