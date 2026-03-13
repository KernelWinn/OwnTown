'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCartStore } from '@/store/cart'
import type { Product, ProductVariant } from '@owntown/types'
import Image from 'next/image'
import { ChevronLeft, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
      <div className="animate-pulse space-y-4 pt-4">
        <div className="aspect-square bg-gray-200 rounded-xl" />
        <div className="h-6 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
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
    <div className="-mx-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-600 px-4 py-2"
      >
        <ChevronLeft size={18} /> Back
      </button>

      {/* Images */}
      <div className="relative aspect-square bg-white">
        <Image
          src={imgUrl(product.images?.[activeImg] ?? '')}
          alt={product.name}
          fill
          className="object-contain"
          sizes="640px"
          priority
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-[#00B43C] text-white text-xs font-bold px-2 py-1 rounded">
            {discount}% off
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {product.images && product.images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${
                activeImg === i ? 'border-[#00B43C]' : 'border-gray-200'
              }`}
            >
              <Image src={imgUrl(img)} alt="" width={56} height={56} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Name & price */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{product.unit}</p>
          <h1 className="text-lg font-semibold">{product.name}</h1>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold">₹{(effectivePrice / 100).toFixed(2)}</span>
            {discount > 0 && (
              <span className="text-sm text-gray-400 line-through">₹{(effectiveMrp / 100).toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Variants */}
        {variants.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Variants</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedVariant(null)}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  !selectedVariant
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                    : 'border-gray-200 bg-white'
                }`}
              >
                Default
              </button>
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    selectedVariant?.id === v.id
                      ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                      : 'border-gray-200 bg-white'
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
            <p className="text-sm font-medium mb-1">About this product</p>
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Add to cart */}
        <div className="pt-2">
          {cartItem ? (
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => updateQty(product.id, cartItem.quantity - 1, selectedVariant?.id)}
                className="qty-btn"
              >
                <Minus size={16} />
              </button>
              <span className="font-semibold">{cartItem.quantity}</span>
              <button
                onClick={() => updateQty(product.id, cartItem.quantity + 1, selectedVariant?.id)}
                className="qty-btn"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleAdd} className="btn-primary w-full flex items-center justify-center gap-2">
              <ShoppingCart size={18} />
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
