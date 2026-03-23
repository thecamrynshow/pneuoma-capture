'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Signup failed')
        setLoading(false)
        return
      }
      router.push('/login')
      router.refresh()
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pt-12 pb-6 max-w-[360px] mx-auto">
      <div className="text-center mb-8">
        <p className="text-[var(--text-muted)] text-[11px] opacity-50 mb-1">πνεῦμα</p>
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-[-0.3px]">PNEUOMA Capture</h1>
      </div>

      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Create account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)]"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5">
            Name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)]"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)]"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="text-sm text-[var(--accent-red)] font-medium">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-[14px] rounded-[var(--radius-sm)] font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)] mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--accent)] font-semibold hover:opacity-80">
          Sign in
        </Link>
      </p>
    </div>
  )
}
