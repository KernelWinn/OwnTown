'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Package } from 'lucide-react'
import { toast } from 'sonner'
import { ordersApi } from '@/lib/api-helpers'
import { formatPrice } from '@owntown/utils'
import type { OrderItem, OrderStatus } from '@owntown/types'

const STATUS_COLORS: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-700',
  confirmed:        'bg-blue-100 text-blue-700',
  packed:           'bg-indigo-100 text-indigo-700',
  shipped:          'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered:        'bg-[#E6F9ED] text-[#00843C]',
  cancelled:        'bg-red-100 text-red-600',
  returned:         'bg-gray-100 text-gray-500',
}

function itemMargin(item: OrderItem) {
  if (!item.costPrice) return null
  const revenue = item.price * item.quantity
  const cost    = item.costPrice * item.quantity
  const gross   = revenue - cost
  const pct     = Math.round((gross / revenue) * 100)
  return { revenue, cost, gross, pct }
}

function MarginBar({ pct }: { pct: number }) {
  const color = pct >= 30 ? 'bg-[#00843C]' : pct >= 10 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
      <span className={`text-xs font-bold ${pct >= 30 ? 'text-[#00843C]' : pct >= 10 ? 'text-amber-600' : 'text-red-500'}`}>
        {pct}%
      </span>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => ordersApi.get(id),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-order', id] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  if (isLoading || !order) {
    return <div className="text-center py-20 text-gray-400">{isLoading ? 'Loading…' : 'Order not found'}</div>
  }

  const items: OrderItem[] = order.items ?? []
  const revenue = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const cost    = items.reduce((s, i) => s + (i.costPrice ?? 0) * i.quantity, 0)
  const gross   = revenue - cost
  const marginPct = revenue > 0 && cost > 0 ? Math.round((gross / revenue) * 100) : null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1A1A1A]">{order.orderNumber}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
          <select
            value={order.status}
            onChange={e => statusMutation.mutate(e.target.value)}
            disabled={statusMutation.isPending}
            className="field-input py-2 text-sm w-44"
          >
            {(['pending','confirmed','packed','shipped','out_for_delivery','delivered','cancelled'] as OrderStatus[]).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Margin summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Order Total</p>
          <p className="text-xl font-bold text-[#1A1A1A]">{formatPrice(order.total)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{order.paymentMethod?.toUpperCase()} · {order.paymentStatus}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cost of Goods</p>
          <p className="text-xl font-bold text-[#1A1A1A]">{cost > 0 ? formatPrice(cost) : '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">From procurement</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Gross Profit</p>
          <p className={`text-xl font-bold ${cost > 0 ? (gross >= 0 ? 'text-[#00843C]' : 'text-red-500') : 'text-[#1A1A1A]'}`}>
            {cost > 0 ? (gross >= 0 ? '+' : '') + (formatPrice(gross)) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Revenue − cost</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Gross Margin</p>
          {marginPct !== null ? (
            <>
              <p className={`text-xl font-bold ${marginPct >= 20 ? 'text-[#00843C]' : marginPct >= 0 ? 'text-amber-600' : 'text-red-500'}`}>
                {marginPct}%
              </p>
              <MarginBar pct={marginPct} />
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-gray-300">—</p>
              <p className="text-xs text-gray-400 mt-0.5">Receive via GRN first</p>
            </>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#1A1A1A]">Items &amp; Margin Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sell Price</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost Price</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gross</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item, idx) => {
              const m = itemMargin(item)
              return (
                <tr key={item.id ?? idx}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600">{item.quantity}</td>
                  <td className="px-5 py-4 text-right">{formatPrice(item.price)}</td>
                  <td className="px-5 py-4 text-right text-gray-500">
                    {item.costPrice ? formatPrice(item.costPrice) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold">{formatPrice(item.price * item.quantity)}</td>
                  <td className="px-5 py-4 text-right">
                    {m ? (
                      <span className={m.gross >= 0 ? 'text-[#00843C] font-semibold' : 'text-red-500 font-semibold'}>
                        {m.gross >= 0 ? '+' : ''}{formatPrice(m.gross)}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {m ? <MarginBar pct={m.pct} /> : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Delivery address */}
      {order.address && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-[#1A1A1A] mb-3">Delivery Address</h2>
          <p className="text-sm text-gray-600">
            {[
              (order.address as any).name,
              (order.address as any).line1,
              (order.address as any).line2,
              (order.address as any).city,
              (order.address as any).state,
              (order.address as any).pincode,
            ].filter(Boolean).join(', ')}
          </p>
          {(order.address as any).phone && (
            <p className="text-sm text-gray-400 mt-1">{(order.address as any).phone}</p>
          )}
        </div>
      )}
    </div>
  )
}
