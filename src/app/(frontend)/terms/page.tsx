import React from 'react'
import type { Metadata } from 'next'
import { getTermsContent } from '@/libs/site-content'

export const dynamic = 'force-dynamic'
import { Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms & Privacy Policy | RASS',
  description: 'Terms of service and privacy policy for the Ramathibodi Surgical Society platform, compliant with Thailand PDPA.',
}

export default async function TermsPage() {
  const termsContent = await getTermsContent()

  return (
    <section className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 animate-in fade-in duration-500 overflow-hidden">
      <div className="pointer-events-none absolute -top-10 right-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

      <header className="relative rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm p-6 md:p-8 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground mb-4">
          Policy Center
        </div>
        <div className="flex items-start gap-3 mb-3">
          <Shield className="w-7 h-7 text-primary mt-1" />
          <h1 className="font-script text-4xl md:text-5xl leading-tight text-primary">Terms & Privacy Policy</h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {termsContent.intro}
        </p>
      </header>

      <article className="space-y-4">
        {termsContent.sections.map((section, index) => (
          <section key={`${section.title}-${index}`} className="relative rounded-2xl border border-border/70 bg-card p-6 md:p-8 shadow-sm">
            <h2 className="text-lg md:text-xl font-semibold mb-3">{section.title}</h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
          </section>
        ))}
      </article>

      <footer className="mt-6 rounded-xl border border-border/70 bg-muted/30 p-4 text-xs md:text-sm text-muted-foreground">
        Need updates? Edit sections in the Terms Content global in Payload admin.
      </footer>
    </section>
  )
}
