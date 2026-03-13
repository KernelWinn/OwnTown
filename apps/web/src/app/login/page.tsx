'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'

  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'register') {
        const { data } = await api.post('/auth/register', { name: form.name, email: form.email, phone: form.phone, password: form.password })
        setTokens(data.accessToken, data.refreshToken)
        setUser(data.user)
      } else {
        const { data } = await api.post('/auth/login', { email: form.email, password: form.password })
        setTokens(data.accessToken, data.refreshToken)
        setUser(data.user)
      }
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!')
      router.push(redirect)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#00B43C] rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">OT</span>
            </div>
            <span className="text-xl font-bold text-[#1A1A1A]">OwnTown</span>
          </Link>
          <h1 className="text-xl font-bold text-[#1A1A1A]">
            {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login' ? 'Welcome back' : 'Join OwnTown today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="sq-card p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="field-label">Full name</label>
              <input value={form.name} onChange={set('name')} placeholder="Your name" required className="field-input" />
            </div>
          )}
          <div>
            <label className="field-label">Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required className="field-input" />
          </div>
          {mode === 'register' && (
            <div>
              <label className="field-label">Phone (optional)</label>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className="field-input" />
            </div>
          )}
          <div>
            <label className="field-label">Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} className="field-input" />
          </div>
          <button type="submit" disabled={loading} className="sq-btn-primary w-full disabled:opacity-60 mt-2">
            {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-[#1A1A1A] font-semibold hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
