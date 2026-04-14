import { CollectionConfig } from 'payload'
import { hasPermission } from '../libs/permissions'
import type { User } from '../payload-types'

export const Groups: CollectionConfig = {
  slug: 'groups',
  admin: {
    useAsTitle: 'name',
    group: 'Admin',
  },
  access: {
    // Groups must remain readable to every authenticated user because
    // `hasPermission` resolves user → groups → permissions on every auth'd
    // request. Gating this (or the `permissions` field) would break the
    // capability model for non-staff users who rely on group-based perms.
    // Tracked as informational: the bitmask model is visible to any logged-in user.
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => hasPermission(user as User, 'manage_users'),
    update: ({ req: { user } }) => hasPermission(user as User, 'manage_users'),
    delete: ({ req: { user } }) => hasPermission(user as User, 'manage_users'),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
      admin: {
        description: 'Unique identifier for code references (e.g. "admin", "od", "year-1")',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'System Role', value: 'system' },
        { label: 'Staff Role', value: 'role' },
        { label: 'Department', value: 'department' },
        { label: 'Year', value: 'year' },
        { label: 'Track', value: 'track' },
        { label: 'Access', value: 'access' },
      ],
      defaultValue: 'role',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'permissions',
      type: 'json',
      admin: {
        description: 'Granular permissions configuration',
      },
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: 'Use this field to add or remove members from the group.',
        components: {
          Cell: '@/components/MembersCell#MembersCell'
        }
      },
    },
    {
      name: 'members_table',
      type: 'join',
      collection: 'users',
      on: 'groups',
      admin: {
        allowCreate: false,
        defaultColumns: ['email', 'roles', 'department'],
        description: 'Read-only table of all users belonging to this group. Click a row to view the user.',
      },
      defaultLimit: 25,
      defaultSort: 'email',
    },
  ],
  hooks: {
    afterChange: [
      async (args) => {
        const { syncGroupMembers } = await import('../hooks/sync-group-members')
        return syncGroupMembers(args)
      },
    ],
  },
}
