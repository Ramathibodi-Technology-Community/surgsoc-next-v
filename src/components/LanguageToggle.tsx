'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localeNames, locales, type Locale } from '@/i18n/config'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const pathname = usePathname()

  const getSwitchUrl = (newLocale: Locale) => {
    // pathname logic:
    // if current is /th/events, and new is en -> /events
    // if current is /events, and new is th -> /th/events

    // Remove current locale prefix if exists
    let path = pathname
    for (const loc of locales) {
      if (path.startsWith(`/${loc}/`) || path === `/${loc}`) {
        path = path.replace(`/${loc}`, '')
        break
      }
    }

    if (!path.startsWith('/')) {
      path = `/${path}`
    }

    if (newLocale === 'en') {
      return path
    }
    return `/${newLocale}${path}`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 px-0">
          <Globe className="h-[1.2rem] w-[1.2rem] transition-all" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem key={locale} asChild>
            <Link href={getSwitchUrl(locale)} className="cursor-pointer">
              {localeNames[locale]}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
