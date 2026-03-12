import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentOrders } from '@/components/dashboard/RecentOrders'
import { LowStockAlert } from '@/components/dashboard/LowStockAlert'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardStats />

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <div>
          <LowStockAlert />
        </div>
      </div>
    </div>
  )
}
