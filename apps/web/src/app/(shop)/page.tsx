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
  const { data: featured = [] } = useQuery<Product[]>({
    queryKey: ['featured'],
    queryFn: () => api.get('/products?featured=true&limit=8').then((r) => r.data),
  })
  const { data: allProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products?limit=60').then((r) => r.data),
  })

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#007a78] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              Fresh groceries,<br />delivered fast.
            </h1>
            <p className="text-white/80 text-lg mb-8 max-w-md">
              Shop local essentials and get them delivered right to your door — same day.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-white text-[#007a78] font-bold px-8 py-4 rounded-2xl hover:bg-[#e6f5f5] transition-colors text-base shadow-lg"
            >
              Browse products <ChevronRight size={18} />
            </Link>
          </div>
          <div className="hidden md:flex w-72 h-56 bg-white/10 rounded-3xl items-center justify-center">
            <span className="text-7xl">🛒</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <h2 className="text-xl font-black text-[#2C2C2C] mb-5">Shop by category</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/search?category=${cat.id}`} className="flex flex-col items-center gap-2 group">
                  <div className="w-full aspect-square tgtg-card group-hover:shadow-elevated transition-shadow">
                    {cat.imageUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={imgUrl(cat.imageUrl)}
                          alt={cat.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="80px"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-[#e6f5f5] flex items-center justify-center text-2xl">🌿</div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight line-clamp-2">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-[#2C2C2C]">Featured picks</h2>
              <Link href="/search" className="flex items-center gap-1 text-sm font-semibold text-[#007a78] hover:underline">
                See all <ChevronRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* All products */}
        <section>
          <h2 className="text-xl font-black text-[#2C2C2C] mb-5">All Products</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="tgtg-card animate-pulse h-64" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {allProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
