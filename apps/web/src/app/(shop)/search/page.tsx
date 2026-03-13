'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import ProductCard from '@/components/ProductCard'
import type { Product, Category } from '@owntown/types'
import Image from 'next/image'
import { Search, X } from 'lucide-react'

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? ''
function imgUrl(key: string) {
  if (!key) return ''
  if (key.startsWith('http')) return key
  return `${CDN}/${key}`
}

function recordEvent(
  productId: string,
  eventType: 'search_click' | 'add_to_cart' | 'purchase',
  query?: string,
) {
  api.post('/products/search-event', { productId, eventType, query }).catch(() => {})
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [debouncedQ, setDebouncedQ] = useState(q)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category') ?? null,
  )

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then((r) => r.data),
  })

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['search', debouncedQ, selectedCategory, user?.id],
    queryFn: () => {
      if (debouncedQ.length >= 2) {
        const params = new URLSearchParams({ q: debouncedQ })
        if (user?.id) params.set('userId', user.id)
        if (selectedCategory) params.set('categoryId', selectedCategory)
        return api.get(`/products/search?${params}`).then((r) => r.data)
      }
      const params = new URLSearchParams({ limit: '60' })
      if (selectedCategory) params.set('categoryId', selectedCategory)
      return api.get(`/products?${params}`).then((r) => r.data)
    },
  })

  const handleProductClick = useCallback((productId: string) => {
    if (debouncedQ.length >= 2) {
      recordEvent(productId, 'search_click', debouncedQ)
    }
  }, [debouncedQ])

  function selectCategory(id: string | null) {
    setSelectedCategory(id)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (id) params.set('category', id)
    router.replace(`/search${params.toString() ? `?${params}` : ''}`, { scroll: false })
  }

  const activeCat = categories.find(c => c.id === selectedCategory)

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      {/* Search bar */}
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

      {/* Category filter bar */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => selectCategory(null)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
              !selectedCategory
                ? 'bg-[#007a78] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#007a78] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.icon ? (
                <span className="text-base leading-none">{cat.icon}</span>
              ) : cat.imageUrl ? (
                <span className="w-5 h-5 rounded-full overflow-hidden inline-block relative flex-shrink-0">
                  <Image src={imgUrl(cat.imageUrl)} alt="" fill className="object-cover" sizes="20px" />
                </span>
              ) : null}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Active category heading */}
      {activeCat && (
        <div className="flex items-center gap-2">
          {activeCat.icon && <span className="text-2xl">{activeCat.icon}</span>}
          <h2 className="text-lg font-black text-[#2C2C2C]">{activeCat.name}</h2>
          <button
            onClick={() => selectCategory(null)}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            <X size={13} /> Clear filter
          </button>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="tgtg-card animate-pulse h-64" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="tgtg-card p-16 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-bold text-[#2C2C2C]">
            {debouncedQ ? <>No results for &ldquo;{debouncedQ}&rdquo;</> : 'No products found'}
          </p>
          <p className="text-gray-500 text-sm mt-1">Try a different search term or category</p>
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
