'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, Truck, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatPrice, formatDate } from '@owntown/utils'
import { OrderDetailModal } from '@/components/orders/OrderDetailModal'
import type { Order } from '@owntown/types'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-gray-100 text-gray-700',
  shipped: 'bg-amber-100 text-amber-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-[#E6F9ED] text-[#00843C]',
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

  const [labelLoading, setLabelLoading] = useState<string | null>(null)
  const printLabel = async (orderId: string) => {
    setLabelLoading(orderId)
    try {
      const { data } = await api.get(`/admin/orders/${orderId}/label`)
      window.open(data.labelUrl, '_blank', 'noopener')
    } catch {
      toast.error('Failed to generate label')
    } finally {
      setLabelLoading(null)
    }
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const toPackCount = orders.filter(o => o.status === 'confirmed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and fulfil customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
              {pendingCount} pending
            </span>
          )}
          {toPackCount > 0 && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
              {toPackCount} to pack
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading orders...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#1A1A1A]">{order.orderNumber}</p>
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
                  <td className="px-5 py-4 font-semibold text-[#1A1A1A]">{formatPrice(order.total)}</td>
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
                          className="text-xs px-3 py-1.5 bg-[#1A1A1A] text-white rounded-md hover:bg-black/80 font-medium transition disabled:opacity-50"
                        >
                          Mark {NEXT_STATUS[order.status]}
                        </button>
                      )}
                      {/* Ship button — appears when packed and no AWB yet */}
                      {order.status === 'packed' && !order.awbNumber && (
                        <button
                          onClick={() => shipMutation.mutate(order.id)}
                          disabled={shipMutation.isPending}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#00B43C] text-white rounded-md hover:bg-[#009932] font-medium transition disabled:opacity-50"
                        >
                          <Truck size={12} />
                          Ship
                        </button>
                      )}
                      {/* AWB + Print Label */}
                      {order.awbNumber && (
                        <>
                          <span className="text-xs text-gray-400 font-mono">{order.awbNumber}</span>
                          <button
                            onClick={() => printLabel(order.id)}
                            disabled={labelLoading === order.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition disabled:opacity-50"
                            title="Print shipping label"
                          >
                            <Printer size={12} />
                            {labelLoading === order.id ? 'Generating…' : 'Label'}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 rounded-lg transition"
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
