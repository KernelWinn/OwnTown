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
  Ticket,
  Image,
  Star,
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
  { label: 'Coupons', href: '/coupons', icon: Ticket },
  { label: 'Banners', href: '/banners', icon: Image },
  { label: 'Reviews', href: '/reviews', icon: Star },
  { label: 'Users', href: '/users', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAdminStore()

  return (
    <aside className="w-56 bg-[#1A1A1A] flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#00B43C] rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">OT</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">OwnTown</h1>
            <p className="text-white/40 text-[10px] leading-tight">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00B43C] rounded-r-full" />
              )}
              <Icon size={16} className={active ? 'text-[#00B43C]' : ''} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white/70 rounded-md transition"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
