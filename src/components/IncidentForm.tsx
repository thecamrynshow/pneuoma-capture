'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import { MODE_CONFIG, getStoredMode } from '@/lib/modes'
import { SEVERITY_LEVELS, STATUS_OPTIONS } from '@/types/incident'
import type { IncidentFormData } from '@/types/incident'

interface IncidentFormProps {
  initialData?: Partial<IncidentFormData>
  onSubmit: (data: IncidentFormData) => Promise<void>
  submitLabel?: string
  isSubmitting?: boolean
  showStatus?: boolean
}

function StudentAddInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [input, setInput] = useState('')
  const add = () => {
    const trimmed = input.trim()
    if (trimmed) {
      onAdd(trimmed)
      setInput('')
    }
  }
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        placeholder="Add student name, press Enter"
        className="input-field flex-1 px-3 py-2.5 text-sm rounded-[var(--radius-sm)]"
      />
      <button
        type="button"
        onClick={add}
        disabled={!input.trim()}
        className="px-4 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-all disabled:opacity-40"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
      >
        Add
      </button>
    </div>
  )
}

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
      setInput('')
    }
  }

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div>
      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5">{label}</label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-[6px] mb-2">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 pl-[10px] pr-[6px] py-1 rounded-full text-xs"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[var(--text-muted)] text-sm transition-colors hover:text-[var(--accent-red)] hover:bg-[rgba(239,68,68,0.2)]"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type name and press Enter'}
          className="input-field flex-1 px-3 py-2.5 text-sm rounded-[var(--radius-sm)]"
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!input.trim()}
          className="px-4 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

