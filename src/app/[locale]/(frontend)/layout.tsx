import React from 'react'
import '../../globals.css'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { Inter, IBM_Plex_Sans_Thai_Looped, Pacifico, Dancing_Script } from 'next/font/google'
import { Locale, locales } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { I18nProvider } from '@/i18n/client'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const ibm = IBM_Plex_Sans_Thai_Looped({ weight: ['400', '500', '600', '700'], subsets: ['thai', 'latin'], variable: '--font-thai', display: 'swap' })
const pacifico = Pacifico({ weight: ['400'], subsets: ['latin'], variable: '--font-pacifico', display: 'swap' })
const dancing = Dancing_Script({ subsets: ['latin'], variable: '--font-script', display: 'swap' })

export const metadata = {
  title: 'Ramathibodi Surgical Society',
  description: 'Ramathibodi Surgical Society Website',
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function RootLayout({
  children,
  params,
}: Props) {
  const { locale } = await params as { locale: Locale }
  const dictionary = await getDictionary(locale)


  return (
    <html lang={locale} className="scroll-smooth">
      <body className={`flex flex-col min-h-screen bg-background text-foreground ${inter.variable} ${ibm.variable} ${pacifico.variable} ${dancing.variable} font-sans antialiased`}>
        <I18nProvider locale={locale} dictionary={dictionary}>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  )
}
