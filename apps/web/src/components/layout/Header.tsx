'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, User } from 'lucide-react'
import { useCartStore } from '@/store/cart'

export default function Header() {
  const count = useCartStore((s) => s.count())
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight text-[#1A1A1A]">
          OwnTown
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push('/search')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          <Link href="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute top-1 right-1 bg-[#00B43C] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>

          <Link href="/profile" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <User size={20} />
          </Link>
        </div>
      </div>
    </header>
  )
}
