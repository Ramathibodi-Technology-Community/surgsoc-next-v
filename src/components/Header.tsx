import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import LogoWithFallback from './LogoWithFallback'
import MobileMenu from './MobileMenu'
import { LanguageToggle } from './LanguageToggle'
import { Button } from '@/components/ui/button'
import { getSiteSettings } from '@/libs/site-settings'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function Header() {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  const { enableI18n } = await getSiteSettings()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xs supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo/Home */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <LogoWithFallback />
          <span className="font-bold text-primary text-lg hidden sm:inline-block">RASS</span>
        </Link>

        {/* Desktop Menu - Centered */}
        <div className="hidden md:flex flex-1 justify-center">
           <NavigationMenu>
             <NavigationMenuList>
               <NavigationMenuItem>
                 <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                   <Link href="/forms">Forms</Link>
                 </NavigationMenuLink>
               </NavigationMenuItem>
               <NavigationMenuItem>
                 <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                   <Link href="/events">Events</Link>
                 </NavigationMenuLink>
               </NavigationMenuItem>
               <NavigationMenuItem>
                 <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                   <Link href="/attendings">Advisors</Link>
                 </NavigationMenuLink>
               </NavigationMenuItem>
               <NavigationMenuItem>
                 <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                   <Link href="/team">Team</Link>
                 </NavigationMenuLink>
               </NavigationMenuItem>
             </NavigationMenuList>
           </NavigationMenu>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {enableI18n && <LanguageToggle />}

          {/* Account / Login */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image_url || ''} alt={user.email} />
                    <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name_english?.first_name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">My Account</Link>
                </DropdownMenuItem>
                {(user.roles?.some((role) => ['admin', 'superadmin', 'vp', 'deputy_vp'].includes(role))) && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/logout" className="text-destructive focus:text-destructive">Sign Out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">
                Sign In
              </Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
