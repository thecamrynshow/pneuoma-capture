import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="px-4 pt-2 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-[20px] font-extrabold tracking-[-0.3px] text-[var(--text-primary)]">Privacy Policy</h1>
      </div>

      <div className="space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p className="text-xs text-[var(--text-muted)]">Last updated: March 4, 2026</p>

        <section>
          <h2 className="font-bold text-[var(--text-primary)] text-base mb-2">Overview</h2>
          <p>
            PNEUOMA Capture (&ldquo;the App&rdquo;) is developed and operated by PNEUOMA (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
            This Privacy Policy explains what data the App collects, how it is processed, where it is sent, and how it is stored.
            The App is an incident documentation tool designed for administrators, managers, and professionals.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[var(--text-primary)] text-base mb-2">Data We Collect</h2>
          <p className="mb-2">The App collects the following data based solely on your input:</p>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
            <li><strong className="text-[var(--text-secondary)]">Voice recordings</strong> — captured when you use the voice recording feature, used only for transcription</li>
            <li><strong className="text-[var(--text-secondary)]">Incident details</strong> — date, time, location, incident type, severity level</li>
            <li><strong className="text-[var(--text-secondary)]">People involved</strong> — names of students/employees involved, staff involved, and witnesses (anonymized by default)</li>
            <li><strong className="text-[var(--text-secondary)]">Descriptions and actions</strong> — incident narrative, immediate actions taken, follow-up needed, de-escalation strategies</li>
            <li><strong className="text-[var(--text-secondary)]">Reporter name</strong> — the name of the person creating the report</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[var(--text-primary)] text-base mb-2">How We Process Your Data</h2>
          <p className="mb-3">
            The App uses AI to transcribe voice recordings, extract structured incident data, generate communication templates,
            and assist with report refinement through conversational chat.
          </p>

          <div className="rounded-[var(--radius)] p-4 my-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p className="font-bold text-[var(--accent-green)] text-sm mb-2">No Third-Party AI Services</p>
            <p className="text-xs" style={{ color: 'rgba(16,185,129,0.8)' }}>
              All AI processing runs exclusively on PNEUOMA&apos;s own servers, hosted on our private cloud infrastructure
              (Google Cloud Platform, US region). Your data is <strong>never sent to OpenAI, Google AI, Anthropic, or any
              other third-party AI service</strong>. We operate our own AI models (Whisper for transcription, Llama for
              text processing) on hardware we control.
            </p>
          </div>

          <p className="mb-2">Specifically, the following AI processing occurs on PNEUOMA&apos;s servers:</p>
          <ul className="list-disc list-inside space-y-1.5 text-[var(--text-muted)]">
            <li><strong className="text-[var(--text-secondary)]">Voice transcription:</strong> Audio recordings are transmitted to PNEUOMA&apos;s AI server for speech-to-text conversion using our self-hosted Whisper model. Audio is processed in memory and deleted immediately after transcription completes. No audio is stored.</li>
            <li><strong className="text-[var(--text-secondary)]">Incident parsing:</strong> Transcribed text is analyzed by PNEUOMA&apos;s self-hosted Llama model to extract structured fields (date, time, names, descriptions). Processing occurs in memory.</li>
            <li><strong className="text-[var(--text-secondary)]">Communication templates:</strong> When you generate templates, incident details are processed by PNEUOMA&apos;s AI to draft professional communications. No data leaves PNEUOMA&apos;s infrastructure.</li>
            <li><strong className="text-[var(--text-secondary)]">AI Refine Assistant:</strong> When you use the chat feature to refine reports, your messages and incident data are processed by PNEUOMA&apos;s AI. Conversation data is not stored after the session ends.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[var(--text-primary)] text-base mb-2">User Consent</h2>
          <p>
            Before any voice data is recorded or sent for AI processing, the App presents a consent screen that clearly
            explains what data will be collected, how it will be processed, and where it will be sent. You must explicitly
            consent before voice capture is enabled. You can use the manual entry feature without consenting to AI processing.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[var(--text-primary)] text-base mb-2">Data Storage</h2>
          <p>
            Incident records you create are stored in the App&apos;s database on PNEUOMA&apos;s servers. Voice recordings
            are used only during transcription and are <strong>not permanently stored</strong>. All stored data remains
            within PNEUOMA&apos;s infrastructure and is not shared with external parties. You can delete any incident
            at any time from within the App.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[var(--text-primary)] text-base mb-2">Data Sharing</h2>
          <p>
            PNEUOMA does <strong>not</strong> sell, rent, or share your data with any third parties. Your incident data is
            accessible only to you. No data is used to train AI models. No data is shared with advertisers, analytics
            companies, or any external service.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[var(--text-primary)] text-base mb-2">FERPA Compliance</h2>
          <p>
            When used in educational settings, the App is designed with FERPA (Family Educational Rights and Privacy Act)
            compliance in mind. Student names are anonymized by default (displayed as &ldquo;Student A,&rdquo; &ldquo;Student B,&rdquo; etc.).
            The recorder controls whether to reveal real names. All student data is processed and stored solely on
            PNEUOMA&apos;s own infrastructure. No student personally identifiable information (PII) is transmitted to
            any third-party service.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[var(--text-primary)] text-base mb-2">Your Rights</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
            <li>Access and review all data stored in your reports</li>
            <li>Delete individual incidents or request deletion of all your data</li>
            <li>Control how names are displayed (anonymized, real, initials, or custom labels)</li>
            <li>Export your data as PDF reports at any time</li>
            <li>Revoke AI processing consent at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[var(--text-primary)] text-base mb-2">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be reflected on this page with an updated
            date. Continued use of the App after changes constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-[var(--text-primary)] text-base mb-2">Contact</h2>
          <p>
            For questions about this Privacy Policy or your data, contact us at{' '}
            <a href="mailto:camrynjackson@pneuoma.com" className="text-[var(--accent)] underline hover:opacity-80">
              camrynjackson@pneuoma.com
            </a>.
          </p>
          <p className="mt-1">
            Website:{' '}
            <a href="https://pneuoma.com" className="text-[var(--accent)] underline hover:opacity-80">
              pneuoma.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
