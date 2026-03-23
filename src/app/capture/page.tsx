'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import VoiceRecorder from '@/components/VoiceRecorder'
import IncidentForm from '@/components/IncidentForm'
import RefinePanel from '@/components/RefinePanel'
import DataConsentBanner, { useDataConsent } from '@/components/DataConsentBanner'
import { getApiBase } from '@/lib/api'
import { getStoredMode } from '@/lib/modes'
import type { IncidentFormData } from '@/types/incident'

type CaptureState = 'ready' | 'transcribing' | 'parsing' | 'review' | 'manual'

export default function CapturePage() {
  const router = useRouter()
  const { consented, grant } = useDataConsent()
  const [state, setState] = useState<CaptureState>('ready')
  const [transcript, setTranscript] = useState('')
  const [parsedData, setParsedData] = useState<Partial<IncidentFormData> | null>(null)
  const [refineKey, setRefineKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    setError(null)

    try {
      setState('transcribing')
      const formData = new FormData()
      formData.append('audio', blob)

      const transcribeRes = await fetch(`${getApiBase()}/api/transcribe`, {
        method: 'POST',
        body: formData,
      })

      if (!transcribeRes.ok) {
        const err = await transcribeRes.json()
        throw new Error(err.error || 'Transcription failed')
      }

      const { transcript: text } = await transcribeRes.json()
      setTranscript(text)

      setState('parsing')
      const parseRes = await fetch(`${getApiBase()}/api/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })

      if (!parseRes.ok) {
        const err = await parseRes.json()
        throw new Error(err.error || 'Parsing failed')
      }

      const parsed = await parseRes.json()
      setParsedData({ ...parsed, rawTranscript: text })
      setState('review')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      setState('ready')
    }
  }, [])

  const handleSubmit = async (data: IncidentFormData) => {
    setIsSubmitting(true)
    try {
      const mode = getStoredMode()
      const res = await fetch(`${getApiBase()}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, mode }),
      })

      if (!res.ok) throw new Error('Failed to save incident')

      const saved = await res.json()
      router.push(`/incidents/${saved.id}`)
    } catch {
      setError('Failed to save incident. Please try again.')
      setIsSubmitting(false)
    }
  }

  const switchToManual = () => {
    setParsedData(null)
    setTranscript('')
    setState('manual')
  }

  const resetCapture = () => {
    setState('ready')
    setTranscript('')
    setParsedData(null)
    setError(null)
  }

  return (
    <div className="px-4 pt-2 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.3px] text-[var(--text-primary)]">
            {state === 'manual' ? 'Manual Entry' : 'Capture Incident'}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {state === 'ready' && 'Speak naturally about the incident'}
            {state === 'transcribing' && 'Converting speech to text...'}
            {state === 'parsing' && 'Extracting incident details...'}
            {state === 'review' && 'Review and edit the details below'}
            {state === 'manual' && 'Fill in the incident details'}
          </p>
        </div>
        {(state === 'review' || state === 'manual') && (
          <button
            onClick={resetCapture}
            className="text-xs text-[var(--accent)] font-semibold hover:opacity-80"
          >
            Start Over
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 p-[12px_14px] rounded-[var(--radius-sm)]" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="font-semibold text-sm">Error</p>
          <p className="text-xs mt-1 opacity-80">{error}</p>
          <button onClick={() => setError(null)} className="text-xs font-semibold underline mt-2 hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Ready State */}
      {state === 'ready' && (
        <div className="flex flex-col items-center pt-8">
          {consented === false ? (
            <div className="w-full">
              <DataConsentBanner onConsent={grant} />
              <div className="mt-4">
                <button
                  onClick={switchToManual}
                  className="surface-elevated w-full py-3 rounded-[var(--radius-sm)] text-[var(--text-secondary)] font-semibold text-sm transition-all active:scale-[0.98]"
                >
                  Enter Manually Instead
                </button>
              </div>
            </div>
          ) : consented === true ? (
            <>
              <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

              <div className="mt-10 w-full">
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  <span className="text-xs text-[var(--text-muted)] font-semibold">or</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                </div>

                <button
                  onClick={switchToManual}
                  className="surface-elevated w-full py-3 rounded-[var(--radius-sm)] text-[var(--text-secondary)] font-semibold text-sm transition-all active:scale-[0.98]"
                >
                  Enter Manually
                </button>
              </div>

              <div className="mt-8 w-full rounded-[var(--radius)] p-[14px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-2">Tips for Voice Capture</p>
                <ul className="text-xs text-[var(--accent)] space-y-1.5 list-none">
                  <li className="relative pl-3 before:content-['•'] before:absolute before:left-0 before:text-[var(--accent)]">Include the time and location</li>
                  <li className="relative pl-3 before:content-['•'] before:absolute before:left-0 before:text-[var(--accent)]">Name the students and staff involved</li>
                  <li className="relative pl-3 before:content-['•'] before:absolute before:left-0 before:text-[var(--accent)]">Describe what happened and what you did</li>
                  <li className="relative pl-3 before:content-['•'] before:absolute before:left-0 before:text-[var(--accent)]">Mention any witnesses</li>
                </ul>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Processing States */}
      {(state === 'transcribing' || state === 'parsing') && (
        <div className="flex flex-col items-center justify-center py-[60px]">
          <div className="w-[60px] h-[60px] rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mt-5">
            {state === 'transcribing' ? 'Transcribing audio...' : 'Extracting incident details...'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">This usually takes a few seconds</p>

          {transcript && state === 'parsing' && (
            <div className="mt-6 rounded-[var(--radius)] p-[14px] max-w-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-1">Transcript</p>
              <p className="text-[13px] text-[var(--text-secondary)] italic">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {/* Review State */}
      {state === 'review' && parsedData && (
        <>
          <RefinePanel
            formData={parsedData as IncidentFormData}
            onUpdate={(updates) => {
              setParsedData((prev) => (prev ? { ...prev, ...updates } : null))
              setRefineKey((k) => k + 1)
            }}
          />
          <IncidentForm
            key={refineKey}
            initialData={parsedData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Save Incident"
          />
        </>
      )}

      {/* Manual Entry */}
      {state === 'manual' && (
        <IncidentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="Save Incident" />
      )}
    </div>
  )
}
