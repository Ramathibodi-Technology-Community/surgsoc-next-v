'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { User } from '@/payload-types'

const profileSchema = z.object({
  nickname_thai: z.string().max(50).optional().default(''),
  nickname_english: z.string().max(50).optional().default(''),
  first_name_thai: z.string().max(100).optional().default(''),
  last_name_thai: z.string().max(100).optional().default(''),
  first_name_english: z.string().max(100).optional().default(''),
  last_name_english: z.string().max(100).optional().default(''),
  phone_number: z.string().regex(/^(0\d{1,2}-?\d{3}-?\d{4})?$/, 'Invalid phone format').optional().default(''),
  line_id: z.string().max(50).optional().default(''),
  dob: z.string().refine(v => !v || !isNaN(Date.parse(v)), 'Invalid date').optional().default(''),
  track: z.enum(['MD', 'MD_MEng', 'MD_MM', 'RAK', '']).optional().default(''),
  year: z.string().optional().default(''),
  student_id: z.string().max(20).optional().default(''),
  interests: z.array(z.string()).optional().default([]),
  portfolio: z.array(z.object({
    year: z.string(),
    activity: z.string().max(200),
    role: z.string().max(200).optional().default(''),
  })).max(20).optional().default([]),
  social_media: z.array(z.object({
    platform: z.string().max(50),
    handle: z.string().max(200),
  })).max(10).optional().default([]),
})

export async function updateProfile(prevState: { success: boolean; message: string } | null, formData: FormData) {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    // Parse JSON fields
    let rawPortfolio: unknown[] = []
    const portfolioJson = formData.get('portfolio_json')
    if (typeof portfolioJson === 'string' && portfolioJson) {
      try { rawPortfolio = JSON.parse(portfolioJson) } catch { /* ignore */ }
    }

    let rawSocialMedia: unknown[] = []
    const socialMediaJson = formData.get('social_media_json')
    if (typeof socialMediaJson === 'string' && socialMediaJson) {
      try { rawSocialMedia = JSON.parse(socialMediaJson) } catch { /* ignore */ }
    }

    const parsed = profileSchema.safeParse({
      nickname_thai: formData.get('nickname_thai') || '',
      nickname_english: formData.get('nickname_english') || '',
      first_name_thai: formData.get('first_name_thai') || '',
      last_name_thai: formData.get('last_name_thai') || '',
      first_name_english: formData.get('first_name_english') || '',
      last_name_english: formData.get('last_name_english') || '',
      phone_number: formData.get('phone_number') || '',
      line_id: formData.get('line_id') || '',
      dob: formData.get('dob') || '',
      track: formData.get('track') || '',
      year: formData.get('year') || '',
      student_id: formData.get('student_id') || '',
      interests: formData.getAll('interests'),
      portfolio: rawPortfolio,
      social_media: rawSocialMedia,
    })

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return { success: false, message: firstError?.message || 'Validation failed' }
    }

    const d = parsed.data

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        name_thai: {
          first_name: d.first_name_thai || user.name_thai?.first_name || '',
          last_name: d.last_name_thai || user.name_thai?.last_name || '',
          nickname: d.nickname_thai,
        },
        name_english: {
          first_name: d.first_name_english || user.name_english?.first_name || '',
          last_name: d.last_name_english || user.name_english?.last_name || '',
          nickname: d.nickname_english,
        },
        contact: {
          ...user.contact,
          phone_number: d.phone_number,
          line_id: d.line_id,
        },
        social_media: d.social_media as NonNullable<User['social_media']>,
        interests: d.interests as NonNullable<User['interests']>,
        dob: d.dob || undefined,
        portfolio: d.portfolio as NonNullable<User['portfolio']>,
        academic: {
          student_id: d.student_id || user.academic?.student_id || '',
          track: (d.track || undefined) as any,
          year: (d.year || undefined) as any,
        },
      },
    })

    revalidatePath('/account')
    return { success: true, message: 'Profile updated successfully' }

  } catch (error) {
    console.error('Update profile error:', error)
    return { success: false, message: 'Failed to update profile' }
  }
}
