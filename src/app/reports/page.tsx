'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getApiBase } from '@/lib/api'
import type { Incident } from '@/types/incident'

export default function ReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`${getApiBase()}/api/incidents?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setIncidents(list)
        setSelected(new Set(list.map((i: Incident) => i.id)))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [date])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(incidents.map((i) => i.id)))
  const selectNone = () => setSelected(new Set())

  const selectedIncidents = incidents.filter((i) => selected.has(i.id))
  const stats = {
    selected: selectedIncidents.length,
    urgent: selectedIncidents.filter((i) => i.severity === 'Critical' || i.severity === 'High').length,
    open: selectedIncidents.filter((i) => i.status === 'open').length,
    resolved: selectedIncidents.filter((i) => i.status === 'resolved').length,
  }

  const sharePDF = async (blob: Blob, filename: string) => {
    const file = new File([blob], filename, { type: 'application/pdf' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename.replace('.pdf', '') })
        return
      } catch { /* cancelled */ }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateDailyPDF = async () => {
    if (selectedIncidents.length === 0) return
    setGenerating(true)
    try {
      const { generateDailyReport } = await import('@/lib/pdf')
      const doc = generateDailyReport(selectedIncidents, date)
      await sharePDF(doc.output('blob'), `daily-report-${date}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  const generateIndividualPDFs = async () => {
    if (selectedIncidents.length === 0) return
    setGenerating(true)
    try {
      const { generateIncidentPDF } = await import('@/lib/pdf')
      for (const inc of selectedIncidents) {
        const doc = generateIncidentPDF(inc)
        await sharePDF(doc.output('blob'), `incident-${inc.id.slice(0, 8)}.pdf`)
        await new Promise((r) => setTimeout(r, 300))
      }
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="px-4 pt-2 pb-6">
      <div className="mb-5">
        <h1 className="text-[20px] font-extrabold tracking-[-0.3px] text-[var(--text-primary)]">Reports</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Generate daily and individual reports</p>
      </div>

      {/* Date Picker */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="input-field w-full px-[14px] py-3 text-sm rounded-[var(--radius-sm)] mb-5"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Selected', value: stats.selected, cls: 'text-[var(--text-primary)]' },
          { label: 'Urgent', value: stats.urgent, cls: 'text-[var(--accent-red)]' },
          { label: 'Open', value: stats.open, cls: 'text-[var(--accent-blue)]' },
          { label: 'Resolved', value: stats.resolved, cls: 'text-[var(--accent-green)]' },
        ].map((stat) => (
          <div key={stat.label} className="card-surface rounded-[var(--radius-sm)] p-3 text-center">
            <p className={`text-[22px] font-extrabold leading-none ${stat.cls}`}>{stat.value}</p>
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Select All / None */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-[var(--text-primary)] uppercase tracking-[0.5px]">
          Incidents for {format(new Date(date + 'T12:00:00'), 'MMM d, yyyy')}
        </h3>
        <div className="flex gap-3">
          <button onClick={selectAll} className="text-[11px] text-[var(--accent)] font-semibold hover:opacity-80">All</button>
          <button onClick={selectNone} className="text-[11px] text-[var(--text-muted)] font-semibold hover:opacity-80">None</button>
        </div>
      </div>

      {/* Incident List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-[48px] h-[48px] rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-elevated)' }}>
            <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-semibold">No incidents for this date</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Try selecting a different date</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[8px] mb-6">
          {incidents.map((inc) => {
            const isSelected = selected.has(inc.id)
            return (
              <button
                key={inc.id}
                onClick={() => toggleSelect(inc.id)}
                className="flex items-start gap-3 p-[12px_14px] rounded-[var(--radius-sm)] text-left transition-all"
                style={{
                  background: isSelected ? 'var(--accent-dim)' : 'var(--bg-card)',
                  border: isSelected ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border)',
                }}
              >
                <div
                  className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 mt-0.5 transition-all"
                  style={{
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    border: isSelected ? '2px solid var(--accent)' : '2px solid var(--text-muted)',
                  }}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[var(--text-primary)]">{inc.incidentType}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{inc.time} &middot; {inc.location}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{inc.description}</p>
                </div>
                <span className={`badge-${inc.severity.toLowerCase()} px-2 py-[3px] rounded-full text-[9px] font-extrabold uppercase tracking-[0.5px] shrink-0`}>
                  {inc.severity}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Generate Buttons */}
      {incidents.length > 0 && (
        <div className="flex flex-col gap-[10px]">
          <button
            onClick={generateDailyPDF}
            disabled={generating || selectedIncidents.length === 0}
            className="w-full py-[14px] rounded-[var(--radius-sm)] font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            {generating ? 'Generating...' : `Generate Daily Report (${selectedIncidents.length})`}
          </button>
          <button
            onClick={generateIndividualPDFs}
            disabled={generating || selectedIncidents.length === 0}
            className="surface-elevated w-full py-[14px] rounded-[var(--radius-sm)] text-[var(--text-primary)] font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Individual PDFs
          </button>
        </div>
      )}
    </div>
  )
}
