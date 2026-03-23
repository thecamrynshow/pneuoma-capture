'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { MODE_STORAGE_KEY } from '@/lib/modes'

const PUBLIC_PATHS = ['/home', '/privacy', '/login', '/signup']

export default function ModeGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const mode = localStorage.getItem(MODE_STORAGE_KEY)
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    if (!mode && !isPublic) {
      router.replace('/home')
    } else {
      setReady(true)
    }
  }, [pathname, router])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-[48px] h-[48px] rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
      </div>
    )
  }
  return <>{children}</>
}
