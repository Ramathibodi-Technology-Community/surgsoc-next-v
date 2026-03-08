'use client'

import React from 'react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-background">
      <Separator />
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Ramathibodi Surgical Society. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/feedback" className="underline-offset-4 transition-colors hover:text-primary hover:underline">
            Feedback
          </Link>
          <Link href="/terms" className="underline-offset-4 transition-colors hover:text-primary hover:underline">
            Terms & Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}
