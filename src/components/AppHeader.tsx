'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { MODE_CONFIG, MODE_STORAGE_KEY, getStoredMode, type AppMode } from '@/lib/modes'

const MODES: AppMode[] = ['education', 'corporate', 'individual']
const AUTH_PATHS = ['/login', '/signup']

export default function AppHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mode, setMode] = useState<AppMode>('education')
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMode(getStoredMode())

    // Detect safe area inset via JS as fallback when env() returns 0
    const probe = document.createElement('div')
    probe.style.cssText = 'position:fixed;top:0;left:0;height:env(safe-area-inset-top,0px);height:constant(safe-area-inset-top);pointer-events:none;visibility:hidden;'
    document.body.appendChild(probe)
    requestAnimationFrame(() => {
      const inset = probe.offsetHeight
      if (inset === 0 && /iPhone|iPad/.test(navigator.userAgent)) {
        document.documentElement.style.setProperty('--sat-fallback', '47px')
      }
      probe.remove()
    })
  }, [])

  const current = MODE_CONFIG[mode]
  const showAppControls = session && !AUTH_PATHS.some((p) => pathname.startsWith(p))

  const selectMode = (m: AppMode) => {
    setMode(m)
    setOpen(false)
    localStorage.setItem(MODE_STORAGE_KEY, m)
    window.dispatchEvent(new Event('pneuoma-mode-change'))
  }

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 nav-top app-header z-50 flex items-end px-4" style={{ paddingBottom: '8px' }}>
      <div className="max-w-[500px] mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-[0.5px] text-[var(--text-primary)]">
            <span className="text-[var(--text-muted)] text-[11px] opacity-50 mr-1.5">πνεῦμα</span>
            PNEUOMA
          </span>
          <Link
            href="/privacy"
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors font-medium"
          >
            Privacy
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {showAppControls && (
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-1 px-[10px] py-1 rounded-full font-bold text-[10px] tracking-[0.5px] transition-colors"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                {(session?.user?.email ?? '').slice(0, 2).toUpperCase()}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} aria-hidden="true" />
                  <div
                    className="absolute right-0 top-full mt-1 z-50 min-w-[160px] py-1 rounded-xl shadow-xl"
                    style={{ background: 'var(--bg-mid)', border: '1px solid var(--border-light)' }}
                  >
                    <p className="px-4 py-2 text-xs text-[var(--text-muted)] truncate max-w-[140px]">
                      {session?.user?.email}
                    </p>
                    <button
                      onClick={() => { setAccountOpen(false); signOut({ callbackUrl: '/login' }) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--accent-red)] font-semibold hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {showAppControls && (
          <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 px-[10px] py-1 rounded-full font-bold text-[10px] tracking-[0.5px] uppercase transition-colors"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
          >
            {current.label.toUpperCase()}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
              <div
                className="absolute right-0 top-full mt-1 z-50 min-w-[180px] py-1 rounded-xl shadow-xl"
                style={{ background: 'var(--bg-mid)', border: '1px solid var(--border-light)' }}
              >
                {MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => selectMode(m)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                    style={{
                      background: mode === m ? 'var(--accent-dim)' : 'transparent',
                      color: mode === m ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    <span className="font-semibold text-xs tracking-[0.3px]">{MODE_CONFIG[m].label.toUpperCase()}</span>
                    <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {MODE_CONFIG[m].subtitle}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          </div>
          )}
        </div>
      </div>
    </header>
  )
}
