'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { toast } from 'sonner'
import type { Product } from '@owntown/types'

interface Props {
  product: Product
}

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? ''

function imgUrl(key: string) {
  if (!key) return '/placeholder.png'
  if (key.startsWith('http')) return key
  return `${CDN}/${key}`
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem)
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
    <Link href={`/product/${product.id}`} className="card flex flex-col">
      <div className="relative aspect-square bg-gray-50 rounded-md overflow-hidden mb-2">
        <Image
          src={imgUrl(product.images?.[0] ?? '')}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 200px"
        />
        {discount > 0 && (
          <span className="absolute top-1.5 left-1.5 bg-[#00B43C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {discount}% off
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-0.5">{product.unit}</p>
      <p className="text-sm font-medium leading-tight line-clamp-2 flex-1">{product.name}</p>

      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="font-bold text-sm">₹{(product.price / 100).toFixed(2)}</span>
          {discount > 0 && (
            <span className="ml-1 text-xs text-gray-400 line-through">
              ₹{(product.mrp / 100).toFixed(2)}
            </span>
          )}
        </div>
        <button
          onClick={handleAdd}
          className="w-7 h-7 rounded-full bg-[#00B43C] text-white flex items-center justify-center hover:bg-[#009933] transition-colors"
          aria-label="Add to cart"
        >
          <Plus size={16} />
        </button>
      </div>
    </Link>
  )
}
