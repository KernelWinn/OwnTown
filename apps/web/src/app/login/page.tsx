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
      toast.success(mode === 'login' ? 'Welcome back! 👋' : 'Account created! 🎉')
      router.push(redirect)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex w-1/2 bg-[#007a78] flex-col items-center justify-center p-16 text-white">
        <Link href="/" className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center">
            <span className="text-[#007a78] font-black text-sm">OT</span>
          </div>
          <span className="font-black text-2xl">OwnTown</span>
        </Link>
        <h2 className="text-4xl font-black leading-tight text-center mb-4">
          Fresh groceries,<br />delivered fast.
        </h2>
        <p className="text-white/70 text-center text-lg max-w-xs">
          Shop local essentials and get them delivered same day.
        </p>
        <div className="mt-12 text-6xl">🛒</div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#007a78] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">OT</span>
            </div>
            <span className="font-black text-xl text-[#2C2C2C]">OwnTown</span>
          </Link>

          <h1 className="text-2xl font-black text-[#2C2C2C] mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-gray-500 text-sm mb-7">
            {mode === 'login' ? 'Sign in to continue shopping' : 'Join OwnTown today'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full name</label>
                <input value={form.name} onChange={set('name')} placeholder="Your name" required className="tgtg-input" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required className="tgtg-input" />
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone (optional)</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className="tgtg-input" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} className="tgtg-input" />
            </div>
            <button type="submit" disabled={loading} className="tgtg-btn w-full py-4 text-base mt-2 disabled:opacity-60">
              {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-bold text-[#007a78] hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
