'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import type { Incident } from '@/types/incident'

export default function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <Link href={`/incidents/${incident.id}`}>
      <div className="card-surface rounded-[var(--radius)] p-[14px_16px] transition-all hover:translate-y-[-1px] active:scale-[0.99] cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">{incident.incidentType}</h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {incident.time} &middot; {incident.location}
            </p>
          </div>
          <div className="flex gap-[6px] shrink-0">
            <span className={`badge-${incident.severity.toLowerCase()} px-2 py-[3px] rounded-full text-[9px] font-extrabold uppercase tracking-[0.5px]`}>
              {incident.severity}
            </span>
            <span className={`badge-${incident.status} px-2 py-[3px] rounded-full text-[9px] font-extrabold uppercase tracking-[0.5px]`}>
              {incident.status}
            </span>
          </div>
        </div>

        <p className="text-[13px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-[10px]">
          {incident.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {incident.studentsInvolved.slice(0, 3).map((name, i) => {
              const labels = incident.studentLabels || {}
              const display = labels[i] ?? `Student ${String.fromCharCode(65 + i)}`
              return (
                <span key={i} className="text-[10px] font-semibold px-2 py-[3px] rounded-full tracking-[0.3px]" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                  {display}
                </span>
              )
            })}
            {incident.studentsInvolved.length > 3 && (
              <span className="text-[var(--text-muted)] text-[10px]">
                +{incident.studentsInvolved.length - 3} more
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            {format(new Date(incident.createdAt), 'MMM d')}
          </span>
        </div>
      </div>
    </Link>
  )
}
