'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { ChevronLeft, Package, MapPin, Truck, Star, X } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? ''
function imgUrl(key: string) {
  if (!key) return '/placeholder.png'
  if (key.startsWith('http')) return key
  return `${CDN}/${key}`
}

const STATUS_STEPS = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']

const STATUS: Record<string, { label: string; className: string }> = {
  pending:          { label: 'Pending',          className: 'bg-yellow-100 text-yellow-700' },
  confirmed:        { label: 'Confirmed',        className: 'bg-blue-100 text-blue-700' },
  packed:           { label: 'Packed',           className: 'bg-indigo-100 text-indigo-700' },
  shipped:          { label: 'Shipped',          className: 'bg-purple-100 text-purple-700' },
  out_for_delivery: { label: 'Out for Delivery', className: 'bg-orange-100 text-orange-700' },
  delivered:        { label: 'Delivered',        className: 'bg-[#E8F8EE] text-[#007a78]' },
  cancelled:        { label: 'Cancelled',        className: 'bg-red-100 text-red-600' },
  returned:         { label: 'Returned',         className: 'bg-gray-100 text-gray-500' },
}

interface OrderItem {
  id: string
  productId: string
  name: string
  unit: string
  imageUrl?: string
  price: number
  quantity: number
  totalPrice: number
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  deliveryFee: number
  createdAt: string
  address: Record<string, string>
  items: OrderItem[]
  awbNumber?: string
  trackingUrl?: string
  paymentMethod: string
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition"
        >
          <Star size={22}
            className={(hover || value) >= i ? 'text-amber-400' : 'text-gray-200'}
            fill={(hover || value) >= i ? '#fbbf24' : '#e5e7eb'}
          />
        </button>
      ))}
    </div>
  )
}

function RateOrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const qc = useQueryClient()
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: () => {
      const items = order.items
        .filter(i => ratings[i.productId])
        .map(i => ({ productId: i.productId, rating: ratings[i.productId], comment: comments[i.productId] || undefined }))
      return api.post(`/reviews/order/${order.id}`, { items }).then(r => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', order.id] })
      qc.invalidateQueries({ queryKey: ['order-reviewed', order.id] })
      toast.success('Thanks for your review!')
      onClose()
    },
    onError: () => toast.error('Failed to submit review'),
  })

  const anyRated = Object.values(ratings).some(v => v > 0)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-black text-[#2C2C2C]">Rate your order</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {order.items.map(item => (
            <div key={item.productId} className="space-y-2">
              <div className="flex items-center gap-3">
                {item.imageUrl && (
                  <img src={imgUrl(item.imageUrl)} alt="" className="w-10 h-10 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                )}
                <p className="text-sm font-semibold text-[#2C2C2C] line-clamp-1 flex-1">{item.name}</p>
              </div>
              <StarPicker value={ratings[item.productId] ?? 0} onChange={v => setRatings(r => ({ ...r, [item.productId]: v }))} />
              {(ratings[item.productId] ?? 0) > 0 && (
                <textarea
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#007a78]/30 placeholder:text-gray-300"
                  rows={2}
                  placeholder="Optional comment…"
                  value={comments[item.productId] ?? ''}
                  onChange={e => setComments(c => ({ ...c, [item.productId]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={() => mutation.mutate()}
            disabled={!anyRated || mutation.isPending}
            className="tgtg-btn w-full justify-center disabled:opacity-40"
          >
            {mutation.isPending ? 'Submitting…' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [showRate, setShowRate] = useState(false)

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  })

  const { data: alreadyReviewed } = useQuery<boolean>({
    queryKey: ['order-reviewed', id],
    queryFn: () => api.get(`/reviews/order/${id}/submitted`).then(r => r.data),
    enabled: !!order && order.status === 'delivered',
  })

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="tgtg-card h-36" />
        <div className="tgtg-card h-52" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-4xl mb-4">😕</p>
        <h2 className="text-xl font-black text-[#2C2C2C] mb-2">Order not found</h2>
        <button onClick={() => router.back()} className="tgtg-btn">Go back</button>
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
            {order.orderNumber ?? `#${order.id.slice(-8).toUpperCase()}`}
          </h1>
          {st && <span className={`tgtg-badge text-sm ${st.className}`}>{st.label}</span>}
          {order.status === 'delivered' && (
            alreadyReviewed ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#007a78] bg-[#E8F8EE] px-3 py-1.5 rounded-full">
                <Star size={12} fill="#007a78" className="text-[#007a78]" /> Reviewed
              </span>
            ) : (
              <button onClick={() => setShowRate(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full transition">
                <Star size={12} /> Rate this order
              </button>
            )
          )}
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {showRate && <RateOrderModal order={order} onClose={() => setShowRate(false)} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Status tracker */}
          {order.status !== 'cancelled' && order.status !== 'returned' && (
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
                    <span className={`text-[10px] font-bold text-center leading-tight ${i <= stepIndex ? 'text-[#007a78]' : 'text-gray-400'}`}>
                      {step.replace(/_/g, ' ')}
                    </span>
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
                  {item.imageUrl && (
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image src={imgUrl(item.imageUrl)} alt="" fill className="object-cover" sizes="56px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} · {item.unit}</p>
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
          {order.address && (
            <div className="tgtg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={15} className="text-[#007a78]" />
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Delivery address</p>
              </div>
              <p className="text-sm font-semibold text-[#2C2C2C] mb-1">{order.address.name}</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {[order.address.line1, order.address.line2, order.address.city, order.address.state, order.address.pincode]
                  .filter(Boolean).join(', ')}
              </p>
              {order.address.phone && (
                <p className="text-sm text-gray-400 mt-1">{order.address.phone}</p>
              )}
            </div>
          )}

          {order.awbNumber && (
            <a
              href={order.trackingUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="tgtg-card p-5 bg-[#E8F8EE] border border-green-100 flex items-start gap-3 hover:bg-[#d0f0df] transition block"
            >
              <Truck size={15} className="text-[#007a78] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#007a78] mb-1">Tracking</p>
                <p className="text-sm font-mono font-bold text-[#007a78]">{order.awbNumber}</p>
                <p className="text-xs text-[#007a78]/70 mt-0.5">Tap to track shipment →</p>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
