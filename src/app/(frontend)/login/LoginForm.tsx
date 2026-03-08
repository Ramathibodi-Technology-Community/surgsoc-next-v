'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loginWithEmail } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertCircle } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await loginWithEmail(null, formData)

    setIsLoading(false)
    if (result.success) {
      router.push('/account')
      router.refresh()
    } else {
      setError('Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <Card className="max-w-md w-full shadow-lg border-muted">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-lg">
            Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Google Login */}
          <Button asChild size="lg" className="w-full text-lg h-12">
            <Link href="/api/auth/google">
              Sign in with Google
            </Link>
          </Button>

          {/* Separator */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
              Or
            </span>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sign in with Email</>
              ) : (
                "Sign in with Email"
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Email login is for accounts with a password set.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
