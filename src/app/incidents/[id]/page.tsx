'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import IncidentForm from '@/components/IncidentForm'
import TemplateModal from '@/components/TemplateModal'
import { getApiBase } from '@/lib/api'
import { MODE_CONFIG, getStoredMode } from '@/lib/modes'
import type { Incident, IncidentFormData } from '@/types/incident'

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<Record<string, string> | null>(null)
  const [generatingTemplates, setGeneratingTemplates] = useState(false)
  const [copied, setCopied] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${getApiBase()}/api/incidents/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((data) => {
        setIncident(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [id])

  const handleUpdate = async (data: IncidentFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      setIncident(updated)
      setEditing(false)
    } catch {
      alert('Failed to update incident')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this incident? This cannot be undone.')) return
    try {
      const res = await fetch(`${getApiBase()}/api/incidents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/incidents')
    } catch {
      alert('Failed to delete incident')
    }
  }

  const handleGenerateTemplates = async () => {
    if (!incident) return
    setGeneratingTemplates(true)
    setTemplateError(null)
    try {
      const mode = getStoredMode()
      const res = await fetch(`${getApiBase()}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: incident.date,
          time: incident.time,
          location: incident.location,
          incidentType: incident.incidentType,
          studentsInvolved: incident.studentsInvolved,
          description: incident.description,
          immediateAction: incident.immediateAction,
          followUpNeeded: incident.followUpNeeded,
          reportedBy: incident.reportedBy,
          mode,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate templates')
      }
      const data = await res.json()
      setTemplates(data)
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : 'Template generation failed')
    } finally {
      setGeneratingTemplates(false)
    }
  }

  const handleMarkSent = async (type: string) => {
    const fieldMap: Record<string, string> = {
      teacher: 'teacherNotified',
      parent: 'parentNotified',
      counselor: 'counselorNotified',
      principal: 'principalNotified',
      dean: 'deanNotified',
      supportStaff: 'supportStaffNotified',
      hr: 'hrNotified',
      manager: 'managerNotified',
      personal: 'personalNotified',
    }
    const field = fieldMap[type]
    if (!field) return
    try {
      const res = await fetch(`${getApiBase()}/api/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: true }),
      })
      if (res.ok) {
        const updated = await res.json()
        setIncident(updated)
      }
    } catch {
      // silent
    }
  }

  const copyToClipboard = async () => {
    if (!incident) return
    const { generateClipboardText } = await import('@/lib/pdf')
    await navigator.clipboard.writeText(generateClipboardText(incident))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPDF = async () => {
    if (!incident) return
    const { generateIncidentPDF } = await import('@/lib/pdf')
    const doc = generateIncidentPDF(incident)
    const filename = `incident-${incident.id.slice(0, 8)}.pdf`

    const blob = doc.output('blob')
    const file = new File([blob], filename, { type: 'application/pdf' })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Incident Report' })
        return
      } catch {
        // User cancelled or share failed — fall through to regular download
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-[48px] h-[48px] rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="px-4 pt-6 text-center py-24">
        <p className="text-sm text-[var(--text-secondary)] font-semibold">Incident not found</p>
        <button onClick={() => router.push('/incidents')} className="text-sm text-[var(--accent)] font-semibold mt-2 hover:opacity-80">
          Back to Incidents
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="px-4 pt-2 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-extrabold tracking-[-0.3px] text-[var(--text-primary)]">Edit Incident</h1>
          <button onClick={() => setEditing(false)} className="text-sm text-[var(--text-muted)] font-semibold hover:text-[var(--text-primary)]">
            Cancel
          </button>
        </div>
        <IncidentForm
          initialData={{
            date: new Date(incident.date).toISOString().split('T')[0],
            time: incident.time,
            location: incident.location,
            incidentType: incident.incidentType,
            severity: incident.severity,
            studentsInvolved: incident.studentsInvolved,
            staffInvolved: incident.staffInvolved,
            witnesses: incident.witnesses,
            description: incident.description,
            immediateAction: incident.immediateAction,
            followUpNeeded: incident.followUpNeeded,
            deEscalationStrategies: incident.deEscalationStrategies || '',
            studentLabels: incident.studentLabels || {},
            witnessLabels: incident.witnessLabels || {},
            reportedBy: incident.reportedBy,
            status: incident.status,
            rawTranscript: incident.rawTranscript || undefined,
            notes: incident.notes,
          }}
          onSubmit={handleUpdate}
          isSubmitting={isSubmitting}
          submitLabel="Update Incident"
          showStatus
        />
      </div>
    )
  }

  return (
    <div className="px-4 pt-2 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-[20px] font-extrabold tracking-[-0.3px] text-[var(--text-primary)]">{incident.incidentType}</h1>
          <p className="text-xs text-[var(--text-muted)]">
            {format(new Date(incident.date), 'MMM d, yyyy')} at {incident.time}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-[6px] mb-5">
        <span className={`badge-${incident.severity.toLowerCase()} px-3 py-[3px] rounded-full text-[9px] font-extrabold uppercase tracking-[0.5px]`}>
          {incident.severity}
        </span>
        <span className={`badge-${incident.status} px-3 py-[3px] rounded-full text-[9px] font-extrabold uppercase tracking-[0.5px]`}>
          {incident.status}
        </span>
      </div>

      {/* Detail Card */}
      <div className="card-surface rounded-[var(--radius)] overflow-hidden mb-4">
        {[
          { label: 'Location', value: incident.location },
          { label: 'Description', value: incident.description },
          { label: 'Immediate Action', value: incident.immediateAction },
          { label: 'Follow-Up Needed', value: incident.followUpNeeded },
          { label: 'Notes', value: incident.notes },
          { label: 'Reported By', value: incident.reportedBy },
          { label: 'De-Escalation Strategies', value: incident.deEscalationStrategies },
        ]
          .filter((f) => f.value)
          .map((field) => (
            <div key={field.label} className="p-[14px_16px]" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-1">{field.label}</p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{field.value}</p>
            </div>
          ))}

        {incident.studentsInvolved.length > 0 && (
          <div className="p-[14px_16px]" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-2">Students Involved</p>
            <div className="flex flex-wrap gap-[6px]">
              {incident.studentsInvolved.map((name, i) => {
                const labels = incident.studentLabels || {}
                const display = labels[i] ?? `Student ${String.fromCharCode(65 + i)}`
                return (
                  <span key={i} className="text-[12px] px-[10px] py-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                    {display}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {incident.staffInvolved.length > 0 && (
          <div className="p-[14px_16px]" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-2">Staff Involved</p>
            <div className="flex flex-wrap gap-[6px]">
              {incident.staffInvolved.map((name, i) => (
                <span key={i} className="text-[12px] px-[10px] py-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {incident.witnesses.length > 0 && (
          <div className="p-[14px_16px]" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-2">Witnesses</p>
            <div className="flex flex-wrap gap-[6px]">
              {incident.witnesses.map((name, i) => {
                const wLabels = incident.witnessLabels || {}
                const offset = incident.studentsInvolved.length
                const display = wLabels[i] ?? `Student ${String.fromCharCode(65 + offset + i)}`
                return (
                  <span key={i} className="text-[12px] px-[10px] py-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                    {display}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {incident.rawTranscript && (
          <div className="p-[14px_16px]">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-1">Voice Transcript</p>
            <p className="text-[13px] text-[var(--text-muted)] italic leading-relaxed">&ldquo;{incident.rawTranscript}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Communications */}
      <div className="card-surface rounded-[var(--radius)] p-4 mb-4">
        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-3">Communications</p>
        <div className="flex flex-col gap-2">
          {(() => {
            const mode = getStoredMode()
            const roleLabels: Record<string, { label: string; field: keyof Incident }> = {
              teacher: { label: 'Teacher Notified', field: 'teacherNotified' },
              parent: { label: 'Parent Notified', field: 'parentNotified' },
              counselor: { label: 'Counselor Notified', field: 'counselorNotified' },
              principal: { label: 'Principal Notified', field: 'principalNotified' },
              dean: { label: 'Dean Notified', field: 'deanNotified' },
              supportStaff: { label: 'Support Staff Notified', field: 'supportStaffNotified' },
              hr: { label: 'HR Notified', field: 'hrNotified' },
              manager: { label: 'Manager Notified', field: 'managerNotified' },
              personal: { label: 'Personal Contact Notified', field: 'personalNotified' },
            }
            const roles = MODE_CONFIG[mode]?.templateRoles || MODE_CONFIG.education.templateRoles
            return roles.map((role) => {
              const info = roleLabels[role]
              if (!info) return null
              const done = !!incident[info.field]
              return (
                <div key={role} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${done ? 'bg-[var(--accent-green)]' : 'bg-[var(--text-muted)]'}`} />
                  <span className={`text-[13px] ${done ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {info.label}
                  </span>
                </div>
              )
            })
          })()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-[10px] mb-6">
        <button
          onClick={handleGenerateTemplates}
          disabled={generatingTemplates}
          className="w-full py-[14px] rounded-[var(--radius-sm)] font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          {generatingTemplates ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          ) : (
            'Generate Communication Templates'
          )}
        </button>

        {templateError && (
          <p className="text-xs text-[var(--accent-red)] text-center">{templateError}</p>
        )}

        <div className="grid grid-cols-2 gap-[10px]">
          <button
            onClick={copyToClipboard}
            className="surface-elevated py-[10px] rounded-[var(--radius-sm)] text-[var(--text-primary)] font-bold text-[13px] transition-all active:scale-[0.98]"
          >
            {copied ? 'Copied!' : 'Copy for SIS'}
          </button>
          <button
            onClick={downloadPDF}
            className="surface-elevated py-[10px] rounded-[var(--radius-sm)] text-[var(--text-primary)] font-bold text-[13px] transition-all active:scale-[0.98]"
          >
            Download PDF
          </button>
        </div>

        <div className="grid grid-cols-2 gap-[10px]">
          <button
            onClick={() => setEditing(true)}
            className="surface-elevated py-[10px] rounded-[var(--radius-sm)] text-[var(--text-primary)] font-bold text-[13px] transition-all active:scale-[0.98]"
          >
            Edit Incident
          </button>
          <button
            onClick={handleDelete}
            className="py-[10px] rounded-[var(--radius-sm)] font-bold text-[13px] transition-all active:scale-[0.98]"
            style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            Delete
          </button>
        </div>
      </div>

      {templates && (
        <TemplateModal templates={templates} onClose={() => setTemplates(null)} onMarkSent={handleMarkSent} />
      )}
    </div>
  )
}
