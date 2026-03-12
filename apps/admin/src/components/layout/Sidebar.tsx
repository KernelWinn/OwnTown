'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Truck,
  Clock,
  LogOut,
} from 'lucide-react'
import { useAdminStore } from '@/store/admin'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/orders', icon: ShoppingCart },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Categories', href: '/categories', icon: Tag },
  { label: 'Shipments', href: '/shipments', icon: Truck },
  { label: 'Delivery Slots', href: '/slots', icon: Clock },
  { label: 'Users', href: '/users', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAdminStore()

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col">
      {/* Brand */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-violet-600">OwnTown</h1>
        <p className="text-xs text-gray-400 mt-0.5">Admin Dashboard</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
              pathname.startsWith(href)
                ? 'bg-violet-50 text-violet-700'
                : 'text-gray-600 hover:bg-gray-50',
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}
