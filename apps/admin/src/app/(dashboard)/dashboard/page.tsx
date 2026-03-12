import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentOrders } from '@/components/dashboard/RecentOrders'
import { LowStockAlert } from '@/components/dashboard/LowStockAlert'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <DashboardStats />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
