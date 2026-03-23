'use client'

import { useState, useEffect } from 'react'
import { MODE_CONFIG, getStoredMode } from '@/lib/modes'

const TEMPLATE_KEYS = [
  { key: 'teacherEmail', label: 'Teacher', type: 'teacher' },
  { key: 'parentEmail', label: 'Parent', type: 'parent' },
  { key: 'counselorReferral', label: 'Counselor', type: 'counselor' },
  { key: 'principalEmail', label: 'Principal', type: 'principal' },
  { key: 'deanEmail', label: 'Dean', type: 'dean' },
  { key: 'supportStaffEmail', label: 'Support Staff', type: 'supportStaff' },
  { key: 'hrEmail', label: 'HR', type: 'hr' },
  { key: 'managerEmail', label: 'Manager', type: 'manager' },
  { key: 'personalContact', label: 'Personal', type: 'personal' },
] as const

interface TemplateModalProps {
  templates: Record<string, string>
  onClose: () => void
  onMarkSent: (type: string) => void
}

export default function TemplateModal({ templates, onClose, onMarkSent }: TemplateModalProps) {
  const [mode, setMode] = useState(() => getStoredMode())
  const [activeTab, setActiveTab] = useState<string>(TEMPLATE_KEYS[0].key)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => setMode(getStoredMode())
    window.addEventListener('pneuoma-mode-change', handler)
    return () => window.removeEventListener('pneuoma-mode-change', handler)
  }, [])

  const config = MODE_CONFIG[mode]
  const visibleTabs = TEMPLATE_KEYS.filter((t) =>
    config.templateRoles.includes(t.type as 'teacher' | 'parent' | 'counselor' | 'principal' | 'dean' | 'supportStaff' | 'manager' | 'hr' | 'personal')
  )
  const activeKey = visibleTabs.some((t) => t.key === activeTab) ? activeTab : visibleTabs[0]?.key ?? 'teacherEmail'

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const currentTemplate = templates[activeKey] || ''
  const currentType = TEMPLATE_KEYS.find((t) => t.key === activeKey)?.type ?? 'teacher'

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-[500px] max-h-[85vh] flex flex-col"
        style={{ background: 'var(--bg-mid)', borderRadius: 'var(--radius) var(--radius) 0 0' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-bold text-[var(--text-primary)]">Communication Templates</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-3 px-3 text-[13px] font-semibold transition-colors whitespace-nowrap relative"
              style={{ color: activeKey === tab.key ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              {tab.label}
              {activeKey === tab.key && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-sm" style={{ background: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <pre
            className="text-[13px] leading-relaxed whitespace-pre-wrap font-[inherit] p-[14px] rounded-[var(--radius-sm)]"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
          >
            {currentTemplate || 'No template generated for this category.'}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex gap-[10px] p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => copyToClipboard(currentTemplate, activeKey)}
            className="flex-1 surface-elevated py-3 rounded-[var(--radius-sm)] text-[var(--text-primary)] font-bold text-[13px] transition-all active:scale-[0.98]"
          >
            {copied === activeKey ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={() => onMarkSent(currentType)}
            className="py-3 px-5 rounded-[var(--radius-sm)] font-bold text-[13px] transition-all active:scale-[0.98]"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            Mark Sent
          </button>
        </div>
      </div>
    </div>
  )
}
