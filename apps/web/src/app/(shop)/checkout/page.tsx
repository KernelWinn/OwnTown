'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { MapPin, CreditCard, CheckCircle2 } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const clearCart = useCartStore((s) => s.clearCart)
  const user = useAuthStore((s) => s.user)

  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '' })
  const [placing, setPlacing] = useState(false)

  if (!user) { router.replace('/login?redirect=/checkout'); return null }
  if (items.length === 0) { router.replace('/cart'); return null }

  async function handlePlaceOrder() {
    if (!address.line1 || !address.city || !address.pincode) {
      toast.error('Please fill in your delivery address')
      return
    }
    setPlacing(true)
    try {
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity, price: i.price })),
        deliveryAddress: address,
        paymentMethod: 'cod',
      })
      clearCart()
      toast.success('Order placed! 🎉')
      router.push(`/orders/${data.id}`)
    } catch {
      toast.error('Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-black text-[#2C2C2C] mb-8">Checkout</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Address */}
          <div className="tgtg-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={18} className="text-[#007a78]" />
              <h2 className="font-black text-[#2C2C2C]">Delivery address</h2>
            </div>
            <input value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
              placeholder="Address line 1 *" className="tgtg-input" />
            <input value={address.line2} onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
              placeholder="Address line 2 (optional)" className="tgtg-input" />
            <div className="grid grid-cols-2 gap-3">
              <input value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                placeholder="City *" className="tgtg-input" />
              <input value={address.pincode} onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))}
                placeholder="Pincode *" className="tgtg-input" />
            </div>
            <input value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
              placeholder="State" className="tgtg-input" />
          </div>

          {/* Payment */}
          <div className="tgtg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-[#007a78]" />
              <h2 className="font-black text-[#2C2C2C]">Payment</h2>
            </div>
            <label className="flex items-center gap-3 border-2 border-[#007a78] bg-[#e6f5f5] rounded-2xl px-5 py-4 cursor-pointer">
              <CheckCircle2 size={20} className="text-[#007a78]" />
              <div>
                <p className="font-semibold text-sm">Cash on delivery</p>
                <p className="text-xs text-gray-500">Pay when your order arrives</p>
              </div>
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="tgtg-card p-6 space-y-5 h-fit">
          <h2 className="font-black text-[#2C2C2C]">Order summary</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                <span className="text-gray-600 line-clamp-1 flex-1 mr-2">{item.name} × {item.quantity}</span>
                <span className="font-semibold flex-shrink-0">₹{((item.price * item.quantity) / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery</span>
              <span className="font-semibold text-[#007a78]">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="font-black text-[#2C2C2C]">Total</span>
              <span className="font-black text-xl">₹{(total / 100).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={handlePlaceOrder} disabled={placing}
            className="tgtg-btn w-full py-4 text-base disabled:opacity-60">
            {placing ? 'Placing order...' : 'Place order'}
          </button>
        </div>
      </div>
    </div>
  )
}
