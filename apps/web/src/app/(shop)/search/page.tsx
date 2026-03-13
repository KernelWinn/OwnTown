'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@owntown/types'
import { Search, X } from 'lucide-react'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [debouncedQ, setDebouncedQ] = useState(q)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['search', debouncedQ],
    queryFn: () =>
      debouncedQ.length >= 2
        ? api.get(`/products/search?q=${encodeURIComponent(debouncedQ)}`).then((r) => r.data)
        : api.get('/products?limit=60').then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-sm text-gray-500 mt-1">Find products by name</p>
      </div>

      <div className="relative max-w-lg">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products..."
          className="field-input pl-10 pr-10"
        />
        {q && (
          <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 sq-icon-btn">
            <X size={14} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="sq-card animate-pulse h-56" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="sq-card p-16 text-center text-gray-500 text-sm">
          No products found for &ldquo;{q}&rdquo;
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{products.length} product{products.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  )
}
