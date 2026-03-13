'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCartStore } from '@/store/cart'
import type { Product, ProductVariant } from '@owntown/types'
import Image from 'next/image'
import { ChevronLeft, Minus, Plus, ShoppingCart, Star } from 'lucide-react'
import { toast } from 'sonner'

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? ''
function imgUrl(key: string) {
  if (!key) return '/placeholder.png'
  if (key.startsWith('http')) return key
  return `${CDN}/${key}`
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [activeImg, setActiveImg] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
  })
  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: ['variants', id],
    queryFn: () => api.get(`/products/${id}/variants`).then((r) => r.data),
    enabled: !!product,
  })

  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const updateQty = useCartStore((s) => s.updateQty)

  if (isLoading || !product) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-24 mb-8" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="aspect-square bg-gray-200 rounded-3xl" />
          <div className="space-y-4 pt-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  const effectivePrice = selectedVariant ? selectedVariant.price : product.price
  const effectiveMrp = selectedVariant ? selectedVariant.mrp : product.mrp
  const discount = effectiveMrp > effectivePrice
    ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100)
    : 0

  const cartItem = items.find(
    (i) => i.productId === product.id && i.variantId === (selectedVariant?.id ?? undefined),
  )

  function handleAdd() {
    addItem({
      productId: product!.id,
      name: product!.name + (selectedVariant ? ` — ${selectedVariant.title}` : ''),
      image: product!.images?.[0] ?? '',
      price: effectivePrice,
      mrp: effectiveMrp,
      unit: product!.unit,
      variantId: selectedVariant?.id,
      variantTitle: selectedVariant?.title,
    })
    toast.success('Added to cart 🛒')
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#2C2C2C] transition mb-8">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square tgtg-card overflow-visible rounded-3xl bg-white">
            <Image
              src={imgUrl(product.images?.[activeImg] ?? '')}
              alt={product.name}
              fill
              className="object-contain p-8 rounded-3xl"
              sizes="600px"
              priority
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-[#FF8C42] text-white text-sm font-bold px-3 py-1 rounded-full shadow">
                -{discount}%
              </span>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition ${
                    activeImg === i ? 'border-[#25a855]' : 'border-gray-100 hover:border-gray-300'
                  }`}>
                  <Image src={imgUrl(img)} alt="" width={64} height={64} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6 py-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#25a855] bg-green-50 px-3 py-1 rounded-full">
              {product.unit}
            </span>
            <h1 className="text-3xl font-black text-[#2C2C2C] mt-3 leading-tight">{product.name}</h1>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl font-black text-[#2C2C2C]">₹{(effectivePrice / 100).toFixed(2)}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{(effectiveMrp / 100).toFixed(2)}</span>
                  <span className="text-sm font-bold text-[#FF8C42] bg-orange-50 px-2 py-0.5 rounded-full">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Choose variant</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedVariant(null)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl border-2 transition ${
                    !selectedVariant
                      ? 'border-[#25a855] bg-green-50 text-[#25a855]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Default
                </button>
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl border-2 transition ${
                      selectedVariant?.id === v.id
                        ? 'border-[#25a855] bg-green-50 text-[#25a855]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">About</p>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Add to cart */}
          <div className="pt-2">
            {cartItem ? (
              <div className="flex items-center gap-4">
                <button onClick={() => updateQty(product.id, cartItem.quantity - 1, selectedVariant?.id)}
                  className="w-11 h-11 rounded-full border-2 border-[#25a855] text-[#25a855] flex items-center justify-center hover:bg-green-50 transition">
                  <Minus size={16} />
                </button>
                <span className="text-2xl font-black w-8 text-center">{cartItem.quantity}</span>
                <button onClick={() => updateQty(product.id, cartItem.quantity + 1, selectedVariant?.id)}
                  className="w-11 h-11 rounded-full border-2 border-[#25a855] text-[#25a855] flex items-center justify-center hover:bg-green-50 transition">
                  <Plus size={16} />
                </button>
                <span className="text-sm text-gray-500 font-medium">in cart</span>
              </div>
            ) : (
              <button onClick={handleAdd} className="tgtg-btn py-4 px-8 text-base">
                <ShoppingCart size={18} />
                Add to cart
              </button>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 pt-2">
            {['Same-day delivery', 'Fresh guaranteed', 'Easy returns'].map((badge) => (
              <span key={badge} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <Star size={11} className="text-[#25a855]" fill="#25a855" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
