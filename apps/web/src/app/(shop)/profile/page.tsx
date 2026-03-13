'use client'

import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { User, Package, ChevronRight, LogOut } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  function handleLogout() {
    logout()
    toast.success('Logged out')
    router.push('/')
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <User size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Sign in to view your profile</p>
        <Link href="/login" className="sq-btn-primary">Sign in</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your account details</p>
      </div>

      {/* Avatar card */}
      <div className="sq-card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl font-bold">{user.name?.[0]?.toUpperCase() ?? 'U'}</span>
        </div>
        <div>
          <p className="font-semibold text-base">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
        </div>
      </div>

      {/* Menu */}
      <div className="sq-card divide-y divide-gray-100">
        <Link href="/orders" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
          <Package size={16} className="text-gray-500" />
          <span className="flex-1 text-sm font-medium">My Orders</span>
          <ChevronRight size={16} className="text-gray-400" />
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition"
      >
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  )
}
