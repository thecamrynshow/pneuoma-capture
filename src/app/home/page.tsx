'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { MODE_CONFIG, MODE_STORAGE_KEY, type AppMode } from '@/lib/modes'

const modeIcons: Record<AppMode, { color: string; icon: React.ReactNode }> = {
  education: {
    color: 'var(--accent)',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  corporate: {
    color: 'var(--accent-blue)',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  individual: {
    color: 'var(--accent-purple)',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
}

export default function HomePage() {
  const router = useRouter()

  const selectMode = (mode: AppMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MODE_STORAGE_KEY, mode)
      router.push('/')
    }
  }

  return (
    <div className="px-4 pt-8 pb-6 min-h-[80vh] flex flex-col">
      <div className="text-center mb-8">
        <p className="text-[var(--text-muted)] text-[11px] opacity-50 mb-1">πνεῦμα</p>
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-[-0.3px]">PNEUOMA</h1>
      </div>

      <h2 className="text-xl font-extrabold text-[var(--text-primary)] text-center mb-2">What do you capture?</h2>
      <p className="text-xs text-[var(--text-muted)] text-center mb-8">
        Choose your profession to customize your experience. You can switch anytime.
      </p>

      <div className="flex flex-col gap-[10px] flex-1">
        {(Object.entries(MODE_CONFIG) as [AppMode, (typeof MODE_CONFIG)[AppMode]][]).map(([id, config]) => {
          const { color, icon } = modeIcons[id]
          return (
            <button
              key={id}
              onClick={() => selectMode(id)}
              className="w-full text-left cta-gradient rounded-[var(--radius)] p-4 transition-all hover:translate-y-[-1px] active:scale-[0.99]"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--bg-elevated)', color }}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--text-primary)]">{config.label}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">{config.subtitle}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{config.description}</p>
                </div>
                <svg className="w-[18px] h-[18px] text-[var(--text-muted)] shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-center text-[10px] text-[var(--text-muted)] mt-8 tracking-[0.3px]">
        PNEUOMA Capture — Voice-first documentation
      </p>
    </div>
  )
}
