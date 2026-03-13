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
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <User size={32} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">Sign in to view your profile</p>
        <Link href="/login" className="btn-primary px-8">Sign in</Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Avatar */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl font-bold">
            {user.name?.[0]?.toUpperCase() ?? 'U'}
          </span>
        </div>
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
        </div>
      </div>

      {/* Menu */}
      <div className="card divide-y divide-gray-100">
        <Link href="/orders" className="flex items-center gap-3 py-3">
          <Package size={18} className="text-gray-500" />
          <span className="flex-1 text-sm font-medium">My orders</span>
          <ChevronRight size={16} className="text-gray-400" />
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="w-full card flex items-center justify-center gap-2 text-red-500 py-3 hover:bg-red-50 transition-colors"
      >
        <LogOut size={16} />
        <span className="text-sm font-medium">Sign out</span>
      </button>
    </div>
  )
}
