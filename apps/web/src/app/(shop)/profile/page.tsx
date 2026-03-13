'use client'

import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { Package, ChevronRight, LogOut } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  function handleLogout() {
    logout()
    toast.success('Signed out')
    router.push('/')
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center gap-5 text-center">
        <span className="text-6xl">👋</span>
        <h2 className="text-2xl font-black text-[#2C2C2C]">Sign in to your account</h2>
        <p className="text-gray-500">View your orders, manage your profile, and more</p>
        <Link href="/login" className="tgtg-btn mt-2">Sign in</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-3xl font-black text-[#2C2C2C]">Profile</h1>

      {/* Avatar card */}
      <div className="tgtg-card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-[#007a78] flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-white text-2xl font-black">{user.name?.[0]?.toUpperCase() ?? 'U'}</span>
        </div>
        <div>
          <p className="font-black text-xl text-[#2C2C2C]">{user.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
        </div>
      </div>

      {/* Menu */}
      <div className="tgtg-card divide-y divide-gray-50">
        <Link href="/orders" className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-[#e6f5f5] flex items-center justify-center">
            <Package size={16} className="text-[#007a78]" />
          </div>
          <span className="flex-1 font-semibold text-sm">My orders</span>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>
      </div>

      <button onClick={handleLogout}
        className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 transition px-1">
        <LogOut size={15} /> Sign out
      </button>
    </div>
  )
}
