'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatPrice, formatDate } from '@owntown/utils'
import { OrderDetailModal } from '@/components/orders/OrderDetailModal'
import type { Order } from '@owntown/types'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-amber-100 text-amber-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  payment_failed: 'bg-red-100 text-red-600',
}

const NEXT_STATUS: Record<string, string> = {
  confirmed: 'packed',
  packed: 'shipped',
}

export default function OrdersPage() {
  const qc = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => api.get('/admin/orders?limit=100').then(r => r.data),
    refetchInterval: 30_000,   // poll every 30s
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Order status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const shipMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/orders/${id}/ship`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Shipment created — AWB generated')
    },
    onError: () => toast.error('Shipment creation failed'),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading orders...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Order</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Date</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Payment</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">{(order as any).address?.name}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.paymentMethod === 'cod'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {order.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900">{formatPrice(order.total)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Advance status button */}
                      {NEXT_STATUS[order.status] && (
                        <button
                          onClick={() => statusMutation.mutate({ id: order.id, status: NEXT_STATUS[order.status] })}
                          disabled={statusMutation.isPending}
                          className="text-xs px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 font-medium transition disabled:opacity-50"
                        >
                          Mark {NEXT_STATUS[order.status]}
                        </button>
                      )}
                      {/* Ship button — appears when packed and no AWB yet */}
                      {order.status === 'packed' && !order.awbNumber && (
                        <button
                          onClick={() => shipMutation.mutate(order.id)}
                          disabled={shipMutation.isPending}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-medium transition disabled:opacity-50"
                        >
                          <Truck size={12} />
                          Ship
                        </button>
                      )}
                      {/* AWB badge */}
                      {order.awbNumber && (
                        <span className="text-xs text-gray-400 font-mono">{order.awbNumber}</span>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">No orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}
