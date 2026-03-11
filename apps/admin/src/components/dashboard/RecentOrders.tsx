'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatPrice, formatDate } from '@owntown/utils'
import type { Order } from '@owntown/types'

const statusStyle: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function RecentOrders() {
  const { data: orders } = useQuery<Order[]>({
    queryKey: ['recent-orders'],
    queryFn: () => api.get('/admin/orders?limit=10').then(r => r.data),
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Recent Orders</h2>
      <div className="space-y-3">
        {(orders ?? []).map(order => (
          <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
              <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {order.status.replace(/_/g, ' ')}
              </span>
              <p className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</p>
            </div>
          </div>
        ))}
        {!orders?.length && (
          <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
        )}
      </div>
    </div>
  )
}
