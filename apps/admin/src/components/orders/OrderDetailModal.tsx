'use client'

import { useQuery } from '@tanstack/react-query'
import { X, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { formatPrice, formatDate } from '@owntown/utils'
import type { Order } from '@owntown/types'

interface Props {
  order: Order
  onClose: () => void
}

export function OrderDetailModal({ order, onClose }: Props) {
  const { data: detail } = useQuery({
    queryKey: ['admin-order', order.id],
    queryFn: () => api.get(`/admin/orders/${order.id}`).then(r => r.data),
    initialData: order,
  })

  const addr = (detail as any).address ?? {}

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="font-bold text-[#1A1A1A]">{detail.orderNumber}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(detail.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Status</span>
            <span className="text-sm font-semibold text-[#1A1A1A] capitalize">
              {detail.status.replace(/_/g, ' ')}
            </span>
            <span className="text-sm text-gray-500 ml-auto">{detail.paymentMethod.toUpperCase()}</span>
          </div>

          {/* Delivery address */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Deliver To</p>
            <p className="text-sm font-semibold text-[#1A1A1A]">{addr.name}</p>
            <p className="text-sm text-gray-600">{addr.phone}</p>
            <p className="text-sm text-gray-600">
              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
              {addr.landmark ? `, near ${addr.landmark}` : ''}
            </p>
            <p className="text-sm text-gray-600">{addr.city}, {addr.state} — {addr.pincode}</p>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</p>
            <div className="space-y-2">
              {((detail as any).items ?? []).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.unit} × {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{formatPrice(detail.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Fee</span>
              <span>{detail.deliveryFee === 0 ? 'Free' : formatPrice(detail.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#1A1A1A] border-t border-gray-200 pt-2">
              <span>Total</span><span>{formatPrice(detail.total)}</span>
            </div>
          </div>

          {/* Shipment */}
          {detail.awbNumber && (
            <div className="bg-[#E6F9ED] rounded-lg p-4">
              <p className="text-xs font-semibold text-[#00843C] uppercase tracking-wide mb-2">Shipment</p>
              <p className="text-sm text-gray-700">AWB: <span className="font-mono font-semibold">{detail.awbNumber}</span></p>
              {detail.trackingUrl && (
                <a
                  href={detail.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-sm text-[#00843C] hover:underline mt-1"
                >
                  Track shipment <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
