'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { toast } from 'sonner'
import type { Product } from '@owntown/types'

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? ''
function imgUrl(key: string) {
  if (!key) return '/placeholder.png'
  if (key.startsWith('http')) return key
  return `${CDN}/${key}`
}

export default function ProductCard({ product }: { product: Product }) {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const updateQty = useCartStore((s) => s.updateQty)

  const cartItem = items.find((i) => i.productId === product.id && !i.variantId)
  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images?.[0] ?? '',
      price: product.price,
      mrp: product.mrp,
      unit: product.unit,
    })
    toast.success('Added to cart')
  }

  return (
    <Link href={`/product/${product.id}`} className="sq-card flex flex-col overflow-hidden hover:shadow-sm transition-shadow">
      <div className="relative aspect-square bg-gray-50">
        <Image
          src={imgUrl(product.images?.[0] ?? '')}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 220px"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#00B43C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {discount}% off
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-[11px] text-gray-500 mb-0.5 uppercase tracking-wide">{product.unit}</p>
        <p className="text-sm font-medium leading-tight line-clamp-2 flex-1">{product.name}</p>

        <div className="flex items-center justify-between mt-2.5">
          <div>
            <span className="font-bold text-sm">₹{(product.price / 100).toFixed(2)}</span>
            {discount > 0 && (
              <span className="ml-1.5 text-xs text-gray-400 line-through">₹{(product.mrp / 100).toFixed(2)}</span>
            )}
          </div>

          {cartItem ? (
            <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
              <button
                onClick={(e) => { e.preventDefault(); updateQty(product.id, cartItem.quantity - 1) }}
                className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
              >
                <Minus size={11} />
              </button>
              <span className="w-5 text-center text-xs font-semibold">{cartItem.quantity}</span>
              <button
                onClick={(e) => { e.preventDefault(); updateQty(product.id, cartItem.quantity + 1) }}
                className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
              >
                <Plus size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-7 h-7 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center hover:bg-[#2A2A2A] transition"
              aria-label="Add to cart"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
