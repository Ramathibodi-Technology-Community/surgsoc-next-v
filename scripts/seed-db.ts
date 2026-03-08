#!/usr/bin/env node
// @ts-nocheck — payload-types.ts may be stale; regenerate via `pnpm run generate:types`

/**
 * Database Seed Script
 * Seeds the database with test data using PayloadCMS Local API.
 * Fully idempotent — safe to run multiple times.
 *
 * Usage: pnpm run db:seed
 */

import { getPayloadInstance } from './shared.js'
import type { Payload } from 'payload'

export async function seedDatabase(payloadInstance?: Payload) {
  console.log('🌱 Seeding database...\n')
  console.log('────────────────────────────────────────')

  const payload = payloadInstance || await getPayloadInstance()

  // ── Groups ───────────────────────────────────────
  console.log('\n📁 Seeding Groups...')
  const groups = [
    { name: 'Admin', slug: 'admin', type: 'system' as const, permissions: { manage_users: true, manage_content: true, manage_events: true, manage_forms: true } },
    { name: 'Superadmin', slug: 'superadmin', type: 'system' as const, permissions: { manage_users: true, manage_content: true, manage_events: true, manage_forms: true, manage_system: true } },
    { name: 'Staff', slug: 'staff', type: 'role' as const, permissions: { manage_events: true, manage_forms: true } },
    { name: 'Member', slug: 'member', type: 'system' as const, permissions: {} },
    { name: 'Visitor', slug: 'visitor', type: 'system' as const, permissions: {} },
    // Department Groups
    { name: 'Internal Affairs', slug: 'dept-ia', type: 'department' as const, permissions: { manage_events: true, manage_forms: true } },
    { name: 'External Affairs', slug: 'dept-ea', type: 'department' as const, permissions: { manage_events: true, manage_forms: true } },
    { name: 'Operations & Development', slug: 'dept-od', type: 'department' as const, permissions: { manage_events: true, manage_forms: true } },
    { name: 'Academic', slug: 'dept-ad', type: 'department' as const, permissions: { manage_events: true, manage_forms: true } },
    { name: 'Creative & Content', slug: 'dept-cc', type: 'department' as const, permissions: { manage_events: true, manage_forms: true } },
    { name: 'Public Relations', slug: 'dept-pr', type: 'department' as const, permissions: { manage_events: true, manage_forms: true } },
    // Year Groups
    { name: 'M.Eng / M.M', slug: 'year-m-eng-m-m', type: 'year' as const, permissions: {} },
    { name: 'Year 1', slug: 'year-1', type: 'year' as const, permissions: {} },
    { name: 'Year 2', slug: 'year-2', type: 'year' as const, permissions: {} },
    { name: 'Year 3', slug: 'year-3', type: 'year' as const, permissions: {} },
    { name: 'Year 4', slug: 'year-4', type: 'year' as const, permissions: {} },
    { name: 'Year 5', slug: 'year-5', type: 'year' as const, permissions: {} },
    { name: 'Year 6', slug: 'year-6', type: 'year' as const, permissions: {} },
    // Track Groups
    { name: 'M.D', slug: 'track-md', type: 'track' as const, permissions: {} },
    { name: 'M.D-M.Eng.', slug: 'track-md-meng', type: 'track' as const, permissions: {} },
    { name: 'M.D-M.M', slug: 'track-md-mm', type: 'track' as const, permissions: {} },
    { name: 'RAK', slug: 'track-rak', type: 'track' as const, permissions: {} },
  ]

  for (const group of groups) {
    const existing = await payload.find({
      collection: 'groups',
      where: { slug: { equals: group.slug } },
      limit: 1,
    })
    if (existing.totalDocs > 0) {
      console.log(`   ℹ️  ${group.name} (exists)`)
    } else {
      await payload.create({
        collection: 'groups',
        data: group,
        overrideAccess: true,
      })
      console.log(`   ✅ ${group.name}`)
    }
  }

  // ── Locations ────────────────────────────────────
  console.log('\n📍 Seeding Locations...')
  const locations = [
    { campus: 'Ramathibodi Hospital', building: 'Building 1', room: 'Room 301' },
    { campus: 'Ramathibodi Hospital', building: 'Building 1', room: 'Room 201' },
    { campus: 'Ramathibodi Hospital', building: 'Anatomy Building', room: 'Lecture Hall A' },
    { campus: 'Online' },
  ]

  const locationIds: Record<string, number> = {}
  for (const loc of locations) {
    const displayName = [loc.campus, loc.building, loc.room].filter(Boolean).join(', ')
    const existing = await payload.find({
      collection: 'locations',
      where: {
        and: [
          { campus: { equals: loc.campus } },
          ...(loc.building ? [{ building: { equals: loc.building } }] : []),
          ...(loc.room ? [{ room: { equals: loc.room } }] : []),
        ],
      },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      locationIds[displayName] = existing.docs[0].id
      console.log(`   ℹ️  ${displayName} (exists)`)
    } else {
      // The 'name' field is computed via beforeChange hook from campus/building/room
      const doc = await payload.create({
        collection: 'locations',
        data: {
          campus: loc.campus,
          building: loc.building || undefined,
          room: loc.room || undefined,
        },
        overrideAccess: true,
      })
      locationIds[displayName] = doc.id
      console.log(`   ✅ ${displayName}`)
    }
  }

  // ── Users ────────────────────────────────────────
  console.log('\n👤 Seeding Users...')
  const users = [
    {
      email: 'kraiwish.kai@student.mahidol.edu',
      roles: ['superadmin'] as ('superadmin')[],
      name_english: { first_name: 'Kraiwish', last_name: 'Kai', nickname: 'Ohm' },
      name_thai: { first_name: 'ไกรวิชญ์', last_name: 'ไค', nickname: 'โอม' },
      academic: { student_id: '6500001', year: 'Year_4' as const, track: 'MD' as const },
    },
    {
      email: 'admin@test.com',
      roles: ['admin'] as ('admin')[],
      name_english: { first_name: 'Admin', last_name: 'User', nickname: 'Admin' },
      name_thai: { first_name: 'แอดมิน', last_name: 'ผู้ใช้', nickname: 'แอด' },
      academic: { student_id: '6500002', year: 'Year_3' as const, track: 'MD_MEng' as const },
    },
    {
      email: 'staff.od@test.com',
      roles: ['staff'] as ('staff')[],
      department: 'OD' as const,
      name_english: { first_name: 'Staff', last_name: 'OD', nickname: 'OD' },
      name_thai: { first_name: 'สตาฟ', last_name: 'โอดี', nickname: 'โอ' },
      academic: { student_id: '6500003', year: 'Year_2' as const, track: 'MD' as const },
    },
    {
      email: 'member@test.com',
      roles: ['member'] as ('member')[],
      name_english: { first_name: 'Regular', last_name: 'Member', nickname: 'Mem' },
      name_thai: { first_name: 'สมาชิก', last_name: 'ทั่วไป', nickname: 'ซิก' },
      academic: { student_id: '6500005', year: 'Year_1' as const, track: 'MD' as const },
    },
  ]

  const createdUsers: Record<string, number> = {}
  for (const user of users) {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: user.email } },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      createdUsers[user.email] = existing.docs[0].id
      console.log(`   ℹ️  ${user.email} (exists)`)
    } else {
      const doc = await payload.create({
        collection: 'users',
        data: {
          email: user.email,
          password: 'seed-dummy-password-not-used', // Required by Payload auth; users login via Google OAuth
          roles: user.roles,
          department: user.department,
          name_english: user.name_english,
          name_thai: user.name_thai,
          academic: user.academic,
          notification_preferences: { email_opt_in: true },
        },
        overrideAccess: true,
      })
      createdUsers[user.email] = doc.id
      console.log(`   ✅ ${user.email}`)
    }
  }

  // ── Events ────────────────────────────────────────
  console.log('\n🎉 Seeding Events...')
  const adminId = createdUsers['kraiwish.kai@student.mahidol.edu'] || createdUsers['admin@test.com']
  const staffId = createdUsers['staff.od@test.com']
  const ramaBld1Rm301 = locationIds['Ramathibodi Hospital, Building 1, Room 301']
  const onlineId = locationIds['Online']

  const events = [
    {
      name: 'Surgical Skills Workshop 2026',
      description: 'Learn essential surgical skills including suturing, knot-tying, and basic procedures.',
      owner: adminId,
      coordinator: staffId,
      date_begin: '2026-03-15T09:00:00Z',
      date_end: '2026-03-15T17:00:00Z',
      location: ramaBld1Rm301,
      event_type: 'workshop_full' as const,
      department: 'OD' as const,
      participant_limit: 30,
      is_visible: true,
      registration_opens_at: '2026-02-01T00:00:00Z',
      registration_closes_at: '2026-03-10T23:59:59Z',
      status_override: 'auto' as const,
    },
    {
      name: 'Anatomy Review Session',
      description: 'Comprehensive anatomy review for upcoming exams. Focus on upper and lower limb.',
      owner: adminId,
      coordinator: staffId,
      date_begin: '2026-04-01T13:00:00Z',
      date_end: '2026-04-01T16:00:00Z',
      location: onlineId,
      event_type: 'special_lecture' as const,
      department: 'AD' as const,
      participant_limit: 100,
      is_visible: true,
      registration_opens_at: '2026-03-01T00:00:00Z',
      registration_closes_at: '2026-03-28T23:59:59Z',
      status_override: 'auto' as const,
    },
    {
      name: 'SurgSoc Annual Camp',
      description: 'Join us for our annual camp! Team building, workshops, and fun activities.',
      owner: adminId,
      coordinator: staffId,
      date_begin: '2026-05-10T08:00:00Z',
      date_end: '2026-05-12T18:00:00Z',
      event_type: 'event' as const,
      department: 'OD' as const,
      participant_limit: 50,
      is_visible: true,
      registration_opens_at: '2026-04-01T00:00:00Z',
      registration_closes_at: '2026-05-01T23:59:59Z',
      max_waiting_list: 10,
      auto_promote: true,
      status_override: 'auto' as const,
    },
  ]

  for (const event of events) {
    const existing = await payload.find({
      collection: 'events',
      where: {
        and: [
          { name: { equals: event.name } },
          { date_begin: { equals: event.date_begin } },
        ],
      },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      console.log(`   ℹ️  ${event.name} (exists)`)
    } else {
      await payload.create({
        collection: 'events',
        data: event,
        overrideAccess: true,
      })
      console.log(`   ✅ ${event.name}`)
    }
  }

  // ── Academic Titles ────────────────────────────────
  console.log('\n🎓 Seeding Academic Titles...')
  const academicTitles = [
    { title_thai: 'ศ.นพ.', title_english: 'Prof. Dr.' },
    { title_thai: 'รศ.นพ.', title_english: 'Assoc. Prof. Dr.' },
    { title_thai: 'ผศ.นพ.', title_english: 'Asst. Prof. Dr.' },
    { title_thai: 'นพ.', title_english: 'Dr.' },
  ]

  const createdTitles: { [key: string]: string } = {}
  const titleIdToString: { [key: string]: string } = {}

  for (const title of academicTitles) {
    const existing = await payload.find({
      collection: 'academic_titles',
      where: {
        title_thai: { equals: title.title_thai },
      },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      createdTitles[title.title_thai] = existing.docs[0].id
      titleIdToString[existing.docs[0].id] = title.title_thai
      console.log(`   ℹ️  ${title.title_thai} (exists)`)
    } else {
      const created = await payload.create({
        collection: 'academic_titles',
        data: title,
        overrideAccess: true,
      })
      createdTitles[title.title_thai] = created.id
      titleIdToString[created.id] = title.title_thai
      console.log(`   ✅ ${title.title_thai}`)
    }
  }

  // ── Attendings ─────────────────────────────────────
  console.log('\n🩺 Seeding Attendings...')
  const attendings = [
    {
      name_english: { first_name: 'Somchai', last_name: 'Suwannapong' },
      name_thai: { first_name: 'สมชาย', last_name: 'สุวรรณพงษ์' },
      title: createdTitles['ศ.นพ.'],
      specialty: 'general_surgery' as const,
      is_visible: true,
      sort_order: 0,
    },
    {
      name_english: { first_name: 'Pornchai', last_name: 'Rattanakit' },
      name_thai: { first_name: 'พรชัย', last_name: 'รัตนกิจ' },
      title: createdTitles['รศ.นพ.'],
      specialty: 'cardiothoracic' as const,
      is_visible: true,
      sort_order: 1,
    },
  ]

  for (const att of attendings) {
    const existing = await payload.find({
      collection: 'attendings',
      where: {
        and: [
          { 'name_english.first_name': { equals: att.name_english.first_name } },
          { 'name_english.last_name': { equals: att.name_english.last_name } },
        ],
      },
      limit: 1,
    })

    const titleString = titleIdToString[att.title as string] || att.title
    const displayName = `${titleString} ${att.name_english.first_name} ${att.name_english.last_name}`
    if (existing.totalDocs > 0) {
      console.log(`   ℹ️  ${displayName} (exists)`)
    } else {
      await payload.create({
        collection: 'attendings',
        data: att,
        overrideAccess: true,
      })
      console.log(`   ✅ ${displayName}`)
    }
  }

  // ── Team Members ──────────────────────────────────
  console.log('\n👥 Seeding Team Members...')
  const teamMembers = [
    { email: 'kraiwish.kai@student.mahidol.edu', position: 'President', academic_year: '2025-2026', sort_order: 0 },
    { email: 'admin@test.com', position: 'Vice President', academic_year: '2025-2026', sort_order: 1 },
    { email: 'staff.od@test.com', position: 'Head of OD', academic_year: '2025-2026', sort_order: 5 },
  ]

  for (const tm of teamMembers) {
    const userId = createdUsers[tm.email]
    if (!userId) {
      console.log(`   ⚠️  ${tm.email} not found`)
      continue
    }

    const existing = await payload.find({
      collection: 'team-members',
      where: {
        and: [
          { user: { equals: userId } },
          { academic_year: { equals: tm.academic_year } },
        ],
      },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      console.log(`   ℹ️  ${tm.position} (exists)`)
    } else {
      await payload.create({
        collection: 'team-members',
        data: {
          user: userId,
          position: tm.position,
          academic_year: tm.academic_year,
          is_current: true,
          sort_order: tm.sort_order,
        },
        overrideAccess: true,
      })
      console.log(`   ✅ ${tm.position}`)
    }
  }

  // ── Home & Terms Globals ────────────────────────
  console.log('\n📄 Seeding Home/Terms Content Globals...')

  await payload.updateGlobal({
    slug: 'home-content',
    data: {
      sections: [
        {
          kicker: 'About The Society',
          heading: 'Where Passion, Determination, and Teamwork Forge the Future',
          body: 'Ramathibodi Surgical Society is a student-driven community dedicated to growth in surgical knowledge, collaboration, and service.',
          imageUrl: '/assets/beta.jpg',
        },
      ],
    },
    overrideAccess: true,
  })
  console.log('   ✅ Home Content global')

  await payload.updateGlobal({
    slug: 'terms-content',
    data: {
      intro: 'This page unifies terms of use and privacy commitments. Continued use of the platform means you agree to these policies.',
      sections: [
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
      ],
    },
    overrideAccess: true,
  })
  console.log('   ✅ Terms Content global')

  // ── Forms ──────────────────────────────────────────
  console.log('\n📝 Seeding Forms...')
  const sampleForm = {
    title: 'Participant Feedback & Registration',
    confirmationType: 'message',
    confirmationMessage: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [{ type: 'text', version: 1, text: 'Thank you for your submission!' }],
            direction: 'ltr',
            format: '',
            indent: 0,
          }
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      }
    },
    publish: {
      status: 'auto',
      allow_edits: true,
      allow_multiple_submissions: false,
    },
    fields: [
      {
        name: 'user_profile',
        label: 'User Profile Prefill',
        blockType: 'userProfile',
        profileField: 'name_english.first_name',
        readOnly: true,
      },
        {
        name: 'satisfaction',
        label: 'Overall Satisfaction',
        blockType: 'slider',
        variant: 'stars',
        min: 1,
        max: 5,
        required: true,
      },
      {
        name: 'topics_interest',
        label: 'Topics of Interest',
        blockType: 'checkboxGroup',
        options: [
          { label: 'Suturing', value: 'suturing' },
          { label: 'Knots', value: 'knots' },
          { label: 'Anatomy', value: 'anatomy' },
        ],
        minSelect: 1,
        maxSelect: 2,
      },
      {
        name: 'event_ranking',
        label: 'Rank these events by preference',
        blockType: 'ranking',
        options: [
          { label: 'Morning Session', value: 'morning' },
          { label: 'Afternoon Workshop', value: 'afternoon' },
          { label: 'Evening Networking', value: 'evening' },
        ],
      },
      {
        name: 'additional_comments',
        label: 'Additional Comments',
        blockType: 'textarea',
        conditional: {
            enabled: true,
            action: 'show',
            source_field: 'satisfaction',
            operator: 'less_than',
            value: 3
        }
      }
    ],
  } as any

  const existingForm = await payload.find({
      collection: 'forms',
      where: { title: { equals: sampleForm.title } },
      limit: 1,
  })

  if (existingForm.totalDocs > 0) {
      console.log(`   ℹ️  ${sampleForm.title} (exists)`)
  } else {
      await payload.create({
          collection: 'forms',
          data: sampleForm,
          overrideAccess: true,
      })
      console.log(`   ✅ ${sampleForm.title}`)
  }

  console.log('\n────────────────────────────────────────')
  console.log('\n✅ Database seeding complete!')
  console.log('\n📋 Test Users (use Google OAuth):')
  console.log('   • kraiwish.kai@student.mahidol.edu (superadmin)')
  console.log('   • admin@test.com (admin)')
  console.log('   • staff.od@test.com (staff)')
  console.log('   • member@test.com (member)')
  console.log('\n🚀 Start the dev server: pnpm run dev')
}

// Run directly if this is the main script
const isMainScript = process.argv[1]?.includes('seed-db')
if (isMainScript) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Unhandled error:', err)
      process.exit(1)
    })
}
