import { Sidebar } from '@/components/layout/Sidebar'
import AuthGuard from '@/components/AuthGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#F7F7F7]">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
