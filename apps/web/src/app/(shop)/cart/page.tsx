'use client'

import { useCartStore } from '@/store/cart'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? ''
function imgUrl(key: string) {
  if (!key) return '/placeholder.png'
  if (key.startsWith('http')) return key
  return `${CDN}/${key}`
}

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const total = useCartStore((s) => s.total())
  const router = useRouter()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <ShoppingBag size={56} className="text-gray-300" />
        <p className="text-gray-500 text-sm">Your cart is empty</p>
        <Link href="/" className="btn-primary px-8">Browse products</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Your cart</h1>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId}`} className="card flex gap-3">
            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-50">
              <Image
                src={imgUrl(item.image)}
                alt={item.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.unit}</p>
              <p className="text-sm font-bold mt-1">₹{(item.price / 100).toFixed(2)}</p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <button
                onClick={() => removeItem(item.productId, item.variantId)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQty(item.productId, item.quantity - 1, item.variantId)}
                  className="qty-btn"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.productId, item.quantity + 1, item.variantId)}
                  className="qty-btn"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span>₹{(total / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Delivery</span>
          <span className="text-[#00B43C] font-medium">Free</span>
        </div>
        <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>₹{(total / 100).toFixed(2)}</span>
        </div>
      </div>

      <button onClick={() => router.push('/checkout')} className="btn-primary w-full">
        Proceed to checkout
      </button>
    </div>
  )
}
