'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import type { Product, Category } from '@owntown/types'
import Image from 'next/image'
import Link from 'next/link'

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
  const { data: featured = [] } = useQuery<Product[]>({
    queryKey: ['featured'],
    queryFn: () => api.get('/products?featured=true&limit=8').then((r) => r.data),
  })
  const { data: allProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products?limit=60').then((r) => r.data),
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Shop</h1>
        <p className="text-sm text-gray-500 mt-1">Fresh groceries &amp; essentials delivered to your door</p>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">Categories</h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/search?category=${cat.id}`} className="flex flex-col items-center gap-2 group">
                <div className="w-full aspect-square sq-card overflow-hidden relative">
                  {cat.imageUrl ? (
                    <Image src={imgUrl(cat.imageUrl)} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-200" sizes="100px" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
                <span className="text-xs font-medium text-center leading-tight line-clamp-2 text-gray-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Featured</h2>
            <Link href="/search" className="text-xs font-medium text-[#00B43C] hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* All products */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">All Products</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="sq-card animate-pulse h-56" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {allProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  )
}
