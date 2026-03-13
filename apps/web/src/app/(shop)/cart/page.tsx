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
      <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center gap-5 text-center">
        <ShoppingBag size={64} className="text-gray-200" />
        <h2 className="text-2xl font-black text-[#2C2C2C]">Your cart is empty</h2>
        <p className="text-gray-500">Add some products to get started</p>
        <Link href="/" className="tgtg-btn mt-2">Browse products</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-black text-[#2C2C2C] mb-8">Your cart</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId}`} className="tgtg-card p-4 flex gap-4 items-center">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                <Image src={imgUrl(item.image)} alt={item.name} fill className="object-cover" sizes="80px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.unit}</p>
                <p className="font-bold text-[#007a78] mt-1">₹{(item.price / 100).toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <button onClick={() => removeItem(item.productId, item.variantId)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1, item.variantId)}
                    className="w-7 h-7 rounded-full border-2 border-[#007a78] text-[#007a78] flex items-center justify-center hover:bg-[#e6f5f5] transition">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1, item.variantId)}
                    className="w-7 h-7 rounded-full border-2 border-[#007a78] text-[#007a78] flex items-center justify-center hover:bg-[#e6f5f5] transition">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="tgtg-card p-6 space-y-4">
            <h2 className="font-black text-lg text-[#2C2C2C]">Order summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">₹{(total / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery</span>
                <span className="font-semibold text-[#007a78]">Free</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-black text-[#2C2C2C]">Total</span>
                <span className="font-black text-xl text-[#2C2C2C]">₹{(total / 100).toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => router.push('/checkout')} className="tgtg-btn w-full text-base py-4">
              Checkout
            </button>
          </div>
          <Link href="/" className="block text-center text-sm font-semibold text-gray-500 hover:text-[#2C2C2C] transition-colors py-2">
            ← Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
