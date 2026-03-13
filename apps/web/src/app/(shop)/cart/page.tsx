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
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <ShoppingBag size={56} className="text-gray-300" />
        <p className="text-gray-500 text-sm font-medium">Your cart is empty</p>
        <Link href="/" className="sq-btn-primary">Browse products</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cart</h1>
        <p className="text-sm text-gray-500 mt-1">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId}`} className="sq-card p-4 flex gap-4 items-center">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                <Image src={imgUrl(item.image)} alt={item.name} fill className="object-cover" sizes="64px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.unit}</p>
                <p className="text-sm font-bold mt-1">₹{(item.price / 100).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => updateQty(item.productId, item.quantity - 1, item.variantId)} className="qty-btn">
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, item.quantity + 1, item.variantId)} className="qty-btn">
                  <Plus size={12} />
                </button>
                <button onClick={() => removeItem(item.productId, item.variantId)} className="sq-icon-btn-danger ml-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <div className="sq-card p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{(total / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className="text-[#00B43C] font-medium">Free</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{(total / 100).toFixed(2)}</span>
            </div>
            <button onClick={() => router.push('/checkout')} className="sq-btn-green w-full mt-1">
              Proceed to checkout
            </button>
          </div>
          <Link href="/" className="sq-btn-ghost w-full text-center block">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
