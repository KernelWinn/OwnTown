'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Product } from '@owntown/types'

export function LowStockAlert() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/admin/products/low-stock').then(r => r.data),
    refetchInterval: 60_000,
  })

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1A1A1A]">Low Stock</h2>
        {products && products.length > 0 && (
          <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
            {products.length} items
          </span>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {(products ?? []).map(p => (
          <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
            <p className="text-sm text-gray-700 truncate flex-1 mr-3">{p.name}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-12 bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-red-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min((p.stockQuantity / (p.lowStockThreshold ?? 10)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-red-600 w-8 text-right">{p.stockQuantity}</span>
            </div>
          </div>
        ))}
        {!products?.length && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-medium text-[#00B43C]">✓ All stock levels OK</p>
          </div>
        )}
      </div>
    </div>
  )
}
