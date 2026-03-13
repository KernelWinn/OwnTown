'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { ChevronLeft, Package, MapPin, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? ''
function imgUrl(key: string) {
  if (!key) return '/placeholder.png'
  if (key.startsWith('http')) return key
  return `${CDN}/${key}`
}

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-[#00843C]',
  cancelled: 'bg-red-100 text-red-700',
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
      <div className="space-y-4 animate-pulse pt-4">
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="card h-32 bg-gray-100" />
        <div className="card h-48 bg-gray-100" />
      </div>
    )
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-600 -ml-1">
        <ChevronLeft size={18} /> Orders
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">#{order.id.slice(-8).toUpperCase()}</h1>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {order.status}
        </span>
      </div>

      {/* Status tracker */}
      {order.status !== 'cancelled' && (
        <div className="card">
          <p className="text-sm font-medium mb-3">Order status</p>
          <div className="relative flex justify-between">
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200" />
            <div
              className="absolute top-3 left-0 h-0.5 bg-[#00B43C] transition-all"
              style={{ width: stepIndex >= 0 ? `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
            />
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="relative flex flex-col items-center gap-1 z-10">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  i <= stepIndex ? 'bg-[#00B43C] border-[#00B43C]' : 'bg-white border-gray-200'
                }`}>
                  {i <= stepIndex && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[9px] text-gray-500 capitalize">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="card">
        <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
          <Package size={15} /> Items
        </p>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 items-center">
              {item.productImage && (
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
                  <Image src={imgUrl(item.productImage)} alt="" fill className="object-cover" sizes="48px" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-1">{item.productName ?? 'Product'}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium">₹{((item.price * item.quantity) / 100).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-semibold text-sm">
          <span>Total</span>
          <span>₹{(order.total / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Delivery address */}
      {order.deliveryAddress && (
        <div className="card">
          <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <MapPin size={15} /> Delivery address
          </p>
          <p className="text-sm text-gray-600">
            {[order.deliveryAddress.line1, order.deliveryAddress.line2, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pincode]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}

      {/* Tracking */}
      {order.trackingNumber && (
        <div className="card bg-[#E6F9ED]">
          <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
            <Truck size={15} className="text-[#00843C]" /> Tracking
          </p>
          <p className="text-sm font-mono text-[#00843C]">{order.trackingNumber}</p>
        </div>
      )}
    </div>
  )
}
