'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { ordersApi } from '@/lib/api-helpers'
import { formatPrice } from '@owntown/utils'
import type { Order, OrderStatus } from '@owntown/types'

const STATUS_COLORS: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-700',
  confirmed:        'bg-blue-100 text-blue-700',
  packed:           'bg-indigo-100 text-indigo-700',
  shipped:          'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered:        'bg-[#E6F9ED] text-[#00843C]',
  cancelled:        'bg-red-100 text-red-600',
  returned:         'bg-gray-100 text-gray-500',
  payment_failed:   'bg-red-100 text-red-600',
}

function marginColor(pct: number) {
  if (pct >= 30) return 'text-[#00843C]'
  if (pct >= 10) return 'text-amber-600'
  return 'text-red-500'
}

function orderMargin(order: Order) {
  if (!order.items?.length) return null
  const revenue = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const cost    = order.items.reduce((s, i) => s + (i.costPrice ?? 0) * i.quantity, 0)
  if (revenue === 0) return null
  // Only show margin when at least one item has a cost price set
  if (cost === 0) return null
  return { revenue, cost, gross: revenue - cost, pct: Math.round(((revenue - cost) / revenue) * 100) }
}

export default function OrdersPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [limit, setLimit] = useState(50)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', limit],
    queryFn: () => ordersApi.list(limit),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Order status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  // Aggregate stats across all orders with margin data
  const stats = orders.reduce(
    (acc, o) => {
      acc.revenue += o.total ?? 0
      const m = orderMargin(o)
      if (m) { acc.cost += m.cost; acc.gross += m.gross; acc.withMargin++ }
      return acc
    },
    { revenue: 0, cost: 0, gross: 0, withMargin: 0 },
  )
  const avgMarginPct = stats.revenue > 0 && stats.cost > 0
    ? Math.round((stats.gross / stats.revenue) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} orders loaded</p>
        </div>
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="field-input py-2 w-36 text-sm"
        >
          <option value={20}>Last 20</option>
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
          <option value={500}>Last 500</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',  value: formatPrice(stats.revenue), sub: `${orders.length} orders` },
          { label: 'Total Cost',     value: stats.cost > 0 ? formatPrice(stats.cost) : '—', sub: 'From procurement' },
          { label: 'Gross Profit',   value: stats.cost > 0 ? formatPrice(stats.gross) : '—', sub: stats.withMargin > 0 ? `${stats.withMargin} orders tracked` : 'Receive stock via GRN to track' },
          { label: 'Avg Gross Margin', value: stats.cost > 0 ? `${avgMarginPct}%` : '—', sub: avgMarginPct >= 20 ? '✓ Healthy' : avgMarginPct > 0 ? '⚠ Review pricing' : 'No cost data yet' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-xl font-bold text-[#1A1A1A]">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading orders…</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gross Profit</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Margin</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => {
                const m = orderMargin(order)
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#1A1A1A]">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-[#1A1A1A]">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-500">
                      {m ? formatPrice(m.cost) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {m ? (
                        <span className={m.gross >= 0 ? 'text-[#00843C] font-semibold' : 'text-red-500 font-semibold'}>
                          {m.gross >= 0 ? '+' : ''}{formatPrice(m.gross)}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {m ? (
                        <span className={`font-bold text-sm flex items-center justify-end gap-1 ${marginColor(m.pct)}`}>
                          {m.pct >= 20 ? <TrendingUp size={13} /> : m.pct >= 0 ? <Minus size={13} /> : <TrendingDown size={13} />}
                          {m.pct}%
                        </span>
                      ) : <span className="text-gray-300 text-right block">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={order.status}
                        onChange={e => statusMutation.mutate({ id: order.id, status: e.target.value })}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer outline-none ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-500'}`}
                      >
                        {(['pending','confirmed','packed','shipped','out_for_delivery','delivered','cancelled'] as OrderStatus[]).map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="p-2 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 rounded-lg transition"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
