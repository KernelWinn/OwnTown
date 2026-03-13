'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, ChevronRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-[#00843C]',
  cancelled: 'bg-red-100 text-red-700',
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

  if (!user) {
    router.replace('/login?redirect=/orders')
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card animate-pulse h-20 bg-gray-100" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Package size={56} className="text-gray-300" />
        <p className="text-gray-500 text-sm">No orders yet</p>
        <Link href="/" className="btn-primary px-8">Start shopping</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Your orders</h1>
      <div className="space-y-3">
        {orders.map((order) => {
          const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0
          return (
            <Link key={order.id} href={`/orders/${order.id}`} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">#{order.id.slice(-8).toUpperCase()}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {itemCount} item{itemCount !== 1 ? 's' : ''} · ₹{(order.total / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
