'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    href: '/capture',
    label: 'Capture',
    primary: true,
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    href: '/incidents',
    label: 'Incidents',
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
]

export default function Navigation() {
  const pathname = usePathname()
  const path = pathname?.replace(/\/$/, '') || '/'

  return (
    <nav className="fixed bottom-0 left-0 right-0 nav-bottom z-40 safe-area-bottom">
      <div className="max-w-[500px] mx-auto flex items-end justify-around px-2 py-[6px]">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? path === '/' || path === ''
              : path === item.href || path.startsWith(item.href + '/')

          if (item.primary) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-5">
                <div
                  className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[var(--accent)] text-black accent-glow shadow-[0_4px_24px_rgba(245,158,11,0.5)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                  }`}
                >
                  {item.icon(isActive)}
                </div>
                <span className="text-[10px] mt-1 font-semibold tracking-[0.3px] text-[var(--accent)]">
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center py-[6px] px-3 rounded-xl transition-colors">
              <div className={`transition-colors ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                {item.icon(isActive)}
              </div>
              <span
                className={`text-[10px] mt-0.5 font-semibold tracking-[0.3px] ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
