'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, ChevronRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-[#E6F9ED] text-[#00843C] border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
}

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  items: { quantity: number }[]
}

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then((r) => r.data),
    enabled: !!user,
  })

  if (!user) { router.replace('/login?redirect=/orders'); return null }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Your order history</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sq-card h-20 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="sq-card p-16 flex flex-col items-center gap-4">
          <Package size={48} className="text-gray-300" />
          <p className="text-gray-500 text-sm font-medium">No orders yet</p>
          <Link href="/" className="sq-btn-primary">Start shopping</Link>
        </div>
      ) : (
        <div className="sq-card divide-y divide-gray-100">
          {orders.map((order) => {
            const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0
            return (
              <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">#{order.id.slice(-8).toUpperCase()}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {itemCount} item{itemCount !== 1 ? 's' : ''} · ₹{(order.total / 100).toFixed(2)} ·{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
