'use client'

import { useState, useEffect } from 'react'
import IncidentCard from '@/components/IncidentCard'
import { getApiBase } from '@/lib/api'
import type { Incident } from '@/types/incident'

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateFilter) params.set('date', dateFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search) params.set('search', search)

    fetch(`${getApiBase()}/api/incidents?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setIncidents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [dateFilter, statusFilter, search])

  return (
    <div className="px-4 pt-2 pb-6">
      <div className="mb-5">
        <h1 className="text-[20px] font-extrabold tracking-[-0.3px] text-[var(--text-primary)]">All Incidents</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {incidents.length} incident{incidents.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, location, type..."
          className="input-field w-full px-[14px] py-3 text-sm rounded-[var(--radius-sm)]"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field flex-1 px-3 py-2.5 text-sm rounded-[var(--radius-sm)]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field px-3 py-2.5 text-sm rounded-[var(--radius-sm)] appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          {(dateFilter || statusFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setDateFilter('')
                setStatusFilter('all')
                setSearch('')
              }}
              className="px-3 py-2 text-xs text-[var(--accent)] font-semibold hover:opacity-80"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-[48px] h-[48px] rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-elevated)' }}>
            <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-semibold">No incidents found</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {dateFilter || statusFilter !== 'all' || search
              ? 'Try adjusting your filters'
              : 'Record your first incident to get started'}
          </p>
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