export default function IncidentForm({
  initialData,
  onSubmit,
  submitLabel = 'Save Incident',
  isSubmitting,
  showStatus,
}: IncidentFormProps) {
  const now = new Date()
  const [mode, setMode] = useState(() => getStoredMode())
  const config = MODE_CONFIG[mode]

  useEffect(() => {
    const handler = () => setMode(getStoredMode())
    window.addEventListener('pneuoma-mode-change', handler)
    return () => window.removeEventListener('pneuoma-mode-change', handler)
  }, [])

  const [form, setForm] = useState<IncidentFormData>({
    date: initialData?.date || now.toISOString().split('T')[0],
    time:
      initialData?.time ||
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    location: initialData?.location || '',
    incidentType: initialData?.incidentType || '',
    severity: initialData?.severity || 'Medium',
    studentsInvolved: initialData?.studentsInvolved || [],
    staffInvolved: initialData?.staffInvolved || [],
    witnesses: initialData?.witnesses || [],
    studentLabels: initialData?.studentLabels || {},
    witnessLabels: initialData?.witnessLabels || {},
    description: initialData?.description || '',
    immediateAction: initialData?.immediateAction || '',
    followUpNeeded: initialData?.followUpNeeded || '',
    deEscalationStrategies: initialData?.deEscalationStrategies ?? '',
    reportedBy: initialData?.reportedBy || '',
    status: initialData?.status || 'open',
    rawTranscript: initialData?.rawTranscript,
    notes: initialData?.notes || '',
  })

  const updateField = (field: keyof IncidentFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const getStudentDisplay = (name: string, index: number) => {
    const labels = form.studentLabels || {}
    return labels[index] || `Student ${String.fromCharCode(65 + index)}`
  }

  const getWitnessDisplay = (name: string, index: number) => {
    const labels = form.witnessLabels || {}
    const offset = form.studentsInvolved.length
    return labels[index] || `Student ${String.fromCharCode(65 + offset + index)}`
  }

  const cycleStudentLabel = (index: number) => {
    const name = form.studentsInvolved[index] || ''
    const labels = { ...(form.studentLabels || {}) }
    const current = labels[index]
    const alias = `Student ${String.fromCharCode(65 + index)}`
    const initials = name ? `${name[0]}.` : '?'
    if (!current || current === alias) labels[index] = name
    else if (current === name) labels[index] = initials
    else labels[index] = alias
    setForm((prev) => ({ ...prev, studentLabels: labels }))
  }

  const cycleWitnessLabel = (index: number) => {
    const name = form.witnesses[index] || ''
    const labels = { ...(form.witnessLabels || {}) }
    const current = labels[index]
    const offset = form.studentsInvolved.length
    const alias = `Student ${String.fromCharCode(65 + offset + index)}`
    const initials = name ? `${name[0]}.` : '?'
    if (!current || current === alias) labels[index] = name
    else if (current === name) labels[index] = initials
    else labels[index] = alias
    setForm((prev) => ({ ...prev, witnessLabels: labels }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  const severityStyles: Record<string, { active: string; css: React.CSSProperties }> = {
    Low: { active: 'badge-low', css: { borderColor: 'rgba(16,185,129,0.3)' } },
    Medium: { active: 'badge-medium', css: { borderColor: 'rgba(245,158,11,0.3)' } },
    High: { active: 'badge-high', css: { borderColor: 'rgba(249,115,22,0.3)' } },
    Critical: { active: 'badge-critical', css: { borderColor: 'rgba(239,68,68,0.3)' } },
  }

  const labelClass = 'block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-[18px]">
      {/* Raw Transcript Banner */}
      {form.rawTranscript && (
        <div className="rounded-[var(--radius)] p-[14px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-1.5">
            Voice Transcript
          </p>
          <p className="text-[13px] text-[var(--text-secondary)] italic leading-relaxed">
            &ldquo;{form.rawTranscript}&rdquo;
          </p>
        </div>
      )}

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-[10px]">
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => updateField('date', e.target.value)}
            className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)]"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Time</label>
          <input
            type="text"
            value={form.time}
            onChange={(e) => updateField('time', e.target.value)}
            placeholder="8:42 AM"
            className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)]"
            required
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className={labelClass}>Location</label>
        <select
          value={form.location}
          onChange={(e) => updateField('location', e.target.value)}
          className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)] appearance-none cursor-pointer"
          required
        >
          <option value="">Select location...</option>
          {[...new Set([...config.locations, form.location].filter(Boolean))].map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Incident Type */}
      <div>
        <label className={labelClass}>Incident Type</label>
        <select
          value={form.incidentType}
          onChange={(e) => updateField('incidentType', e.target.value)}
          className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)] appearance-none cursor-pointer"
          required
        >
          <option value="">Select type...</option>
          {[...new Set([...config.incidentTypes, form.incidentType].filter(Boolean))].map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Severity */}
      <div>
        <label className={labelClass}>Severity</label>
        <div className="grid grid-cols-4 gap-[6px]">
          {SEVERITY_LEVELS.map((level) => {
            const isActive = form.severity === level
            const styles = severityStyles[level]
            return (
              <button
                key={level}
                type="button"
                onClick={() => updateField('severity', level)}
                className={`py-[10px] px-1 rounded-[var(--radius-sm)] text-[11px] font-bold text-center transition-all ${isActive ? styles.active : ''}`}
                style={{
                  background: isActive ? undefined : 'transparent',
                  color: isActive ? undefined : 'var(--text-muted)',
                  border: isActive ? `1px solid` : '1px solid var(--border)',
                  ...(isActive ? styles.css : {}),
                }}
              >
                {level}
              </button>
            )
          })}
        </div>
      </div>

      {/* Status */}
      {showStatus && (
        <div>
          <label className={labelClass}>Status</label>
          <div className="grid grid-cols-4 gap-[6px]">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateField('status', s)}
                className="py-[10px] px-1 rounded-[var(--radius-sm)] text-[11px] font-bold text-center transition-all capitalize"
                style={{
                  background: form.status === s ? 'var(--accent)' : 'transparent',
                  color: form.status === s ? '#000' : 'var(--text-muted)',
                  border: form.status === s ? '1px solid var(--accent)' : '1px solid var(--border)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* People */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5">
            Students Involved (anonymized by default)
          </label>
          {form.studentsInvolved.length > 0 && (
            <div className="flex flex-wrap gap-[6px] mb-2">
              {form.studentsInvolved.map((name, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 pl-[10px] pr-[6px] py-[5px] rounded-full text-xs"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                >
                  {getStudentDisplay(name, i)}
                  <button
                    type="button"
                    onClick={() => cycleStudentLabel(i)}
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[var(--accent)] text-[10px] transition-colors hover:bg-[var(--accent-dim)]"
                    title="Cycle: Alias / Real name / Initials"
                  >
                    ⇄
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = form.studentsInvolved.filter((_, j) => j !== i)
                      const newLabels = { ...(form.studentLabels || {}) }
                      delete newLabels[i]
                      const rekeyed: Record<number, string> = {}
                      Object.entries(newLabels).forEach(([k, v]) => {
                        const ki = parseInt(k, 10)
                        if (ki < i) rekeyed[ki] = v
                        else if (ki > i) rekeyed[ki - 1] = v
                      })
                      setForm((p) => ({ ...p, studentsInvolved: next, studentLabels: rekeyed }))
                    }}
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[var(--text-muted)] text-sm transition-colors hover:text-[var(--accent-red)] hover:bg-[rgba(239,68,68,0.2)]"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
          <StudentAddInput
            onAdd={(name) => {
              if (name && !form.studentsInvolved.includes(name)) {
                setForm((p) => ({ ...p, studentsInvolved: [...p.studentsInvolved, name] }))
              }
            }}
          />
        </div>
        <TagInput
          label="Staff Involved"
          tags={form.staffInvolved}
          onChange={(tags) => setForm((p) => ({ ...p, staffInvolved: tags }))}
          placeholder="Staff name..."
        />
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5">
            Witnesses (anonymized by default)
          </label>
          {form.witnesses.length > 0 && (
            <div className="flex flex-wrap gap-[6px] mb-2">
              {form.witnesses.map((name, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 pl-[10px] pr-[6px] py-[5px] rounded-full text-xs"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                >
                  {getWitnessDisplay(name, i)}
                  <button
                    type="button"
                    onClick={() => cycleWitnessLabel(i)}
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[var(--accent)] text-[10px] transition-colors hover:bg-[var(--accent-dim)]"
                    title="Cycle: Alias / Real name / Initials"
                  >
                    ⇄
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = form.witnesses.filter((_, j) => j !== i)
                      const newLabels = { ...(form.witnessLabels || {}) }
                      delete newLabels[i]
                      const rekeyed: Record<number, string> = {}
                      Object.entries(newLabels).forEach(([k, v]) => {
                        const ki = parseInt(k, 10)
                        if (ki < i) rekeyed[ki] = v
                        else if (ki > i) rekeyed[ki - 1] = v
                      })
                      setForm((p) => ({ ...p, witnesses: next, witnessLabels: rekeyed }))
                    }}
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[var(--text-muted)] text-sm transition-colors hover:text-[var(--accent-red)] hover:bg-[rgba(239,68,68,0.2)]"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
          <StudentAddInput
            onAdd={(name) => {
              if (name && !form.witnesses.includes(name)) {
                setForm((p) => ({ ...p, witnesses: [...p.witnesses, name] }))
              }
            }}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={4}
          placeholder="Describe what happened..."
          className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)] resize-none"
          style={{ minHeight: '80px' }}
          required
        />
      </div>

      {/* Immediate Action */}
      <div>
        <label className={labelClass}>Immediate Action Taken</label>
        <textarea
          value={form.immediateAction}
          onChange={(e) => updateField('immediateAction', e.target.value)}
          rows={2}
          placeholder="What was done on the spot..."
          className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)] resize-none"
        />
      </div>

      {/* Follow-up */}
      <div>
        <label className={labelClass}>Follow-Up Needed</label>
        <textarea
          value={form.followUpNeeded}
          onChange={(e) => updateField('followUpNeeded', e.target.value)}
          rows={2}
          placeholder="Next steps required..."
          className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)] resize-none"
        />
      </div>

      {/* De-escalation Strategies */}
      <div>
        <label className={labelClass}>De-escalation Strategies</label>
        <textarea
          value={form.deEscalationStrategies || ''}
          onChange={(e) => updateField('deEscalationStrategies', e.target.value)}
          rows={2}
          placeholder="Strategies used or recommended..."
          className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)] resize-none"
        />
      </div>

      {/* Reported By */}
      <div>
        <label className={labelClass}>Reported By</label>
        <input
          type="text"
          value={form.reportedBy}
          onChange={(e) => updateField('reportedBy', e.target.value)}
          placeholder="Your name..."
          className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)]"
          required
        />
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Additional Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={2}
          placeholder="Any additional information..."
          className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)] resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-[14px] rounded-[var(--radius-sm)] font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--accent)', color: '#000' }}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  )
}
