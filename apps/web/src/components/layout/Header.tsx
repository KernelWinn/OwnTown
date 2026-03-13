'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, Search, User, Menu, X } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { useState } from 'react'
import { toast } from 'sonner'

const NAV = [
  { label: 'Shop', href: '/' },
  { label: 'Orders', href: '/orders' },
]

export default function Header() {
  const count = useCartStore((s) => s.count())
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    toast.success('Signed out')
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-[#007a78] rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm">OT</span>
          </div>
          <span className="font-black text-xl text-[#2C2C2C] hidden sm:block font-display tracking-tight">OwnTown</span>
        </Link>

        {/* Search bar */}
        <button
          onClick={() => router.push('/search')}
          className="flex-1 max-w-md flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2.5 text-gray-400 text-sm"
        >
          <Search size={15} />
          <span>Search products...</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                href === '/' ? pathname === '/' : pathname.startsWith(href)
                  ? 'text-[#007a78] bg-[#e6f5f5]'
                  : 'text-gray-600 hover:text-[#2C2C2C] hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          <Link href="/cart" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ShoppingCart size={20} className="text-[#2C2C2C]" />
            {count > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-[#007a78] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <div className="w-7 h-7 rounded-full bg-[#007a78] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.name?.split(' ')[0]}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-elevated border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                  <User size={15} className="text-gray-400" /> Profile
                </Link>
                <Link href="/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                  Orders
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login" className="tgtg-btn-sm hidden sm:inline-flex">Sign in</Link>
          )}

          <button className="md:hidden p-2 rounded-full hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {NAV.map(({ label, href }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              {label}
            </Link>
          ))}
          {!user && (
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-semibold text-[#007a78]">
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
