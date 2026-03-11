'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import type { Product } from '@owntown/types'

export function LowStockAlert() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/admin/products/low-stock').then(r => r.data),
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={18} className="text-amber-500" />
        <h2 className="font-semibold text-gray-900">Low Stock</h2>
      </div>
      <div className="space-y-3">
        {(products ?? []).map(p => (
          <div key={p.id} className="flex items-center justify-between">
            <p className="text-sm text-gray-700 truncate flex-1">{p.name}</p>
            <span className="text-xs font-bold text-red-600 ml-2">{p.stockQuantity} left</span>
          </div>
        ))}
        {!products?.length && (
          <p className="text-sm text-gray-400 text-center py-4">All stock levels OK</p>
        )}
      </div>
    </div>
  )
}
