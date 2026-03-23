'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import IncidentCard from '@/components/IncidentCard'
import { getApiBase } from '@/lib/api'
import type { Incident } from '@/types/incident'

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetch(`${getApiBase()}/api/incidents?date=${today}`)
      .then((res) => res.json())
      .then((data) => {
        setIncidents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [today])

  const stats = {
    total: incidents.length,
    open: incidents.filter((i) => i.status === 'open').length,
    inProgress: incidents.filter((i) => i.status === 'in-progress').length,
    urgent: incidents.filter((i) => i.severity === 'Critical' || i.severity === 'High').length,
  }

  return (
    <div className="px-4 pt-2 pb-6">
      <div className="mb-6">
        <h1 className="text-[20px] font-extrabold tracking-[-0.3px] text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Today&apos;s incident overview</p>
      </div>

      {/* CTA Card */}
      <Link href="/capture">
        <div className="cta-gradient rounded-[var(--radius)] p-5 mb-5 flex items-center gap-4 cursor-pointer transition-all hover:translate-y-[-1px] active:scale-[0.99]">
          <div className="w-[52px] h-[52px] bg-[var(--accent)] rounded-full flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(245,158,11,0.25)]">
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Record New Incident</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Tap to start voice capture</p>
          </div>
          <svg className="w-[18px] h-[18px] text-[var(--text-muted)] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Total', value: stats.total, cls: 'text-[var(--text-primary)]' },
          { label: 'Open', value: stats.open, cls: 'text-[var(--accent-blue)]' },
          { label: 'Active', value: stats.inProgress, cls: 'text-[var(--accent-purple)]' },
          { label: 'Urgent', value: stats.urgent, cls: 'text-[var(--accent-red)]' },
        ].map((stat) => (
          <div key={stat.label} className="card-surface rounded-[var(--radius-sm)] p-3 text-center">
            <p className={`text-[22px] font-extrabold leading-none ${stat.cls}`}>{stat.value}</p>
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-[var(--text-primary)] uppercase tracking-[0.5px]">
          Today&apos;s Incidents
        </h3>
        <Link href="/incidents" className="text-xs text-[var(--accent)] font-semibold hover:opacity-80">
          View All
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-[48px] h-[48px] rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-elevated)' }}>
            <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-semibold">No incidents logged today</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Tap the mic above to record your first incident</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  )
}
