'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { api } from '@/lib/api'
import { formatPrice } from '@owntown/utils'

function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{label}</p>
      <p className="text-3xl font-bold text-[#1A1A1A] leading-none mb-2">{value}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-2">
          {trend === 'up' && <TrendingUp size={13} className="text-[#00B43C]" />}
          {trend === 'down' && <TrendingDown size={13} className="text-red-500" />}
          {trend === 'neutral' && <Minus size={13} className="text-gray-400" />}
          <p className={
            trend === 'up' ? 'text-xs text-[#00B43C] font-medium'
            : trend === 'down' ? 'text-xs text-red-500 font-medium'
            : 'text-xs text-gray-400'
          }>
            {sub}
          </p>
        </div>
      )}
    </div>
  )
}

export function DashboardStats() {
  const { data } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    refetchInterval: 60_000,
  })

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Today's Orders"
        value={data?.todayOrders ?? '—'}
        sub="Orders placed today"
        trend="neutral"
      />
      <StatCard
        label="Today's Revenue"
        value={data?.todayRevenue != null ? formatPrice(data.todayRevenue) : '—'}
        sub="Gross revenue"
        trend="up"
      />
      <StatCard
        label="Pending"
        value={data?.pendingOrders ?? '—'}
        sub="Awaiting action"
        trend={data?.pendingOrders > 10 ? 'down' : 'neutral'}
      />
      <StatCard
        label="Customers"
        value={data?.totalCustomers ?? '—'}
        sub="Registered users"
        trend="up"
      />
    </div>
  )
}
