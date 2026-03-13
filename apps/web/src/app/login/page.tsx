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
        const { data } = await api.post('/auth/register', {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        })
        setTokens(data.accessToken, data.refreshToken)
        setUser(data.user)
      } else {
        const { data } = await api.post('/auth/login', {
          email: form.email,
          password: form.password,
        })
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
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#1A1A1A]">OwnTown</Link>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-3">
          {mode === 'register' && (
            <input
              value={form.name}
              onChange={set('name')}
              placeholder="Full name"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
            />
          )}
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="Email"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
          />
          {mode === 'register' && (
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="Phone number"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
            />
          )}
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder="Password"
            required
            minLength={6}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
          />

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-[#1A1A1A] font-semibold underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
