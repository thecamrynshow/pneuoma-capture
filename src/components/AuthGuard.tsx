'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const PUBLIC_PATHS = ['/login', '/signup', '/privacy']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    if (!session && !isPublic) {
      router.replace('/login')
    } else {
      setReady(true)
    }
  }, [session, status, pathname, router])

  if (status === 'loading' || !ready) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-[48px] h-[48px] rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
      </div>
    )
  }
  return <>{children}</>
}
