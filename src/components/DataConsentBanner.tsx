'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'pneuoma-data-consent'

export function useDataConsent() {
  const [consented, setConsented] = useState<boolean | null>(null)

  useEffect(() => {
    setConsented(localStorage.getItem(CONSENT_KEY) === 'granted')
  }, [])

  const grant = () => {
    localStorage.setItem(CONSENT_KEY, 'granted')
    setConsented(true)
  }

  const revoke = () => {
    localStorage.removeItem(CONSENT_KEY)
    setConsented(false)
  }

  return { consented, grant, revoke }
}

interface DataConsentBannerProps {
  onConsent: () => void
}

export default function DataConsentBanner({ onConsent }: DataConsentBannerProps) {
  return (
    <div className="cta-gradient rounded-[var(--radius)] p-5">
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent-dim)' }}
        >
          <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-[var(--text-primary)] text-sm">Data Processing Consent</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
            Before using voice capture, please review how your data is processed.
          </p>
        </div>
      </div>

      {/* What data is collected */}
      <div className="rounded-[var(--radius-sm)] p-3 mb-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold text-[var(--text-secondary)] mb-1.5">What data is sent for processing:</p>
        <ul className="text-xs text-[var(--text-muted)] space-y-1">
          <li className="flex items-start gap-1.5">
            <span className="text-[var(--accent)] mt-0.5">&#8226;</span>
            <span><strong className="text-[var(--text-secondary)]">Voice recordings</strong> — sent for speech-to-text transcription</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[var(--accent)] mt-0.5">&#8226;</span>
            <span><strong className="text-[var(--text-secondary)]">Transcript text</strong> — analyzed to extract structured incident details (names, dates, locations, actions)</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[var(--accent)] mt-0.5">&#8226;</span>
            <span><strong className="text-[var(--text-secondary)]">Incident data</strong> — used to generate professional communication templates</span>
          </li>
        </ul>
      </div>

      {/* Where data is sent */}
      <div className="rounded-[var(--radius-sm)] p-3 mb-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <p className="text-xs font-bold text-[var(--accent-green)] mb-1.5">Where your data is processed:</p>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          All AI processing runs exclusively on <strong className="text-[var(--text-secondary)]">PNEUOMA&apos;s own servers</strong> hosted
          on our private cloud infrastructure. Your data is <strong className="text-[var(--text-secondary)]">never sent to any third-party AI
          service</strong> — not OpenAI, Google, Anthropic, or any other external provider. Audio recordings are processed
          in memory and are not stored after transcription.
        </p>
      </div>

      {/* Data retention */}
      <div className="rounded-[var(--radius-sm)] p-3 mb-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold text-[var(--text-secondary)] mb-1.5">Data retention:</p>
        <ul className="text-xs text-[var(--text-muted)] space-y-1">
          <li className="flex items-start gap-1.5">
            <span className="text-[var(--accent)] mt-0.5">&#8226;</span>
            Voice recordings are deleted immediately after transcription
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[var(--accent)] mt-0.5">&#8226;</span>
            Incident reports are stored until you choose to delete them
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[var(--accent)] mt-0.5">&#8226;</span>
            Your data is never used to train AI models
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onConsent}
          className="w-full py-[14px] rounded-[var(--radius-sm)] font-bold text-sm transition-all active:scale-[0.98]"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          I Consent — Begin Voice Capture
        </button>
        <Link
          href="/privacy"
          className="w-full py-2.5 text-center text-[var(--accent)] font-semibold text-xs hover:opacity-80 transition-colors"
        >
          Read Full Privacy Policy
        </Link>
      </div>
    </div>
  )
}
