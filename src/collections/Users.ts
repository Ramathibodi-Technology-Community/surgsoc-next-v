import { CollectionConfig } from 'payload'
import { portfolioField } from '../libs/fields/portfolio'
import { contactFields } from '../libs/fields/contacts'
import { interestOptions } from '../libs/fields/interests'
// import { isAdmin, isAdminOrSuperadmin, isFieldAdmin, isSelfOrAdmin, isStaff } from '../libs/access' // Replaced by granular permissions
import { User } from '@/payload-types'
import { hasPermission } from '../libs/permissions'
import { syncUserGroups } from '../hooks/sync-user-groups'
import { getMissingProfileFieldsFromData, isProfileComplete } from '../libs/profile-completion'


export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 28800, // 8 hours
    useSessions: false,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      // Don't set domain - causes issues on localhost
    },
  },
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
    defaultColumns: ['email', 'roles', 'full_name_thai', 'department'],
    components: {
        beforeListTable: [
          '@/components/payload/BulkAssignLink#BulkAssignLink',
          '@/components/payload/CollectionImportLink#CollectionImportLink',
        ],
    },
  },
  access: {
    read: ({ req: { user } }) => {
        if (!user) return false
        if (hasPermission(user as User, 'view_users') || hasPermission(user as User, 'manage_users')) return true
        return {
            id: {
                equals: user.id,
            },
        }
    },
    create: ({ req }) => {
      // OAuth flow sets a context flag
      if (req.context?.isOAuthFlow) return true
      // Admins can create users via admin panel
      if (req.user && hasPermission(req.user as User, 'manage_users')) return true
      return false
    },
    update: ({ req: { user } }) => {
        if (!user) return false
        if (hasPermission(user as User, 'manage_users')) return true
        return {
            id: {
                equals: user.id
            }
        }
    },
    delete: ({ req: { user } }) => hasPermission(user as User, 'manage_users'),
  },
  hooks: {
    beforeChange: [
      async (args) => {
        const incomingRoles = Array.isArray(args.data?.roles) ? args.data.roles : undefined
        const existingRoles = Array.isArray(args.originalDoc?.roles) ? args.originalDoc.roles : []
        const effectiveRoles = incomingRoles ?? existingRoles

        const requiresCompleteProfile = effectiveRoles.some((role: string) => role !== 'visitor')

        if (requiresCompleteProfile) {
          const merged = {
            ...(args.originalDoc || {}),
            ...(args.data || {}),
          } as Record<string, unknown>

          const missing = getMissingProfileFieldsFromData(merged)
          if (missing.length > 0) {
            throw new Error(`Profile is incomplete: ${missing.join(', ')}`)
          }
        }

        if (args.req.context?.skipGroupSync) return args.data
        return syncUserGroups(args)
      },
    ],
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Visitor', value: 'visitor' },
        { label: 'Member', value: 'member' },
        { label: 'Staff (Probation)', value: 'staff_probation' },
        { label: 'Staff', value: 'staff' },
        { label: 'Deputy VP', value: 'deputy_vp' },
        { label: 'VP', value: 'vp' },
        { label: 'Admin (President)', value: 'admin' },
        { label: 'Superadmin', value: 'superadmin' },
      ],
      defaultValue: ['visitor'],
      admin: {
        description: 'Changing roles auto-syncs the user\'s groups. Admin role is equivalent to President.',
      },
      access: {
        update: ({ req: { user } }) => hasPermission(user as User, 'manage_users'),
      },
      required: true,
    },
    {
      name: 'groups',
      type: 'relationship',
      relationTo: 'groups',
      hasMany: true,
      saveToJWT: true,
      admin: {
        position: 'sidebar',
      },
      access: {
        update: ({ req: { user } }) => hasPermission(user as User, 'manage_users'),
      },
    },
    {
       name: 'department',
       type: 'select',
       options: [
           { label: 'Internal Affairs (IA)', value: 'IA' },
           { label: 'External Affairs (EA)', value: 'EA' },
           { label: 'Operations & Development (OD)', value: 'OD' },
           { label: 'Academic (AD)', value: 'AD' },
           { label: 'Creative & Content (CC)', value: 'CC' },
           { label: 'Public Relations (PR)', value: 'PR' },
       ],
       admin: {
           description: 'Auto-syncs to the corresponding department group',
           condition: (data) => {
               if (data?.roles?.includes('staff') || data?.roles?.includes('staff_probation') || data?.roles?.includes('vp')) {
                   return true
               }
               return false
           }
       },
       access: {
           read: () => true,
           update: ({ req: { user } }) => hasPermission(user as User, 'manage_users'),
       }
    },
    {
      name: 'google_id',
      type: 'text',
      admin: {
        readOnly: true,
      },
      index: true,
    },
    {
        name: 'image_url',
        type: 'text',
        label: 'Profile Picture URL',
        admin: {
            readOnly: true,
        },
    },
    {
      name: 'dob',
      type: 'date',
      label: 'Date of Birth',
    },
    {
        name: 'age',
        type: 'number',
        admin: {
            readOnly: true,
        },
        hooks: {
            beforeChange: [
                ({ siblingData }) => {
                    // remove from DB, make it virtual? Payload virtual fields are hooks afterRead
                    // But here we might want to store it or just calculate on read.
                    // Let's just calculate it.
                    return undefined
                }
            ],
            afterRead: [
                ({ data }) => {
                    if (!data?.dob) return null
                    const dob = new Date(data.dob)
                    const ageDifMs = Date.now() - dob.getTime()
                    const ageDate = new Date(ageDifMs)
                    return Math.abs(ageDate.getUTCFullYear() - 1970)
                }
            ]
        }
    },
    {
      name: 'name_thai',
      type: 'group',
      label: 'Thai Name',
      fields: [
        { name: 'first_name', type: 'text' },
        { name: 'last_name', type: 'text' },
        { name: 'nickname', type: 'text' },
      ],
    },
    // Virtual field for full name
    {
        name: 'full_name_thai',
        type: 'text',
        admin: {
            hidden: true,
        },
        hooks: {
            afterRead: [
                ({ data }) => {
                    if (data?.name_thai?.first_name && data?.name_thai?.last_name) {
                        return `${data.name_thai.first_name} ${data.name_thai.last_name}`
                    }
                    return ''
                }
            ]
        }
    },
    {
      name: 'profile_complete',
      type: 'checkbox',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
      hooks: {
        afterRead: [
          ({ data }) => isProfileComplete(data as User),
        ],
      },
    },
    {
      name: 'name_english',
      type: 'group',
      label: 'English Name',
      fields: [
        { name: 'first_name', type: 'text' },
        { name: 'last_name', type: 'text' },
        { name: 'nickname', type: 'text' },
      ],
    },
    {
      name: 'academic',
      type: 'group',
      label: 'Academic Info',
      fields: [
        {
          name: 'student_id',
          type: 'text',
          required: false,
        },
        {
          name: 'track',
          type: 'select',
          options: [
            { label: 'M.D', value: 'MD' },
            { label: 'M.D-M.Eng.', value: 'MD_MEng' },
            { label: 'M.D.-M.M', value: 'MD_MM' },
            { label: 'RAK', value: 'RAK' },
          ],
          admin: {
            description: 'Auto-syncs to the corresponding academic track group',
          },
        },
        {
          name: 'year',
          type: 'select',
          options: [
            'M_Eng_M_M',
            'Year_1',
            'Year_2',
            'Year_3',
            'Year_4',
            'Year_5',
            'Year_6',
          ],
          admin: {
            description: 'Auto-syncs to the corresponding academic year group',
          },
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      fields: contactFields.filter(f => (f as any).name !== 'email'),
    },
    {
        name: 'social_media',
        type: 'array',
        label: 'Social Media',
        labels: { singular: 'Account', plural: 'Accounts' },
        fields: [
            {
              name: 'platform',
              type: 'text',
              required: true,
              label: 'Platform',
              admin: { placeholder: 'e.g. Facebook, Instagram, X, LinkedIn' },
            },
            {
              name: 'handle',
              type: 'text',
              required: true,
              label: 'Handle / URL',
              admin: { placeholder: '@handle or profile URL' },
            },
        ],
    },
    portfolioField,
    {
        name: 'interests',
        type: 'select',
        hasMany: true,
        options: interestOptions.map(opt => ({ label: opt.label, value: opt.value })),
    },
    {
      name: 'notification_preferences',
      type: 'group',
      fields: [
        {
          name: 'email_opt_in',
          type: 'checkbox',
          label: 'Receive Email Notifications',
          defaultValue: true,
        },
      ],
    },
  ],
}
