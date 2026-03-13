'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, ChevronRight } from 'lucide-react'

const STATUS: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-yellow-100 text-yellow-700' },
  confirmed:  { label: 'Confirmed',  className: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Shipped',    className: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Delivered',  className: 'bg-[#E8F8EE] text-[#25a855]' },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-100 text-red-600' },
}

interface Order {
  id: string; status: string; total: number; createdAt: string; items: { quantity: number }[]
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
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-black text-[#2C2C2C] mb-8">Your orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="tgtg-card h-24 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="tgtg-card p-20 flex flex-col items-center gap-4 text-center">
          <span className="text-6xl">📦</span>
          <h2 className="font-black text-xl text-[#2C2C2C]">No orders yet</h2>
          <p className="text-gray-500 text-sm">Start shopping to see your orders here</p>
          <Link href="/" className="tgtg-btn mt-2">Browse products</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0
            const st = STATUS[order.status]
            return (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="tgtg-card flex items-center gap-4 p-5 hover:shadow-elevated transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-[#25a855]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-[#2C2C2C]">#{order.id.slice(-8).toUpperCase()}</p>
                    {st && (
                      <span className={`tgtg-badge ${st.className}`}>{st.label}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {itemCount} item{itemCount !== 1 ? 's' : ''} · ₹{(order.total / 100).toFixed(2)} ·{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
