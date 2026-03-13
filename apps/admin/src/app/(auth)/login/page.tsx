'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAdminStore } from '@/store/admin'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password is required'),
})

type LoginForm = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { setAdmin } = useAdminStore()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    try {
      const res = await api.post('/admin/auth/login', data)
      setAdmin(res.data.admin, res.data.token)
      router.replace('/dashboard')
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark brand */}
      <div className="hidden lg:flex w-[420px] bg-[#1A1A1A] flex-col justify-between p-12 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00B43C] rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">OT</span>
          </div>
          <span className="text-white font-semibold text-lg">OwnTown</span>
        </div>

        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest font-semibold mb-6">Admin Dashboard</p>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Manage your<br />store with ease.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Orders, inventory, customers, and revenue — all in one place.
          </p>

        </div>

        <p className="text-white/20 text-xs">© {new Date().getFullYear()} OwnTown. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 bg-[#F7F7F7] flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 bg-[#00B43C] rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">OT</span>
            </div>
            <span className="font-semibold text-[#1A1A1A]">OwnTown</span>
          </div>

          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-8">Enter your admin credentials to continue.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent transition"
                placeholder="admin@owntown.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent transition"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] text-white rounded-lg py-3 font-semibold text-sm hover:bg-[#2A2A2A] disabled:opacity-50 transition mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              Secure admin access · OwnTown v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
