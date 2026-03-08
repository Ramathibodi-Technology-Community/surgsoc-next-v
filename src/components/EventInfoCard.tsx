import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface EventInfoCardProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function EventInfoCard({
  label,
  value,
  icon,
  className = '',
  actions,
}: EventInfoCardProps) {
  return (
    <Card className={`py-0 gap-0 rounded-lg shadow-none ${className}`} data-testid="event-info-card">
      <CardContent className="space-y-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {icon && <span className="text-primary">{icon}</span>}
          {label}
          </dt>
          {actions && <div className="flex items-center justify-end">{actions}</div>}
        </div>
        <dd className="break-words text-base font-medium text-foreground">{value || '-'}</dd>
      </CardContent>
    </Card>
  )
}
