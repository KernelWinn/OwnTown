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
    <Link href={`/product/${product.id}`} className="tgtg-card flex flex-col hover:shadow-elevated transition-shadow group">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-[#e6f5f5] overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={imgUrl(product.images[0])}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, 220px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl select-none">
            🌿
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#FF8C42] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{product.unit}</p>
        <p className="text-sm font-semibold leading-tight line-clamp-2 flex-1 text-[#2C2C2C]">{product.name}</p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-base text-[#2C2C2C]">₹{(product.price / 100).toFixed(2)}</span>
            {discount > 0 && (
              <span className="text-xs text-gray-400 line-through">₹{(product.mrp / 100).toFixed(2)}</span>
            )}
          </div>

          {product.stockQuantity === 0 ? (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Out of stock</span>
          ) : cartItem ? (
            <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
              <button
                onClick={(e) => { e.preventDefault(); updateQty(product.id, cartItem.quantity - 1) }}
                className="w-7 h-7 rounded-full border-2 border-[#007a78] text-[#007a78] flex items-center justify-center hover:bg-[#e6f5f5] transition"
              >
                <Minus size={11} />
              </button>
              <span className="w-5 text-center text-sm font-bold">{cartItem.quantity}</span>
              <button
                onClick={(e) => { e.preventDefault(); updateQty(product.id, cartItem.quantity + 1) }}
                className="w-7 h-7 rounded-full border-2 border-[#007a78] text-[#007a78] flex items-center justify-center hover:bg-[#e6f5f5] transition"
              >
                <Plus size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-8 h-8 rounded-full bg-[#007a78] text-white flex items-center justify-center hover:bg-[#005f5d] transition shadow-sm"
              aria-label="Add to cart"
            >
              <Plus size={15} />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
