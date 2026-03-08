'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { confirmAttendance, declineAttendance } from './actions'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EventActions({
  eventId,
  primaryAction,
  secondaryAction,
}: {
  eventId: string
  primaryAction: { label: string; kind: string; disabled?: boolean }
  secondaryAction?: { label: string; kind: string; href?: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState('')

  const handleConfirm = async () => {
    setLoading('confirm')
    await confirmAttendance(eventId)
    router.refresh()
    setLoading('')
  }

  const handleDecline = async () => {
    // If it's a link (like LOA form), we don't need to call server action here, router will handle navigation
    // But if it's a direct decline action (no form), we call server action
    if (secondaryAction?.href && secondaryAction.href.startsWith('/forms')) {
        return // Let the Link handle it
    }

    setLoading('decline')
    await declineAttendance(eventId)
    router.refresh()
    setLoading('')
  }

  return (
    <div className="space-y-3 w-full md:w-auto">
      <Button
        onClick={handleConfirm}
        className="w-full text-lg h-12"
        disabled={!!loading || primaryAction.disabled}
        variant={primaryAction.kind === 'confirmed' ? 'outline' : 'default'}
      >
        {loading === 'confirm' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {primaryAction.label}
      </Button>

      {secondaryAction && (
        secondaryAction.href ? (
             <Button
                asChild
                variant="outline"
                className="w-full"
                disabled={!!loading}
             >
                <Link href={secondaryAction.href}>
                    {secondaryAction.label}
                </Link>
             </Button>
        ) : (
            <Button
              onClick={handleDecline}
              variant="outline"
              className="w-full"
              disabled={!!loading}
            >
              {loading === 'decline' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {secondaryAction.label}
            </Button>
        )
      )}
    </div>
  )
}
