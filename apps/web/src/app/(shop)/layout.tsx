import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </>
  )
}
