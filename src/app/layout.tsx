import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import AppHeader from '@/components/AppHeader'
import SessionProvider from '@/components/SessionProvider'
import AuthGuard from '@/components/AuthGuard'
import ModeGuard from '@/components/ModeGuard'
import Navigation from '@/components/Navigation'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PNEUOMA - Incident Capture & Containment',
  description: 'Voice-first incident documentation and containment system.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PNEUOMA',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#07080d',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="min-h-dvh" style={{ background: '#07080d' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh`}
        style={{ background: '#07080d' }}
      >
        <div className="fixed inset-0 -z-10" style={{ background: '#07080d' }} aria-hidden />
        <SessionProvider>
          <AppHeader />
          <main className="max-w-[500px] mx-auto pb-28 min-h-dvh relative main-content">
            <AuthGuard>
              <ModeGuard>{children}</ModeGuard>
            </AuthGuard>
          </main>
        </SessionProvider>
        <Navigation />
      </body>
    </html>
  )
}
