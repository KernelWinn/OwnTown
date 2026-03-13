'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@owntown/types'
import { Search, X } from 'lucide-react'

function recordEvent(
  productId: string,
  eventType: 'search_click' | 'add_to_cart' | 'purchase',
  query?: string,
) {
  api.post('/products/search-event', { productId, eventType, query }).catch(() => {})
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [debouncedQ, setDebouncedQ] = useState(q)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['search', debouncedQ, user?.id],
    queryFn: () => {
      if (debouncedQ.length >= 2) {
        const params = new URLSearchParams({ q: debouncedQ })
        if (user?.id) params.set('userId', user.id)
        return api.get(`/products/search?${params}`).then((r) => r.data)
      }
      return api.get('/products?limit=60').then((r) => r.data)
    },
  })

  const handleProductClick = useCallback((productId: string) => {
    if (debouncedQ.length >= 2) {
      recordEvent(productId, 'search_click', debouncedQ)
    }
  }, [debouncedQ])

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#2C2C2C] mb-6">Search</h1>
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for groceries..."
            className="tgtg-input pl-11 pr-10 py-4 text-base rounded-2xl"
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="tgtg-card animate-pulse h-64" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="tgtg-card p-16 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-bold text-[#2C2C2C]">No results for &ldquo;{q}&rdquo;</p>
          <p className="text-gray-500 text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 font-medium">
            {products.length} product{products.length !== 1 ? 's' : ''}
            {debouncedQ && <span className="ml-1">for &ldquo;{debouncedQ}&rdquo;</span>}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} onClick={() => handleProductClick(p.id)}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
