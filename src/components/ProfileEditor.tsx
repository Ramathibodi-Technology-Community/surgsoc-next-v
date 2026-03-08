'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/app/(frontend)/account/actions'
import { interestOptions } from '@/libs/fields/interests'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Loader2, Plus, Trash2, Edit2, X, Check,
  User, GraduationCap, Contact, Award, Heart,
} from 'lucide-react'
import { cn } from '@/libs/utils'

// ─── Editable Section Wrapper ───────────────────────────────────────
function EditableSection({
  title,
  icon,
  children,
  editForm,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  editForm: React.ReactNode
}) {
  const [editing, setEditing] = useState(false)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          {icon} {title}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(!editing)}
          className="h-8 px-2 text-xs"
        >
          {editing ? <><X className="w-3 h-3 mr-1" /> Cancel</> : <><Edit2 className="w-3 h-3 mr-1" /> Edit</>}
        </Button>
      </CardHeader>
      <Separator />
      <CardContent className="p-6">
        {editing ? editForm : children}
      </CardContent>
    </Card>
  )
}

// ─── Input Helper ───────────────────────────────────────────────────
function Field({ label, name, defaultValue, placeholder, type = 'text', readOnly }: {
  label: string; name: string; defaultValue?: string; placeholder?: string; type?: string; readOnly?: boolean
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      <Input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(readOnly && 'opacity-50 cursor-not-allowed')}
      />
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────
export default function ProfileEditor({ user }: { user: any }) {
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null)
  const [portfolio, setPortfolio] = useState<any[]>(Array.isArray(user.portfolio) ? user.portfolio : [])
  const [socialMedia, setSocialMedia] = useState<any[]>(
    Array.isArray(user.social_media) ? user.social_media : []
  )
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    formData.append('portfolio_json', JSON.stringify(portfolio))
    formData.append('social_media_json', JSON.stringify(socialMedia))

    const result = await updateProfile(null, formData)

    setIsSaving(false)
    if (result.success) {
      setMessage({ text: 'Profile saved successfully.', success: true })
      router.refresh()
      setTimeout(() => setMessage(null), 2000)
    } else {
      setMessage({ text: result.message || 'Failed to save profile.', success: false })
    }
  }

  // ── Display helpers ──
  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="font-medium text-sm">{value || <span className="text-muted-foreground italic">—</span>}</p>
    </div>
  )

  const trackLabels: Record<string, string> = { MD: 'M.D', MD_MEng: 'M.D-M.Eng.', MD_MM: 'M.D.-M.M', RAK: 'RAK' }
  const yearLabels: Record<string, string> = {
    M_Eng_M_M: 'M.Eng/M.M', Year_1: 'Year 1', Year_2: 'Year 2', Year_3: 'Year 3',
    Year_4: 'Year 4', Year_5: 'Year 5', Year_6: 'Year 6',
  }

  const getFieldLabel = (key: string) => {
    const labels: Record<string, string> = {
        first_name_thai: 'First Name (Thai)',
        last_name_thai: 'Last Name (Thai)',
        first_name_english: 'First Name (English)',
        last_name_english: 'Last Name (English)',
        nickname_thai: 'Nickname (Thai)',
        nickname_english: 'Nickname (English)',
        dob: 'Date of Birth',
        student_id: 'Student ID',
        track: 'Track',
        year: 'Year',
        phone: 'Phone',
        line_id: 'Line ID',
        platform: 'Platform',
        handle: 'Handle',
        activity: 'Activity',
        role: 'Role',
    }
    return labels[key] || key
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={cn(
          "p-3 rounded-lg text-sm font-medium flex items-center gap-2",
          message.success
            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
            : 'bg-destructive/10 text-destructive border border-destructive/20'
        )}>
          {message.success && <Check className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* ── Personal Info ── */}
      <EditableSection title="Personal Information" icon={<User className="w-5 h-5 text-primary" />}
        editForm={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={getFieldLabel('first_name_thai')} name="first_name_thai" defaultValue={user.name_thai?.first_name} />
            <Field label={getFieldLabel('last_name_thai')} name="last_name_thai" defaultValue={user.name_thai?.last_name} />
            <Field label={getFieldLabel('first_name_english')} name="first_name_english" defaultValue={user.name_english?.first_name} />
            <Field label={getFieldLabel('last_name_english')} name="last_name_english" defaultValue={user.name_english?.last_name} />
            <Field label={getFieldLabel('nickname_thai')} name="nickname_thai" defaultValue={user.name_thai?.nickname} />
            <Field label={getFieldLabel('nickname_english')} name="nickname_english" defaultValue={user.name_english?.nickname} />
            <Field label={getFieldLabel('dob')} name="dob" type="date" defaultValue={user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''} />
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <InfoRow label="Thai Name" value={`${user.name_thai?.first_name || ''} ${user.name_thai?.last_name || ''}`.trim() || undefined} />
          <InfoRow label="English Name" value={`${user.name_english?.first_name || ''} ${user.name_english?.last_name || ''}`.trim() || undefined} />
          <InfoRow label={getFieldLabel('nickname_thai')} value={user.name_thai?.nickname} />
          <InfoRow label={getFieldLabel('nickname_english')} value={user.name_english?.nickname} />
          <InfoRow label={getFieldLabel('dob')} value={user.dob ? new Date(user.dob).toLocaleDateString('en-US') : undefined} />
        </div>
      </EditableSection>

      {/* ── Academic Info ── */}
      <EditableSection title="Academic Information" icon={<GraduationCap className="w-5 h-5 text-primary" />}
        editForm={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label={getFieldLabel('student_id')} name="student_id" defaultValue={user.academic?.student_id} />
            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">{getFieldLabel('track')}</Label>
              <Select name="track" defaultValue={user.academic?.track || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(trackLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">{getFieldLabel('year')}</Label>
              <Select name="year" defaultValue={user.academic?.year || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(yearLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
          <InfoRow label={getFieldLabel('student_id')} value={user.academic?.student_id} />
          <InfoRow label={getFieldLabel('track')} value={user.academic?.track ? trackLabels[user.academic.track] || user.academic.track : undefined} />
          <InfoRow label={getFieldLabel('year')} value={user.academic?.year ? yearLabels[user.academic.year] || user.academic.year : undefined} />
        </div>
      </EditableSection>

      {/* ── Contact & Social Media (Merged) ── */}
      <EditableSection title="Contact & Social Media" icon={<Contact className="w-5 h-5 text-primary" />}
        editForm={
          <div className="space-y-6">
            {/* Contact fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={getFieldLabel('phone')} name="phone_number" defaultValue={user.contact?.phone_number} placeholder="08X-XXX-XXXX" />
              <Field label={getFieldLabel('line_id')} name="line_id" defaultValue={user.contact?.line_id} />
            </div>

            <Separator />

            {/* Social media entries */}
            <div className="space-y-3">
              <Label className="text-xs uppercase text-muted-foreground tracking-wide">Social Media</Label>
              {socialMedia.map((item, i) => (
                <div key={i} className="flex gap-2 items-center bg-muted/20 p-3 rounded-lg border">
                  <Input
                    value={item.platform}
                    onChange={e => { const n = [...socialMedia]; n[i] = { ...n[i], platform: e.target.value }; setSocialMedia(n) }}
                    placeholder={getFieldLabel('platform')}
                    className="flex-1 h-8 text-sm"
                  />
                  <Input
                    value={item.handle}
                    onChange={e => { const n = [...socialMedia]; n[i] = { ...n[i], handle: e.target.value }; setSocialMedia(n) }}
                    placeholder={getFieldLabel('handle')}
                    className="flex-[2] h-8 text-sm"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSocialMedia(socialMedia.filter((_, j) => j !== i))} className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setSocialMedia([...socialMedia, { platform: '', handle: '' }])}>
                <Plus className="w-4 h-4 mr-2" /> Add Account
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <InfoRow label={getFieldLabel('phone')} value={user.contact?.phone_number} />
            <InfoRow label={getFieldLabel('line_id')} value={user.contact?.line_id} />
          </div>
          {socialMedia.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-3">
                {socialMedia.map((item, i) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm font-normal gap-2">
                    <span className="font-semibold text-primary">{item.platform}</span>
                    <span className="opacity-50">|</span>
                    <span>{item.handle}</span>
                  </Badge>
                ))}
              </div>
            </>
          )}
          {socialMedia.length === 0 && (
            <p className="text-muted-foreground italic text-sm">No social media accounts added.</p>
          )}
        </div>
      </EditableSection>

      {/* ── Portfolio ── */}
      <EditableSection title="Portfolio" icon={<Award className="w-5 h-5 text-primary" />}
        editForm={
          <div className="space-y-3">
            {portfolio.map((item, i) => (
              <div key={i} className="flex gap-2 items-start bg-muted/20 p-3 rounded-lg border">
                 <div className="w-24">
                     <Select
                        value={item.year}
                        onValueChange={val => { const n = [...portfolio]; n[i] = { ...n[i], year: val }; setPortfolio(n) }}
                     >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                             {Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => 2020 + i).map(y => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                     </Select>
                 </div>
                <div className="flex-1 space-y-2">
                  <Input value={item.activity} onChange={e => { const n = [...portfolio]; n[i] = { ...n[i], activity: e.target.value }; setPortfolio(n) }} placeholder={getFieldLabel('activity')} className="h-9 text-sm" />
                  <Input value={item.role || ''} onChange={e => { const n = [...portfolio]; n[i] = { ...n[i], role: e.target.value }; setPortfolio(n) }} placeholder={getFieldLabel('role')} className="h-9 text-sm" />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setPortfolio(portfolio.filter((_, j) => j !== i))} className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setPortfolio([...portfolio, { year: String(new Date().getFullYear()), activity: '', role: '' }])}>
                <Plus className="w-4 h-4 mr-2" /> Add Activity
            </Button>
          </div>
        }
      >
        {portfolio.length > 0 ? (
          <div className="space-y-3">
            {portfolio.map((item: any, i: number) => (
              <div key={i} className="flex gap-4 items-start pb-3 border-b last:border-0 last:pb-0">
                <Badge variant="outline" className="min-w-[3rem] justify-center">{item.year}</Badge>
                <div>
                  <p className="font-bold text-sm">{item.activity}</p>
                  {item.role && <p className="text-xs text-muted-foreground">{item.role}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic text-sm">No activities added.</p>
        )}
      </EditableSection>

      {/* ── Interests ── */}
      <EditableSection title="Interests" icon={<Heart className="w-5 h-5 text-primary" />}
        editForm={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {interestOptions.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`interest-${opt.value}`}
                  name="interests"
                  value={opt.value}
                  defaultChecked={user.interests?.some((i: any) => (typeof i === 'string' ? i : i.value) === opt.value)}
                />
                <Label htmlFor={`interest-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
              </div>
            ))}
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          {user.interests?.length > 0 ? (
            user.interests.map((i: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{i}</Badge>
            ))
          ) : (
            <span className="text-muted-foreground italic text-sm">No interests selected.</span>
          )}
        </div>
      </EditableSection>

      {/* ── Save Button ── */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          className="px-8"
          disabled={isSaving}
        >
          {isSaving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  )
}
