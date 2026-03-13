'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCartStore } from '@/store/cart'
import type { Product, ProductVariant } from '@owntown/types'
import Image from 'next/image'
import { ChevronLeft, Minus, Plus, ShoppingCart } from 'lucide-react'
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
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="aspect-square bg-gray-200 rounded-lg" />
          <div className="space-y-4">
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
    toast.success('Added to cart')
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A1A1A] transition"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square sq-card overflow-hidden">
            <Image
              src={imgUrl(product.images?.[activeImg] ?? '')}
              alt={product.name}
              fill
              className="object-contain p-4"
              sizes="600px"
              priority
            />
            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-[#00B43C] text-white text-xs font-bold px-2 py-1 rounded-md">
                {discount}% off
              </span>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    activeImg === i ? 'border-[#1A1A1A]' : 'border-gray-200'
                  }`}
                >
                  <Image src={imgUrl(img)} alt="" width={64} height={64} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{product.unit}</p>
            <h1 className="text-2xl font-bold leading-snug">{product.name}</h1>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-2xl font-bold">₹{(effectivePrice / 100).toFixed(2)}</span>
              {discount > 0 && (
                <span className="text-base text-gray-400 line-through">₹{(effectiveMrp / 100).toFixed(2)}</span>
              )}
              {discount > 0 && (
                <span className="text-sm font-semibold text-[#00B43C]">Save {discount}%</span>
              )}
            </div>
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <div>
              <p className="field-label">Variants</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedVariant(null)}
                  className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition ${
                    !selectedVariant ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  Default
                </button>
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition ${
                      selectedVariant?.id === v.id ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-gray-200 bg-white hover:border-gray-400'
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
              <p className="field-label">About this product</p>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Add to cart */}
          <div className="pt-2">
            {cartItem ? (
              <div className="flex items-center gap-3">
                <button onClick={() => updateQty(product.id, cartItem.quantity - 1, selectedVariant?.id)} className="qty-btn w-9 h-9">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-semibold text-lg">{cartItem.quantity}</span>
                <button onClick={() => updateQty(product.id, cartItem.quantity + 1, selectedVariant?.id)} className="qty-btn w-9 h-9">
                  <Plus size={14} />
                </button>
                <span className="text-sm text-gray-500 ml-1">in cart</span>
              </div>
            ) : (
              <button onClick={handleAdd} className="sq-btn-green flex items-center gap-2">
                <ShoppingCart size={16} />
                Add to cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
