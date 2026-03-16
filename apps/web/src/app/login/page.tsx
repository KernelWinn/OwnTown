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

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  function normalizePhone(raw: string) {
    const digits = raw.replace(/\D/g, '')
    // Strip leading 91 country code if 12 digits given
    return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    const normalized = normalizePhone(phone)
    if (!/^[6-9]\d{9}$/.test(normalized)) {
      toast.error('Enter a valid 10-digit Indian mobile number')
      return
    }
    setPhone(normalized)
    setLoading(true)
    try {
      await api.post('/auth/otp/send', { phone: normalized })
      toast.success('OTP sent!')
      setStep('otp')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/otp/verify', { phone, otp })
      setTokens(data.tokens.accessToken, data.tokens.refreshToken)
      setUser(data.user)
      toast.success(data.isNewUser ? 'Welcome to OwnTown! 🎉' : 'Welcome back! 👋')
      router.push(redirect)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Invalid OTP')
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
          <span className="font-black text-3xl font-display tracking-tight">OwnTown</span>
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
            <span className="font-black text-2xl text-[#2C2C2C] font-display tracking-tight">OwnTown</span>
          </Link>

          {step === 'phone' ? (
            <>
              <h1 className="text-2xl font-black text-[#2C2C2C] mb-1">Sign in</h1>
              <p className="text-gray-500 text-sm mb-7">Enter your phone number to receive a one-time code</p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="tgtg-input"
                  />
                </div>
                <button type="submit" disabled={loading} className="tgtg-btn w-full py-4 text-base mt-2 disabled:opacity-60">
                  {loading ? 'Sending…' : 'Send OTP'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('phone'); setOtp('') }}
                className="text-sm font-semibold text-gray-400 hover:text-[#2C2C2C] transition mb-6 flex items-center gap-1"
              >
                ← Change number
              </button>
              <h1 className="text-2xl font-black text-[#2C2C2C] mb-1">Enter OTP</h1>
              <p className="text-gray-500 text-sm mb-7">
                We sent a 6-digit code to <span className="font-semibold text-[#2C2C2C]">{phone}</span>
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    OTP code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    required
                    maxLength={6}
                    className="tgtg-input text-center text-2xl tracking-widest font-bold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="tgtg-btn w-full py-4 text-base mt-2 disabled:opacity-60"
                >
                  {loading ? 'Verifying…' : 'Verify & Sign in'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-5">
                Didn&apos;t receive it?{' '}
                <button
                  onClick={() => { setStep('phone'); setOtp('') }}
                  className="font-bold text-[#007a78] hover:underline"
                >
                  Resend OTP
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
