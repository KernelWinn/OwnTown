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

  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '' })
  const [placing, setPlacing] = useState(false)

  if (!user) { router.replace('/login?redirect=/checkout'); return null }
  if (items.length === 0) { router.replace('/cart'); return null }

  async function handlePlaceOrder() {
    if (!address.line1 || !address.city || !address.pincode) {
      toast.error('Please fill in your address')
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
      toast.success('Order placed!')
      router.push(`/orders/${data.id}`)
    } catch {
      toast.error('Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-gray-500 mt-1">Review your order and enter delivery details</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Address + Payment */}
        <div className="lg:col-span-2 space-y-4">
          {/* Delivery address */}
          <div className="sq-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#00B43C]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Delivery Address</h2>
            </div>
            <input value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} placeholder="Address line 1 *" className="field-input" />
            <input value={address.line2} onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))} placeholder="Address line 2 (optional)" className="field-input" />
            <div className="grid grid-cols-2 gap-3">
              <input value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} placeholder="City *" className="field-input" />
              <input value={address.pincode} onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))} placeholder="Pincode *" className="field-input" />
            </div>
            <input value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} placeholder="State" className="field-input" />
          </div>

          {/* Payment */}
          <div className="sq-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-[#00B43C]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Payment Method</h2>
            </div>
            <label className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 cursor-pointer">
              <div className="w-4 h-4 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
              </div>
              <span className="text-sm font-medium">Cash on delivery</span>
            </label>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="sq-card p-5 space-y-4 h-fit">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Order Summary</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                <span className="text-gray-600 line-clamp-1 flex-1 mr-2">{item.name} × {item.quantity}</span>
                <span className="font-medium">₹{((item.price * item.quantity) / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery</span>
              <span className="text-[#00B43C] font-medium">Free</span>
            </div>
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>₹{(total / 100).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={handlePlaceOrder} disabled={placing} className="sq-btn-green w-full disabled:opacity-60">
            {placing ? 'Placing order...' : 'Place order'}
          </button>
        </div>
      </div>
    </div>
  )
}
