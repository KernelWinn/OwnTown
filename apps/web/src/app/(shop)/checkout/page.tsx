'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { MapPin, CreditCard } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const clearCart = useCartStore((s) => s.clearCart)
  const user = useAuthStore((s) => s.user)

  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [placing, setPlacing] = useState(false)

  if (!user) {
    router.replace('/login?redirect=/checkout')
    return null
  }

  if (items.length === 0) {
    router.replace('/cart')
    return null
  }

  async function handlePlaceOrder() {
    if (!address.line1 || !address.city || !address.pincode) {
      toast.error('Please fill in your address')
      return
    }
    setPlacing(true)
    try {
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
        })),
        deliveryAddress: address,
        paymentMethod: 'cod',
      })
      clearCart()
      toast.success('Order placed!')
      router.push(`/orders/${data.id}`)
    } catch {
      toast.error('Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Checkout</h1>

      {/* Delivery address */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 font-medium text-sm">
          <MapPin size={16} className="text-[#00B43C]" />
          Delivery address
        </div>
        <input
          value={address.line1}
          onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
          placeholder="Address line 1 *"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
        />
        <input
          value={address.line2}
          onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
          placeholder="Address line 2 (optional)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={address.city}
            onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
            placeholder="City *"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
          />
          <input
            value={address.pincode}
            onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))}
            placeholder="Pincode *"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
          />
        </div>
        <input
          value={address.state}
          onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
          placeholder="State"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
        />
      </div>

      {/* Payment */}
      <div className="card">
        <div className="flex items-center gap-2 font-medium text-sm mb-3">
          <CreditCard size={16} className="text-[#00B43C]" />
          Payment method
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
          <div className="w-4 h-4 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
          </div>
          <span className="text-sm font-medium">Cash on delivery</span>
        </div>
      </div>

      {/* Order summary */}
      <div className="card space-y-2">
        <p className="font-medium text-sm mb-2">Order summary ({items.length} items)</p>
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
            <span className="text-gray-600 line-clamp-1 flex-1 mr-2">
              {item.name} × {item.quantity}
            </span>
            <span>₹{((item.price * item.quantity) / 100).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>₹{(total / 100).toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={placing}
        className="btn-primary w-full disabled:opacity-60"
      >
        {placing ? 'Placing order...' : `Place order · ₹${(total / 100).toFixed(2)}`}
      </button>
    </div>
  )
}
