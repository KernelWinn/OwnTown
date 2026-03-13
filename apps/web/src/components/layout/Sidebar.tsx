'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, ShoppingCart, Package, User, LogOut } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Cart', href: '/cart', icon: ShoppingCart },
  { label: 'Orders', href: '/orders', icon: Package },
  { label: 'Profile', href: '/profile', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const cartCount = useCartStore((s) => s.count())
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  function handleLogout() {
    logout()
    toast.success('Logged out')
    router.push('/')
  }

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
            <p className="text-white/40 text-[10px] leading-tight">Store</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const isCart = href === '/cart'
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00B43C] rounded-r-full" />
              )}
              <span className="relative">
                <Icon size={16} className={active ? 'text-[#00B43C]' : ''} />
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#00B43C] text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-2 border-t border-white/10">
        {user ? (
          <>
            <div className="px-3 py-2 mb-1">
              <p className="text-white/70 text-xs font-medium truncate">{user.name}</p>
              <p className="text-white/30 text-[10px] truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white/70 rounded-md transition"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2.5 w-full text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white/70 rounded-md transition"
          >
            <User size={16} />
            Sign in
          </Link>
        )}
      </div>
    </aside>
  )
}
