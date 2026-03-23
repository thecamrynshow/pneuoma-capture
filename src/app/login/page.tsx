'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })
      if (!res?.ok || res?.error) {
        setError(
          res?.error === 'Configuration' || res?.error === 'Callback'
            ? 'Server configuration error. Check Vercel env vars (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL) and redeploy.'
            : 'Invalid email or password',
        )
        setLoading(false)
        return
      }
      // Wait until session is readable before navigating — avoids AuthGuard
      // redirecting back to /login before React picks up the new session (Capacitor / fast nav).
      const session = await getSession()
      if (!session) {
        setError('Signed in but session did not load. Try again or check NEXTAUTH_URL matches this site (https://capture.pneuoma.com).')
        setLoading(false)
        return
      }
      const safePath =
        callbackUrl.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/'
      router.push(safePath)
      router.refresh()
      setLoading(false)
    } catch (err) {
      console.error(err)
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

      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Sign in</h2>

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
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field w-full px-3 py-3 text-sm rounded-[var(--radius-sm)]"
            required
            autoComplete="current-password"
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
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)] mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[var(--accent)] font-semibold hover:opacity-80">
          Create one
        </Link>
      </p>
    </div>
  )
}
