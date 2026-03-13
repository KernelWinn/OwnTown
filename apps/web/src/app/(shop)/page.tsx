'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import type { Product, Category } from '@owntown/types'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? ''
function imgUrl(key: string) {
  if (!key) return '/placeholder.png'
  if (key.startsWith('http')) return key
  return `${CDN}/${key}`
}

export default function HomePage() {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then((r) => r.data),
  })

  const { data: featured = [], isLoading } = useQuery<Product[]>({
    queryKey: ['featured'],
    queryFn: () => api.get('/products?featured=true&limit=8').then((r) => r.data),
  })

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products?limit=40').then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      {/* Search bar shortcut */}
      <Link
        href="/search"
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-400 text-sm"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        Search for groceries...
      </Link>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base">Shop by category</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.id}`}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-full aspect-square rounded-xl bg-white border border-gray-100 overflow-hidden relative">
                  {cat.imageUrl ? (
                    <Image
                      src={imgUrl(cat.imageUrl)}
                      alt={cat.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-center leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base">Featured</h2>
            <Link href="/search" className="text-xs text-[#00B43C] flex items-center gap-0.5">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* All products */}
      {allProducts.length > 0 && (
        <section>
          <h2 className="font-semibold text-base mb-3">All Products</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card animate-pulse h-52 bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {allProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
