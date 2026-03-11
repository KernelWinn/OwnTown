'use client'

import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, Package, IndianRupee, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { formatPrice } from '@owntown/utils'

export function DashboardStats() {
  const { data } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  })

  const stats = [
    { label: "Today's Orders", value: data?.todayOrders ?? 0, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: "Today's Revenue", value: formatPrice(data?.todayRevenue ?? 0), icon: IndianRupee, color: 'bg-green-50 text-green-600' },
    { label: 'Pending Orders', value: data?.pendingOrders ?? 0, icon: Package, color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Customers', value: data?.totalCustomers ?? 0, icon: Users, color: 'bg-violet-50 text-violet-600' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
            <Icon size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}
