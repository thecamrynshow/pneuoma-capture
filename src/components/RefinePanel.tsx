'use client'

import { useState, useRef, useEffect } from 'react'
import { getApiBase } from '@/lib/api'
import type { IncidentFormData } from '@/types/incident'

interface RefinePanelProps {
  formData: IncidentFormData
  onUpdate: (updates: Partial<IncidentFormData>) => void
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export default function RefinePanel({ formData, onUpdate }: RefinePanelProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'AI assistant ready. Ask me to clarify, correct, or add details.' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setSending(true)

    try {
      const res = await fetch(`${getApiBase()}/api/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentJson: JSON.stringify(formData),
          userMessage: userMsg,
          conversationHistory: messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Refine failed')
      }

      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.assistant_message }])

      if (data.updated_incident) {
        const updates: Partial<IncidentFormData> = {}
        const u = data.updated_incident
        if (u.description !== undefined) updates.description = u.description
        if (u.immediateAction !== undefined) updates.immediateAction = u.immediateAction
        if (u.followUpNeeded !== undefined) updates.followUpNeeded = u.followUpNeeded
        if (u.location !== undefined) updates.location = u.location
        if (u.incidentType !== undefined) updates.incidentType = u.incidentType
        if (u.severity !== undefined) updates.severity = u.severity
        if (u.studentsInvolved !== undefined) updates.studentsInvolved = u.studentsInvolved
        if (u.staffInvolved !== undefined) updates.staffInvolved = u.staffInvolved
        if (u.witnesses !== undefined) updates.witnesses = u.witnesses
        if (u.deEscalationStrategies !== undefined) updates.deEscalationStrategies = u.deEscalationStrategies
        if (Object.keys(updates).length > 0) onUpdate(updates)
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: err instanceof Error ? err.message : 'Something went wrong' },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full cta-gradient rounded-[var(--radius)] p-4 flex items-center gap-[10px] text-left transition-all"
      >
        <svg className="w-5 h-5 text-[var(--accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-bold text-[var(--text-primary)]">Refine with AI Assistant</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Clarify details, fix errors, or restructure</p>
        </div>
        <svg
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 card-surface rounded-[var(--radius)] overflow-hidden">
          {/* Messages */}
          <div className="p-4 flex flex-col gap-[10px] max-h-[280px] overflow-y-auto min-h-[180px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-[14px] py-[10px] text-[13px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'self-end rounded-[16px] rounded-br-[4px]'
                    : msg.role === 'assistant'
                    ? 'self-start rounded-[16px] rounded-bl-[4px]'
                    : 'self-center rounded-[var(--radius-sm)] text-[11px] text-center'
                }`}
                style={{
                  background:
                    msg.role === 'user'
                      ? 'var(--accent)'
                      : msg.role === 'assistant'
                      ? 'var(--bg-elevated)'
                      : 'rgba(59,130,246,0.1)',
                  color:
                    msg.role === 'user'
                      ? '#000'
                      : msg.role === 'assistant'
                      ? 'var(--text-primary)'
                      : 'var(--accent-blue)',
                }}
              >
                {msg.content}
              </div>
            ))}
            {sending && (
              <div className="self-start px-[14px] py-[10px] rounded-[16px] rounded-bl-[4px]" style={{ background: 'var(--bg-elevated)' }}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3" style={{ borderTop: '1px solid var(--border)' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about the incident..."
              className="input-field flex-1 px-3 py-2.5 text-sm rounded-[var(--radius-sm)]"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="px-4 py-2.5 rounded-[var(--radius-sm)] font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
