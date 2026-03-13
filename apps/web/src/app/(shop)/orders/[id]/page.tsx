'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { ChevronLeft, Package, MapPin, Truck } from 'lucide-react'
import Image from 'next/image'

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? ''
function imgUrl(key: string) {
  if (!key) return '/placeholder.png'
  if (key.startsWith('http')) return key
  return `${CDN}/${key}`
}

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const STATUS: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-yellow-100 text-yellow-700' },
  confirmed:  { label: 'Confirmed',  className: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Shipped',    className: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Delivered',  className: 'bg-[#E8F8EE] text-[#007a78]' },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-100 text-red-600' },
}

interface OrderItem {
  id: string; productId: string; quantity: number; price: number; productName?: string; productImage?: string
}
interface Order {
  id: string; status: string; total: number; createdAt: string
  deliveryAddress: Record<string, string>; items: OrderItem[]; trackingNumber?: string
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  })

  if (isLoading || !order) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="tgtg-card h-36" />
        <div className="tgtg-card h-52" />
      </div>
    )
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status)
  const st = STATUS[order.status]

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#2C2C2C] transition mb-4">
          <ChevronLeft size={16} /> Back to orders
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-black text-[#2C2C2C]">
            #{order.id.slice(-8).toUpperCase()}
          </h1>
          {st && <span className={`tgtg-badge text-sm ${st.className}`}>{st.label}</span>}
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Status tracker */}
          {order.status !== 'cancelled' && (
            <div className="tgtg-card p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-6">Order progress</p>
              <div className="relative flex justify-between">
                <div className="absolute top-4 left-0 right-0 h-1 bg-gray-100 rounded-full" />
                <div
                  className="absolute top-4 left-0 h-1 bg-[#007a78] rounded-full transition-all duration-500"
                  style={{ width: stepIndex >= 0 ? `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
                />
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="relative flex flex-col items-center gap-2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      i <= stepIndex ? 'bg-[#007a78] shadow-md' : 'bg-white border-2 border-gray-200'
                    }`}>
                      {i <= stepIndex ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <span className={`text-[10px] font-bold capitalize ${i <= stepIndex ? 'text-[#007a78]' : 'text-gray-400'}`}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="tgtg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-[#007a78]" />
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Items</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                  {item.productImage && (
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image src={imgUrl(item.productImage)} alt="" fill className="object-cover" sizes="56px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-1">{item.productName ?? 'Product'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm">₹{((item.price * item.quantity) / 100).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-50 flex justify-between items-center">
              <span className="font-bold text-[#2C2C2C]">Total</span>
              <span className="font-black text-xl text-[#2C2C2C]">₹{(order.total / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {order.deliveryAddress && (
            <div className="tgtg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={15} className="text-[#007a78]" />
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Delivery address</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {[order.deliveryAddress.line1, order.deliveryAddress.line2, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pincode]
                  .filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {order.trackingNumber && (
            <div className="tgtg-card p-5 bg-[#E8F8EE] border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={15} className="text-[#007a78]" />
                <p className="text-xs font-bold uppercase tracking-wide text-[#007a78]">Tracking</p>
              </div>
              <p className="text-sm font-mono font-bold text-[#007a78]">{order.trackingNumber}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
