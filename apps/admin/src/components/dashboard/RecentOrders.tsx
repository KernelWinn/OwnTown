'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatPrice, formatDate } from '@owntown/utils'
import type { Order } from '@owntown/types'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending:          { label: 'Pending',        className: 'bg-gray-100 text-gray-600' },
  confirmed:        { label: 'Confirmed',       className: 'bg-blue-50 text-blue-700' },
  packed:           { label: 'Packed',          className: 'bg-purple-50 text-purple-700' },
  shipped:          { label: 'Shipped',         className: 'bg-amber-50 text-amber-700' },
  out_for_delivery: { label: 'Out for Delivery',className: 'bg-orange-50 text-orange-700' },
  delivered:        { label: 'Delivered',       className: 'bg-[#E6F9ED] text-[#00843C]' },
  cancelled:        { label: 'Cancelled',       className: 'bg-red-50 text-red-600' },
  payment_failed:   { label: 'Payment Failed',  className: 'bg-red-50 text-red-600' },
}

export function RecentOrders() {
  const { data: orders } = useQuery<Order[]>({
    queryKey: ['recent-orders'],
    queryFn: () => api.get('/admin/orders?limit=10').then(r => r.data),
    refetchInterval: 30_000,
  })

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1A1A1A]">Recent Orders</h2>
        <span className="text-xs text-gray-400">Last 10</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
            <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
            <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {(orders ?? []).map(order => {
            const status = statusConfig[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-600' }
            return (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-[#1A1A1A]">{order.orderNumber}</td>
                <td className="px-5 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-semibold text-[#1A1A1A]">
                  {formatPrice(order.total)}
                </td>
              </tr>
            )
          })}
          {!orders?.length && (
            <tr>
              <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                No recent orders
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
