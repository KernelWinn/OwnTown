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

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-[#E6F9ED] text-[#00843C] border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  productName?: string
  productImage?: string
}

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  deliveryAddress: Record<string, string>
  items: OrderItem[]
  trackingNumber?: string
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
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="sq-card h-32" />
        <div className="sq-card h-48" />
      </div>
    )
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A1A1A] transition mb-3">
          <ChevronLeft size={16} /> Back to orders
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">#{order.id.slice(-8).toUpperCase()}</h1>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {order.status}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Status tracker */}
          {order.status !== 'cancelled' && (
            <div className="sq-card p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-5">Order Status</h2>
              <div className="relative flex justify-between">
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200" />
                <div
                  className="absolute top-3 left-0 h-0.5 bg-[#00B43C] transition-all"
                  style={{ width: stepIndex >= 0 ? `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
                />
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="relative flex flex-col items-center gap-2 z-10">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      i <= stepIndex ? 'bg-[#00B43C] border-[#00B43C]' : 'bg-white border-gray-200'
                    }`}>
                      {i <= stepIndex && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 capitalize font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="sq-card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package size={15} className="text-gray-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Items</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                  {item.productImage && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      <Image src={imgUrl(item.productImage)} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.productName ?? 'Product'}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">₹{((item.price * item.quantity) / 100).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-between font-semibold text-sm">
              <span>Total</span>
              <span>₹{(order.total / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Delivery address */}
          {order.deliveryAddress && (
            <div className="sq-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={15} className="text-[#00B43C]" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Delivery Address</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {[order.deliveryAddress.line1, order.deliveryAddress.line2, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pincode]
                  .filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {/* Tracking */}
          {order.trackingNumber && (
            <div className="sq-card p-5 bg-[#E6F9ED] border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={15} className="text-[#00843C]" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#00843C]">Tracking</h2>
              </div>
              <p className="text-sm font-mono text-[#00843C]">{order.trackingNumber}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
